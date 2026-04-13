# AI Chat Interface — React + Material UI

A production-ready React web application that mimics a modern AI chat interface (inspired by Cursor AI, ChatGPT, Amazon Q Business), designed for developers analyzing logs, tickets, and system outputs.

---

## 🎨 Design

- **Light theme** — Clean white background (`#FFFFFF`), blue accent (`#1976d2`), green success (`#2e7d32`)
- **Typography** — Inter for all UI text, SF Mono/JetBrains Mono for code blocks
- **Material UI only** — No Tailwind CSS. All styling via MUI's `sx` prop and `createTheme`
- **Minimal chrome** — Content-first layout, no unnecessary decorations

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── ChatPanel.tsx           # Main chat thread + message orchestration
│   ├── ChatInput.tsx           # Input with auto-expand, file upload, scrollable textarea
│   ├── MessageBubble.tsx       # Markdown rendering, code highlighting, copy, events/sources
│   ├── SessionSidebar.tsx      # Conversation history with delete confirmation
│   ├── StepTracker.tsx         # Right sidebar pipeline stage tracker
│   ├── ProcessingSteps.tsx     # Inline processing steps (analyzing → generating)
│   ├── EventsSourcesPanel.tsx  # Expandable Events & Sources after response
│   └── TypingIndicator.tsx     # Animated thinking indicator
├── features/
│   ├── chat/chatSlice.ts       # Redux: messages, streaming, sources, citations, steps
│   └── session/sessionSlice.ts # Redux: session CRUD, conversation history
├── services/
│   └── websocket.ts            # Mock WebSocket with processing steps simulation
├── store/
│   ├── index.ts                # Redux store configuration
│   └── hooks.ts                # Typed useAppSelector/useAppDispatch
├── utils/
│   └── helpers.ts              # ID generation, formatting utilities
├── pages/
│   └── Index.tsx               # Root layout with MUI ThemeProvider
└── theme.ts                    # MUI light theme configuration
```

---

## ✨ Features

### Chat Thread
- User & assistant message bubbles with distinct avatars (Person icon / Bot icon)
- Timestamps with relative formatting ("Just now", "5m ago")
- Auto-scroll on new messages
- Smooth fade-in animation for new messages
- **Copy button on ALL messages** (both user and assistant)
- **Thumbs up/down** feedback buttons on assistant messages
- Retry button on failed messages

### Smart Input Box
- Single-line input by default, auto-expands as you type
- **Scrollbar appears** when content exceeds max height (no special pasted content block — just scrollable like ChatGPT)
- Shift+Enter for new line, Enter to send
- Drag-and-drop file upload (PDF, DOCX, images up to 10MB)
- **Image preview on click** — clicking an uploaded image opens a full-size preview dialog

### How Tables Are Displayed

To render a table in the assistant response, the API/backend should return **standard Markdown table syntax**:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value A  | Value B  | Value C  |
| Value D  | Value E  | Value F  |
```

The `react-markdown` library with `remark-gfm` plugin automatically renders this as an HTML `<table>` with proper styling (borders, header background, padding).

### How Code Blocks Are Displayed

Return fenced code blocks with a language identifier:

````markdown
```bash
echo "Hello World"
```

```python
def analyze_logs(path: str):
    with open(path) as f:
        return f.read()
```
````

Each code block renders with:
- Syntax highlighting via Prism.js (`oneLight` theme for light mode)
- Language label in the header
- **Copy button** to copy the code content

### Hyperlinks

Standard markdown links render as clickable blue links:

```markdown
See the [PostgreSQL Documentation](https://www.postgresql.org/docs/) for more info.
```

### Inline Code

Wrap with backticks: `` `variable_name` `` renders with a light gray background.

### Blockquotes

```markdown
> **Note**: This is important information.
```

Renders with a blue left border and subtle background.

---

## 🔄 Processing Steps (Streaming Pipeline)

When a user sends a query, the system shows **real-time processing steps** (like Amazon Q Business / Cursor AI):

1. **Analyzing your query** — Determining next steps
2. **Searching your documents** — Looking up relevant passages
3. **Extracting key details** — Processing document content
4. **Generating a response** — Preparing the final answer

Each step shows:
- ✅ Green checkmark when complete
- 🔄 Spinning indicator when active
- ○ Empty circle when pending

These steps are **streamed in real-time** — each step transitions from pending → active → complete as the backend processes.

### How to Implement with Real WebSocket Backend

