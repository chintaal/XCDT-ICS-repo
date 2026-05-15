"""
ws_manager.py
=============
WebSocket connection manager for broadcasting inference records to all
connected dashboard clients.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import WebSocket

log = logging.getLogger("ws_manager")


class ConnectionManager:
    """
    Manages a set of active WebSocket connections and broadcasts JSON
    messages to all of them.

    Usage (in a FastAPI endpoint)::

        @app.websocket("/ws/stream")
        async def stream(ws: WebSocket):
            await ws_manager.connect(ws)
            try:
                while True:
                    await ws.receive_text()   # keep alive / ping
            except WebSocketDisconnect:
                ws_manager.disconnect(ws)
    """

    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        log.info("WS client connected  (total=%d)", len(self._connections))

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)
        log.info("WS client disconnected (total=%d)", len(self._connections))

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    async def broadcast(self, data: dict) -> None:
        """Send a JSON-serialisable dict to all connected clients."""
        if not self._connections:
            return
        message = json.dumps(data, default=str)
        dead: list[WebSocket] = []
        for ws in list(self._connections):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections.discard(ws)
            log.debug("Removed dead WS connection")

    async def send_to(self, websocket: WebSocket, data: dict) -> None:
        """Send a JSON message to a single client."""
        try:
            await websocket.send_text(json.dumps(data, default=str))
        except Exception as exc:
            log.warning("Failed to send to WS client: %s", exc)
            self._connections.discard(websocket)


ws_manager = ConnectionManager()
