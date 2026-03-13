from collections import defaultdict

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self._channels: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, channels: list[str]) -> None:
        await websocket.accept()
        for channel in channels:
          self._channels[channel].add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        empty_channels: list[str] = []
        for channel, members in self._channels.items():
            if websocket in members:
                members.discard(websocket)
            if not members:
                empty_channels.append(channel)
        for channel in empty_channels:
            self._channels.pop(channel, None)

    async def publish(self, channel: str, payload: dict) -> None:
        stale: list[WebSocket] = []
        for websocket in list(self._channels.get(channel, set())):
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(websocket)


ws_manager = WebSocketManager()
