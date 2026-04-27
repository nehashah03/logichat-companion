# """
# Dummy pipeline — emits the same event shapes a real LLM agent would.

# Every event is yielded by an async generator so the WebSocket layer can:
#   * forward each event to the client
#   * cancel cleanly when the user clicks Stop (asyncio.CancelledError)

# Nothing here is hardcoded in the frontend — the UI renders whatever
# phases / events the backend chooses to emit. To customise the demo,
# edit only this file.
# """
# from __future__ import annotations

# import asyncio
# import json
# import time
# import uuid
# from typing import AsyncIterator, Any

# # --------------------------------------------------------------------------
# # Tool reveal text — what the user sees streamed under each tool
# # --------------------------------------------------------------------------
# SPLUNK_REVEAL = [
#     "index=app_logs sourcetype=auth_service ERROR",
#     "  → 14,232 events scanned",
#     "  → 47 OOM warnings detected",
#     "  → memory.rss avg=2.1GB peak=4.4GB",
# ]
# VECTOR_REVEAL = [
#     "embedding query → 1536-d vector",
#     "top-k=8 over 12,448 chunks",
#     "matched: system_logs_march_2024.pdf (p.12)",
#     "matched: performance_metrics_report.docx (p.4)",
# ]
# JIRA_REVEAL = [
#     "project=OPS AND status!=Done AND label=auth-svc",
#     "  → INC-1042 \"Auth pod OOMKilled\"",
#     "  → INC-1057 \"Connection pool errors during peak\"",
# ]

# FINAL_RESPONSE = """## Analysis Complete

# Here's what I found in the data you shared:

# ### Key Findings

# 1. **Memory leak** in the auth service — RSS growing ~50 MB / hour [1]
# 2. **Slow queries** on the `user_sessions` table — P99 latency at 2.3 s [2]
# 3. **Connection-pool exhaustion** — pool maxed out 47 times in the last 24 h [1]
# 4. **Disk I/O spikes** on primary nodes during peak hours [3]

# ### Recommended Actions

# ```bash
# # Restart with a larger heap
# systemctl restart auth-service --env HEAP_SIZE=4096m
# ```

# ### Metrics Summary

# | Metric    | Current | Threshold | Status      |
# |-----------|---------|-----------|-------------|
# | CPU       | 78%     | 85%       | ⚠️ Warning  |
# | Memory    | 92%     | 90%       | 🔴 Critical |
# | Disk I/O  | 45%     | 70%       | ✅ OK       |
# | Network   | 23%     | 60%       | ✅ OK       |

# > The memory issue is the most critical — fix it before the next deploy. [1][3]
# """

# SOURCES = [
#     {"id": "src-1", "name": "system_logs_march_2024.pdf", "url": "#",
#      "snippet": "Authentication service RSS memory growing at ~50MB/hour. Connection pool reaching maximum capacity of 100 connections repeatedly.",
#      "page": 12},
#     {"id": "src-2", "name": "performance_metrics_report.docx", "url": "#",
#      "snippet": "P99 latency for user_sessions table queries measured at 2.3 seconds. Index scans fall back to sequential reads under high load.",
#      "page": 4},
#     {"id": "src-3", "name": "incident_2024_03_18.json", "url": "#",
#      "snippet": "Disk I/O saturation observed on primary nodes between 09:00–11:00 and 18:00–20:00."},
# ]
# CITATIONS = [
#     {"index": 1, "sourceId": "src-1", "text": "Memory leak in auth service"},
#     {"index": 2, "sourceId": "src-2", "text": "Slow queries on user_sessions"},
#     {"index": 3, "sourceId": "src-3", "text": "Disk I/O saturation"},
# ]


# def _ev(t: str, **kw: Any) -> dict:
#     """Build an event envelope with type and turnId placeholder."""
#     return {"type": t, **kw}


