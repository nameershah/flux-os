import os
import json
import time
import google.generativeai as genai
from openai import OpenAI
from groq import Groq
from dotenv import load_dotenv, find_dotenv
from utils.logger import get_logger

# 1. Force load environment variables
load_dotenv(find_dotenv())
logger = get_logger(__name__)

# --- Initialization ---
openai_key = os.environ.get("OPENAI_API_KEY")
gemini_key = os.environ.get("GEMINI_API_KEY")
groq_key = os.environ.get("GROQ_API_KEY")

_groq_client = Groq(api_key=groq_key) if groq_key else None
_openai_client = OpenAI(api_key=openai_key) if openai_key else None

# Gemini 3 Flash: document vision (image/PDF). Intent from text uses Groq/OpenAI.
GEMINI_MODEL_ID = "gemini-3-flash-preview"
if gemini_key:
    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(GEMINI_MODEL_ID)
        logger.info("Gemini engine ready: %s", GEMINI_MODEL_ID)
    except Exception as e:
        logger.error("Gemini init error: %s", e)
        model = None
else:
    model = None

LLM_MODEL_DISPLAY = "Llama-3.3-70b (Groq LPU)"
LLM_MODEL_API = "llama-3.3-70b-versatile" 

def parse_intent_ai(prompt: str) -> tuple[list[str], dict]:
    """Extract categories using Groq's LPU for sub-second latency."""
    cognitive_telemetry = {"model": LLM_MODEL_DISPLAY, "latency_ms": 0, "tokens_used": 0}
    client = _groq_client or _openai_client
    if not client: return ["snacks", "badges"], cognitive_telemetry

    try:
        t0 = time.perf_counter()
        response = client.chat.completions.create(
            model=LLM_MODEL_API if _groq_client else "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return a JSON list of categories: snacks, badges, adapters, prizes. Format: {'categories': []}"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        elapsed = (time.perf_counter() - t0) * 1000
        content = response.choices[0].message.content
        parsed_json = json.loads(content)
        categories = parsed_json.get("categories", ["snacks", "badges"])
        cognitive_telemetry["latency_ms"] = round(elapsed, 0)
        return categories, cognitive_telemetry
    except Exception as e:
        logger.error(f"Groq logic failed: {e}")
        return ["snacks", "badges"], cognitive_telemetry

async def extract_intent_from_doc(file_bytes: bytes, mime_type: str) -> str:
    """Extract procurement intent from image/PDF via Gemini vision API."""
    if not model:
        logger.warning("No Gemini model configured; using fallback intent.")
        return "Procurement: snacks, badges, adapters, prizes for hackathon."
    try:
        response = model.generate_content([
            {"mime_type": mime_type, "data": file_bytes},
            "Extract items and quantities from this document. Return one short sentence summary suitable for a shopping list.",
        ])
        if response and response.text:
            return response.text.strip()
        return "Procurement: snacks, badges, adapters, prizes for hackathon."
    except Exception as e:
        logger.error("Gemini vision API error: %s", e)
        return "Procurement: snacks, badges, adapters, prizes for hackathon."

def calculate_score(item: dict, strategy: str) -> float:
    price = item.get("price", 100)
    norm_price = price / 200.0
    norm_delivery = item["delivery_days"] / 7.0
    w_p, w_d = (0.9, 0.1) if strategy == "cheapest" else (0.1, 0.9) if strategy == "fastest" else (0.5, 0.5)
    return round((norm_price * w_p) + (norm_delivery * w_d), 3)

def derive_ai_reason(item: dict, candidates: list, strategy: str) -> str:
    if strategy == "cheapest": return "Best Price"
    if strategy == "fastest": return "Fastest Delivery"
    return "Balanced Selection"