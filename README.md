# Flux OS

**The cognitive layer for autonomous commerce.** One intent and one budget → one optimized cart and one orchestrated payment across multiple retailers.

---

## Overview

Flux OS turns fragmented multi-retailer procurement into a single agentic workflow. Submit natural-language intent (e.g. *"hackathon kit: snacks, badges, prizes"*), set budget and strategy; the system parses intent, scouts Amazon / Walmart / TechData, ranks by your constraints, and simulates a unified checkout with audit logs.

---

## Plan–Act–Verify Loop

The agent goes beyond retrieval-augmented generation with a closed **Plan–Act–Verify** cycle:

| Phase | What happens |
|-------|----------------|
| **Plan** | GPT-4o parses intent into procurement categories; budget, deadline, and strategy are captured as constraints. |
| **Act** | Orchestrator filters vendors by trust and budget, scores and ranks items, and applies simulated negotiation (e.g. discounts). |
| **Verify** | Options are validated against Flux State; strategy changes trigger re-ranking; payment runs as a simulated fan-out with policy checks. |

Result: the agent **plans from intent**, **acts across vendors**, and **verifies against constraints**—not a one-shot Q&A.

---

## Architecture

| Layer | Technology |
|-------|------------|
| API | FastAPI (Python) |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| AI | OpenAI GPT-4o (intent parsing) |

- **Backend:** `backend/main.py` — FastAPI app, health at `/`, routes under `/api`.
- **Services:** Intent + scoring in `services/ai_engine.py`; orchestration + payment in `routers/procurement.py`.
- **Contract:** REST; schemas in `models/schemas.py` (`UserRequest`, `ProcurementOption`).

---

## Flux State (Constraint Model)

Every decision is evaluated against a multi-dimensional **Flux State**:

| Dimension | Role |
|-----------|------|
| **Budget** | Hard cap; only items with `current_spend + price ≤ budget` are considered. |
| **Speed** | Delivery days feed the ranking engine; strategy can be *cheapest*, *fastest*, or *balanced*. |
| **Vendor trust** | Vendors below a trust threshold are excluded; score shown in cart and reasoning. |
| **Strategy** | User choice drives re-ranking and AI reasoning labels (e.g. “Best Price”, “Fastest Delivery”). |

The UI exposes retailer badges, AI reasoning, and optional telemetry (model, latency, tokens).

---

## Quick Start

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
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

In the dashboard: enter intent, budget, and deadline → choose strategy → **INITIATE** → review cart → **Execute Payment** to see the full flow.

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/orchestrate` | Orchestration; body: `UserRequest`; returns `options` + `telemetry` |
| POST | `/api/execute_payment` | Simulated payment fan-out; body: cart; returns `status` + `logs` |

---

## Project Structure

```
arcflow-commerce-agent/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── models/schemas.py
│   ├── routers/procurement.py
│   ├── services/ai_engine.py
│   ├── utils/logger.py
│   └── requirements.txt
├── frontend/                # Next.js 14 app
└── README.md
```

---

## Hackathon Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Scenario (Host Kit C) | Yes | Snacks, badges, adapters, prizes |
| Multi-retailer | Yes | Amazon, Walmart, TechData; retailer badges in cart |
| Ranking engine | Yes | Cheapest / Fastest / Balanced; re-rank on strategy change |
| AI reasoning | Yes | Per-item “why” (e.g. Best Price, Fastest Delivery) |
| Simulated checkout | Yes | Authenticate → place order per retailer → sync logistics |
| Sandbox / safe demo | Yes | SANDBOX banner, mock gateway |
| Adaptability (Rule 3) | Yes | Strategy dropdown → re-sort + updated reasoning |
| Orchestration (Rule 2.5) | Yes | Parse → Scout → Rank → Assemble; fan-out at checkout |
| Chain-of-thought (Rule 2.3) | Yes | `[THOUGHT]`, `[ACTION]`, `[OBSERVATION]` in UI |
| Dev mode / telemetry | Yes | Model, latency, token usage toggle |
| Autonomous negotiation | Yes | Simulated discounts; original vs negotiated price in UI |

---

## License

MIT
