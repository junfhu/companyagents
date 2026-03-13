from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient


def test_health_endpoint():
    pytest.importorskip("sqlalchemy")
    from modern_delivery_os.backend.app.main import app

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["status"] == "healthy"


def test_api_root():
    pytest.importorskip("sqlalchemy")
    from modern_delivery_os.backend.app.main import app

    client = TestClient(app)
    response = client.get("/api")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert "modules" in body


def test_env_example_exists():
    assert Path("/root/edict/modern_delivery_os/.env.example").exists()
