from fastapi import APIRouter

from . import activity, artifacts, dashboard, plans, reviews, supervisor, tasks, work_items


router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "service": "modern-delivery-os",
        "status": "healthy",
    }


@router.get("/api")
async def api_root() -> dict:
    return {
        "ok": True,
        "name": "AI Delivery Operating System API",
        "version": "0.1.0",
        "modules": [
            "tasks",
            "plans",
            "reviews",
            "work-items",
            "artifacts",
            "activity",
            "supervisor",
        ],
    }


router.include_router(tasks.router)
router.include_router(plans.router)
router.include_router(reviews.router)
router.include_router(work_items.router)
router.include_router(artifacts.router)
router.include_router(activity.router)
router.include_router(supervisor.router)
router.include_router(dashboard.router)
