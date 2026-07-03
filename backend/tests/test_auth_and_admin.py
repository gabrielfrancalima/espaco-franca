"""Backend tests for Emergent Google Auth integration + Admin RBAC.

Covers:
- /api/auth/me (401 / 200)
- /api/auth/session (400/401)
- /api/me/bookings, /api/me/subscriptions (401 + user-scoped filter)
- /api/admin/bookings, /api/admin/transactions, /api/admin/stats (403 non-admin / 200 admin)
- POST /api/bookings persists user_id from token (or null without)
- POST /api/checkout/session persists user_id + uses user email/name
- Regression: public endpoints (services, plans, bookings/taken) still work
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_TOKEN = "ADMIN_TOKEN_TEST"
USER_TOKEN = "USER_TOKEN_TEST"
ADMIN_USER_ID = "user_admin_test"
REGULAR_USER_ID = "user_regular_test"
ADMIN_EMAIL = "df1384435@gmail.com"


def _h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Public regression ----------
class TestPublicEndpointsRegression:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_services(self):
        r = requests.get(f"{API}/services")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 7
        ids = {s["id"] for s in data}
        assert "corte" in ids and "platinado" in ids

    def test_plans(self):
        r = requests.get(f"{API}/plans")
        assert r.status_code == 200
        data = r.json()
        assert {p["id"] for p in data} == {"bronze", "prata", "ouro"}

    def test_bookings_taken_public(self):
        r = requests.get(f"{API}/bookings/taken", params={"date": "2099-12-31"})
        assert r.status_code == 200
        assert "taken" in r.json()


# ---------- /api/auth/me ----------
class TestAuthMe:
    def test_me_no_token_401(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_invalid_token_401(self):
        r = requests.get(f"{API}/auth/me", headers=_h("garbage_token_xxx"))
        assert r.status_code == 401

    def test_me_admin_token_200(self):
        r = requests.get(f"{API}/auth/me", headers=_h(ADMIN_TOKEN))
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["is_admin"] is True
        assert d["user_id"] == ADMIN_USER_ID
        assert "name" in d

    def test_me_regular_token_200(self):
        r = requests.get(f"{API}/auth/me", headers=_h(USER_TOKEN))
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == "test.regular@example.com"
        assert d["is_admin"] is False
        assert d["user_id"] == REGULAR_USER_ID


# ---------- /api/auth/session ----------
class TestAuthSessionExchange:
    def test_session_missing_id_400(self):
        r = requests.post(f"{API}/auth/session", json={})
        assert r.status_code == 400

    def test_session_invalid_id_401(self):
        r = requests.post(f"{API}/auth/session", json={"session_id": "invalid_xxx_" + uuid.uuid4().hex})
        assert r.status_code == 401


# ---------- /api/me/bookings + /api/me/subscriptions ----------
class TestMeScopedEndpoints:
    def test_me_bookings_no_token_401(self):
        r = requests.get(f"{API}/me/bookings")
        assert r.status_code == 401

    def test_me_subscriptions_no_token_401(self):
        r = requests.get(f"{API}/me/subscriptions")
        assert r.status_code == 401

    def test_me_bookings_scoped_to_user(self):
        # Create a booking as regular user
        payload = {
            "name": "TEST_MeBook",
            "phone": "11999990000",
            "service": "Corte",
            "date": "2099-11-11",
            "time": "10:00",
            "notes": "",
        }
        r = requests.post(f"{API}/bookings", json=payload, headers=_h(USER_TOKEN))
        assert r.status_code == 200, r.text
        booking = r.json()
        assert booking["user_id"] == REGULAR_USER_ID

        # Regular user sees own booking
        r = requests.get(f"{API}/me/bookings", headers=_h(USER_TOKEN))
        assert r.status_code == 200
        docs = r.json()
        assert any(b["id"] == booking["id"] for b in docs)
        assert all(b["user_id"] == REGULAR_USER_ID for b in docs)

        # Admin does NOT see it in /me/bookings (scoped to admin's user_id)
        r = requests.get(f"{API}/me/bookings", headers=_h(ADMIN_TOKEN))
        assert r.status_code == 200
        docs_admin = r.json()
        assert all(b["user_id"] == ADMIN_USER_ID for b in docs_admin)

    def test_me_subscriptions_scoped_to_user(self):
        r = requests.get(f"{API}/me/subscriptions", headers=_h(USER_TOKEN))
        assert r.status_code == 200
        docs = r.json()
        assert all(d.get("user_id") == REGULAR_USER_ID for d in docs)


# ---------- Admin endpoints ----------
class TestAdminEndpoints:
    def test_admin_bookings_no_token_401(self):
        r = requests.get(f"{API}/admin/bookings")
        assert r.status_code == 401

    def test_admin_bookings_non_admin_403(self):
        r = requests.get(f"{API}/admin/bookings", headers=_h(USER_TOKEN))
        assert r.status_code == 403

    def test_admin_bookings_admin_200(self):
        r = requests.get(f"{API}/admin/bookings", headers=_h(ADMIN_TOKEN))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_transactions_non_admin_403(self):
        r = requests.get(f"{API}/admin/transactions", headers=_h(USER_TOKEN))
        assert r.status_code == 403

    def test_admin_transactions_admin_200(self):
        r = requests.get(f"{API}/admin/transactions", headers=_h(ADMIN_TOKEN))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_stats_non_admin_403(self):
        r = requests.get(f"{API}/admin/stats", headers=_h(USER_TOKEN))
        assert r.status_code == 403

    def test_admin_stats_admin_200(self):
        r = requests.get(f"{API}/admin/stats", headers=_h(ADMIN_TOKEN))
        assert r.status_code == 200
        d = r.json()
        assert "total_bookings" in d and "total_users" in d and "paid_transactions" in d


# ---------- POST /api/bookings behavior with/without token ----------
class TestBookingsUserAttribution:
    def test_booking_without_token_null_user(self):
        payload = {
            "name": "TEST_Anon",
            "phone": "11988887777",
            "service": "Corte",
            "date": "2099-10-10",
            "time": "11:00",
        }
        r = requests.post(f"{API}/bookings", json=payload)
        assert r.status_code == 200, r.text
        assert r.json().get("user_id") is None

    def test_booking_with_token_records_user_id(self):
        payload = {
            "name": "TEST_Auth",
            "phone": "11977776666",
            "service": "Barba",
            "date": "2099-10-11",
            "time": "12:00",
        }
        r = requests.post(f"{API}/bookings", json=payload, headers=_h(USER_TOKEN))
        assert r.status_code == 200
        assert r.json().get("user_id") == REGULAR_USER_ID


# ---------- Checkout with token ----------
class TestCheckoutUserAttribution:
    def test_checkout_with_token_stores_user_id_and_email(self):
        r = requests.post(
            f"{API}/checkout/session",
            headers=_h(USER_TOKEN),
            json={"plan_id": "bronze", "origin_url": BASE_URL},
        )
        assert r.status_code == 200, r.text
        session_id = r.json()["session_id"]

        # Verify via admin endpoint (has _id excluded)
        r_admin = requests.get(f"{API}/admin/transactions", headers=_h(ADMIN_TOKEN))
        assert r_admin.status_code == 200
        txs = r_admin.json()
        tx = next((t for t in txs if t["session_id"] == session_id), None)
        assert tx is not None, "Transaction not persisted"
        assert tx["user_id"] == REGULAR_USER_ID
        assert tx["customer_email"] == "test.regular@example.com"
        assert tx["customer_name"] == "Regular User"

    def test_checkout_invalid_plan_400(self):
        r = requests.post(
            f"{API}/checkout/session",
            headers=_h(USER_TOKEN),
            json={"plan_id": "diamante", "origin_url": BASE_URL},
        )
        assert r.status_code == 400


# ---------- Logout ----------
class TestLogout:
    def test_logout_without_token_ok(self):
        r = requests.post(f"{API}/auth/logout")
        assert r.status_code == 200
