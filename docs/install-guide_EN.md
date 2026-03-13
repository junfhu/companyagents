# Installation Guide

## Use Case

This guide is for people who want to run `companyagents` locally for
development, demos, or product evaluation.

The simplest recommended setup is:

- SQLite for backend storage
- Vite dev server for frontend
- Optional demo seed data

## Requirements

Recommended environment:

- Python `3.11+`
- Node.js `18+`
- npm `9+`

Optional infrastructure:

- PostgreSQL
- Redis

For local development and demos, you do not need PostgreSQL or Redis.

## 1. Get Into The Project

```bash
cd companyagents
```

## 2. Install Backend Dependencies

From `companyagents/`:

```bash
python -m pip install -e .
```

## 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

## 4. Configure Backend Environment

Minimal local example:

```bash
export DATABASE_URL_OVERRIDE="sqlite+aiosqlite:///./delivery_os.db"
export APP_AUTO_CREATE_TABLES=true
export APP_DEBUG=true
export APP_RUNTIME_WORKERS_ENABLED=true
```

Notes:

- `DATABASE_URL_OVERRIDE` points to a local SQLite database
- `APP_AUTO_CREATE_TABLES=true` lets the app create tables on startup
- `APP_RUNTIME_WORKERS_ENABLED=true` enables the background runtime worker

For more options, see [.env.example](/root/edict/companyagents/.env.example).

## 5. Configure Frontend Environment

```bash
cd frontend
cp .env.example .env
```

Then make sure `.env` contains:

```text
VITE_BACKEND_PORT=8100
```

By default, the frontend will reuse the hostname of the page you opened and
send API requests to port `8100`.
If you need the frontend to talk to a different API server, set:

```text
VITE_API_BASE=http://192.168.1.10:8100/api
```

## 6. Start The Backend

From the parent repo:

```bash
make -C companyagents backend-dev
```

Default backend URL:

```text
http://0.0.0.0:8100
```

Local checks:

```text
http://127.0.0.1:8100/health
http://127.0.0.1:8100/api
```

Remote checks:

```text
http://SERVER_IP:8100/health
http://SERVER_IP:8100/api
```

## 7. Start The Frontend

```bash
make -C companyagents frontend-dev
```

Default frontend URL:

```text
http://SERVER_IP:4173
```

## 7.1 Start Backend And Frontend With One Command

If you want one command to start both services, run this from the parent directory:

```bash
./companyagents/start-dev.sh
```

This script will:

- start backend and frontend together
- write logs to `companyagents/.run/`
- stop both processes when you press `Ctrl+C`

## 8. Seed Demo Data

To quickly see a fuller workflow, seed demo data:

```bash
make -C companyagents seed-demo
```

This creates tasks in a few representative states:

- waiting for review
- actively executing
- stalled and blocked
- sent back for planning changes

## 9. Build And Test

Frontend production build:

```bash
make -C companyagents frontend-build
```

Backend tests:

```bash
make -C companyagents backend-test
```

## Common Issues

### The frontend loads but shows no data

Check:

- the backend is running
- `VITE_BACKEND_PORT` matches the backend port

If the frontend should talk to a different API server, set `VITE_API_BASE` explicitly.

### The backend starts but the UI errors out

Check:

- `python -m pip install -e .` was run
- `APP_AUTO_CREATE_TABLES=true` is set

### I want the fastest way to evaluate the product

The easiest path is:

1. Start the backend
2. Start the frontend
3. Run `make -C companyagents seed-demo`
4. Open `Board`, `Attention`, `Teams`, and `Task Detail`
