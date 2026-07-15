from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Cookie, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta

import httpx
import re
import secrets
import bcrypt
import mercadopago

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

MP_ACCESS_TOKEN = os.environ.get("MP_ACCESS_TOKEN", "")
mp_sdk = mercadopago.SDK(MP_ACCESS_TOKEN)
ADMIN_EMAIL = "df1384435@gmail.com"
EMERGENT_SESSION_DATA_URL = (
    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
)

CLUB_PLANS: Dict[str, Dict] = {
    "bronze": {
        "name": "Club Bronze",
        "amount": 79.90,
        "currency": "brl",
        "description": "2 cortes por mês + 10% off nos demais serviços",
        "benefits": [
            "2 cortes de cabelo por mês",
            "10% off em barba, sobrancelha e pezinho",
            "Prioridade no agendamento",
        ],
    },
    "prata": {
        "name": "Club Prata",
        "amount": 129.90,
        "currency": "brl",
        "description": "4 cortes + 2 barbas + 15% off",
        "benefits": [
            "4 cortes de cabelo por mês",
            "2 barbas completas por mês",
            "15% off em serviços extras",
            "Bebida cortesia (cerveja/whisky)",
        ],
    },
    "ouro": {
        "name": "Club Ouro",
        "amount": 199.90,
        "currency": "brl",
        "description": "Ilimitado + benefícios premium",
        "benefits": [
            "Cortes e barba ilimitados",
            "1 pigmentação por mês",
            "20% off em platinado",
            "Atendimento VIP com o Danilo França",
            "Kit produtos Espaço França",
        ],
    },
}

SERVICES = [
    {"id": "corte", "name": "Corte", "price": 40.00, "duration": 40},
    {"id": "barba", "name": "Barba", "price": 35.00, "duration": 30},
    {"id": "corte-barba", "name": "Corte + Barba", "price": 70.00, "duration": 70},
    {"id": "pezinho", "name": "Pezinho", "price": 20.00, "duration": 15},
    {"id": "sobrancelha", "name": "Sobrancelha", "price": 20.00, "duration": 15},
    {"id": "platinado", "name": "Platinado", "price": 180.00, "duration": 120},
    {"id": "pigmentacao", "name": "Pigmentação", "price": 50.00, "duration": 30},
]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class User(BaseModel):
    user_id: str
    email: Optional[str] = ""
    name: str
    picture: Optional[str] = ""
    phone: Optional[str] = ""
    is_admin: bool = False
    provider: Optional[str] = "google"


class PhoneRegisterRequest(BaseModel):
    name: str
    phone: str
    password: str


class PhoneLoginRequest(BaseModel):
    phone: str
    password: str


class BookingCreate(BaseModel):
    name: str
    phone: str
    service: str
    date: str
    time: str
    notes: Optional[str] = ""


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    name: str
    phone: str
    service: str
    date: str
    time: str
    notes: Optional[str] = ""
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None


class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: str
    plan_id: str
    plan_name: str
    amount: float
    currency: str
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    payment_status: str = "initiated"
    status: str = "open"
    metadata: Dict[str, str] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------- Auth helpers ----------
async def _resolve_session_token(
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> Optional[str]:
    if session_token:
        return session_token
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


async def _load_user_from_session(token: Optional[str]) -> Optional[User]:
    if not token:
        return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        return None
    user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    return User(**user_doc)


async def get_current_user(
    token: Optional[str] = Depends(_resolve_session_token),
) -> User:
    user = await _load_user_from_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return user


async def get_optional_user(
    token: Optional[str] = Depends(_resolve_session_token),
) -> Optional[User]:
    return await _load_user_from_session(token)


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito")
    return user


# ---------- Phone auth helpers ----------
def normalize_phone(raw: str) -> str:
    """Keep digits only. Enforce 10-13 chars (Brazil DDD+number, optional country code)."""
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) < 10 or len(digits) > 13:
        raise HTTPException(status_code=400, detail="Telefone inválido")
    # If no country code, prepend Brazil "55"
    if len(digits) in (10, 11):
        digits = "55" + digits
    return digits


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


async def _issue_session(user_id: str, response: Response) -> str:
    token = "sess_" + secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one(
        {
            "user_id": user_id,
            "session_token": token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    response.set_cookie(
        key="session_token",
        value=token,
        max_age=7 * 24 * 3600,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )
    return token


async def _check_login_attempts(identifier: str):
    now = datetime.now(timezone.utc)
    doc = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if not doc:
        return
    locked_until = doc.get("locked_until")
    if locked_until:
        if isinstance(locked_until, str):
            locked_until = datetime.fromisoformat(locked_until)
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > now:
            raise HTTPException(
                status_code=429,
                detail="Muitas tentativas. Tente novamente em alguns minutos.",
            )


async def _record_failed_attempt(identifier: str):
    now = datetime.now(timezone.utc)
    doc = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    attempts = (doc.get("attempts", 0) if doc else 0) + 1
    update = {"attempts": attempts, "updated_at": now.isoformat()}
    if attempts >= 5:
        update["locked_until"] = (now + timedelta(minutes=15)).isoformat()
        update["attempts"] = 0
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$set": update, "$setOnInsert": {"identifier": identifier}},
        upsert=True,
    )


async def _clear_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})


