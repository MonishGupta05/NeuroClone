from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from services.llm_service import get_response
from services.memory_service import get_memory_context, store_memory, store_correction

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: str = ""

class CorrectionRequest(BaseModel):
    correction: str

class SummaryRequest(BaseModel):
    conversation: str

@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    memory_context = get_memory_context(db)
    response = get_response(request.message, memory_context, request.context)
    store_memory(db, f"User said: {request.message}", memory_type="conversation", importance=0.5)
    return {"response": response}

@router.post("/correct")
def correct(request: CorrectionRequest, db: Session = Depends(get_db)):
    store_correction(db, request.correction)
    return {"status": "correction stored", "correction": request.correction}

@router.post("/summarize")
def summarize_session(request: SummaryRequest, db: Session = Depends(get_db)):
    prompt = f"""Summarize this conversation in 2-3 sentences. Extract:
1. What Monish was struggling with
2. What was decided or planned
3. Any important facts about him revealed

Conversation:
{request.conversation}

Reply with just the summary, no labels."""
    
    summary = get_response(prompt)
    store_memory(db, f"[SESSION SUMMARY] {summary}", memory_type="reflection", importance=1.5)
    return {"summary": summary}