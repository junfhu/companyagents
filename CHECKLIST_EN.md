# Build Checklist

## Phase 0

- [x] Freeze modern role model
- [x] Freeze workflow states
- [x] Freeze domain objects
- [x] Freeze MVP scope
- [x] Create isolated project skeleton

## Phase 1 Backend

- [x] Add `pyproject.toml`
- [x] Add SQLAlchemy models
- [x] Add Alembic migration setup
- [x] Add task APIs
- [x] Add plan APIs
- [x] Add review APIs
- [x] Add work item APIs
- [x] Add artifact APIs
- [x] Add activity APIs
- [x] Add supervisor APIs
- [x] Add event publisher interface
- [x] Add runtime status and control APIs
- [x] Add actor-based permission checks

## Phase 2 Workers

- [ ] Intake worker
- [ ] Planning worker
- [ ] Review worker
- [x] Delivery worker
- [x] Execution worker
- [x] Reporting worker
- [x] Supervisor worker
- [x] Global runtime loop
- [x] Task-level runtime run/sweep controls

## Phase 3 Frontend

- [x] App shell
- [ ] Inbox page
- [x] Task board
- [x] Task detail
- [x] Teams page
- [ ] Templates page
- [x] Settings page
- [x] Attention page
- [x] Runtime status panel
- [x] Runtime audit panels
- [x] Task-level runtime controls

## Phase 4 Realtime

- [x] WebSocket server
- [x] Live task timeline
- [x] Supervisor panel
- [x] Intervention stream
- [x] Runtime event marking in UI

## Phase 5 Quality

- [x] Backend smoke tests
- [x] End-to-end API flow tests
- [x] Runtime orchestration tests
- [x] Runtime control endpoint tests
- [x] Frontend production build verification
