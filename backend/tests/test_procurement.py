"""
Pytest suite for the procurement API.
OpenAI is mocked so tests do not consume API credits.
"""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_parse_intent():
    """Mock OpenAI call so no credits are used. Default: return snacks + badges."""
    with patch("routers.procurement.ai_engine.parse_intent_ai") as m:
        m.return_value = ["snacks", "badges"]
        yield m


def test_orchestrate_success_returns_cart(client, mock_parse_intent):
    """Normal request returns optimized cart with items from mocked categories."""
    response = client.post(
        "/api/orchestrate",
        json={
            "prompt": "I need snacks and badges for a hackathon",
            "budget": 100.0,
            "deadline_days": 3,
            "strategy": "balanced",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # With budget 100 and categories [snacks, badges], we get one item per category
    assert len(data) >= 1
    for item in data:
        assert "id" in item
        assert "name" in item
        assert "price" in item
        assert "vendor_name" in item
        assert "trust_score" in item
        assert "delivery_days" in item
        assert "ai_score" in item
        assert "reason" in item
    mock_parse_intent.assert_called_once_with("I need snacks and badges for a hackathon")


def test_orchestrate_budget_zero_returns_empty_cart(client, mock_parse_intent):
    """When budget is $0, no items can be added; response is empty list."""
    response = client.post(
        "/api/orchestrate",
        json={
            "prompt": "Snacks and badges",
            "budget": 0.0,
            "deadline_days": 5,
            "strategy": "balanced",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data == []
    mock_parse_intent.assert_called_once()


def test_orchestrate_deadline_zero_days_accepted(client, mock_parse_intent):
    """Deadline of 0 days is accepted; orchestration still runs (no validation error)."""
    response = client.post(
        "/api/orchestrate",
        json={
            "prompt": "Need snacks",
            "budget": 50.0,
            "deadline_days": 0,
            "strategy": "fastest",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    mock_parse_intent.assert_called_once_with("Need snacks")


def test_orchestrate_empty_prompt_uses_fallback_categories(client, mock_parse_intent):
    """Empty prompt still calls AI (mocked); we can force fallback to verify no crash."""
    mock_parse_intent.return_value = ["snacks", "badges"]
    response = client.post(
        "/api/orchestrate",
        json={
            "prompt": "",
            "budget": 100.0,
            "deadline_days": 2,
            "strategy": "cheapest",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    mock_parse_intent.assert_called_once_with("")


def test_orchestrate_empty_prompt_with_zero_budget_returns_empty(client, mock_parse_intent):
    """Empty prompt + $0 budget: no items, empty list."""
    mock_parse_intent.return_value = ["snacks", "badges"]
    response = client.post(
        "/api/orchestrate",
        json={
            "prompt": "",
            "budget": 0.0,
            "deadline_days": 0,
            "strategy": "balanced",
        },
    )
    assert response.status_code == 200
    assert response.json() == []


def test_execute_payment_success(client):
    """Execute payment with whitelisted cart returns success, logs, and transaction_hashes."""
    cart = [
        {
            "id": "w2",
            "name": "Peel-and-Stick Name Tags",
            "price": 5.00,
            "vendor_name": "Walmart",
            "vendor_id": "walmart",
            "trust_score": 95,
            "delivery_days": 0,
            "ai_score": 0.5,
            "reason": "Selected via balanced strategy",
        },
    ]
    response = client.post("/api/execute_payment", json=cart)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "logs" in data
    assert len(data["logs"]) > 0
    assert "transaction_hashes" in data
    assert isinstance(data["transaction_hashes"], list)


def test_execute_payment_empty_cart_403(client):
    """Execute payment with empty cart returns 403 Policy Violation."""
    response = client.post("/api/execute_payment", json=[])
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data
    assert "Policy" in data["detail"] or "policy" in data["detail"].lower()


def test_execute_payment_unwhitelisted_merchant_403(client):
    """Cart with non-whitelisted vendor_id returns 403 Policy Violation."""
    cart = [
        {
            "id": "x1",
            "name": "Unknown Vendor Item",
            "price": 10.0,
            "vendor_name": "Unknown",
            "vendor_id": "unknown_merchant",
        },
    ]
    response = client.post("/api/execute_payment", json=cart)
    assert response.status_code == 403


def test_orchestrate_invalid_body_validation(client):
    """Missing required fields returns 422."""
    response = client.post(
        "/api/orchestrate",
        json={"prompt": "test"},  # missing budget, deadline_days
    )
    assert response.status_code == 422
