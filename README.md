# Nexacon Live Chat Widget

Embeddable live chat widget for any website. Drop a single `<script>` tag and you're done.

## Quick Start

```html
<script
  src="https://cdn.nexacon.com/livechat/nexacon-chat.js"
  data-widget-id="YOUR_WIDGET_UUID"
></script>
```

That's it. The widget auto-initializes, shows a chat bubble in the bottom-right corner, and connects visitors to your support agent or bot.

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

| Attribute | Required | Description |
|---|---|---|
| `data-widget-id` | **Yes** | Widget UUID from your Nexacon dashboard |
| `data-base-url` | No | API base URL (default: Nexacon cloud) |
| `data-ejabberd-ws` | No | Ejabberd WebSocket URL (default: Nexacon cloud) |
| `data-visitor-name` | No | Pre-fill visitor name |
| `data-visitor-email` | No | Pre-fill visitor email |

## Programmatic Init

```html
<script src="nexacon-chat.js"></script>
<script>
  NexaconChat.init({
    widgetId: 'YOUR_WIDGET_UUID',
    baseUrl: 'https://your-server.com/api/v1.0',
    ejabberdWsUrl: 'wss://your-ejabberd.com:5443/ws',
    visitorName: 'John Doe',
    visitorEmail: 'john@example.com',
  });
</script>
```

## Build

```bash
npm install
npm run build        # development build → dist/nexacon-chat.js
npm run build:min    # minified → dist/nexacon-chat.min.js
npm run build:all    # both + TypeScript declarations
npm run dev          # watch mode
```

## Security Note

- **API Key and Secret Key are server-side only** — never embedded in the widget script.
- The widget only needs a `widget_id` (public identifier, safe to expose).
- Guest sessions are ephemeral and expire after 1 hour.
