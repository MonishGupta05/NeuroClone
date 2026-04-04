from fastapi import APIRouter
from pydantic import BaseModel
from services.task_service import generate_ai_image, search_web_images, detect_task_intent

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