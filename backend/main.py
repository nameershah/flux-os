import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
from routers.procurement import router as procurement_router
from utils.logger import setup_logging

# Load Environment Variables
load_dotenv(find_dotenv())

# Boot: at least one AI provider required for intent parsing (Groq/OpenAI) and document vision (Gemini)
_has_openai = bool(os.getenv("OPENAI_API_KEY"))
_has_gemini = bool(os.getenv("GEMINI_API_KEY"))
_has_groq = bool(os.getenv("GROQ_API_KEY"))
if not (_has_openai or _has_groq):
    print("[WARN] No OPENAI_API_KEY or GROQ_API_KEY; intent parsing will use fallback categories.")
if not _has_gemini:
    print("[WARN] No GEMINI_API_KEY; document upload will use fallback intent.")
if (_has_openai or _has_groq) and _has_gemini:
    print("[OK] Flux OS: AI engines configured.")

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