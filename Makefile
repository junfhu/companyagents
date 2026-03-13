PYTHON ?= python
NPM ?= npm
BACKEND_PORT ?= 8100
FRONTEND_PORT ?= 4173

.PHONY: backend-dev frontend-dev frontend-build backend-test seed-demo

backend-dev:
	PYTHONPATH=.. APP_AUTO_CREATE_TABLES=true $(PYTHON) -m uvicorn companyagents.backend.app.main:app --reload --host 0.0.0.0 --port $(BACKEND_PORT)

frontend-dev:
	cd frontend && $(NPM) run dev -- --host 0.0.0.0 --port $(FRONTEND_PORT)

frontend-build:
	cd frontend && $(NPM) run build

backend-test:
	PYTHONPATH=.. APP_AUTO_CREATE_TABLES=false APP_DEBUG=false pytest -q tests/test_backend_smoke.py

seed-demo:
	PYTHONPATH=.. APP_AUTO_CREATE_TABLES=true $(PYTHON) -m companyagents.backend.scripts.seed_demo
