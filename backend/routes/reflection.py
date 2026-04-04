from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.reflection_service import generate_daily_reflection, generate_insight, compress_old_memories

router = APIRouter()

@router.post("/reflect")
def daily_reflection(db: Session = Depends(get_db)):
    reflection = generate_daily_reflection(db)
    return {"reflection": reflection}

@router.get("/insight")
def get_insight(db: Session = Depends(get_db)):
    insight = generate_insight(db)
    return {"insight": insight}

@router.post("/memory/compress")
def compress_memories(db: Session = Depends(get_db)):
    result = compress_old_memories(db)
    return {"status": "done", "deleted": result["deleted"]}