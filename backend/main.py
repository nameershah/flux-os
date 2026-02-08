import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
from routers.procurement import router as procurement_router
from utils.logger import setup_logging

# Load Environment Variables
load_dotenv(find_dotenv())

# Boot logs for terminal verification
if not os.getenv("OPENAI_API_KEY") or not os.getenv("GEMINI_API_KEY"):
    print("⚠️ WARNING: Missing API Keys (OpenAI or Gemini) in .env!")
else:
    print("✅ Flux OS: AI Engine Keys Loaded Successfully.")

setup_logging()

app = FastAPI(
    title="Flux OS API",
    description="Cognitive Layer for Autonomous Commerce",
    version="1.0.0",
)

# Standard Middleware for Frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Health Check
@app.get("/")
async def health_check():
    return {
        "status": "online", 
        "agent": "Flux OS",
        "kernel": "ArcFlow Deterministic"
    }

# Registered API Routes
app.include_router(procurement_router, prefix="/api")