"""FastAPI application setup."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.search import router as search_router
from app.config import FRONTEND_ORIGINS


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(auth_router)
app.include_router(search_router)


@app.get("/")
def root():
    return {"EasyLearn": "A platform for learners by Rishabh Surana"}
