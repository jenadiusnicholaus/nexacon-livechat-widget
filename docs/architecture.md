# Architecture

## Separation of Concerns

```
┌──────────────────────────────────────────────┐
│  ADMIN / DEVELOPER DASHBOARD                 │
│                                              │
│  Creates: bots, agents, widgets              │
│  Auth: API Key + Secret Key (server-side)    │
│  Issues: widget_id (public identifier)       │
└─────────────────────┬────────────────────────┘
                      │  widget_id
                      ▼
┌──────────────────────────────────────────────┐
│  NEXACON LIVE CHAT WIDGET  (this SDK)        │
│                                              │
│  Visitor-facing only. No admin operations.   │
│  Auth: NONE — widget_id only                 │
└──────────────────────────────────────────────┘
```

## Connection Flow

```
1. Page loads script tag with data-widget-id
         │
         ▼
2. GET /live-chat/widget/{id}/config/
   ← primary_color, welcome_message, bot_name
         │
         ▼
3. Visitor clicks chat bubble
         │
         ▼
4. POST /live-chat/widget/{id}/guest-session/
   ← guest_jid, token, room_jid, routed_to
         │
         ▼
5. WebSocket → wss://ejabberd:5443/ws
   Authenticate as guest_jid with token (XMPP SASL PLAIN)
         │
         ▼
6. Join MUC room (room_jid)
         │
   ┌─────┴──────┐
   │            │
agent         bot
online?       (fallback)
```

## Files

| File | Purpose |
|---|---|
| `src/index.ts` | Entry point, auto-init, `NexaconChat.init()` |
| `src/api-client.ts` | REST calls: widget config + guest session |
| `src/xmpp-client.ts` | XMPP over WebSocket: auth, MUC join, messages |
| `src/widget-ui.ts` | DOM/CSS: floating bubble + chat window |
| `src/types.ts` | TypeScript interfaces |
| `dist/nexacon-chat.js` | Development bundle (20.6kb) |
| `dist/nexacon-chat.min.js` | Production bundle (14.2kb) |
