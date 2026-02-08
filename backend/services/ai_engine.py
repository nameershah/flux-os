from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

import json
import os
import time
import google.generativeai as genai
from openai import OpenAI
from groq import Groq  # New high-speed inference engine
from utils.logger import get_logger

logger = get_logger(__name__)

# --- Initialization ---
openai_key = os.environ.get("OPENAI_API_KEY")
gemini_key = os.environ.get("GEMINI_API_KEY")
groq_key = os.environ.get("GROQ_API_KEY")

# Primary High-Speed Client (Groq)
_groq_client = Groq(api_key=groq_key) if groq_key else None
# Fallback/Secondary Client (OpenAI)
_openai_client = OpenAI(api_key=openai_key) if openai_key else None

if gemini_key:
    genai.configure(api_key=gemini_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    logger.warning("GEMINI_API_KEY not found")
    model = None

# Telemetry constants
LLM_MODEL_DISPLAY = "Llama-3.3-70b (via Groq)"
LLM_MODEL_API = "llama-3.3-70b-versatile" 
COGNITIVE_REQUEST_TIMEOUT_SEC = 30

def parse_intent_ai(prompt: str) -> tuple[list[str], dict]:
    """Extract categories using Groq's LPU for sub-second latency."""
    cognitive_telemetry = {"model": LLM_MODEL_DISPLAY, "latency_ms": 0, "tokens_used": 0}
    
    # Check if we can use Groq, otherwise fallback to OpenAI
    client = _groq_client or _openai_client
    if not client:
        return ["snacks", "badges", "adapters"], cognitive_telemetry

    try:
        t0 = time.perf_counter()
        
        # Groq is OpenAI-compatible, so the syntax remains almost identical
        response = client.chat.completions.create(
            model=LLM_MODEL_API if _groq_client else "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return a JSON list of procurement categories (snacks, badges, adapters, prizes) based on the user prompt. Example: ['snacks', 'prizes']"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"} if _groq_client else None
        )
        
        elapsed = (time.perf_counter() - t0) * 1000
        content = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
        parsed_json = json.loads(content)
        
        # Handle different possible JSON structures from LLM
        if isinstance(parsed_json, dict) and "categories" in parsed_json:
            categories = parsed_json["categories"]
        elif isinstance(parsed_json, list):
            categories = parsed_json
        else:
            categories = ["snacks", "badges"]

        cognitive_telemetry["latency_ms"] = round(elapsed, 0)
        return categories, cognitive_telemetry

    except Exception as e:
        logger.error(f"Groq/OpenAI parsing failed: {e}")
        return ["snacks", "badges"], cognitive_telemetry

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

async def extract_intent_from_doc(file_bytes: bytes, mime_type: str) -> str:
    """Uses Gemini to turn images/PDFs into a text prompt."""
    if not model:
        return "Generic request"
    
    prompt = "Extract the procurement items and quantities from this document. Return only a single sentence describing the full intent."
    
    # We use Gemini here because Groq doesn't support Vision/Multimodal yet
    response = model.generate_content([
        {'mime_type': mime_type, 'data': file_bytes},
        prompt
    ])
    return response.text