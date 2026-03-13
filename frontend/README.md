# Frontend

React dashboard for the modern delivery control plane.

## Current Slice

The current slice is scaffolded and wired to the backend control-plane APIs:

- dashboard summary
- dashboard attention
- dashboard bundle
- task list
- task detail
- plan panel
- review panel
- work item panel
- artifact panel
- supervisor panel
- task action buttons
- teams overview
- realtime WebSocket refresh

## Run

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Start the dev server with `npm run dev`

The app expects the backend API at `VITE_API_BASE`.

## Implemented Pages

- Task Board
- Attention
- Task Detail
- Teams

## Implementation Notes

Current implementation favors:

- simple route structure
- bundle API for task detail and dashboard overview
- WebSocket incremental refresh after first HTTP load
- shared control-plane panels across Board, Attention, and Sidebar
