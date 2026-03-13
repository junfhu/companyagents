# Backend Module Plan

```text
backend/
  __init__.py
  app/
    main.py
    config.py
    db.py
    realtime.py
    api/
      router.py
      tasks.py
      plans.py
      reviews.py
      work_items.py
      artifacts.py
      activity.py
      supervisor.py
      dashboard.py
    models/
      enums.py
      task.py
      task_plan.py
      task_review.py
      work_item.py
      artifact.py
      activity_event.py
      intervention_log.py
    schemas/
      task.py
      plan.py
      review.py
      work_item.py
      artifact.py
      supervisor.py
    services/
      workflow.py
      task_service.py
      plan_service.py
      review_service.py
      work_item_service.py
      artifact_service.py
      supervisor_service.py
      dashboard_service.py
      task_bundle_service.py
  scripts/
    __init__.py
    seed_demo.py
  START.md
  README.md
  alembic.ini
  migration/
    env.py
    script.py.mako
    versions/
      001_initial.py
```

## Notes

- `services/workflow.py` should own transition rules
- `activity_event` is append-only
- API layer should stay thin
- `dashboard_service.py` owns global control-plane aggregates
- `task_bundle_service.py` owns single-task detail aggregates
- realtime publishing currently happens from `task_service._add_event()`
- `scripts/seed_demo.py` seeds realistic local demo data
- worker processes are still a planned next step, not part of the current scaffold
