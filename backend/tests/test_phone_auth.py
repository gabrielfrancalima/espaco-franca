"""Backend tests for Phone Auth (register/login) + regression w/ Google auth.

Covers iteration 3:
- POST /api/auth/phone/register (happy path, validation, duplicate)
- POST /api/auth/phone/login (happy path, wrong password, unknown phone, lockout)
- Phone normalization (same user with (11) 98765-4321 vs 11987654321)
- session_token cookie set + accepted by GET /api/auth/me
- Cross-integration: phone user creates booking + checkout w/ user_id
- Google Auth still works (POST /api/auth/session invalid_id -> 401)
- Public regression (services/plans/bookings.taken)
- Admin RBAC: phone user cannot access /api/admin/*
- Cleanup all TEST data created
"""
import os
import re
import uuid
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


# --- unique-per-run phones so tests are idempotent ---
def _rand_ddd_number():
    # DDD 11 + 9XXXXXXXX (11 digits total)
    n = uuid.uuid4().int
    tail = str(n)[-8:]
    return f"11 9{tail[0:4]}-{tail[4:8]}"  # formatted


PHONE_A_RAW = _rand_ddd_number()             # e.g. "11 91234-5678"
PHONE_A_DIGITS = re.sub(r"\D", "", PHONE_A_RAW)  # "11912345678"
PHONE_A_NORMALIZED = "55" + PHONE_A_DIGITS       # what backend stores

PHONE_B_RAW = _rand_ddd_number()
PHONE_B_DIGITS = re.sub(r"\D", "", PHONE_B_RAW)

# Sanitized (masked-like) version to test normalization identity
PHONE_A_MASKED = f"({PHONE_A_DIGITS[0:2]}) {PHONE_A_DIGITS[2:7]}-{PHONE_A_DIGITS[7:11]}"

PASSWORD_OK = "supersenha123"
PASSWORD_SHORT = "abc"

_created_user_ids = set()
_created_phones = set()


@pytest.fixture(scope="session", autouse=True)
def _cleanup_at_end():
    yield
    # Delete users we created + their sessions + login_attempts + bookings + payment_transactions
    if _created_user_ids:
        _db.users.delete_many({"user_id": {"$in": list(_created_user_ids)}})
        _db.user_sessions.delete_many({"user_id": {"$in": list(_created_user_ids)}})
        _db.bookings.delete_many({"user_id": {"$in": list(_created_user_ids)}})
        _db.payment_transactions.delete_many({"user_id": {"$in": list(_created_user_ids)}})
    if _created_phones:
        _db.users.delete_many({"phone": {"$in": list(_created_phones)}})
        _db.login_attempts.delete_many(
            {"identifier": {"$in": [f"phone:{p}" for p in _created_phones]}}
        )
    _mongo.close()


