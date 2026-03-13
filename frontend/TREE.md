# Frontend Module Plan

```text
frontend/
  src/
    main.tsx
    App.tsx
    utils.ts
    api/
      client.ts
      artifacts.ts
      tasks.ts
      plans.ts
      workItems.ts
      workItemProgress.ts
      dashboard.ts
    hooks/
      useControlPlane.ts
    pages/
      BoardPage.tsx
      AttentionPage.tsx
      TaskDetailPage.tsx
      TeamsPage.tsx
    components/
      Sidebar.tsx
      TaskDetailPanels.tsx
      task-detail/
        types.ts
        overview-panels.tsx
        form-panels.tsx
```

## First Frontend Slice

Build these first:

1. App shell
2. Task board
3. Task detail page
4. Timeline panel
5. Work item list
6. Review action buttons

Current implementation now also includes:

7. Routed pages
8. Task creation form
9. Plan creation and review submission form
10. Work item creation form
11. Work item progress form
12. Artifact creation form
13. Team workload drill-down
14. Global + task WebSocket refresh
15. Split task detail panels into smaller modules
16. Dedicated attention page
