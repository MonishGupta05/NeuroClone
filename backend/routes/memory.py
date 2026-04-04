from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from services.memory_service import store_memory, retrieve_memories, store_goal

router = APIRouter()

class MemoryRequest(BaseModel):
    content: str
    memory_type: str = "fact"
    importance: float = 1.0

class GoalRequest(BaseModel):
    goal: str

@router.post("/memory")
def add_memory(request: MemoryRequest, db: Session = Depends(get_db)):
    memory = store_memory(db, request.content, request.memory_type, request.importance)
    return {"status": "stored", "id": memory.id}

@router.get("/memory")
def get_memories(db: Session = Depends(get_db)):
    memories = retrieve_memories(db)
    return {"memories": [
        {"id": m.id, "content": m.content, "type": m.memory_type, "importance": m.importance}
        for m in memories
    ]}

@router.post("/goal")
def add_goal(request: GoalRequest, db: Session = Depends(get_db)):
    memory = store_goal(db, request.goal)
    return {"status": "goal stored", "id": memory.id}