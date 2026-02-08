import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import procurement_router
from utils.logger import setup_logging

# Vercel doesn't need load_dotenv() because it injects variables directly.
# This keeps it from crashing if the .env file is missing.
if os.path.exists(".env"):
    from dotenv import load_dotenv
    load_dotenv()

setup_logging()

app = FastAPI(
    title="Flux OS API",
    description="Agentic Commerce Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your Vercel frontend to communicate
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Essential: Add a health check root so Vercel knows the app is live
@app.get("/")
async def health_check():
    return {"status": "online", "agent": "Flux OS"}

app.include_router(procurement_router, prefix="/api")