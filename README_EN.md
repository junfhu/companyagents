# AI Delivery Operating System

Modern-company rewrite of the current multi-agent workflow system.

## What This Folder Is

This directory is the isolated implementation track for the next-generation
system. It keeps the new architecture separate from the legacy runtime so we
can iterate safely.

The current scaffold already includes:

- modern role and workflow model
- FastAPI control plane
- SQLite/Postgres-compatible SQLAlchemy models
- Alembic scaffold and initial migration
- task, plan, review, work item, artifact, activity, and intervention flows
- actor-aware permission checks for write actions
- React dashboard with Board, Attention, Teams, Task Detail, and Settings pages
- WebSocket-based realtime refresh
- lightweight runtime worker that auto-dispatches approved tasks
- runtime status, audit, and manual control surfaces

## Current Status

This is no longer just a planning folder. The vertical slice already works for:

1. create task
2. qualify task
3. create plan
4. submit review
5. approve / request changes / reject
6. create work items
7. update work item progress
8. create artifacts
9. inspect task bundle, dashboard bundle, teams, and activity
10. let the runtime worker auto-create work items for approved plans
11. let the runtime worker advance completed execution into reporting-ready and done states
12. control runtime globally and per task from the UI
13. audit runtime-generated work, events, and escalations

Implemented backend highlights:

- `GET /health`
- `GET /api`
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/{task_id}`
- `POST /api/tasks/{task_id}/qualify`
- `POST /api/tasks/{task_id}/plan`
- `POST /api/tasks/{task_id}/submit-review`
- `POST /api/tasks/{task_id}/approve`
- `POST /api/tasks/{task_id}/request-changes`
- `POST /api/tasks/{task_id}/reject`
- `POST /api/tasks/{task_id}/work-items`
- `POST /api/work-items/{work_item_id}/progress`
- `POST /api/tasks/{task_id}/artifacts`
- `GET /api/tasks/{task_id}/activity`
- `GET /api/tasks/{task_id}/bundle`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/attention`
- `GET /api/dashboard/bundle`
- `GET /api/teams`
- `GET /api/teams/{team_name}/work-items`
- `GET /api/runtime/status`
- `POST /api/runtime/run-once`
- `POST /api/runtime/pause`
- `POST /api/runtime/resume`
- `POST /api/runtime/tasks/{task_id}/run-once`
- `POST /api/runtime/tasks/{task_id}/sweep`
- WebSocket endpoint at `/ws`

Implemented frontend highlights:

- `Board` overview page
- `Attention` queue page
- `Teams` execution page
- `Task Detail` drill-down page
- `Settings` page for actor and runtime controls
- task creation, planning, review, work item, progress, and artifact forms
- runtime status panel, runtime audit views, and task-level runtime actions
- realtime refresh from WebSocket events
- demo seed script for realistic control-plane data

## Layout

```text
modern_delivery_os/
  README.md
  README_EN.md
  CHECKLIST.md
  START_HERE.md
  docs/
  backend/
  frontend/
  tests/
```

## Where To Look First

- `docs/final-plan.md`: final product and architecture direction
- `backend/START_EN.md`: local backend run guide
- `frontend/README_EN.md`: frontend local run guide
- `backend/app/main.py`: FastAPI entrypoint
- `frontend/src/App.tsx`: app shell and routing

## Demo Data

To seed a few realistic tasks for local demos:

```bash
python -m modern_delivery_os.backend.scripts.seed_demo
```

This creates a small mix of:

- task waiting in review
- task actively executing
- blocked task with intervention history
- task sent back for planning changes

## Handy Commands

```bash
make -C modern_delivery_os backend-dev
make -C modern_delivery_os frontend-dev
make -C modern_delivery_os frontend-build
make -C modern_delivery_os backend-test
make -C modern_delivery_os seed-demo
```

## Recommended Next Work

The scaffold is ready for the next implementation layer. Highest-value next
items are:

1. add richer runtime policies, retries, and task-specific templates
2. add deeper supervisor history UX and intervention analytics
3. add Inbox/Templates pages to round out the product shell
4. add demo seed scripts and richer end-to-end tests
