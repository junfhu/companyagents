# User Guide

## What This Software Does

AI Delivery Operating System is a workflow control plane for multi-step delivery
work. It helps a team turn a request into an auditable execution flow:

1. Create a task
2. Qualify the request
3. Build a plan
4. Submit for review
5. Approve or request changes
6. Create and track work items
7. Attach output artifacts
8. Monitor runtime automation and supervisor interventions

This project currently behaves like a modern control plane and demoable MVP,
not a full production deployment platform.

## What You Can Do Today

- Manage tasks from intake to completion
- Review task status from Board, Attention, Teams, and Task Detail pages
- Create plans, work items, progress updates, and artifacts from the UI
- Switch actor identity to simulate different workflow roles
- Let the runtime worker auto-dispatch approved tasks
- Pause, resume, or manually trigger runtime orchestration
- Inspect runtime audit events and supervisor escalations

## Intended Users

- Workflow supervisors
- Project or delivery managers
- Reviewers
- Team leads running execution queues
- Internal demo users evaluating the operating model

## Current Screens

- `Board`: overall status, runtime status, runtime audit
- `Attention`: tasks needing intervention or stalled follow-up
- `Teams`: work-item view by team
- `Task Detail`: full task lifecycle, timeline, work, artifacts, supervisor actions
- `Settings`: actor switching and global runtime controls

## Installation Requirements

Recommended local environment:

- Python `3.11+`
- Node.js `18+`
- npm `9+`

Optional infrastructure for later deployment design:

- PostgreSQL
- Redis

For local development and demos, SQLite is enough.

## Quick Install

From the `modern_delivery_os/` directory:

### 1. Install backend dependencies

```bash
python -m pip install -e .
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Configure environment

Backend example:

```bash
export DATABASE_URL_OVERRIDE="sqlite+aiosqlite:///./delivery_os.db"
export APP_AUTO_CREATE_TABLES=true
export APP_RUNTIME_WORKERS_ENABLED=true
```

Frontend example:

```bash
cd frontend
cp .env.example .env
```

Then set:

```text
VITE_API_BASE=http://127.0.0.1:8100/api
```

## Run Locally

### Start backend

```bash
make -C modern_delivery_os backend-dev
```

Default backend URL:

```text
http://127.0.0.1:8100
```

### Start frontend

```bash
make -C modern_delivery_os frontend-dev
```

Default frontend URL:

```text
http://127.0.0.1:4173
```

### Seed demo data

```bash
make -C modern_delivery_os seed-demo
```

## First-Time Walkthrough

1. Open the frontend
2. Create a task from the Board page
3. Switch actor if needed in Settings or Sidebar
4. Qualify and plan the task
5. Submit for review and approve it
6. Let runtime create work automatically or create work manually
7. Update work progress
8. Add an artifact
9. Inspect the task timeline and runtime audit

## Main Commands

```bash
make -C modern_delivery_os backend-dev
make -C modern_delivery_os frontend-dev
make -C modern_delivery_os frontend-build
make -C modern_delivery_os backend-test
make -C modern_delivery_os seed-demo
```

## Current Limitations

- No full authentication system yet
- No production-grade worker fleet
- Inbox and Templates pages are not built yet
- Tests are still focused on MVP flows
- Best suited for local development, demos, and design validation

## Where To Learn More

- Chinese user guide: `docs/user-guide.md`
- Product design: `docs/final-plan_EN.md`
- Backend start guide: `backend/START_EN.md`
- Frontend overview: `frontend/README_EN.md`
