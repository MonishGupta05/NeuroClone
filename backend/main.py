from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes.chat import router as chat_router
from routes.memory import router as memory_router
from routes.activity import router as activity_router
from routes.permission import router as permission_router
from routes.analytics import router as analytics_router
from routes.reflection import router as reflection_router
from routes.tasks import router as tasks_router

app = FastAPI(title="NeuroClone Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(chat_router, prefix="/api/v1")
app.include_router(memory_router, prefix="/api/v1")
app.include_router(activity_router, prefix="/api/v1")
app.include_router(permission_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(reflection_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "NeuroClone is alive", "message": "Bhai, let's get to work."}