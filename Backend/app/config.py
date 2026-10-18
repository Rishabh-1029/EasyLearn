"""Environment-backed settings for the backend."""

import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
AUTH_SESSION_SECRET = os.getenv("AUTH_SESSION_SECRET", "").strip()
AUTH_COOKIE_NAME = "easylearn_session"
AUTH_COOKIE_MAX_AGE = 14 * 24 * 60 * 60
AUTH_COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "true").lower() == "true"
_cookie_samesite = os.getenv("AUTH_COOKIE_SAMESITE", "lax").lower()
AUTH_COOKIE_SAMESITE = (
    _cookie_samesite if _cookie_samesite in {"lax", "strict", "none"} else "lax"
)
