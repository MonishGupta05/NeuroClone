from fastapi import APIRouter
from pydantic import BaseModel
from services.permission_service import request_permission, grant_permission, deny_permission, execute_if_allowed
from services.launcher_service import detect_launch_intent

router = APIRouter()

class PermissionRequest(BaseModel):
    action: str
    description: str

class PermissionDecision(BaseModel):
    action: str
    decision: str

class LaunchDetectRequest(BaseModel):
    message: str

@router.post("/permission/request")
def ask_permission(request: PermissionRequest):
    return request_permission(request.action, request.description)

@router.post("/permission/decide")
def decide_permission(request: PermissionDecision):
    if request.decision.lower() in ["yes", "y"]:
        return grant_permission(request.action)
    return deny_permission(request.action)

@router.post("/permission/execute")
def execute_action(request: PermissionRequest):
    return execute_if_allowed(request.action)

@router.post("/permission/detect")
def detect_intent(request: LaunchDetectRequest):
    return detect_launch_intent(request.message)