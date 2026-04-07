from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from services.memory_service import retrieve_memories
from services.llm_service import get_response

router = APIRouter()

class BrainSearchRequest(BaseModel):
    query: str

@router.post("/brain/search")
def search_brain(request: BrainSearchRequest, db: Session = Depends(get_db)):
    query = request.query
    memories = retrieve_memories(db, limit=30)

    query_words = query.lower().split()
    relevant = [m for m in memories if any(word in m.content.lower() for word in query_words)]

    context = "\n".join([f"[{m.memory_type.upper()}] {m.content}" for m in relevant[:12]])

    if not context:
        context = "No specific memories found matching this query."

    prompt = f"""You are searching through Monish Gupta's personal memory bank.

Query: {query}

Relevant memories found:
{context}

Give a direct, specific answer based purely on what's stored in memory.
If something relevant is found, summarize it clearly.
If nothing relevant found, say "Nothing stored about this yet" and suggest what to tell you so you can remember it.
Keep it under 3 sentences. No fluff."""

    answer = get_response(prompt)

    return {
        "answer": answer,
        "memories_searched": len(memories),
        "relevant_found": len(relevant),
        "relevant_memories": [
            {"type": m.memory_type, "content": m.content[:120]}
            for m in relevant[:5]
        ]
    }