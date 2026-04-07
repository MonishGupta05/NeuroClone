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

    all_logs = db.query(ActivityLog).all()
    recent_logs = db.query(ActivityLog).filter(ActivityLog.timestamp >= day_ago).all()
    week_logs = db.query(ActivityLog).filter(ActivityLog.timestamp >= week_ago).all()

    today_distractions = [l for l in recent_logs if l.category == "distraction"]
    today_focus = [l for l in recent_logs if l.category == "focus"]

    total_today = len(today_distractions) + len(today_focus)
    score = 50 if total_today == 0 else round((len(today_focus) / total_today) * 100)

    distraction_sites = {}
    for log in all_logs:
        if log.category == "distraction":
            distraction_sites[log.site] = distraction_sites.get(log.site, 0) + 1
    top_distractions = sorted(distraction_sites.items(), key=lambda x: x[1], reverse=True)[:5]

    weekly_trend = []
    for i in range(6, -1, -1):
        day_start = now - timedelta(days=i+1)
        day_end = now - timedelta(days=i)
        day_logs = [l for l in week_logs if day_start <= l.timestamp <= day_end]
        weekly_trend.append({
            "day": (now - timedelta(days=i)).strftime("%a"),
            "distractions": len([l for l in day_logs if l.category == "distraction"]),
            "focus": len([l for l in day_logs if l.category == "focus"])
        })

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

@router.get("/analytics/hourly")
def get_hourly_analytics(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    day_ago = now - timedelta(hours=24)
    logs = db.query(ActivityLog).filter(ActivityLog.timestamp >= day_ago).all()

    hourly = {}
    for i in range(24):
        hourly[str(i)] = {"focus": 0, "distraction": 0, "score": -1, "active": False}

    for log in logs:
        h = str(log.timestamp.hour)
        hourly[h]["active"] = True
        if log.category == "focus":
            hourly[h]["focus"] += 1
        elif log.category == "distraction":
            hourly[h]["distraction"] += 1

    for h in hourly:
        total = hourly[h]["focus"] + hourly[h]["distraction"]
        if total > 0:
            hourly[h]["score"] = round((hourly[h]["focus"] / total) * 100)

    active_hours = {h: hourly[h] for h in hourly if hourly[h]["active"] and hourly[h]["score"] >= 0}
    peak_hour = max(active_hours, key=lambda h: active_hours[h]["score"]) if active_hours else None
    worst_hour = min(active_hours, key=lambda h: active_hours[h]["score"]) if active_hours else None

    total_focus = sum(hourly[h]["focus"] for h in hourly)
    total_dist = sum(hourly[h]["distraction"] for h in hourly)
    efficiency = round((total_focus / (total_focus + total_dist)) * 100) if (total_focus + total_dist) > 0 else 0

    return {
        "hourly": hourly,
        "peak_hour": peak_hour,
        "worst_hour": worst_hour,
        "efficiency": efficiency,
        "current_hour": str(now.hour)
    }