# LogicChat — Cursor-style AI Companion

A production-quality React + Material UI chat workspace for developers
diagnosing logs, tickets and system outputs. Built around an explicit
**Routing → Planning → Executing → Synthesizing** pipeline, with live
tool-output reveals (Splunk, Jira, vector search…), source-grounded answers
with hover-popover citations, and full markdown rendering.

> Inspired by Cursor AI / GPT / Lovable AI workflows: the assistant doesn't
> just answer — it **shows its work** as it happens, and lets you replay
> every step later.

---

## ✨ Features

### Pipeline & live tool streaming
- Four explicit phases — **Routing → Planning → Executing → Synthesizing** —
  visible in the message bubble while the assistant is thinking.
- Each phase contains one or more **events** (tool calls). For each event:
  spinner, tool name (`splunk.search`, `vector.search`, `jira.query`),
  live-streaming detail text, elapsed timer, and an expandable
  **raw output** section for power users.
- Active phase auto-expands; completed phases auto-collapse so you always
  see the current step. The whole timeline is later available under a
  collapsible **Events** panel on the finished message.
- A **Stop** button in the header aborts the in-flight stream.

### Streaming chat
- Token-by-token streaming over WebSocket, with a typing cursor.
- Auto-scroll to latest content during streaming.
- Full markdown: GFM tables, fenced code blocks with Prism syntax
  highlighting + per-block copy button, blockquotes, lists, links, images.
- Inline citations like `[1]` are rendered as clickable chips with a
  hover-popover preview of the cited source.

### Input
- Drag-and-drop **or** file picker for logs, PDFs, JSON, TXT, DOCX, images.
- 10 MB combined upload limit with friendly snackbar errors and per-file
  type validation.
- Image attachments preview as thumbnails — click to open full-size.
- **Long pastes (≥ 500 chars) auto-convert to a syntax-highlighted snippet
  attachment** so the chat input stays clean. Language is auto-detected
  (JSON / Python / JS / SQL / log / text).

### Sessions & sidebar
- Per-session **rename / favorite / export / delete** via a 3-dot menu
  (with a confirmation dialog before delete).
- Export to **Markdown / Plain text / JSON**.
- Search bar that filters by **title or message body**.
- Favorites group pinned at the top.
- Theme toggle is available in **both** the sidebar header and the chat
  header.

### Theming
- Two themes defined entirely in
  [`src/constants/themeColors.ts`](src/constants/themeColors.ts):
  - **Light** — clean Material defaults.
  - **Midnight Blue** — deep navy palette inspired by the dashboard
    reference (bright #3B82F6 accent, near-black `#070B1A` background,
    subtle blue-tinted borders).
- Edit a single object in `themeColors.ts` to recolor the entire app.

### State
- **Redux Toolkit** drives chat + session state.
- Theme choice is the *only* thing persisted to `localStorage`
  (per requirement). All chat data lives in Redux.

---

## 🖥️ Backend (dummy) — Python + FastAPI

A small FastAPI service that emits the same WebSocket events the UI
consumes lives in [`backend/`](backend/). See
[`backend/README.md`](backend/README.md) for run instructions and the full
event protocol.

For local development, the frontend ships with a **mock transport** that
emits identical events directly in-process — so you can run the UI without
the backend if you want.

### Switching the frontend to the real backend

```bash
echo 'VITE_WS_URL=ws://localhost:8000/ws/chat' > .env.local
```

Then in `src/services/websocket.ts`, swap `MockTransport` for a real
WebSocket transport pointed at `import.meta.env.VITE_WS_URL`.

---

## 🧱 Architecture

```
src/
├── components/
│   ├── ChatPanel.tsx          ← header, message list, live pipeline anchor
│   ├── ChatInput.tsx          ← drag-drop, paste-to-snippet, validation
│   ├── MessageBubble.tsx      ← markdown + citations + per-message Events/Sources
│   ├── PipelinePanel.tsx      ← live & recorded pipeline timeline
│   ├── SourcesPanel.tsx       ← collapsible cited documents
│   ├── CitationChip.tsx       ← inline [N] chips with popover preview
│   └── SessionSidebar.tsx     ← search, favorites, per-chat menu
├── features/
│   ├── chat/chatSlice.ts      ← messages + live pipeline state
│   └── session/sessionSlice.ts← sessions, rename, favorite, delete
├── services/websocket.ts      ← MockTransport (swap for real WS in prod)
├── contexts/ThemeModeContext  ← MUI theme provider + persistence
├── constants/themeColors.ts   ← single source of truth for colors
└── utils/
    ├── helpers.ts             ← id, timestamp, file size formatters
    └── sessionExport.ts       ← md / txt / json export

backend/
├── main.py                    ← FastAPI WS server emitting pipeline events
└── requirements.txt
```

### WebSocket event types

| type           | payload                                                   | meaning                                       |
|----------------|-----------------------------------------------------------|-----------------------------------------------|
| `phase_start`  | `{ phase, label, description }`                            | a pipeline phase begins                       |
| `phase_event`  | `{ phase, eventId, label, toolName? }`                     | a tool / sub-step starts inside a phase       |
| `event_chunk`  | `{ phase, eventId, chunk }`                                | streamed text from the running tool           |
| `event_done`   | `{ phase, eventId, durationMs, rawOutput? }`               | the tool finished                             |
| `phase_done`   | `{ phase }`                                                | the phase finished                            |
| `token`        | `{ text }`                                                 | a chunk of the assistant's final answer       |
| `sources`      | `{ sources: [...], citations: [...] }`                     | bibliography + numbered citations             |
| `done`         | `{}`                                                       | end of turn                                   |
| `error`        | `{ message }`                                              | terminal error                                |

---

## 🔐 Security

- All inbound messages on the backend are validated by `pydantic` with
  hard length limits (`content` ≤ 8 000 chars, attachment metadata
  ≤ 10 MB).
- The frontend enforces type allow-list and 10 MB combined attachment
  size *before* sending and shows friendly snackbar errors on rejection.
- Per-connection **rate limit** (30 msg/min) on the backend.
- CORS allow-list, no credentials.
- The dummy backend never reads attachment bytes — metadata only.
- No content or PII is ever written to logs.

---

## 🚀 Run

```bash
# Frontend
npm install
npm run dev          # http://localhost:8080

# Backend (optional — UI works standalone with MockTransport)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## ⌨️ Tech stack

React 18 · Vite 5 · TypeScript · Material UI 7 · Redux Toolkit ·
react-markdown + remark-gfm · react-syntax-highlighter (Prism) ·
react-dropzone · FastAPI · Pydantic 2.
