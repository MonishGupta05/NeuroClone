from sqlalchemy.orm import Session
from database import Memory
from datetime import datetime
import re

GOAL_KEYWORDS = [
    "want to", "goal is", "aim to", "planning to", "target",
    "achieve", "complete", "finish", "by", "deadline", "milestone",
    "gate", "vlsi", "placement", "job", "internship", "startup",
    "learn", "master", "build", "create", "launch"
]

CORRECTION_KEYWORDS = [
    "that's wrong", "incorrect", "not right", "change it", "fix this",
    "actually", "no bhai", "wrong", "mistake", "correct this",
    "i meant", "i said", "not like that"
]

PREFERENCE_KEYWORDS = [
    "i prefer", "i like", "i hate", "i don't like", "i love",
    "my favorite", "i always", "i never", "i usually", "i tend to"
]

FACT_KEYWORDS = [
    "my name", "i am", "i'm", "i study", "i work", "i live",
    "my college", "my branch", "my batch", "my age", "i have"
]

PLAN_KEYWORDS = [
    "today i will", "i'll", "tomorrow", "this week", "planning",
    "will study", "going to", "schedule", "plan is"
]

def auto_tag_memory(content: str) -> tuple:
    c = content.lower()

    if any(kw in c for kw in CORRECTION_KEYWORDS):
        return "correction", 2.0

    if any(kw in c for kw in GOAL_KEYWORDS):
        return "goal", 1.8

    if any(kw in c for kw in PREFERENCE_KEYWORDS):
        return "preference", 1.5

    if any(kw in c for kw in FACT_KEYWORDS):
        return "fact", 1.4

    if any(kw in c for kw in PLAN_KEYWORDS):
        return "plan", 1.3

    return "conversation", 0.5

def store_memory(db: Session, content: str, memory_type: str = None, importance: float = None):
    if memory_type is None or memory_type == "auto":
        memory_type, importance = auto_tag_memory(content)
    elif importance is None:
        importance = 1.0

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