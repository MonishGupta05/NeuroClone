from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, ActivityLog, Memory
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    day_ago = now - timedelta(hours=24)
    week_ago = now - timedelta(days=7)

    # All activity logs
    all_logs = db.query(ActivityLog).all()
    recent_logs = db.query(ActivityLog).filter(ActivityLog.timestamp >= day_ago).all()
    week_logs = db.query(ActivityLog).filter(ActivityLog.timestamp >= week_ago).all()

    # Today's stats
    today_distractions = [l for l in recent_logs if l.category == "distraction"]
    today_focus = [l for l in recent_logs if l.category == "focus"]

    # Productivity score (0-100)
    total_today = len(today_distractions) + len(today_focus)
    if total_today == 0:
        score = 50
    else:
        score = round((len(today_focus) / total_today) * 100)

    # Top distraction sites
    distraction_sites = {}
    for log in all_logs:
        if log.category == "distraction":
            distraction_sites[log.site] = distraction_sites.get(log.site, 0) + 1
    top_distractions = sorted(distraction_sites.items(), key=lambda x: x[1], reverse=True)[:5]

    # Weekly trend (last 7 days)
    weekly_trend = []
    for i in range(6, -1, -1):
        day_start = now - timedelta(days=i+1)
        day_end = now - timedelta(days=i)
        day_logs = [l for l in week_logs if day_start <= l.timestamp <= day_end]
        day_dist = len([l for l in day_logs if l.category == "distraction"])
        day_focus = len([l for l in day_logs if l.category == "focus"])
        weekly_trend.append({
            "day": (now - timedelta(days=i)).strftime("%a"),
            "distractions": day_dist,
            "focus": day_focus
        })

    # Memory stats
    all_memories = db.query(Memory).all()
    memory_types = {}
    for m in all_memories:
        memory_types[m.memory_type] = memory_types.get(m.memory_type, 0) + 1

    return {
        "score": score,
        "today": {
            "distractions": len(today_distractions),
            "focus": len(today_focus),
            "total_sites": total_today
        },
        "top_distractions": [{"site": s, "count": c} for s, c in top_distractions],
        "weekly_trend": weekly_trend,
        "memory_stats": memory_types,
        "total_memories": len(all_memories)
    }