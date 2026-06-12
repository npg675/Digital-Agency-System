from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from contextlib import asynccontextmanager
from app.core.sla_checker import check_slas_and_notify
from app.core.scheduler import start_scheduler, stop_scheduler
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

# Load .env into os.environ
load_dotenv()

from app.api.v1.api import api_router
from app.core.config import settings
from app.database import engine
from app.models.base import Base

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background checker
    sla_task = asyncio.create_task(check_slas_and_notify())
    # Start APScheduler
    start_scheduler()
    yield
    # Cancel it on shutdown
    sla_task.cancel()
    stop_scheduler()

app = FastAPI(
    title="LandingForge API",
    description="Backend API for LandingForge, a digital agency landing page builder.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],  # Add production domains here when deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Mount static files for media uploads
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="api_uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to LandingForge API"}

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
