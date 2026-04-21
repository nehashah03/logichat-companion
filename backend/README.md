# LogicChat backend (FastAPI)

Production-shaped dummy backend. Streams the same pipeline events the UI renders,
stores sessions as JSON files on disk, and supports per-session task isolation
plus client cancel.

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# uvicorn must be invoked at the project root so `backend.main` resolves:
cd ..
uvicorn backend.main:app --reload --port 8000
```

The frontend then connects via `VITE_WS_URL=ws://localhost:8000/ws/chat`
and `VITE_API_URL=http://localhost:8000`.

## Storage layout

```
backend/data/sessions/<session-uuid>.json
```

Each file holds `id`, `title`, `createdAt`, `updatedAt`, `favorite`, and the
full `messages` array (including pipeline trace + sources). Writes are
**atomic** (`tempfile + os.replace`) and serialised by an `asyncio.Lock`
per session id, so concurrent turns can never corrupt the file.

## REST endpoints

| Method | Path                                  | Purpose                                  |
|--------|---------------------------------------|------------------------------------------|
| GET    | `/api/health`                         | liveness                                 |
| POST   | `/api/sessions`                       | create — returns the new session         |
| GET    | `/api/sessions`                       | list (lightweight metadata)              |
| GET    | `/api/sessions/{id}`                  | full session incl. messages              |
| PATCH  | `/api/sessions/{id}`                  | rename / favorite                        |
| DELETE | `/api/sessions/{id}`                  | delete                                   |
| GET    | `/api/sessions/{id}/export?fmt=md`    | download as `md` / `txt` / `json`        |
| GET    | `/api/search?q=...`                   | search title + message bodies            |
| WS     | `/ws/chat`                            | streaming chat                           |

## WebSocket protocol

### Client → server

```jsonc
// Send a message (one user turn)
{ "type": "message",
  "sessionId": "<uuid>",
  "turnId":    "<uuid>",        // client-generated, used to address cancel
  "content":   "string",
  "attachments": [{ "name": "x.log", "size": 1234, "type": "text/plain" }],
  "snippets":    [{ "id": "<uuid>", "language": "log", "content": "...", "lines": 120 }]
}

// Stop a turn
{ "type": "cancel", "turnId": "<uuid>" }
```

### Server → client

Every event includes `sessionId` and `turnId` so the UI routes it to the
right chat (multiple chats can stream concurrently).

| `type`         | payload                                                  | meaning                                       |
|----------------|----------------------------------------------------------|-----------------------------------------------|
| `turn_start`   | `{ userMessageId }`                                      | persisted user message id                     |
| `phase_start`  | `{ phase, label, description }`                          | a pipeline phase began                        |
| `phase_event`  | `{ phase, eventId, label, toolName? }`                   | a tool / sub-step started                     |
| `event_chunk`  | `{ phase, eventId, chunk }`                              | streamed text from the running tool           |
| `event_done`   | `{ phase, eventId, durationMs, rawOutput? }`             | the tool finished                             |
| `phase_done`   | `{ phase }`                                              | the phase finished                            |
| `token`        | `{ text }`                                               | a chunk of the final assistant answer         |
| `sources`      | `{ sources, citations }`                                 | bibliography + inline `[N]` citations         |
| `done`         | `{}`                                                     | end of turn                                   |
| `cancelled`    | `{}`                                                     | the turn was cancelled by the client          |
| `error`        | `{ message }`                                            | terminal error                                |

## Per-session task isolation

Each `message` payload spawns a fresh `asyncio.Task`, keyed by
`(connection, sessionId, turnId)`. Implications:

- Sending a message in **session B** does **not** block session A — both
  stream concurrently.
- Sending another message in the **same session** politely cancels the
  prior turn for that session and starts the new one (mirrors GPT).
- Client `cancel` only cancels the targeted `turnId`.
- On websocket disconnect, all in-flight turns for that connection are
  cancelled.

## Security

- All payloads validated via Pydantic (`schemas.py`).
- Session/turn IDs are UUID-4 only (regex enforced) → safe filenames,
  no path traversal.
- 8 KB hard cap on message content; 10 MB cap on attachment size; 200 KB
  cap on paste-snippet content.
- Per-connection sliding-window rate limit (`RATE_LIMIT_PER_MIN`, default 30).
- CORS allow-list (`ALLOWED_ORIGINS` env var).
- No PII or content is logged; only event types and lifecycle events.
- Attachments are accepted as metadata only — the dummy never reads bytes
  from disk or the wire.
