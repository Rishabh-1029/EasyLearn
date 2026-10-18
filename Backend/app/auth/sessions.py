"""Signed session-cookie encoding and decoding."""

import base64
import hashlib
import hmac
import json
import time

from fastapi import HTTPException, Response

from app.config import (
    AUTH_COOKIE_MAX_AGE,
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_SECURE,
    AUTH_COOKIE_SAMESITE,
    AUTH_SESSION_SECRET,
)


def _session_secret_is_configured() -> bool:
    return len(AUTH_SESSION_SECRET) >= 32 and not AUTH_SESSION_SECRET.startswith("replace-")


def encode_session(user: dict) -> str:
    if not _session_secret_is_configured():
        raise HTTPException(status_code=503, detail="Google sign-in is not configured on the server.")
    payload = {
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "picture": user.get("picture", ""),
        "exp": int(time.time()) + AUTH_COOKIE_MAX_AGE,
    }
    encoded = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":")).encode()
    ).decode().rstrip("=")
    signature = hmac.new(AUTH_SESSION_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
    signed = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{encoded}.{signed}"


def decode_session(value: str | None) -> dict | None:
    if not value or not _session_secret_is_configured():
        return None
    try:
        encoded, supplied_signature = value.split(".", 1)
        expected_signature = hmac.new(
            AUTH_SESSION_SECRET.encode(), encoded.encode(), hashlib.sha256
        ).digest()
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


def set_auth_cookie(response: Response, value: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=value,
        max_age=AUTH_COOKIE_MAX_AGE,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        path="/",
    )


def delete_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        secure=AUTH_COOKIE_SECURE,
        httponly=True,
        samesite=AUTH_COOKIE_SAMESITE,
    )
