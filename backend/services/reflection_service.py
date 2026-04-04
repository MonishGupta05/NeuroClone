from services.llm_service import get_response
from services.memory_service import store_memory, retrieve_memories, get_memory_context
from database import ActivityLog, Memory
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

def generate_daily_reflection(db: Session) -> str:
    now = datetime.utcnow()
    day_ago = now - timedelta(hours=24)

    # Get today's activity
    logs = db.query(ActivityLog).filter(ActivityLog.timestamp >= day_ago).all()
    distractions = [l for l in logs if l.category == "distraction"]
    focus_hits = [l for l in logs if l.category == "focus"]

    # Get recent memories
    memory_context = get_memory_context(db)

    # Build context for reflection
    activity_summary = f"""
Today's activity:
- Distraction sites visited: {len(distractions)}
- Focus sites visited: {len(focus_hits)}
- Top distractions: {', '.join(set([l.site for l in distractions])) or 'none'}
- Focus sites: {', '.join(set([l.site for l in focus_hits])) or 'none'}
"""

    prompt = f"""You are analyzing Monish Gupta's day to generate a personal reflection.

{activity_summary}

Recent memory context:
{memory_context}

Generate a short daily reflection for Monish (3-4 sentences) that:
1. Honestly evaluates how focused he was today
2. Points out one specific pattern you noticed
3. Gives one direct actionable suggestion for tomorrow
4. Ends with one sentence that sounds like something he'd tell himself

Be brutally honest but not discouraging. Sound like him talking to himself.
No fluff. No bullet points. Just raw honest reflection."""

    reflection = get_response(prompt)
    
    # Store as high importance memory
    store_memory(
        db,
        f"[DAILY REFLECTION - {now.strftime('%Y-%m-%d')}] {reflection}",
        memory_type="reflection",
        importance=2.0
    )
    
    return reflection

def generate_insight(db: Session) -> str:
    memory_context = get_memory_context(db)
    
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    week_logs = db.query(ActivityLog).filter(ActivityLog.timestamp >= week_ago).all()
    
    dist_count = len([l for l in week_logs if l.category == "distraction"])
    focus_count = len([l for l in week_logs if l.category == "focus"])

    prompt = f"""Based on Monish's data, generate one sharp behavioral insight.

Last 7 days:
- Total distractions: {dist_count}
- Total focus sessions: {focus_count}
- Memory context: {memory_context}

Give ONE insight in 2 sentences max. 
Make it feel like something only someone who really knows him would say.
Be specific, not generic. No motivational quotes."""

    return get_response(prompt)

def compress_old_memories(db: Session):
    cutoff = datetime.utcnow() - timedelta(days=7)
    old_low = db.query(Memory).filter(
        Memory.created_at <= cutoff,
        Memory.importance <= 0.5,
        Memory.memory_type == "conversation"
    ).all()
    
    for m in old_low:
        db.delete(m)
    db.commit()
    
    return {"deleted": len(old_low)}