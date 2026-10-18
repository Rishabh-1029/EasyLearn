"""Web-search HTTP endpoint."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.web_search import search_web_sources


router = APIRouter(tags=["search"])


class WebSearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)


@router.post("/search")
async def search_web(payload: WebSearchRequest):
    """Search the web, extract public pages, and return relevant text chunks."""
    return await search_web_sources(payload.query)
