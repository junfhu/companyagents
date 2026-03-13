# Backend Start Guide

## Local Dev Mode

Use SQLite first for the fastest local loop.

## 1. Set Environment

Copy values from `.env.example`.

Example:

```bash
export DATABASE_URL_OVERRIDE="sqlite+aiosqlite:///./delivery_os.db"
export APP_AUTO_CREATE_TABLES=true
export APP_DEBUG=true
export APP_RUNTIME_WORKERS_ENABLED=true
```

## 2. Run API

From repo root:

```bash
uvicorn companyagents.backend.app.main:app --reload --host 0.0.0.0 --port 8100
```

## 3. Health Check

Bind address:

```text
http://0.0.0.0:8100
```

Local access:

```text
http://127.0.0.1:8100/health
http://127.0.0.1:8100/api
```

Remote access:

```text
http://SERVER_IP:8100/health
http://SERVER_IP:8100/api
```

## 4. Current Feature Set

The backend currently implements:

- task lifecycle: create, qualify, inspect
- plan lifecycle: create, inspect, submit for review
- review lifecycle: approve, request changes, reject
- work item lifecycle: create, progress update
- artifact creation and listing
- activity timeline query
- supervisor actions: pause, resume, retry, escalate, rollback, replan
- actor-based permission checks via request headers
- dashboard aggregation:
  - summary
  - attention
  - teams
  - recent activity
  - dashboard bundle
- task detail aggregation via task bundle
- runtime control:
  - status
  - run once
  - pause / resume
  - task-level run once / sweep
- background runtime orchestration:
  - auto-dispatch approved tasks into generated work items
  - escalate stalled blocked tasks
  - advance completed work into reporting-ready and done
- WebSocket realtime events at `/ws`

## 5. Example Flow

1. `POST /api/tasks`
2. `POST /api/tasks/{task_id}/qualify`
3. `POST /api/tasks/{task_id}/plan`
4. `POST /api/tasks/{task_id}/submit-review`
5. `POST /api/tasks/{task_id}/approve`
6. `POST /api/tasks/{task_id}/work-items`
7. `POST /api/work-items/{work_item_id}/progress`
8. `POST /api/tasks/{task_id}/artifacts`
9. `GET /api/tasks/{task_id}/bundle`
10. `GET /api/dashboard/bundle`
11. `POST /api/runtime/run-once`
12. `POST /api/runtime/tasks/{task_id}/run-once`

## 6. Realtime

WebSocket endpoint:

```text
ws://127.0.0.1:8100/ws?channels=global,task:TASK-123
ws://SERVER_IP:8100/ws?channels=global,task:TASK-123
```

The current implementation broadcasts task events to:

- `global`
- `task:{task_id}`

## 7. Project Structure Notes

Useful backend entry points:

- `app/main.py`: FastAPI app and lifespan setup
- `app/api/`: route layer
- `app/services/dashboard_service.py`: global control-plane aggregation
- `app/services/task_bundle_service.py`: single-task aggregation
- `app/services/runtime_service.py`: runtime orchestration rules
- `app/runtime.py`: worker loop and manual runtime controls
- `app/services/workflow.py`: transition rules
- `app/realtime.py`: WebSocket broadcast manager

## 8. Migrations

Initial Alembic scaffold is included under:

```text
companyagents/backend/migration/
```

For MVP development, `APP_AUTO_CREATE_TABLES=true` is acceptable.
Once schema stabilizes, prefer migrations for all changes.

## 9. Demo Seed

To create a few realistic tasks for Board, Attention, Teams, and Task Detail:

```bash
python -m companyagents.backend.scripts.seed_demo
```

The seed currently creates examples for:

- task waiting in review
- task actively executing
- blocked task with supervisor intervention
- task sent back for plan changes
