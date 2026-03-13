from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .api.router import router
from .config import get_settings
from .db import init_db
from .models import ActivityEvent, Artifact, InterventionLog, Task, TaskPlan, TaskReview, WorkItem  # noqa: F401
from .realtime import ws_manager


settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    if settings.auto_create_tables:
        await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Modern-company multi-agent workflow control plane.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    raw_channels = websocket.query_params.get("channels", "global")
    channels = [channel.strip() for channel in raw_channels.split(",") if channel.strip()]
    if not channels:
        channels = ["global"]
    await ws_manager.connect(websocket, channels)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