#### Backend (Node.js WebSocket Server)

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const { message, messageId } = JSON.parse(data);
    
    // Step 1: Analyzing
    ws.send(JSON.stringify({
      type: 'step',
      messageId,
      step: { id: 'step-1', label: 'Analyzing your query', description: 'Determining Next Steps', status: 'active' },
      allSteps: [
        { id: 'step-1', label: 'Analyzing your query', description: 'Determining Next Steps', status: 'active' },
        { id: 'step-2', label: 'Searching your documents', description: 'Looking up', status: 'pending' },
        { id: 'step-3', label: 'Extracting key details', description: 'Processing content', status: 'pending' },
        { id: 'step-4', label: 'Generating a response', description: 'Preparing final response', status: 'pending' },
      ]
    }));
    
    // ... process query ...
    await analyzeQuery(message);
    
    // Step 1 complete, Step 2 active
    ws.send(JSON.stringify({
      type: 'step',
      messageId,
      step: { id: 'step-1', label: 'Analyzing your query', description: 'Determining Next Steps', status: 'complete' },
      allSteps: [
        { id: 'step-1', label: 'Analyzing your query', status: 'complete' },
        { id: 'step-2', label: 'Searching your documents', status: 'active' },
        { id: 'step-3', label: 'Extracting key details', status: 'pending' },
        { id: 'step-4', label: 'Generating a response', status: 'pending' },
      ]
    }));
    
    // Step 2: Search documents
    const results = await searchDocuments(message);
    
    // Send progress details during search
    ws.send(JSON.stringify({
      type: 'progress',
      messageId,
      stage: 'searching',
      detail: 'Found passages from 3 documents'
    }));
    
    // ... continue through steps 3 and 4 ...
    
    // Stream response tokens
    const response = await generateResponse(results);
    for (const token of tokenize(response)) {
      ws.send(JSON.stringify({
        type: 'message',
        subtype: 'token',
        messageId,
        token
      }));
      await sleep(10); // Small delay for streaming effect
    }
    
    // Send sources and citations
    ws.send(JSON.stringify({
      type: 'message',
      subtype: 'sources',
      messageId,
      sources: [
        { name: 'document.pdf', url: '/files/document.pdf', snippet: 'Relevant excerpt...' }
      ],
      citations: [
        { index: 1, text: 'Key finding from document', source: 'document.pdf' }
      ]
    }));
    
    // Complete
    ws.send(JSON.stringify({ type: 'complete', messageId }));
  });
});
```

#### Frontend (React WebSocket Client)

```javascript
// src/services/websocket.ts
class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers = {};
  private reconnectAttempts = 0;
  private maxReconnect = 5;
  
  connect(url = 'ws://localhost:8080') {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('Connected');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'step':
          this.handlers.step?.(data);
          break;
        case 'progress':
          this.handlers.progress?.(data);
          break;
        case 'message':
          this.handlers.message?.(data);
          break;
        case 'complete':
          this.handlers.complete?.(data);
          break;
        case 'error':
          this.handlers.error?.(data);
          break;
      }
    };
    
    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnect) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(url), 2000 * this.reconnectAttempts);
      }
    };
  }
  
  send(message, messageId) {
    this.ws?.send(JSON.stringify({ message, messageId }));
  }
  
  on(event, handler) {
    this.handlers[event] = handler;
  }
  
  disconnect() {
    this.ws?.close();
  }
}

export const wsService = new WebSocketService();
```

### WebSocket Message Protocol

| Type | Direction | Purpose |
|------|-----------|---------|
| `step` | Server → Client | Processing step status update (pending/active/complete) |
| `progress` | Server → Client | Sub-step details (e.g., "Found 3 documents") |
| `message` (token) | Server → Client | Single token for streaming response |
| `message` (tool_output) | Server → Client | Tool execution result |
| `message` (sources) | Server → Client | Source documents and citations |
| `complete` | Server → Client | Response fully generated |
| `error` | Server → Client | Error occurred |

---

## 📎 Events & Sources Panel

After the response is complete, two expandable buttons appear:

### Events
Shows all processing steps that occurred (same as the live pipeline, but as a historical record):
- ✓ Analyzing your query — Determining Next Steps
- ✓ Searching your documents — Looking up
- ✓ Extracting key details — Processing document content  
- ✓ Generating a response — Preparing a final response

### Sources
Shows the documents used to generate the response:
- **Document name** (clickable link)
- **Snippet** — excerpt from the document
- **Citations** — numbered references linking parts of the answer to source documents

Citations in the response text appear as `[1]`, `[2]` etc., and map to entries in the Sources panel.

---

## 📋 Copy Functionality

- **Copy code blocks** — Button in each code block header
- **Copy full message** — Hover over any message (user or assistant) to see the copy button
- Copies formatted text: `You:\n<content>` or `Assistant:\n<content>`
- Shows a green "Copied to clipboard" snackbar

---

## 📁 Session Management

- **Sidebar** with conversation history list
- **New Chat** button to start fresh
- **Delete with confirmation** — Click trash icon → "Do you confirm? Yes / No" dialog
- **No "Clear History"** button (removed as requested)
- Auto-title from first user message

---

## 🖼️ Image Handling

- **Upload preview** — 80×80px thumbnails in input area before sending
- **Click to preview** — Clicking an uploaded image opens a full-size dialog
- **In-message preview** — Sent images shown in the message bubble (click to enlarge)
- Non-image files show name + size chip

---

## 📦 Expand/Collapse for Long Content

- Assistant responses exceeding 800 chars or 20 lines get an **Expand/Collapse** toggle
- When expanded, content has a **max-height with scrollbar** (500px) to prevent UI clutter
- Tool output blocks are collapsible by default
- Events and Sources panels are collapsed by default

---

## 🔌 Dummy API (Mock WebSocket)

The mock WebSocket service (`src/services/websocket.ts`) simulates:
1. Processing steps streamed one at a time with realistic delays
2. Sub-step progress details (e.g., search queries, document counts)
3. Tool execution outputs (log_analyzer, metrics_query)
4. Token-by-token response streaming with markdown content
5. Sources and citations delivered after streaming completes
6. Abort controller for cancellation

To replace with a real API:
1. Update `wsService` to use a real WebSocket connection (`new WebSocket('wss://your-api.com')`)
2. Keep the same event handler pattern (`on('step', ...)`, `on('message', ...)`, etc.)
3. Backend should follow the message protocol documented above

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 + Vite 5 | UI framework + bundler |
| TypeScript 5 | Type safety |
| Redux Toolkit | Global state management |
| Material UI v7 | Component library (all styling) |
| react-markdown + remark-gfm | Markdown rendering |
| react-syntax-highlighter (Prism) | Code block highlighting (oneLight theme) |
| react-dropzone | File upload |
| WebSocket (mock) | Real-time streaming simulation |

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — type a question to see the full streaming response flow with processing steps, events, sources, and citations.

---

## 📤 Export

Export conversation as `.txt` file via the "Export" button in the header. Includes timestamps and role labels.
