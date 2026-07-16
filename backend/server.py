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

# ... (CLUB_PLANS e SERVICES mantidos iguais) ...
CLUB_PLANS: Dict[str, Dict] = {
    "bronze": {
        "name": "Club Bronze",
        "amount": 79.90,
        "currency": "brl",
        "description": "2 cortes por mês + 10% off nos demais serviços",
        "benefits": ["2 cortes de cabelo por mês", "10% off em barba, sobrancelha e pezinho", "Prioridade no agendamento"],
    },
    "prata": {
        "name": "Club Prata",
        "amount": 139.90,
        "currency": "brl",
        "description": "4 cortes 10% off",
        "benefits": ["4 cortes de cabelo por mês", "10% off em serviços extras", "Prioridade no agendamento"],
    },
    "ouro": {
        "name": "Club Ouro",
        "amount": 199.90,
        "currency": "brl",
        "description": "Ilimitado + benefícios premium",
        "benefits": ["Cortes ilimitados", "2 barbas por mês", "20% off em platinado", "Atendimento VIP com o Danilo França", "Kit produtos Espaço França"],
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

# --- CORREÇÃO: Configuração de CORS limpa e no topo ---
raw_origins = os.environ.get("CORS_ORIGINS", "*")
allowed_origins = [origin.strip().rstrip('/') for origin in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ---------- Models e Auth (Mantidos iguais) ----------
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

# ---------- Helpers de Auth e Lógica de rotas (Mantidos iguais) ----------
async def _resolve_session_token(session_token: Optional[str] = Cookie(default=None), authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if session_token: return session_token
    if authorization and authorization.lower().startswith("bearer "): return authorization.split(" ", 1)[1].strip()
    return None

async def _load_user_from_session(token: Optional[str]) -> Optional[User]:
    if not token: return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess: return None
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str): expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None: expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc): return None
    user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user_doc: return None
    return User(**user_doc)

async def get_current_user(token: Optional[str] = Depends(_resolve_session_token)) -> User:
    user = await _load_user_from_session(token)
    if not user: raise HTTPException(status_code=401, detail="Não autenticado")
    return user

async def get_optional_user(token: Optional[str] = Depends(_resolve_session_token)) -> Optional[User]:
    return await _load_user_from_session(token)

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin: raise HTTPException(status_code=403, detail="Acesso restrito")
    return user

def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) < 10 or len(digits) > 13: raise HTTPException(status_code=400, detail="Telefone inválido")
    if len(digits) in (10, 11): digits = "55" + digits
    return digits

def hash_password(password: str) -> str: return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
def verify_password(plain: str, hashed: str) -> bool:
    try: return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception: return False

async def _issue_session(user_id: str, response: Response) -> str:
    token = "sess_" + secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": token, "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()})
    response.set_cookie(key="session_token", value=token, max_age=7 * 24 * 3600, path="/", httponly=True, secure=True, samesite="none")
    return token

# ---------- Rotas (Mantidas iguais) ----------
@api_router.get("/")
async def root(): return {"message": "Espaço França API", "status": "ok"}

@api_router.get("/services")
async def get_services(): return SERVICES

@api_router.get("/plans")
async def get_plans(): return [{"id": pid, "name": p["name"], "amount": p["amount"], "currency": p["currency"], "description": p["description"], "benefits": p["benefits"]} for pid, p in CLUB_PLANS.items()]

@api_router.post("/checkout/session")
async def create_checkout_session(payload: CheckoutRequest, http_request: Request, user: Optional[User] = Depends(get_optional_user)):
    if payload.plan_id not in CLUB_PLANS: raise HTTPException(status_code=400, detail="Plano inválido")
    plan = CLUB_PLANS[payload.plan_id]
    origin = payload.origin_url.rstrip("/")
    session_id = str(uuid.uuid4())
    success_url = f"{origin}/pagamento/sucesso?session_id={session_id}"
    failure_url = f"{origin}/pagamento/cancelado?session_id={session_id}"
    customer_email = (user.email if user else payload.customer_email) or ""
    customer_name = (user.name if user else payload.customer_name) or ""
    metadata = {"plan_id": payload.plan_id, "plan_name": plan["name"], "customer_email": customer_email, "customer_name": customer_name, "user_id": user.user_id if user else "", "source": "espaco_franca_club"}
    host_url = str(http_request.base_url).rstrip("/")
    preference_data = {
        "items": [{"title": plan["name"], "quantity": 1, "currency_id": plan["currency"].upper(), "unit_price": float(plan["amount"])}],
        "payer": ({"email": customer_email, "name": customer_name} if customer_email else {}),
        "external_reference": session_id,
        "back_urls": {"success": success_url, "failure": failure_url, "pending": failure_url},
        "auto_return": "approved",
        "notification_url": f"{host_url}/api/webhook/mercadopago",
        "metadata": metadata,
    }
    result = mp_sdk.preference().create(preference_data)
    if result.get("status") not in (200, 201): raise HTTPException(status_code=502, detail="Falha ao criar preferência")
    preference = result["response"]
    checkout_url = preference.get("sandbox_init_point") or preference.get("init_point")
    tx = PaymentTransaction(user_id=user.user_id if user else None, session_id=session_id, plan_id=payload.plan_id, plan_name=plan["name"], amount=float(plan["amount"]), currency=plan["currency"], customer_email=customer_email or None, customer_name=customer_name or None, metadata=metadata)
    tx_dict = tx.model_dump()
    tx_dict["mp_preference_id"] = preference.get("id")
    await db.payment_transactions.insert_one(tx_dict)
    return {"url": checkout_url, "session_id": session_id}

@api_router.post("/webhook/mercadopago")
async def mercadopago_webhook(request: Request):
    body = {}
    try: body = await request.json()
    except Exception: pass
    query = request.query_params
    event_type = body.get("type") or query.get("type") or query.get("topic")
    payment_id = None
    if isinstance(body.get("data"), dict): payment_id = body["data"].get("id")
    payment_id = payment_id or query.get("data.id") or query.get("id")
    if event_type != "payment" or not payment_id: return {"received": True}
    payment_result = mp_sdk.payment().get(payment_id)
    if payment_result.get("status") != 200: return {"received": True}
    payment = payment_result["response"]
    session_id = payment.get("external_reference")
    mp_status = payment.get("status")
    if session_id:
        payment_status = "paid" if mp_status == "approved" else ("unpaid" if mp_status == "rejected" else "pending")
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": payment_status, "status": "complete" if mp_status == "approved" else "open", "mp_payment_id": payment_id, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"received": True}

# --- Inclusão do roteador final ---
app.include_router(api_router)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
