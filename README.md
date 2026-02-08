# Flux OS

The cognitive layer for autonomous commerce. One intent and one budget → one optimized cart and one orchestrated payment across multiple retailers.

## Overview

Flux OS turns fragmented multi-retailer procurement into a single agentic workflow. Submit natural-language intent (e.g. *"hackathon kit: snacks, badges, prizes"*), set budget and strategy; the system parses intent, scouts Amazon, Walmart, and TechData, ranks by your constraints, and simulates a unified checkout with audit logs.

<p align="center">
  <img src="assets/dashboard.png" alt="Flux OS Dashboard" width="600"/>
</p>

## How It Works

The agent follows a **Plan–Act–Verify** cycle:

| Phase | Description |
|-------|-------------|
| **Plan** | GPT-4o parses intent into procurement categories; budget, deadline, and strategy are captured as constraints. |
| **Act** | Orchestrator filters vendors by trust and budget, scores and ranks items, and applies simulated negotiation. |
| **Verify** | Options are validated against Flux State; strategy changes trigger re-ranking; payment runs as a simulated fan-out. |

<p align="center">
  <img src="assets/cart.png" alt="Flux OS Cart" width="600"/>
</p>

## Architecture

| Layer | Technology |
|-------|------------|
| API | FastAPI (Python) |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| AI | OpenAI GPT-4o |

- **Backend:** `backend/main.py` — FastAPI app, health at `/`, routes under `/api`
- **Services:** `services/ai_engine.py` (intent + scoring), `routers/procurement.py` (orchestration + payment)
- **Schemas:** `models/schemas.py` — `UserRequest`, `ProcurementOption`

## Flux State

Every decision is evaluated against:

- **Budget** — Hard cap; only items within budget are considered
- **Speed** — Delivery days feed the ranking engine
- **Strategy** — Cheapest, fastest, or balanced; drives re-ranking and AI reasoning
- **Vendor trust** — Vendors below threshold are excluded; score shown in cart

## Quick Start

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
export OPENAI_API_KEY=sk-your-key
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Frontend (separate terminal)
cd frontend
npm install && npm run dev
```

| Service | URL |
|---------|-----|
| API | http://127.0.0.1:8001 |
| API docs | http://127.0.0.1:8001/docs |
| Dashboard | http://localhost:3000 |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/orchestrate` | Orchestration; body: `UserRequest`; returns `options` + `telemetry` |
| POST | `/api/execute_payment` | Simulated payment fan-out; body: cart; returns `status` + `logs` |

## Project Structure

```
arcflow-commerce-agent/
├── assets/
├── backend/
│   ├── main.py
│   ├── models/schemas.py
│   ├── routers/procurement.py
│   ├── services/ai_engine.py
│   ├── utils/logger.py
│   └── requirements.txt
├── frontend/
└── README.md
```

## License

MIT
