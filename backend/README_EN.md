# Backend

FastAPI control plane for the modern delivery OS scaffold.

## Current Capabilities

The backend already exposes:

- task lifecycle APIs
- plan and review APIs
- work item and artifact APIs
- activity timeline APIs
- supervisor intervention APIs
- actor-based permission checks
- dashboard summary, attention, teams, and bundle APIs
- runtime status and control APIs
- task detail bundle aggregation
- realtime WebSocket event broadcasting
- background orchestration loop for approved / blocked / completed tasks

## Key Modules

- `app/main.py`: FastAPI entrypoint and lifespan setup
- `app/api/`: route layer
- `app/services/dashboard_service.py`: global control-plane aggregates
- `app/services/task_bundle_service.py`: task detail aggregates
- `app/services/runtime_service.py`: runtime orchestration logic
- `app/runtime.py`: runtime worker loop and task-level execution helpers
- `app/services/workflow.py`: transition rules
- `scripts/seed_demo.py`: local demo seed data

## Local Run

Use the detailed guide in [START_EN.md](/root/edict/modern_delivery_os/backend/START_EN.md).
