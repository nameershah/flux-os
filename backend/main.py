import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
# FIX: Explicitly import the router instance from the procurement file
from routers.procurement import router as procurement_router
from utils.logger import setup_logging

# Load Environment Variables
load_dotenv(find_dotenv())

# Debugging logs for terminal
if not os.getenv("OPENAI_API_KEY"):
    print("⚠️ WARNING: OPENAI_API_KEY not found in environment!")
else:
    print("✅ Flux OS: AI Engine Keys Loaded Successfully.")

setup_logging()

app = FastAPI(
    title="Flux OS API",
    description="Cognitive Layer for Autonomous Commerce",
    version="1.0.0",
)

# Standard Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/")
async def health_check():
    return {
        "status": "online", 
        "agent": "Flux OS",
        "kernel": "ArcFlow Deterministic"
    }

# Core API Routes - This mounts everything in procurement.py under /api
app.include_router(procurement_router, prefix="/api")