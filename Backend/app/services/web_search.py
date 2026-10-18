"""Web search, safe URL filtering, page extraction, and result ranking."""

import asyncio
import ipaddress
import logging
import re
import socket
from urllib.parse import urlparse

import httpx
import trafilatura
from ddgs import DDGS
from fastapi import HTTPException


logger = logging.getLogger("easylearn.search")


def _public_web_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or parsed.username
            or parsed.password
        ):
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
    stop_words = {
        "what", "when", "where", "which", "with", "from", "that", "this", "have",
        "will", "does", "about", "into", "your", "their", "explain", "tell", "how",
        "why",
    }
    terms = {
        word.lower()
        for word in re.findall(r"[a-zA-Z0-9]{3,}", query)
        if word.lower() not in stop_words
    }
    for chunk in chunks:
        words = {word.lower() for word in re.findall(r"[a-zA-Z0-9]{3,}", chunk["content"])}
        chunk["score"] = len(terms & words) / max(1, len(terms))
    return sorted(chunks, key=lambda chunk: chunk["score"], reverse=True)


async def search_web_sources(query: str) -> dict:
    """Retrieve public search results and rank extracted passages for a query."""
    try:
        search_results = await asyncio.to_thread(
            lambda: DDGS().text(
                query,
                region="in-en",
                safesearch="moderate",
                max_results=5,
                # Search across available providers so one blocked or rate-limited
                # engine does not make the whole web-search request fail.
                backend="auto",
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
        # Search-library errors can include the query URL, so log only the error type.
        logger.warning("Web search failed: %s (%s)", reason, type(error).__name__)
        raise HTTPException(status_code=502, detail=detail) from error

    candidates = []
    for item in search_results:
        url = str(item.get("href") or item.get("url") or "")
        if not _public_web_url(url):
            continue
        candidates.append(
            {
                "title": str(item.get("title") or url)[:200],
                "url": url[:2000],
                "snippet": " ".join(str(item.get("body") or item.get("snippet") or "").split())[:1200],
            }
        )
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
                fallback = (
                    [{"title": item["title"], "url": item["url"], "content": item["snippet"]}]
                    if len(item["snippet"]) > 40
                    else []
                )
                try:
                    page_response = await client.get(item["url"])
                    if (
                        page_response.status_code != 200
                        or "html" not in page_response.headers.get("content-type", "").lower()
                    ):
                        return fallback
                    html = page_response.content[:1_000_000].decode(
                        page_response.encoding or "utf-8", errors="replace"
                    )
                    text = trafilatura.extract(
                        html,
                        url=item["url"],
                        include_comments=False,
                        include_tables=False,
                    )
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
                    extracted_chunks = [
                        {"title": item["title"], "url": item["url"], "content": chunk[:1200]}
                        for chunk in page_chunks[:8]
                    ]
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

    chunks = _rank_chunks(query, [chunk for batch in batches for chunk in batch])
    selected = []
    seen_sources = set()
    for chunk in chunks:
        if chunk["url"] not in seen_sources:
            selected.append(chunk)
            seen_sources.add(chunk["url"])
        if len(selected) == 3:
            break
    return {"results": selected}
