from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from services.activity_service import classify_site, get_warning_message, get_encouragement_message, log_activity, get_recent_activity

router = APIRouter()

class ActivityRequest(BaseModel):
    url: str
    site: str

@router.post("/activity")
def track_activity(request: ActivityRequest, db: Session = Depends(get_db)):
    category = classify_site(request.url)
    log_activity(db, request.site, category)

    if category == "distraction":
        return {
            "category": "distraction",
            "message": get_warning_message(request.site),
            "action": "warn"
        }
    elif category == "focus":
        return {
            "category": "focus",
            "message": get_encouragement_message(),
            "action": "encourage"
        }
    else:
        return {
            "category": "neutral",
            "message": "",
            "action": "none"
        }

@router.get("/activity/recent")
def recent_activity(db: Session = Depends(get_db)):
    logs = get_recent_activity(db)
    return {"activity": [
        {"site": l.site, "category": l.category, "time": str(l.timestamp)}
        for l in logs
    ]}