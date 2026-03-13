from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import WorkItem
from ..services.dashboard_service import DashboardService
from ..services.task_bundle_service import TaskBundleService
from .work_items import to_work_item_out


router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard/summary", response_model=dict)
async def dashboard_summary(db: AsyncSession = Depends(get_db)):
    dashboard_svc = DashboardService(db)
    return {
        "ok": True,
        "data": await dashboard_svc.build_summary(),
    }


@router.get("/dashboard/attention", response_model=dict)
async def dashboard_attention(db: AsyncSession = Depends(get_db)):
    dashboard_svc = DashboardService(db)
    return {
        "ok": True,
        "data": await dashboard_svc.build_attention(),
    }


@router.get("/dashboard/bundle", response_model=dict)
async def dashboard_bundle(db: AsyncSession = Depends(get_db)):
    dashboard_svc = DashboardService(db)
    return {
        "ok": True,
        "data": await dashboard_svc.build_bundle(),
    }


@router.get("/teams", response_model=dict)
async def teams_overview(db: AsyncSession = Depends(get_db)):
    dashboard_svc = DashboardService(db)
    return {
        "ok": True,
        "data": await dashboard_svc.build_teams_overview(),
    }


@router.get("/teams/{team_name}/work-items", response_model=dict)
async def team_work_items(team_name: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(WorkItem)
        .where(WorkItem.assigned_team == team_name)
        .order_by(WorkItem.updated_at.desc(), WorkItem.created_at.desc())
    )
    result = await db.execute(stmt)
    items = list(result.scalars().all())

    return {
        "ok": True,
        "data": {
            "team_name": team_name,
            "items": [to_work_item_out(item).model_dump() for item in items],
        },
    }


@router.get("/tasks/{task_id}/bundle", response_model=dict)
async def task_bundle(task_id: str, db: AsyncSession = Depends(get_db)):
    bundle_svc = TaskBundleService(db)
    try:
        bundle = await bundle_svc.build_bundle(task_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="task not found")

    return {
        "ok": True,
        "data": bundle,
    }
