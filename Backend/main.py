import base64
import asyncio
import hashlib
import hmac
import json
import ipaddress
import logging
import os
import re
import socket
import time
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, Field
import httpx
import trafilatura
from ddgs import DDGS
from fastapi.middleware.cors import CORSMiddleware
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

load_dotenv()

app = FastAPI()
logger = logging.getLogger("easylearn.search")

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


class WebSearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)


def _public_web_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
            return False
        host = parsed.hostname.lower()
        if host == "localhost" or host.endswith((".localhost", ".local")):
            return False
        addresses = [
            ipaddress.ip_address(info[4][0])
            for info in socket.getaddrinfo(
                host,
                parsed.port or (443 if parsed.scheme == "https" else 80),
                type=socket.SOCK_STREAM,
            )
        ]
        return bool(addresses) and all(address.is_global for address in addresses)
    except (ValueError, OSError):
        return False


def _rank_chunks(query: str, chunks: list[dict]) -> list[dict]:
    stop_words = {"what", "when", "where", "which", "with", "from", "that", "this", "have", "will", "does", "about", "into", "your", "their", "explain", "tell", "how", "why"}
    terms = {word.lower() for word in re.findall(r"[a-zA-Z0-9]{3,}", query) if word.lower() not in stop_words}
    for chunk in chunks:
        words = {word.lower() for word in re.findall(r"[a-zA-Z0-9]{3,}", chunk["content"])}
        chunk["score"] = len(terms & words) / max(1, len(terms))
    return sorted(chunks, key=lambda chunk: chunk["score"], reverse=True)


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


@app.post("/search")
async def search_web(payload: WebSearchRequest):
    """Search via DDGS, extract public pages, and return relevant text chunks."""
    try:
        search_results = await asyncio.to_thread(
            lambda: DDGS().text(
                payload.query,
                region="in-en",
                safesearch="moderate",
                max_results=5,
                backend="duckduckgo",
            )
        )
    except Exception as error:
        error_text = str(error).lower()
        if "dns" in error_text or "resolve" in error_text:
            detail = "Could not reach DuckDuckGo because DNS lookup failed. Check the backend machine’s internet and DNS connection."
            reason = "DNS lookup failed"
        elif "timeout" in error_text or "timed out" in error_text:
            detail = "DuckDuckGo search timed out. Please try again shortly."
            reason = "request timed out"
        else:
            detail = "DuckDuckGo search is temporarily unavailable. Please try again shortly."
            reason = "provider request failed"
        # Avoid logging the exception text: search-library errors can include the query URL.
        logger.warning("Web search failed: %s (%s)", reason, type(error).__name__)
        raise HTTPException(
            status_code=502,
            detail=detail,
        ) from error

    candidates = []
    for item in search_results:
        url = str(item.get("href") or item.get("url") or "")
        if not _public_web_url(url):
            continue
        candidates.append({
            "title": str(item.get("title") or url)[:200],
            "url": url[:2000],
            "snippet": " ".join(str(item.get("body") or item.get("snippet") or "").split())[:1200],
        })
        if len(candidates) == 5:
            break
    if not candidates:
        return {"results": []}

    try:
        async with httpx.AsyncClient(
            timeout=12,
            follow_redirects=False,
            headers={
                "User-Agent": "EasyLearn/0.1 (educational search)",
                "Accept": "text/html",
            },
        ) as client:
            async def fetch_page(item):
                fallback = [{"title": item["title"], "url": item["url"], "content": item["snippet"]}] if len(item["snippet"]) > 40 else []
                try:
                    page_response = await client.get(item["url"])
                    if page_response.status_code != 200 or "html" not in page_response.headers.get("content-type", "").lower():
                        return fallback
                    html = page_response.content[:1_000_000].decode(page_response.encoding or "utf-8", errors="replace")
                    text = trafilatura.extract(html, url=item["url"], include_comments=False, include_tables=False)
                    text = " ".join((text or "").split())
                    if len(text) < 180:
                        return fallback
                    sentences = re.split(r"(?<=[.!?])\s+", text)
                    page_chunks = []
                    buffer = ""
                    for sentence in sentences:
                        if len(buffer) + len(sentence) > 1000 and buffer:
                            if len(buffer) > 180:
                                page_chunks.append(buffer)
                            buffer = ""
                        buffer = f"{buffer} {sentence}".strip()
                    if len(buffer) > 180:
                        page_chunks.append(buffer)
                    extracted_chunks = [{"title": item["title"], "url": item["url"], "content": chunk[:1200]} for chunk in page_chunks[:8]]
                    return extracted_chunks or fallback
                except (httpx.HTTPError, UnicodeError, ValueError):
                    return fallback
                except Exception:
                    return fallback

            batches = await asyncio.gather(*(fetch_page(item) for item in candidates))
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve live web search results. The search page may be temporarily unavailable.",
        ) from error

    chunks = _rank_chunks(payload.query, [chunk for batch in batches for chunk in batch])
    selected = []
    seen_sources = set()
    for chunk in chunks:
        if chunk["url"] not in seen_sources:
            selected.append(chunk)
            seen_sources.add(chunk["url"])
        if len(selected) == 3:
            break
    return {"results": selected}


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
