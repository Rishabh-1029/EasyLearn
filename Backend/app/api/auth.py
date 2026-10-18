"""Google sign-in and session endpoints."""

from fastapi import APIRouter, HTTPException, Request, Response
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel

from app.auth.sessions import decode_session, delete_auth_cookie, encode_session, set_auth_cookie
from app.config import AUTH_COOKIE_NAME, AUTH_SESSION_SECRET, GOOGLE_CLIENT_ID


router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleCredentialRequest(BaseModel):
    credential: str


@router.post("/google")
async def sign_in_with_google(request: GoogleCredentialRequest, response: Response):
    if (
        not GOOGLE_CLIENT_ID
        or len(AUTH_SESSION_SECRET) < 32
        or AUTH_SESSION_SECRET.startswith("replace-")
    ):
        raise HTTPException(status_code=503, detail="Google sign-in is not configured on the server.")
    try:
        claims = id_token.verify_oauth2_token(
            request.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception as error:
        raise HTTPException(
            status_code=401,
            detail="Google could not verify this sign-in. Please try again.",
        ) from error

    if not claims.get("sub") or not claims.get("email") or not claims.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google did not return a verified email address.")

    user = {
        "id": claims["sub"],
        "name": claims.get("name") or claims["email"].split("@")[0],
        "email": claims["email"],
        "picture": claims.get("picture", ""),
    }
    set_auth_cookie(response, encode_session(user))
    response.headers["Cache-Control"] = "no-store"
    return {"user": user}


@router.get("/me")
async def current_user(request: Request, response: Response):
    user = decode_session(request.cookies.get(AUTH_COOKIE_NAME))
    if not user:
        raise HTTPException(status_code=401, detail="Not signed in.")
    response.headers["Cache-Control"] = "no-store"
    return {"user": user}


@router.post("/logout", status_code=204)
async def sign_out(response: Response):
    delete_auth_cookie(response)
    response.headers["Cache-Control"] = "no-store"
    return response
