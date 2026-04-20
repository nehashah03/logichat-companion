"""
Dummy LogicChat backend.

A small FastAPI app that exposes:

    POST /api/sessions                 → create a session
    GET  /api/sessions/{id}/messages   → load history (JSON)
    GET  /api/health
    WS   /ws/chat                      → bidirectional chat with pipeline events

The WebSocket protocol is identical to the one consumed by the frontend
(`src/services/websocket.ts`). Replace the `MockTransport` in the frontend
with a real WebSocket client pointed at `VITE_WS_URL=ws://localhost:8000/ws/chat`
to run end-to-end against this backend.

----------------------------------------------------------------------
Run locally:

    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
----------------------------------------------------------------------

Security notes baked into this dummy:
- Pydantic models validate every inbound payload (length-bounded strings).
- Per-connection rate limit (max N messages / minute).
- CORS is restricted to the dev origin (override via ALLOWED_ORIGINS).
- Attachments are accepted as metadata only — the dummy never reads bytes.
- No secrets or PII are logged. Only event types are printed.
"""
from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from typing import Any, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError


# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:8080,http://localhost:5173").split(",")
MAX_MSG_LEN = 8000
MAX_ATTACHMENT_TOTAL_MB = 10
RATE_LIMIT_PER_MIN = 30


# --------------------------------------------------------------------------
# Schemas
# --------------------------------------------------------------------------
class AttachmentMeta(BaseModel):
    name: str = Field(..., max_length=200)
    size: int = Field(..., ge=0, le=MAX_ATTACHMENT_TOTAL_MB * 1024 * 1024)
    type: str = Field(default="", max_length=120)


class ChatPayload(BaseModel):
    content: str = Field(..., max_length=MAX_MSG_LEN)
    attachments: list[AttachmentMeta] = Field(default_factory=list)


# --------------------------------------------------------------------------
# In-memory store (replace with DB in production)
# --------------------------------------------------------------------------
SESSIONS: dict[str, dict] = {}