# async def _stream_event(phase: str, label: str, lines: list[str], tool: str | None = None,
#                         raw: dict | None = None) -> AsyncIterator[dict]:
#     """Yield a phase_event then character-stream `lines` then event_done."""
#     eid = str(uuid.uuid4())
#     started = time.time()
#     yield _ev("phase_event", phase=phase, eventId=eid, label=label, toolName=tool)
#     for line in lines:
#         for ch in line:
#             yield _ev("event_chunk", phase=phase, eventId=eid, chunk=ch)
#             await asyncio.sleep(0.005)
#         yield _ev("event_chunk", phase=phase, eventId=eid, chunk="\n")
#         await asyncio.sleep(0.08)
#     yield _ev(
#         "event_done", phase=phase, eventId=eid,
#         durationMs=int((time.time() - started) * 1000),
#         rawOutput=json.dumps(raw, indent=2) if raw else None,
#     )


# async def run(user_content: str) -> AsyncIterator[dict]:
#     """The full pipeline. One async generator; cancel-safe."""
#     # Light personalisation so different prompts feel distinct in the demo
#     intent = "incident.diagnose" if "error" in user_content.lower() or "log" in user_content.lower() else "general.qa"

#     # ---------- ROUTING ----------
#     yield _ev("phase_start", phase="routing", label="Routing", description="Classifying intent & selecting tools")
#     async for e in _stream_event("routing", "Classifying intent",
#                                  [f"intent={intent} · confidence=0.94"]):
#         yield e
#     yield _ev("phase_done", phase="routing")

#     # ---------- PLANNING ----------
#     yield _ev("phase_start", phase="planning", label="Planning", description="Building execution plan")
#     async for e in _stream_event("planning", "Drafting tool plan", [
#         "1) splunk.search auth_service errors",
#         "2) vector.search uploaded docs",
#         "3) jira.query open incidents",
#     ]):
#         yield e
#     yield _ev("phase_done", phase="planning")

#     # ---------- EXECUTING ----------
#     yield _ev("phase_start", phase="executing", label="Executing", description="Running tools")
#     async for e in _stream_event("executing", "Querying Splunk", SPLUNK_REVEAL,
#                                  tool="splunk.search",
#                                  raw={"events_scanned": 14232, "oom_warnings": 47,
#                                       "memory": {"avg_gb": 2.1, "peak_gb": 4.4}}):
#         yield e
#     async for e in _stream_event("executing", "Searching uploaded documents", VECTOR_REVEAL,
#                                  tool="vector.search",
#                                  raw={"topk": 8, "total_chunks": 12448,
#                                       "matches": ["system_logs_march_2024.pdf#p12",
#                                                   "performance_metrics_report.docx#p4"]}):
#         yield e
#     async for e in _stream_event("executing", "Cross-referencing Jira", JIRA_REVEAL,
#                                  tool="jira.query",
#                                  raw={"issues": ["INC-1042", "INC-1057"]}):
#         yield e
#     yield _ev("phase_done", phase="executing")

#     # ---------- SYNTHESIZING ----------
#     yield _ev("phase_start", phase="synthesizing", label="Synthesizing", description="Composing final response")
#     async for e in _stream_event("synthesizing", "Composing answer",
#                                  ["building markdown response with citations…"]):
#         yield e
#     yield _ev("phase_done", phase="synthesizing")

#     # ---------- TOKEN STREAM ----------
#     buf = ""
#     for i, ch in enumerate(FINAL_RESPONSE):
#         buf += ch
#         if len(buf) >= 3 or i == len(FINAL_RESPONSE) - 1:
#             yield _ev("token", text=buf)
#             buf = ""
#             await asyncio.sleep(0.008)

#     yield _ev("sources", sources=SOURCES, citations=CITATIONS)
#     yield _ev("done")

