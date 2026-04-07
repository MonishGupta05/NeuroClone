from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, ActivityLog
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/streaks")
def get_streaks(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    thirty_ago = now - timedelta(days=30)
    logs = db.query(ActivityLog).filter(ActivityLog.timestamp >= thirty_ago).all()

    daily_scores = {}
    for log in logs:
        d = log.timestamp.strftime("%Y-%m-%d")
        if d not in daily_scores:
            daily_scores[d] = {"focus": 0, "distraction": 0}
        if log.category == "focus":
            daily_scores[d]["focus"] += 1
        elif log.category == "distraction":
            daily_scores[d]["distraction"] += 1

    daily_results = {}
    for d, counts in daily_scores.items():
        total = counts["focus"] + counts["distraction"]
        score = round((counts["focus"] / total) * 100) if total > 0 else 0
        daily_results[d] = {"score": score, "productive": score >= 40}

    today = now.date()
    current_streak = 0
    for i in range(30):
        check_date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        if check_date in daily_results and daily_results[check_date]["productive"]:
            current_streak += 1
        else:
            break

    streak = 0
    best_streak = 0
    for d in sorted(daily_results.keys()):
        if daily_results[d]["productive"]:
            streak += 1
            best_streak = max(best_streak, streak)
        else:
            streak = 0

    last_14 = []
    for i in range(13, -1, -1):
        d = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        last_14.append({
            "date": d,
            "day": (today - timedelta(days=i)).strftime("%a"),
            "score": daily_results.get(d, {}).get("score", -1),
            "productive": daily_results.get(d, {}).get("productive", False)
        })

    today_str = today.strftime("%Y-%m-%d")
    yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")

    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "last_14_days": last_14,
        "today_score": daily_results.get(today_str, {}).get("score", 0),
        "yesterday_score": daily_results.get(yesterday_str, {}).get("score", 0)
    }