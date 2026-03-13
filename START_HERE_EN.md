# Start Here

## Current Status

The isolated rewrite in `companyagents/` already has a working end-to-end
scaffold:

- backend API boots locally
- initial migration exists
- smoke tests exist
- frontend builds successfully
- local frontend and backend have been run together
- realtime task events flow through WebSocket
- runtime worker can auto-dispatch approved tasks and advance completed tasks
- actor-based permissions and runtime control surfaces are wired end-to-end

## What Already Works

Backend flow:

1. create task
2. qualify task
3. create plan
4. submit review
5. approve / request changes / reject
6. create work items
7. update work item progress
8. create artifacts
9. query task bundle and dashboard bundle
10. let the runtime worker auto-create execution work items
11. let the runtime worker advance completed tasks into reporting-ready and done
12. control runtime globally and per task
13. inspect runtime audit views from Board and Task Detail

Frontend flow:

1. create task from UI
2. create plan from UI
3. submit for review from UI
4. approve / request changes / reject from UI
5. create work items from UI
6. update work item progress from UI
7. create artifacts from UI
8. inspect Board / Attention / Teams / Task Detail
9. switch actor identity in UI
10. control runtime from Board / Settings / Task Detail

Demo support:

- `python -m companyagents.backend.scripts.seed_demo`
- creates review, execution, blocked, and changes-requested examples

## Best Entry Points

If you are getting oriented, open these first:

1. `README.md` (Chinese default)
2. `README_EN.md` (English version)
3. `docs/final-plan_EN.md`
4. `backend/START_EN.md`
5. `backend/app/main.py`
6. `backend/app/api/router.py`
7. `backend/app/services/dashboard_service.py`
8. `backend/app/services/task_bundle_service.py`
9. `frontend/src/hooks/useControlPlane.ts`
10. `frontend/src/App.tsx`

## Best Next Engineering Steps

If you are continuing implementation, the highest-value next steps are:

1. add stronger supervisor policies and intervention history UX
2. deepen worker policies beyond the current orchestrator
3. add seed/demo scripts for repeatable local showcases
4. add Inbox/Templates pages and broader settings coverage
5. add deeper integration and end-to-end tests

## Definition Of Done For The Current Slice

The current slice should be considered healthy if:

- API boots locally
- frontend builds locally
- one task can move from `New` to `Approved`
- work items and artifacts can be created
- dashboard bundle returns summary, attention, teams, and recent activity
- task bundle returns task detail data for the control plane
- WebSocket emits realtime task events
- runtime can be controlled globally and per task
