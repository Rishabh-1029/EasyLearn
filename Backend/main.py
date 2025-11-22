from fastapi import FastAPI
from pydantic import BaseModel
from queryResponse import response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    user_query: str
    model: str = "Gemini"
    level: str = "Short"
    
@app.get("/")
def root():
    return {"EasyLearn": "A platform for learners by Rishabh Surana"}
    
@app.post("/ask")
async def ask_question(request: QueryRequest):
    sys_response = response(request.user_query, request.model, request.level)
    if hasattr(sys_response, "model_dump"):
        sys_response = sys_response.model_dump()
    return {"response": sys_response,
            "model": request.model,
            "level": request.level}