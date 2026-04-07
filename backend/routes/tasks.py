from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from services.task_service import generate_ai_image, search_web_images, detect_task_intent
from services.memory_service import get_memory_context
from services.llm_service import get_response
from datetime import datetime
import json, re

router = APIRouter()

class TaskDetectRequest(BaseModel):
    message: str

class ImageGenRequest(BaseModel):
    prompt: str

class ImageSearchRequest(BaseModel):
    query: str

@router.post("/task/detect")
def detect_task(request: TaskDetectRequest):
    return detect_task_intent(request.message)

@router.post("/task/generate-image")
def gen_image(request: ImageGenRequest):
    return generate_ai_image(request.prompt)

@router.post("/task/search-image")
def search_img(request: ImageSearchRequest):
    return search_web_images(request.query)

@router.post("/task/study-plan")
def generate_study_plan(db: Session = Depends(get_db)):
    memory_context = get_memory_context(db)
    current_time = datetime.now().strftime("%I:%M %p")

    prompt = f"""Generate a realistic study plan for Monish Gupta for today.

Current time: {current_time}
Memory context: {memory_context}

His priorities:
- GATE 2026 preparation (PW course - 370 videos pending, only 30 watched)
- VLSI and Verilog skills
- His biggest challenge is inconsistency and starting late

Generate time blocks from now until midnight. Be specific.
Return ONLY a valid JSON array, nothing else, no markdown:
[
  {{"time": "4:00 PM - 5:00 PM", "task": "Watch 2 PW videos on Network Theory", "subject": "GATE", "priority": "high", "note": "Take notes, don't skip"}},
  {{"time": "5:00 PM - 5:15 PM", "task": "Short break", "subject": "Break", "priority": "low", "note": "No phone"}},
  ...
]

Subjects must be one of: GATE, VLSI, Break, Skills, Review
Priority must be: high, medium, low
Maximum 10 blocks. Make it achievable."""

    response = get_response(prompt)

    try:
        json_match = re.search(r'\[.*?\]', response, re.DOTALL)
        if json_match:
            plan = json.loads(json_match.group())
            return {"plan": plan, "generated_at": current_time, "success": True}
    except Exception as e:
        pass

    return {"plan": [], "raw": response, "generated_at": current_time, "success": False}