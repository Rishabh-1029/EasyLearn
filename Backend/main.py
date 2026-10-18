import base64
import hashlib
import hmac
import json
import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

load_dotenv()

app = FastAPI()

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
AUTH_COOKIE_SAMESITE = _cookie_samesite if _cookie_samesite in {"lax", "strict", "none"} else "lax"

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

class GoogleCredentialRequest(BaseModel):
    credential: str


def _encode_session(user: dict) -> str:
    if len(AUTH_SESSION_SECRET) < 32 or AUTH_SESSION_SECRET.startswith("replace-"):
        raise HTTPException(status_code=503, detail="Google sign-in is not configured on the server.")
    payload = {
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "picture": user.get("picture", ""),
        "exp": int(time.time()) + AUTH_COOKIE_MAX_AGE,
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(AUTH_SESSION_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
    signed = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{encoded}.{signed}"


def _decode_session(value: str | None) -> dict | None:
    if not value or len(AUTH_SESSION_SECRET) < 32 or AUTH_SESSION_SECRET.startswith("replace-"):
        return None
    try:
        encoded, supplied_signature = value.split(".", 1)
        expected_signature = hmac.new(AUTH_SESSION_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
        expected = base64.urlsafe_b64encode(expected_signature).decode().rstrip("=")
        if not hmac.compare_digest(supplied_signature, expected):
            return None
        padded = encoded + "=" * (-len(encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode())
        if payload.get("exp", 0) <= time.time():
            return None
        return {
            "id": payload["sub"],
            "name": payload.get("name", "EasyLearn user"),
            "email": payload["email"],
            "picture": payload.get("picture", ""),
        }
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None


def _set_auth_cookie(response: Response, value: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=value,
        max_age=AUTH_COOKIE_MAX_AGE,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        path="/",
    )
    
@app.get("/")
def root():
    return {"EasyLearn": "A platform for learners by Rishabh Surana"}


@app.post("/auth/google")
async def sign_in_with_google(request: GoogleCredentialRequest, response: Response):
    if not GOOGLE_CLIENT_ID or len(AUTH_SESSION_SECRET) < 32 or AUTH_SESSION_SECRET.startswith("replace-"):
        raise HTTPException(status_code=503, detail="Google sign-in is not configured on the server.")
    try:
        claims = id_token.verify_oauth2_token(
            request.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception as error:
        raise HTTPException(status_code=401, detail="Google could not verify this sign-in. Please try again.") from error

    if not claims.get("sub") or not claims.get("email") or not claims.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google did not return a verified email address.")

    user = {
        "id": claims["sub"],
        "name": claims.get("name") or claims["email"].split("@")[0],
        "email": claims["email"],
        "picture": claims.get("picture", ""),
    }
    _set_auth_cookie(response, _encode_session(user))
    response.headers["Cache-Control"] = "no-store"
    return {"user": user}


@app.get("/auth/me")
async def current_user(request: Request, response: Response):
    user = _decode_session(request.cookies.get(AUTH_COOKIE_NAME))
    if not user:
        raise HTTPException(status_code=401, detail="Not signed in.")
    response.headers["Cache-Control"] = "no-store"
    return {"user": user}


@app.post("/auth/logout", status_code=204)
async def sign_out(response: Response):
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        secure=AUTH_COOKIE_SECURE,
        httponly=True,
        samesite=AUTH_COOKIE_SAMESITE,
    )
    response.headers["Cache-Control"] = "no-store"
    return response
