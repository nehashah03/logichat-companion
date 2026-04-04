# Cursor AI Chat Interface Clone

A production-ready React web application that mimics a modern AI chat interface inspired by **Cursor AI**, designed for developers analyzing logs, tickets, and system outputs.

---

## 🎨 Design

- **Cursor AI-inspired dark theme** — `#1A1A1A` background, `#007AFF` accent blue, `#00D68F` success green
- **Typography** — Inter for UI, SF Mono/JetBrains Mono for code
- **Minimal chrome** — no unnecessary icons or decorations, content-first layout

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── ChatPanel.tsx          # Main chat thread + message orchestration
│   ├── ChatInput.tsx          # Smart input with auto-expand, file upload, paste detection
│   ├── MessageBubble.tsx      # Markdown rendering, code highlighting, tool outputs
│   ├── SessionSidebar.tsx     # Conversation history sidebar
│   ├── StepTracker.tsx        # Real-time pipeline stage tracker
│   ├── TypingIndicator.tsx    # Animated thinking indicator
│   └── ui/                    # Shadcn/Radix primitives
├── features/
│   ├── chat/chatSlice.ts      # Redux: messages, streaming state, pipeline stages
│   └── session/sessionSlice.ts # Redux: session CRUD, conversation history
├── services/
│   └── websocket.ts           # Mock WebSocket with simulated streaming
├── store/
│   ├── index.ts               # Redux store configuration
│   └── hooks.ts               # Typed useAppSelector/useAppDispatch
├── utils/
│   └── helpers.ts             # ID generation, formatting utilities
├── pages/
│   └── Index.tsx              # Root layout with providers
└── theme.ts                   # MUI dark theme configuration
```

---

## ✨ Features

### Chat Thread
- User & assistant message bubbles with distinct avatars
- Timestamps with relative formatting ("Just now", "5m ago")
- Auto-scroll on new messages
- Smooth fade-in animation for new messages
- Copy-to-clipboard on assistant messages
- Retry button on failed messages

### Smart Input Box
- **Minimized by default** — single-line input
- **Auto-expands** after 4+ lines of content
- **Manual expand/collapse** toggle button appears when content exceeds threshold
- Shift+Enter for new line, Enter to send
- **Large paste detection** — content >500 chars or 15+ lines collapsed into expandable preview
- Drag-and-drop file upload (PDF, DOCX, images up to 10MB)

### Image Upload Previews
- **Thumbnail previews** for uploaded images (80×80px grid)
- File info display for non-image attachments (name + size)
- Individual remove buttons on each attachment
- Previews shown both in input area and in sent message bubbles

### Streaming Responses
- Token-by-token display via WebSocket
- Blinking cursor indicator during streaming
- Typing indicator with animated dots

### Markdown Rendering
- Full GFM support (tables, strikethrough, task lists)
- Syntax-highlighted code blocks (Prism.js with oneDark theme)
- Copy button on every code block
- Inline code styling
- Blockquotes, images, links

### Pipeline Tracker (Cursor-style)
Shows real-time AI processing stages:
1. **Routing** — Determining intent
2. **Planning** — Building execution plan
3. **Executing** — Running tools (shows tool name with ⚡ icon)
4. **Synthesizing** — Composing response

Each stage shows:
- ✅ Completed (green checkmark)
- 🔄 Active (spinning indicator)
- ○ Pending (dimmed circle)
- Connected by vertical progress lines
- Elapsed time counter at bottom

### Tool Output UI
- Collapsible sections for each tool invocation
- Terminal icon with green tool name
- JSON syntax highlighting for code outputs
- Click-to-expand interaction

### Session Management
- Sidebar with full conversation history
- New Chat button
- Click to load previous sessions
- Delete individual sessions (hover to reveal)
- Clear All with confirmation dialog
- Auto-title from first user message

### Export
- Export conversation as `.txt` file with timestamps

---

## 🔌 WebSocket Simulation

The mock WebSocket service (`src/services/websocket.ts`) simulates:
- Pipeline stage progression with realistic delays
- Tool execution outputs (log_analyzer, metrics_query)
- Token-by-token response streaming
- Auto-reconnect logic
- Abort controller for cancellation

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 + Vite 5 | UI framework + bundler |
| TypeScript 5 | Type safety |
| Redux Toolkit | Global state management |
| Material UI v7 | Component library |
| react-markdown + remark-gfm | Markdown rendering |
| react-syntax-highlighter (Prism) | Code block highlighting |
| react-dropzone | File upload |
| WebSocket (mock) | Real-time streaming |

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — click any suggested prompt or type your own to see the full streaming response flow with pipeline tracking.