def _session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Register ----------
class TestPhoneRegister:
    def test_register_happy_path_sets_cookie_and_persists_user(self):
        s = _session()
        r = s.post(
            f"{API}/auth/phone/register",
            json={"name": "TEST_PhoneUserA", "phone": PHONE_A_RAW, "password": PASSWORD_OK},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        # Data assertions
        assert data["provider"] == "phone"
        assert data["is_admin"] is False
        assert data["phone"] == PHONE_A_NORMALIZED
        assert data["name"] == "TEST_PhoneUserA"
        assert data["user_id"].startswith("user_")

        _created_user_ids.add(data["user_id"])
        _created_phones.add(PHONE_A_NORMALIZED)

        # Cookie set
        cookie = r.cookies.get("session_token")
        assert cookie is not None, "session_token cookie must be set"
        assert cookie.startswith("sess_"), f"unexpected token prefix: {cookie[:10]}"

        # DB: password_hash is bcrypt
        doc = _db.users.find_one({"user_id": data["user_id"]})
        assert doc is not None
        assert doc.get("password_hash", "").startswith("$2b$"), "bcrypt hash must start with $2b$"
        assert doc["provider"] == "phone"
        assert doc["is_admin"] is False

        # /auth/me works using the session cookie via the same session
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200, me.text
        me_data = me.json()
        assert me_data["user_id"] == data["user_id"]
        assert me_data["phone"] == PHONE_A_NORMALIZED
        assert me_data["is_admin"] is False

    def test_register_short_password_400(self):
        r = requests.post(
            f"{API}/auth/phone/register",
            json={"name": "TEST_x", "phone": _rand_ddd_number(), "password": PASSWORD_SHORT},
        )
        assert r.status_code == 400
        assert "senha" in (r.json().get("detail", "").lower())

    def test_register_invalid_phone_too_short_400(self):
        r = requests.post(
            f"{API}/auth/phone/register",
            json={"name": "TEST_bad_phone", "phone": "123456", "password": PASSWORD_OK},
        )
        assert r.status_code == 400
        assert "Telefone" in r.json().get("detail", "")

    def test_register_duplicate_phone_409(self):
        r = requests.post(
            f"{API}/auth/phone/register",
            json={"name": "TEST_dup", "phone": PHONE_A_RAW, "password": PASSWORD_OK},
        )
        assert r.status_code == 409


# ---------- Login ----------
class TestPhoneLogin:
    def test_login_success_with_masked_phone_normalizes_to_same_user(self):
        s = _session()
        # Uses masked variant "(11) 91234-5678" -> should hit the same user
        r = s.post(
            f"{API}/auth/phone/login",
            json={"phone": PHONE_A_MASKED, "password": PASSWORD_OK},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["phone"] == PHONE_A_NORMALIZED
        assert data["provider"] == "phone"
        assert data["is_admin"] is False

        cookie = r.cookies.get("session_token")
        assert cookie and cookie.startswith("sess_")

        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["phone"] == PHONE_A_NORMALIZED

    def test_login_wrong_password_401(self):
        r = requests.post(
            f"{API}/auth/phone/login",
            json={"phone": PHONE_A_RAW, "password": "wrongwrong"},
        )
        assert r.status_code == 401
        assert r.json().get("detail") == "Telefone ou senha inválidos"

    def test_login_unknown_phone_same_error_401(self):
        # Use a completely fresh phone number so no lockout is in effect
        r = requests.post(
            f"{API}/auth/phone/login",
            json={"phone": _rand_ddd_number(), "password": PASSWORD_OK},
        )
        assert r.status_code == 401
        # Same generic message — must NOT leak existence
        assert r.json().get("detail") == "Telefone ou senha inválidos"


# ---------- Rate limit / lockout ----------
class TestLoginRateLimit:
    def test_five_failed_then_429_on_sixth(self):
        # New user just for lockout test to keep isolation
        phone_raw = _rand_ddd_number()
        phone_norm = "55" + re.sub(r"\D", "", phone_raw)
        r_reg = requests.post(
            f"{API}/auth/phone/register",
            json={"name": "TEST_Locky", "phone": phone_raw, "password": PASSWORD_OK},
        )
        assert r_reg.status_code == 200, r_reg.text
        _created_user_ids.add(r_reg.json()["user_id"])
        _created_phones.add(phone_norm)

        # 5 wrong password attempts
        for i in range(5):
            r = requests.post(
                f"{API}/auth/phone/login",
                json={"phone": phone_raw, "password": "wrongwrong"},
            )
            assert r.status_code == 401, f"attempt {i+1}: {r.status_code} {r.text}"

        # 6th attempt should be 429 (locked)
        r6 = requests.post(
            f"{API}/auth/phone/login",
            json={"phone": phone_raw, "password": PASSWORD_OK},  # even correct pwd
        )
        assert r6.status_code == 429, r6.text
        assert "Muitas tentativas" in r6.json().get("detail", "")


# ---------- Phone user creates booking + checkout ----------
class TestPhoneUserFlows:
    def test_phone_user_booking_records_user_id(self):
        s = _session()
        r = s.post(f"{API}/auth/phone/login",
                   json={"phone": PHONE_A_RAW, "password": PASSWORD_OK})
        assert r.status_code == 200
        user_id = r.json()["user_id"]

        # /me/bookings (no bookings yet -> 200 list)
        r_me = s.get(f"{API}/me/bookings")
        assert r_me.status_code == 200
        assert isinstance(r_me.json(), list)

        r_b = s.post(
            f"{API}/bookings",
            json={
                "name": "TEST_PhoneBook",
                "phone": "11999998888",
                "service": "Corte",
                "date": "2099-08-08",
                "time": "10:00",
            },
        )
        assert r_b.status_code == 200, r_b.text
        b = r_b.json()
        assert b["user_id"] == user_id

        r_me2 = s.get(f"{API}/me/bookings")
        assert r_me2.status_code == 200
        assert any(x["id"] == b["id"] for x in r_me2.json())

    def test_phone_user_checkout_records_user_id(self):
        s = _session()
        r = s.post(f"{API}/auth/phone/login",
                   json={"phone": PHONE_A_RAW, "password": PASSWORD_OK})
        assert r.status_code == 200
        user_id = r.json()["user_id"]

        r_c = s.post(
            f"{API}/checkout/session",
            json={"plan_id": "bronze", "origin_url": BASE_URL},
        )
        assert r_c.status_code == 200, r_c.text
        session_id = r_c.json()["session_id"]

        # Verify persistence via mongo directly (avoid needing admin token here)
        tx = _db.payment_transactions.find_one({"session_id": session_id})
        assert tx is not None
        assert tx["user_id"] == user_id
        assert tx.get("customer_name") == "TEST_PhoneUserA"


# ---------- Admin RBAC regression for phone users ----------
class TestPhoneUserNotAdmin:
    def test_phone_user_gets_403_on_admin(self):
        s = _session()
        r = s.post(f"{API}/auth/phone/login",
                   json={"phone": PHONE_A_RAW, "password": PASSWORD_OK})
        assert r.status_code == 200
        for path in ("/admin/bookings", "/admin/transactions", "/admin/stats"):
            rr = s.get(f"{API}{path}")
            assert rr.status_code == 403, f"{path} -> {rr.status_code}"


# ---------- Google Auth regression (should still exist) ----------
class TestGoogleAuthRegression:
    def test_session_missing_id_400(self):
        r = requests.post(f"{API}/auth/session", json={})
        assert r.status_code == 400

    def test_session_invalid_id_401(self):
        r = requests.post(
            f"{API}/auth/session",
            json={"session_id": "invalid_" + uuid.uuid4().hex},
        )
        assert r.status_code == 401


# ---------- Public regression ----------
class TestPublicRegression:
    def test_services_ok(self):
        r = requests.get(f"{API}/services")
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) >= 5

    def test_plans_ok(self):
        r = requests.get(f"{API}/plans")
        assert r.status_code == 200
        assert {p["id"] for p in r.json()} == {"bronze", "prata", "ouro"}

    def test_bookings_taken_ok(self):
        r = requests.get(f"{API}/bookings/taken", params={"date": "2099-12-31"})
        assert r.status_code == 200
        assert "taken" in r.json()

    def test_checkout_session_no_auth_still_ok(self):
        # public checkout still allowed (user_id null, but no error)
        r = requests.post(
            f"{API}/checkout/session",
            json={"plan_id": "prata", "origin_url": BASE_URL},
        )
        assert r.status_code == 200
        assert r.json().get("session_id")
