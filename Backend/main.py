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
    
@app.get("/")
def root():
    return {"Welcome": "EasyLearn"}
    
@app.post("/ask")
async def ask_question(request: QueryRequest):
    sys_response = response(request.user_query)
    return {"response": sys_response}