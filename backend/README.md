# LogicChat dummy backend

FastAPI service that mirrors the WebSocket protocol consumed by the frontend.

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Endpoints

| Method | Path                                | Purpose                                  |
|--------|-------------------------------------|------------------------------------------|
| GET    | `/api/health`                        | liveness probe                           |
| POST   | `/api/sessions`                      | create a session, returns `{id}`         |
| GET    | `/api/sessions/{id}/messages`        | load history                             |
| WS     | `/ws/chat`                           | bidirectional chat & pipeline streaming  |

## WebSocket protocol

Client sends:
```json
{ "content": "string", "attachments": [{ "name": "x.log", "size": 1234, "type": "text/plain" }] }
```

Server emits events of these types (in order):
1. `phase_start` → `phase_event` → `event_chunk*` → `event_done` → `phase_done`
2. Repeated for each phase: **routing → planning → executing → synthesizing**
3. `token` events stream the final assistant response chunk-by-chunk
4. `sources` carries the bibliography + numbered `citations`
5. `done` signals the end of the turn

## Wire it to the frontend

Set in `.env` (or `.env.local`):

```
VITE_WS_URL=ws://localhost:8000/ws/chat
```

Then swap `MockTransport` for the real WebSocket transport in
`src/services/websocket.ts` (a stub `RealTransport` slot is left there).

## Security

- `pydantic` validates every payload (string length bounded at 8 000 chars,
  attachment metadata size capped at 10 MB).
- Per-connection rate limit (30 messages / minute).
- CORS allow-list driven by `ALLOWED_ORIGINS`.
- The dummy never reads attachment bytes — only metadata.
- No PII or content is logged.