app = FastAPI(title="LogicChat dummy backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


@app.get("/api/health")
async def health() -> dict:
    return {"ok": True, "ts": time.time()}


@app.post("/api/sessions")
async def create_session() -> dict:
    sid = str(uuid.uuid4())
    SESSIONS[sid] = {"id": sid, "created": time.time(), "messages": []}
    return SESSIONS[sid]


@app.get("/api/sessions/{sid}/messages")
async def get_messages(sid: str) -> dict:
    if sid not in SESSIONS:
        raise HTTPException(404, "session not found")
    return {"messages": SESSIONS[sid]["messages"]}


# --------------------------------------------------------------------------
# Pipeline simulation
# --------------------------------------------------------------------------
SPLUNK_REVEAL = [
    "index=app_logs sourcetype=auth_service ERROR",
    "  → 14,232 events scanned",
    "  → 47 OOM warnings detected",
    "  → memory.rss avg=2.1GB peak=4.4GB",
]
VECTOR_REVEAL = [
    "embedding query → 1536-d vector",
    "top-k=8 over 12,448 chunks",
    "matched: system_logs_march_2024.pdf (p.12)",
    "matched: performance_metrics_report.docx (p.4)",
]
JIRA_REVEAL = [
    "project=OPS AND status!=Done AND label=auth-svc",
    "  → INC-1042 \"Auth pod OOMKilled\"",
    "  → INC-1057 \"Connection pool errors during peak\"",
]

FINAL_RESPONSE = """## Analysis Complete

Here's what I found in the data you shared:

### Key Findings

1. **Memory leak** in the auth service — RSS growing ~50 MB / hour [1]
2. **Slow queries** on the `user_sessions` table — P99 latency at 2.3 s [2]
3. **Connection-pool exhaustion** — pool maxed out 47 times in the last 24 h [1]
4. **Disk I/O spikes** on primary nodes during peak hours [3]

### Recommended Actions

```bash
# Restart with a larger heap
systemctl restart auth-service --env HEAP_SIZE=4096m
```

### Metrics Summary

| Metric    | Current | Threshold | Status      |
|-----------|---------|-----------|-------------|
| CPU       | 78%     | 85%       | ⚠️ Warning  |
| Memory    | 92%     | 90%       | 🔴 Critical |
| Disk I/O  | 45%     | 70%       | ✅ OK       |

> The memory issue is the most critical — fix it before the next deploy. [1][3]
"""

SOURCES = [
    {
        "id": "src-1",
        "name": "system_logs_march_2024.pdf",
        "url": "#",
        "snippet": "Authentication service RSS memory growing at ~50MB/hour. Connection pool reaching maximum capacity of 100 connections repeatedly.",
        "page": 12,
    },
    {
        "id": "src-2",
        "name": "performance_metrics_report.docx",
        "url": "#",
        "snippet": "P99 latency for user_sessions table queries measured at 2.3 seconds. Index scans fall back to sequential reads under high load.",
        "page": 4,
    },
    {
        "id": "src-3",
        "name": "incident_2024_03_18.json",
        "url": "#",
        "snippet": "Disk I/O saturation observed on primary nodes between 09:00–11:00 and 18:00–20:00.",
    },
]
CITATIONS = [
    {"index": 1, "sourceId": "src-1", "text": "Memory leak detected in authentication service"},
    {"index": 2, "sourceId": "src-2", "text": "Slow queries on user_sessions table"},
    {"index": 3, "sourceId": "src-3", "text": "Disk I/O saturation on primary nodes"},
]


async def send(ws: WebSocket, ev: dict[str, Any]) -> None:
    await ws.send_text(json.dumps(ev))


async def stream_event(ws: WebSocket, phase: str, label: str, lines: list[str], tool: Optional[str] = None, raw: Optional[dict] = None) -> None:
    eid = str(uuid.uuid4())
    started = time.time()
    await send(ws, {"type": "phase_event", "phase": phase, "eventId": eid, "label": label, "toolName": tool})
    for line in lines:
        for ch in line:
            await send(ws, {"type": "event_chunk", "phase": phase, "eventId": eid, "chunk": ch})
            await asyncio.sleep(0.005)
        await send(ws, {"type": "event_chunk", "phase": phase, "eventId": eid, "chunk": "\n"})
        await asyncio.sleep(0.1)
    await send(ws, {
        "type": "event_done",
        "phase": phase,
        "eventId": eid,
        "durationMs": int((time.time() - started) * 1000),
        "rawOutput": json.dumps(raw, indent=2) if raw else None,
    })


async def run_pipeline(ws: WebSocket, payload: ChatPayload) -> None:
    # ROUTING
    await send(ws, {"type": "phase_start", "phase": "routing", "label": "Routing", "description": "Classifying intent"})
    await stream_event(ws, "routing", "Classifying intent", ["intent=incident.diagnose · confidence=0.94"])
    await send(ws, {"type": "phase_done", "phase": "routing"})

    # PLANNING
    await send(ws, {"type": "phase_start", "phase": "planning", "label": "Planning", "description": "Building execution plan"})
    await stream_event(ws, "planning", "Drafting tool plan", [
        "1) splunk.search auth_service errors",
        "2) vector.search uploaded docs",
        "3) jira.query open incidents",
    ])
    await send(ws, {"type": "phase_done", "phase": "planning"})

    # EXECUTING — multiple tools
    await send(ws, {"type": "phase_start", "phase": "executing", "label": "Executing", "description": "Running tools"})
    await stream_event(ws, "executing", "Querying Splunk", SPLUNK_REVEAL,
                       tool="splunk.search",
                       raw={"events_scanned": 14232, "oom_warnings": 47, "memory": {"avg_gb": 2.1, "peak_gb": 4.4}})
    await stream_event(ws, "executing", "Searching uploaded documents", VECTOR_REVEAL,
                       tool="vector.search",
                       raw={"topk": 8, "total_chunks": 12448, "matches": ["system_logs_march_2024.pdf#p12", "performance_metrics_report.docx#p4"]})
    await stream_event(ws, "executing", "Cross-referencing Jira", JIRA_REVEAL,
                       tool="jira.query",
                       raw={"issues": ["INC-1042", "INC-1057"]})
    await send(ws, {"type": "phase_done", "phase": "executing"})

    # SYNTHESIZING
    await send(ws, {"type": "phase_start", "phase": "synthesizing", "label": "Synthesizing", "description": "Composing response"})
    await stream_event(ws, "synthesizing", "Composing answer", ["building markdown response with citations…"])
    await send(ws, {"type": "phase_done", "phase": "synthesizing"})

    # TOKEN STREAM
    buf = ""
    for i, ch in enumerate(FINAL_RESPONSE):
        buf += ch
        if len(buf) >= 3 or i == len(FINAL_RESPONSE) - 1:
            await send(ws, {"type": "token", "text": buf})
            buf = ""
            await asyncio.sleep(0.008)

    await send(ws, {"type": "sources", "sources": SOURCES, "citations": CITATIONS})
    await send(ws, {"type": "done"})


@app.websocket("/ws/chat")
async def chat_ws(ws: WebSocket) -> None:
    await ws.accept()
    msg_window: list[float] = []
    try:
        while True:
            raw = await ws.receive_text()

            # rate limit
            now = time.time()
            msg_window[:] = [t for t in msg_window if now - t < 60]
            if len(msg_window) >= RATE_LIMIT_PER_MIN:
                await send(ws, {"type": "error", "message": "rate limit exceeded"})
                continue
            msg_window.append(now)

            # validate
            try:
                data = json.loads(raw)
                payload = ChatPayload(**data)
            except (json.JSONDecodeError, ValidationError) as e:
                await send(ws, {"type": "error", "message": f"invalid payload: {e}"})
                continue

            await run_pipeline(ws, payload)
    except WebSocketDisconnect:
        return
    except Exception as e:  # last-resort guard
        try:
            await send(ws, {"type": "error", "message": f"server error: {e}"})
        except Exception:
            pass
