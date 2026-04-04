from sqlalchemy.orm import Session
from database import Memory
from datetime import datetime

def store_memory(db: Session, content: str, memory_type: str, importance: float = 1.0):
    memory = Memory(
        content=content,
        memory_type=memory_type,
        importance=importance,
        created_at=datetime.utcnow()
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return memory

def retrieve_memories(db: Session, limit: int = 10):
    return db.query(Memory)\
             .order_by(Memory.importance.desc(), Memory.created_at.desc())\
             .limit(limit)\
             .all()

def get_memory_context(db: Session):
    memories = retrieve_memories(db)
    if not memories:
        return "No memories stored yet."
    lines = []
    for m in memories:
        lines.append(f"[{m.memory_type.upper()}] {m.content}")
    return "\n".join(lines)

def store_correction(db: Session, correction: str):
    return store_memory(db, correction, memory_type="correction", importance=2.0)

def store_goal(db: Session, goal: str):
    return store_memory(db, goal, memory_type="goal", importance=1.8)