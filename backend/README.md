# Backend

FastAPI control plane for the modern delivery OS scaffold.

## Current Capabilities

The backend already exposes:

- task lifecycle APIs
- plan and review APIs
- work item and artifact APIs
- activity timeline APIs
- supervisor intervention APIs
- dashboard summary, attention, teams, and bundle APIs
- task detail bundle aggregation
- realtime WebSocket event broadcasting

## Key Modules

- `app/main.py`: FastAPI entrypoint and lifespan setup
- `app/api/`: route layer
- `app/services/dashboard_service.py`: global control-plane aggregates
- `app/services/task_bundle_service.py`: task detail aggregates
- `app/services/workflow.py`: transition rules
- `scripts/seed_demo.py`: local demo seed data

## Local Run

Use the detailed guide in [START.md](/root/edict/modern_delivery_os/backend/START.md).
