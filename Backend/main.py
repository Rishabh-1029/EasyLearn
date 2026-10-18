"""Compatibility entry point for ``uvicorn main:app`` from Backend/."""

from app.main import app

__all__ = ["app"]