# ---------- Basic ----------
@api_router.get("/")
async def root():
    return {"message": "Espaço França API", "status": "ok"}


@api_router.get("/services")
async def get_services():
    return SERVICES


@api_router.get("/plans")
async def get_plans():
    return [
        {
            "id": pid,
            "name": p["name"],
            "amount": p["amount"],
            "currency": p["currency"],
            "description": p["description"],
            "benefits": p["benefits"],
        }
        for pid, p in CLUB_PLANS.items()
    ]


# ---------- Auth ----------
@api_router.post("/auth/session")
async def auth_session(request: Request, response: Response):
    """Exchange session_id (from Emergent auth redirect) for our own session cookie."""
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id ausente")

    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.get(EMERGENT_SESSION_DATA_URL, headers={"X-Session-ID": session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Falha ao validar sessão Emergent")
    data = r.json()

    email = data.get("email")
    name = data.get("name") or email
    picture = data.get("picture") or ""
    emergent_token = data.get("session_token")
    if not email or not emergent_token:
        raise HTTPException(status_code=401, detail="Dados de sessão inválidos")

    is_admin = email.lower() == ADMIN_EMAIL.lower()

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "is_admin": is_admin, "provider": "google"}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one(
            {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "is_admin": is_admin,
                "provider": "google",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one(
        {
            "user_id": user_id,
            "session_token": emergent_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    response.set_cookie(
        key="session_token",
        value=emergent_token,
        max_age=7 * 24 * 3600,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )

    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "is_admin": is_admin,
    }


@api_router.get("/auth/me", response_model=User)
async def auth_me(user: User = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def auth_logout(
    response: Response,
    token: Optional[str] = Depends(_resolve_session_token),
):
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


@api_router.post("/auth/phone/register")
async def phone_register(payload: PhoneRegisterRequest, response: Response):
    name = (payload.name or "").strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Nome muito curto")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 6 caracteres")

    phone = normalize_phone(payload.phone)

    existing = await db.users.find_one({"phone": phone}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Já existe uma conta com esse telefone")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one(
        {
            "user_id": user_id,
            "email": "",
            "name": name,
            "picture": "",
            "phone": phone,
            "password_hash": hash_password(payload.password),
            "is_admin": False,
            "provider": "phone",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    await _issue_session(user_id, response)
    return {
        "user_id": user_id,
        "email": "",
        "name": name,
        "picture": "",
        "phone": phone,
        "is_admin": False,
        "provider": "phone",
    }


@api_router.post("/auth/phone/login")
async def phone_login(payload: PhoneLoginRequest, response: Response):
    phone = normalize_phone(payload.phone)
    identifier = f"phone:{phone}"

    await _check_login_attempts(identifier)

    user_doc = await db.users.find_one({"phone": phone}, {"_id": 0})
    if not user_doc or not user_doc.get("password_hash"):
        await _record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Telefone ou senha inválidos")

    if not verify_password(payload.password, user_doc["password_hash"]):
        await _record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Telefone ou senha inválidos")

    await _clear_attempts(identifier)
    await _issue_session(user_doc["user_id"], response)
    return {
        "user_id": user_doc["user_id"],
        "email": user_doc.get("email", ""),
        "name": user_doc.get("name", ""),
        "picture": user_doc.get("picture", ""),
        "phone": user_doc.get("phone", ""),
        "is_admin": bool(user_doc.get("is_admin", False)),
        "provider": user_doc.get("provider", "phone"),
    }


# ---------- Bookings ----------
@api_router.post("/bookings", response_model=Booking)
async def create_booking(
    data: BookingCreate,
    user: Optional[User] = Depends(get_optional_user),
):
    booking = Booking(**data.model_dump(), user_id=user.user_id if user else None)
    await db.bookings.insert_one(booking.model_dump())
    return booking


@api_router.get("/bookings/taken")
async def bookings_taken(date: str):
    docs = await db.bookings.find({"date": date}, {"_id": 0, "time": 1}).to_list(200)
    return {"date": date, "taken": [d["time"] for d in docs]}


@api_router.get("/me/bookings", response_model=List[Booking])
async def my_bookings(user: User = Depends(get_current_user)):
    docs = (
        await db.bookings.find({"user_id": user.user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(500)
    )
    return docs


@api_router.get("/me/subscriptions")
async def my_subscriptions(user: User = Depends(get_current_user)):
    docs = (
        await db.payment_transactions.find({"user_id": user.user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(500)
    )
    return docs


# ---------- Admin ----------
@api_router.get("/admin/bookings", response_model=List[Booking])
async def admin_bookings(_: User = Depends(require_admin)):
    docs = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.get("/admin/transactions")
async def admin_transactions(_: User = Depends(require_admin)):
    docs = (
        await db.payment_transactions.find({}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(1000)
    )
    return docs


@api_router.get("/admin/stats")
async def admin_stats(_: User = Depends(require_admin)):
    total_bookings = await db.bookings.count_documents({})
    total_users = await db.users.count_documents({})
    paid_tx = await db.payment_transactions.count_documents({"payment_status": "paid"})
    return {
        "total_bookings": total_bookings,
        "total_users": total_users,
        "paid_transactions": paid_tx,
    }


# ---------- Mercado Pago Checkout (Checkout Pro) ----------
@api_router.post("/checkout/session")
async def create_checkout_session(
    payload: CheckoutRequest,
    http_request: Request,
    user: Optional[User] = Depends(get_optional_user),
):
    if payload.plan_id not in CLUB_PLANS:
        raise HTTPException(status_code=400, detail="Plano inválido")

    plan = CLUB_PLANS[payload.plan_id]
    origin = payload.origin_url.rstrip("/")
    session_id = str(uuid.uuid4())
    success_url = f"{origin}/pagamento/sucesso?session_id={session_id}"
    failure_url = f"{origin}/pagamento/cancelado?session_id={session_id}"

    customer_email = (user.email if user else payload.customer_email) or ""
    customer_name = (user.name if user else payload.customer_name) or ""

    metadata = {
        "plan_id": payload.plan_id,
        "plan_name": plan["name"],
        "customer_email": customer_email,
        "customer_name": customer_name,
        "user_id": user.user_id if user else "",
        "source": "espaco_franca_club",
    }

    host_url = str(http_request.base_url).rstrip("/")
    preference_data = {
        "items": [
            {
                "title": plan["name"],
                "quantity": 1,
                "currency_id": plan["currency"].upper(),
                "unit_price": float(plan["amount"]),
            }
        ],
        "payer": ({"email": customer_email, "name": customer_name} if customer_email else {}),
        "external_reference": session_id,
        "back_urls": {
            "success": success_url,
            "failure": failure_url,
            "pending": failure_url,
        },
        "auto_return": "approved",
        "notification_url": f"{host_url}/api/webhook/mercadopago",
        "metadata": metadata,
    }

    result = mp_sdk.preference().create(preference_data)
    if result.get("status") not in (200, 201):
        logger.error(f"Erro Mercado Pago: {result}")
        raise HTTPException(status_code=502, detail="Falha ao criar preferência de pagamento")

    preference = result["response"]
    checkout_url = preference.get("sandbox_init_point") or preference.get("init_point")

    tx = PaymentTransaction(
        user_id=user.user_id if user else None,
        session_id=session_id,
        plan_id=payload.plan_id,
        plan_name=plan["name"],
        amount=float(plan["amount"]),
        currency=plan["currency"],
        customer_email=customer_email or None,
        customer_name=customer_name or None,
        metadata=metadata,
    )
    tx_dict = tx.model_dump()
    tx_dict["mp_preference_id"] = preference.get("id")
    await db.payment_transactions.insert_one(tx_dict)

    return {"url": checkout_url, "session_id": session_id}


@api_router.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, http_request: Request):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    return {
        "session_id": session_id,
        "status": tx.get("status", "open"),
        "payment_status": tx.get("payment_status", "unpaid"),
        "amount_total": int(round(float(tx.get("amount", 0)) * 100)),
        "currency": tx.get("currency"),
        "metadata": tx.get("metadata"),
    }


@api_router.post("/webhook/mercadopago")
async def mercadopago_webhook(request: Request):
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001
        body = {}

    # O Mercado Pago também pode notificar via query string (?type=payment&data.id=...)
    query = request.query_params
    event_type = body.get("type") or query.get("type") or query.get("topic")
    payment_id = None
    if isinstance(body.get("data"), dict):
        payment_id = body["data"].get("id")
    payment_id = payment_id or query.get("data.id") or query.get("id")

    if event_type != "payment" or not payment_id:
        return {"received": True}

    payment_result = mp_sdk.payment().get(payment_id)
    if payment_result.get("status") != 200:
        logger.warning(f"Não foi possível consultar pagamento {payment_id}: {payment_result}")
        return {"received": True}

    payment = payment_result["response"]
    session_id = payment.get("external_reference")
    mp_status = payment.get("status")  # approved, pending, rejected, etc.

    if session_id:
        payment_status = "paid" if mp_status == "approved" else ("unpaid" if mp_status == "rejected" else "pending")
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "payment_status": payment_status,
                    "status": "complete" if mp_status == "approved" else "open",
                    "mp_payment_id": payment_id,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
    return {"received": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
