import random
from prompts import DISTRACTION_WARNING_MESSAGES, FOCUS_ENCOURAGEMENT_MESSAGES
from database import ActivityLog
from sqlalchemy.orm import Session
from datetime import datetime

DISTRACTION_SITES = [
    "youtube.com", "instagram.com", "twitter.com", "x.com",
    "reddit.com", "netflix.com", "lordsmobile.com", "facebook.com",
    "snapchat.com", "hotstar.com", "primevideo.com"
]

FOCUS_SITES = [
    "github.com", "stackoverflow.com", "leetcode.com", "nptel.ac.in",
    "coursera.org", "pw.live", "geeksforgeeks.org", "kaggle.com",
    "claude.ai", "chatgpt.com", "notion.so", "docs.google.com"
]

def classify_site(url: str) -> str:
    url = url.lower()
    for site in DISTRACTION_SITES:
        if site in url:
            return "distraction"
    for site in FOCUS_SITES:
        if site in url:
            return "focus"
    return "neutral"

def get_warning_message(site: str) -> str:
    msg = random.choice(DISTRACTION_WARNING_MESSAGES)
    return msg.format(site=site)

def get_encouragement_message() -> str:
    return random.choice(FOCUS_ENCOURAGEMENT_MESSAGES)

def log_activity(db: Session, site: str, category: str):
    log = ActivityLog(site=site, category=category, timestamp=datetime.utcnow())
    db.add(log)
    db.commit()
    return log

def get_recent_activity(db: Session, limit: int = 5):
    return db.query(ActivityLog)\
             .order_by(ActivityLog.timestamp.desc())\
             .limit(limit)\
             .all()