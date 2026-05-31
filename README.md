# Nexacon Live Chat Widget

Embeddable live chat widget for any website. Drop a single `<script>` tag or use as a library in TypeScript/JavaScript projects.

## Quick Start (Script Tag)

```html
<script
  src="https://unpkg.com/nexacon-livechat-widget/dist/widget.min.js"
  data-widget-id="YOUR_WIDGET_UUID"
></script>
```

That's it. The widget auto-initializes, shows a chat bubble in the bottom-right corner, and connects visitors to your support agent or bot.

## Use as a Library (TypeScript/JavaScript)

Install:

```bash
npm install nexacon-livechat-widget
```

**Core API client + WebSocket client:**

```typescript
import { ApiClient, nxClient } from "nexacon-livechat-widget";

const api = new ApiClient();

// Get widget config
const config = await api.getWidgetConfig("your-widget-id");

// Create guest session
const session = await api.createGuestSession("your-widget-id", {
  visitorId: "user-123",
  name: "John Doe",
  email: "john@example.com",
});

// Connect via WebSocket
const nx = new nxClient({
  wsUrl: "wss://nxservice.quantumvision-tech.com/nx-websocket/",
  jid: session.session_id,
  password: session.token,
  roomJid: session.channel,
});

nx.onMessage = (from, body) => {
  console.log("Message from", from, ":", body);
};

nx.onStateChange = (state) => {
  console.log("Connection state:", state);
};

nx.connect();
nx.sendMessage("Hello!");
```

**Full widget (with UI) in React:**

```tsx
import { NexaconChatWidget } from "nexacon-livechat-widget/widget";

useEffect(() => {
  const widget = new NexaconChatWidget({
    widgetId: "your-widget-id",
    visitorName: "John Doe",
  });
  widget.init();
  return () => widget.destroy();
}, []);
```

## How It Works

```
Website visitor
    │
    │  <script data-widget-id="...">
    │
    ▼
Widget SDK (this library)
    │
    ├── GET  /live-chat/widget/{id}/config/       ← load colors, bot name
    │
    ├── POST /live-chat/widget/{id}/guest-session/ ← create anonymous session
    │         returns: guest_jid, token, room_jid
    │
    └── WebSocket → Ejabberd XMPP                 ← real-time chat
              authenticate as guest_jid with token
              join MUC room
              send/receive messages
```

## Script Tag Attributes

| Attribute            | Required | Description                             |
| -------------------- | -------- | --------------------------------------- |
| `data-widget-id`     | **Yes**  | Widget UUID from your Nexacon dashboard |
| `data-visitor-name`  | No       | Pre-fill visitor name                   |
| `data-visitor-email` | No       | Pre-fill visitor email                  |

## Build

```bash
npm install
npm run build        # library (ESM) + widget (IIFE)
npm run build:min    # minified widget
npm run build:all    # all builds + TypeScript declarations
npm run dev          # watch mode
```

## Security Note

- **API Key and Secret Key are server-side only** — never embedded in the widget script.
- The widget only needs a `widget_id` (public identifier, safe to expose).
- Guest sessions are ephemeral and expire after 1 hour.