"""
pipeline.py

Dummy backend-owned streaming pipeline.

Important:
- Frontend must not hardcode phases.
- Frontend must not hardcode tool steps.
- Frontend must not hardcode final answer structure.
- Backend emits everything.
- Frontend only renders WebSocket events.

Later this file can be replaced with:
- real LLM pipeline
- LangChain
- tool calling
- vector search
- database queries
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from typing import Any, AsyncIterator


# ---------------------------------------------------------------------
# Mock tool reveal data
# ---------------------------------------------------------------------

SPLUNK_REVEAL = [
    "index=app_logs sourcetype=auth_service ERROR",
    "  -> 14,232 events scanned",
    "  -> 47 OOM warnings detected",
    "  -> memory.rss avg=2.1GB peak=4.4GB",
]

VECTOR_REVEAL = [
    "embedding query -> 1536-d vector",
    "top-k=8 over 12,448 chunks",
    "matched: system_logs_march_2024.pdf (p.12)",
    "matched: performance_metrics_report.docx (p.4)",
]

JIRA_REVEAL = [
    "project=OPS AND status!=Done AND label=auth-svc",
    "  -> INC-1042 Auth pod OOMKilled",
    "  -> INC-1057 Connection pool errors during peak",
]


FINAL_RESPONSE = '''## Analysis Complete

Here is what I found in the data you shared:

### Key Findings

1. **Memory leak** in the auth service - RSS growing approximately 50 MB per hour [1]
2. **Slow queries** on the `user_sessions` table - P99 latency at 2.3 seconds [2]
3. **Connection-pool exhaustion** - pool maxed out 47 times in the last 24 hours [1]
4. **Disk I/O spikes** on primary nodes during peak hours [3]

### Recommended Actions

```bash
systemctl restart auth-service --env HEAP_SIZE=4096m
```

### Metrics Summary

| Metric    | Current | Threshold | Status      |
|-----------|---------|-----------|-------------|
| CPU       | 78%     | 85%       | Warning     |
| Memory    | 92%     | 90%       | Critical    |
| Disk I/O  | 45%     | 70%       | OK          |
| Network   | 23%     | 60%       | OK          |

### Useful Links

- [Auth Runbook](https://example.com/runbooks/auth-service)
- [Incident Dashboard](https://example.com/dashboard/incidents)
- [Service Logs](https://example.com/logs/auth-service)

> The memory issue is the most critical - fix it before the next deploy. [1][3]
'''


SOURCES = [
    {
        "id": "src-1",
        "name": "system_logs_march_2024.pdf",
        "url": "#",
        "snippet": "Authentication service RSS memory growing at approximately 50MB/hour. Connection pool reaching maximum capacity repeatedly.",
        "page": 12,
    },
    {
        "id": "src-2",
        "name": "performance_metrics_report.docx",
        "url": "#",
        "snippet": "P99 latency for user_sessions table queries measured at 2.3 seconds.",
        "page": 4,
    },
    {
        "id": "src-3",
        "name": "incident_2024_03_18.json",
        "url": "#",
        "snippet": "Disk I/O saturation observed on primary nodes during peak traffic windows.",
    },
]


CITATIONS = [
    {
        "index": 1,
        "sourceId": "src-1",
        "text": "Memory leak in auth service",
    },
    {
        "index": 2,
        "sourceId": "src-2",
        "text": "Slow queries on user_sessions",
    },
    {
        "index": 3,
        "sourceId": "src-3",
        "text": "Disk I/O saturation",
    },
]


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def _event(event_type: str, **kwargs: Any) -> dict:
    """
    Build a consistent event envelope.
    """
    return {
        "type": event_type,
        **kwargs,
    }


async def _stream_event(
    *,
    phase: str,
    label: str,
    lines: list[str],
    tool: str | None = None,
    raw: dict | None = None,
) -> AsyncIterator[dict]:
    """
    Stream a single backend event/tool.

    Emits:
    1. phase_event
    2. event_chunk repeatedly
    3. event_done
    """
    event_id = str(uuid.uuid4())
    started = time.time()

    yield _event(
        "phase_event",
        phase=phase,
        eventId=event_id,
        label=label,
        toolName=tool,
    )

    for line in lines:
        for char in line:
            yield _event(
                "event_chunk",
                phase=phase,
                eventId=event_id,
                chunk=char,
            )
            await asyncio.sleep(0.005)

        yield _event(
            "event_chunk",
            phase=phase,
            eventId=event_id,
            chunk="\n",
        )

        await asyncio.sleep(0.08)

    yield _event(
        "event_done",
        phase=phase,
        eventId=event_id,
        durationMs=int((time.time() - started) * 1000),
        rawOutput=json.dumps(raw, indent=2) if raw else None,
    )


# ---------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------

async def run(user_content: str) -> AsyncIterator[dict]:
    """
    Full dummy pipeline.

    This is intentionally backend-owned.
    The UI should not know these steps in advance.
    """
    lower_content = user_content.lower()

    intent = (
        "incident.diagnose"
        if "error" in lower_content or "log" in lower_content or "issue" in lower_content
        else "general.qa"
    )

    # -----------------------------
    # ROUTING
    # -----------------------------
    yield _event(
        "phase_start",
        phase="routing",
        label="Routing",
        description="Classifying intent and selecting backend tools",
    )

    async for item in _stream_event(
        phase="routing",
        label="Classifying intent",
        lines=[f"intent={intent} | confidence=0.94"],
    ):
        yield item

    yield _event(
        "phase_done",
        phase="routing",
    )

    # -----------------------------
    # PLANNING
    # -----------------------------
    yield _event(
        "phase_start",
        phase="planning",
        label="Planning",
        description="Building backend execution plan",
    )

    async for item in _stream_event(
        phase="planning",
        label="Drafting tool plan",
        lines=[
            "1) splunk.search auth_service errors",
            "2) vector.search uploaded docs",
            "3) jira.query open incidents",
        ],
    ):
        yield item

    yield _event(
        "phase_done",
        phase="planning",
    )

    # -----------------------------
    # EXECUTING
    # -----------------------------
    yield _event(
        "phase_start",
        phase="executing",
        label="Executing",
        description="Running backend tools",
    )

    async for item in _stream_event(
        phase="executing",
        label="Querying Splunk",
        lines=SPLUNK_REVEAL,
        tool="splunk.search",
        raw={
            "events_scanned": 14232,
            "oom_warnings": 47,
            "memory": {
                "avg_gb": 2.1,
                "peak_gb": 4.4,
            },
        },
    ):
        yield item

    async for item in _stream_event(
        phase="executing",
        label="Searching uploaded documents",
        lines=VECTOR_REVEAL,
        tool="vector.search",
        raw={
            "topk": 8,
            "total_chunks": 12448,
            "matches": [
                "system_logs_march_2024.pdf#p12",
                "performance_metrics_report.docx#p4",
            ],
        },
    ):
        yield item

    async for item in _stream_event(
        phase="executing",
        label="Cross-referencing Jira",
        lines=JIRA_REVEAL,
        tool="jira.query",
        raw={
            "issues": [
                "INC-1042",
                "INC-1057",
            ],
        },
    ):
        yield item

    yield _event(
        "phase_done",
        phase="executing",
    )

    # -----------------------------
    # SYNTHESIZING
    # -----------------------------
    yield _event(
        "phase_start",
        phase="synthesizing",
        label="Synthesizing",
        description="Composing final response",
    )

    async for item in _stream_event(
        phase="synthesizing",
        label="Composing answer",
        lines=[
            "building markdown response with citations...",
        ],
    ):
        yield item

    yield _event(
        "phase_done",
        phase="synthesizing",
    )

    # -----------------------------
    # TOKEN STREAM
    # -----------------------------
    buffer = ""

    for index, char in enumerate(FINAL_RESPONSE):
        buffer += char

        if len(buffer) >= 3 or index == len(FINAL_RESPONSE) - 1:
            yield _event(
                "token",
                text=buffer,
            )

            buffer = ""

            await asyncio.sleep(0.008)

    yield _event(
        "sources",
        sources=SOURCES,
        citations=CITATIONS,
    )

    yield _event(
        "done",
    )
