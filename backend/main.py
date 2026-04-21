"""
LogicChat dummy backend.

FastAPI app providing:

    REST   POST   /api/sessions                  create
           GET    /api/sessions                   list (lightweight metadata)
           GET    /api/sessions/{id}              full session (messages)
           PATCH  /api/sessions/{id}              rename / favorite
           DELETE /api/sessions/{id}              delete
           GET    /api/sessions/{id}/export?fmt=  download as md|txt|json
           GET    /api/search?q=                  search title + bodies
           GET    /api/health                     liveness
    WS     /ws/chat                               bidirectional streaming

Per-session task isolation
--------------------------
Each WebSocket message starts an independent ``asyncio.Task`` keyed by
(connection_id, sessionId, turnId).  A second message arriving for a
*different* session does not block the first; sending another message in
the *same* session politely cancels the prior turn for that session.
The client can also send ``{"type":"cancel","turnId":...}`` to stop a
specific turn (the Stop button).

Security
--------
- Pydantic validates every payload (length-bounded).
- Session IDs are UUID-4 only (regex enforced) → safe filenames, no
  path traversal.
- Per-connection sliding-window rate limit (30 messages / minute).
- CORS origin allow-list controlled by ``ALLOWED_ORIGINS`` env var.
- Attachments are accepted as metadata only (the dummy never reads bytes).
- Logs never contain user content or PII.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import uuid
from contextlib import suppress
from typing import Any

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, Response
from pydantic import ValidationError

from . import pipeline, storage
from .schemas import (
    CancelPayload, ChatPayload, CreateSessionPayload, PatchSessionPayload,
    assert_uuid,
)

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:8080,http://localhost:5173,http://127.0.0.1:8080",
).split(",")
RATE_LIMIT_PER_MIN = int(os.environ.get("RATE_LIMIT_PER_MIN", "30"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("logicchat")

app = FastAPI(title="LogicChat backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


# --------------------------------------------------------------------------
# REST
# --------------------------------------------------------------------------
@app.get("/api/health")
async def health() -> dict:
    return {"ok": True, "ts": time.time()}


@app.post("/api/sessions")
async def create_session(body: CreateSessionPayload | None = None) -> dict:
    sid = str(uuid.uuid4())
    title = (body.title if body else None) or "New Conversation"
    return await storage.create_session(sid, title=title)


@app.get("/api/sessions")
async def list_sessions() -> dict:
    return {"sessions": await storage.list_sessions()}


@app.get("/api/sessions/{sid}")
async def get_session(sid: str) -> dict:
    try:
        assert_uuid(sid)
    except ValueError:
        raise HTTPException(400, "invalid id")
    s = await storage.get_session(sid)
    if s is None:
        raise HTTPException(404, "not found")
    return s


@app.patch("/api/sessions/{sid}")
async def patch_session(sid: str, body: PatchSessionPayload) -> dict:
    try:
        assert_uuid(sid)
    except ValueError:
        raise HTTPException(400, "invalid id")
    s = await storage.patch_session(sid, title=body.title, favorite=body.favorite)
    if s is None:
        raise HTTPException(404, "not found")
    return s


@app.delete("/api/sessions/{sid}")
async def delete_session(sid: str) -> dict:
    try:
        assert_uuid(sid)
    except ValueError:
        raise HTTPException(400, "invalid id")
    ok = await storage.delete_session(sid)
    if not ok:
        raise HTTPException(404, "not found")
    return {"ok": True}


@app.get("/api/search")
async def search(q: str = Query(default="", max_length=200)) -> dict:
    return {"sessions": await storage.search(q)}


def _format_export(session: dict, fmt: str) -> tuple[str, str, str]:
    """Return (body, mime, extension)."""
    if fmt == "json":
        return json.dumps(session, ensure_ascii=False, indent=2), "application/json", "json"
    title = session.get("title") or "conversation"
    if fmt == "md":
        out = [f"# {title}", ""]
        for m in session.get("messages", []):
            who = "You" if m.get("role") == "user" else "Assistant"
            out.append(f"## {who}")
            out.append(m.get("content") or "")
            atts = m.get("attachments") or []
            if atts:
                out.append("")
                out.append("**Attachments:** " + ", ".join(a.get("name", "") for a in atts))
            out.append("")
        return "\n".join(out), "text/markdown", "md"
    # default: plain text
    out = [title, "=" * len(title), ""]
    for m in session.get("messages", []):
        who = "You" if m.get("role") == "user" else "Assistant"
        out.append(f"[{who}] {time.strftime('%Y-%m-%d %H:%M', time.localtime(m.get('timestamp', 0) / 1000))}")
        out.append(m.get("content") or "")
        out.append("")
    return "\n".join(out), "text/plain", "txt"


@app.get("/api/sessions/{sid}/export")
async def export_session(sid: str, fmt: str = Query(default="md", pattern="^(md|txt|json)$")):
    try:
        assert_uuid(sid)
    except ValueError:
        raise HTTPException(400, "invalid id")
    s = await storage.get_session(sid)
    if s is None:
        raise HTTPException(404, "not found")
    body, mime, ext = _format_export(s, fmt)
    safe = "".join(c for c in (s.get("title") or "conversation") if c.isalnum() or c in "-_ ")[:60].strip() or "conversation"
    return Response(
        content=body,
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{safe}.{ext}"'},
    )


# --------------------------------------------------------------------------
# WebSocket
# --------------------------------------------------------------------------
class Connection:
    """One websocket = one Connection. Holds running tasks per turnId."""

    def __init__(self, ws: WebSocket) -> None:
        self.ws = ws
        self.send_lock = asyncio.Lock()  # WS sends are not safe under concurrency
        # turnId → asyncio.Task (running pipeline)
        self.turns: dict[str, asyncio.Task] = {}
        # session_id → turnId currently running for that session (if any)
        self.session_turn: dict[str, str] = {}
        # sliding window of message timestamps for rate-limiting
        self.window: list[float] = []

    async def send(self, ev: dict) -> None:
        async with self.send_lock:
            await self.ws.send_text(json.dumps(ev))

    def rate_check(self) -> bool:
        now = time.time()
        self.window[:] = [t for t in self.window if now - t < 60]
        if len(self.window) >= RATE_LIMIT_PER_MIN:
            return False
        self.window.append(now)
        return True

    async def cancel_turn(self, turn_id: str) -> None:
        task = self.turns.pop(turn_id, None)
        if task and not task.done():
            task.cancel()
            with suppress(asyncio.CancelledError, Exception):
                await task


async def _run_turn(conn: Connection, payload: ChatPayload) -> None:
    """Run the pipeline for one turn and persist the resulting message.

    Cancellation: if the task is cancelled mid-stream, the partial assistant
    message is still saved with status='cancelled' so the user sees what was
    produced before they hit Stop.
    """
    sid = payload.sessionId
    turn_id = payload.turnId

    # 1) persist the user message (so reload shows it even if streaming dies)
    user_msg = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": payload.content,
        "timestamp": int(time.time() * 1000),
        "status": "complete",
        "attachments": [a.model_dump() for a in payload.attachments],
        "pasteSnippets": [s.model_dump() for s in payload.snippets],
    }
    await storage.append_message(sid, user_msg)

    # 2) Tell the client which turn is starting (so it can correlate cancels)
    await conn.send({"type": "turn_start", "sessionId": sid, "turnId": turn_id,
                     "userMessageId": user_msg["id"]})

    assistant_id = str(uuid.uuid4())
    assembled = ""
    pipeline_trace: list[dict] = []
    sources: list[dict] = []
    citations: list[dict] = []
    status = "complete"

    try:
        async for ev in pipeline.run(payload.content):
            # Tag every event with sessionId+turnId so the client routes it
            ev["sessionId"] = sid
            ev["turnId"] = turn_id
            await conn.send(ev)

            # Maintain a server-side trace so we can persist the final message
            t = ev.get("type")
            if t == "token":
                assembled += ev.get("text", "")
            elif t == "sources":
                sources = ev.get("sources", [])
                citations = ev.get("citations", [])
            elif t in ("phase_start", "phase_event", "event_done", "phase_done"):
                pipeline_trace.append({k: v for k, v in ev.items() if k not in ("sessionId", "turnId")})
    except asyncio.CancelledError:
        status = "cancelled"
        await conn.send({"type": "cancelled", "sessionId": sid, "turnId": turn_id})
        # don't re-raise — we still want to persist the partial message

    # 3) Persist assistant message (always, even if cancelled / errored)
    assistant_msg = {
        "id": assistant_id,
        "role": "assistant",
        "content": assembled,
        "timestamp": int(time.time() * 1000),
        "status": status,
        "sources": sources,
        "citations": citations,
        "pipeline": pipeline_trace,
    }
    await storage.append_message(sid, assistant_msg)

    # 4) Cleanup turn bookkeeping
    conn.turns.pop(turn_id, None)
    if conn.session_turn.get(sid) == turn_id:
        conn.session_turn.pop(sid, None)


@app.websocket("/ws/chat")
async def chat_ws(ws: WebSocket) -> None:
    await ws.accept()
    conn = Connection(ws)
    log.info("ws connected")
    try:
        while True:
            raw = await ws.receive_text()

            # Validate envelope
            try:
                data = json.loads(raw)
                if not isinstance(data, dict):
                    raise ValueError("payload must be an object")
            except (json.JSONDecodeError, ValueError) as e:
                await conn.send({"type": "error", "message": f"invalid json: {e}"})
                continue

            kind = data.get("type", "message")

            # ---- CANCEL ----
            if kind == "cancel":
                try:
                    cp = CancelPayload(**data)
                except ValidationError as e:
                    await conn.send({"type": "error", "message": f"invalid cancel: {e.errors()[0]['msg']}"})
                    continue
                await conn.cancel_turn(cp.turnId)
                continue

            # ---- MESSAGE ----
            if not conn.rate_check():
                await conn.send({"type": "error", "message": "rate limit exceeded"})
                continue
            try:
                payload = ChatPayload(**data)
            except ValidationError as e:
                await conn.send({"type": "error", "message": f"invalid payload: {e.errors()[0]['msg']}"})
                continue

            # If the same session already has a running turn → cancel it.
            # Different sessions run in parallel — that's the whole point.
            prev_turn = conn.session_turn.get(payload.sessionId)
            if prev_turn and prev_turn != payload.turnId:
                await conn.cancel_turn(prev_turn)

            task = asyncio.create_task(_run_turn(conn, payload))
            conn.turns[payload.turnId] = task
            conn.session_turn[payload.sessionId] = payload.turnId

    except WebSocketDisconnect:
        log.info("ws disconnected")
    except Exception as e:  # last-resort guard
        log.exception("ws error")
        with suppress(Exception):
            await conn.send({"type": "error", "message": f"server error: {e}"})
    finally:
        # Cancel any in-flight turns belonging to this connection
        for tid in list(conn.turns.keys()):
            await conn.cancel_turn(tid)