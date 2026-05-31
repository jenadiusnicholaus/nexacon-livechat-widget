# Getting Started

## Prerequisites

1. A running Nexacon backend instance
2. A **Widget ID** — created via the Nexacon admin dashboard (or API)

## Step 1: Create your widget (admin only)

Use the Nexacon API or dashboard to create a bot and widget:

```bash
# Create bot
POST /api/v1.0/live-chat/bots/
Headers: X-API-Key, X-Secret-Key
Body: { "bot_name": "Support Bot", "ai_model": "gpt-3.5-turbo" }

# Create widget (links to the bot)
POST /api/v1.0/live-chat/widgets/
Headers: X-API-Key, X-Secret-Key
Body: { "bot": <bot_id>, "welcome_message": "Hi! How can we help?" }
# → Returns widget_id (UUID)
```

## Step 2: Embed the widget

Paste this before `</body>` on your website:

```html
<script
  src="https://unpkg.com/nexacon-livechat-widget/dist/nexacon-chat.min.js"
  data-widget-id="YOUR_WIDGET_UUID"
></script>
```

Replace `YOUR_WIDGET_UUID` with the `widget_id` from Step 1.

## Step 3: Done

The chat bubble appears automatically. When a visitor clicks it:

1. An anonymous guest session is created
2. If an agent is **online** → routed to the agent
3. If no agent online → routed to the AI bot

## Optional: Pre-fill visitor info

```html
<script
  src="nexacon-chat.min.js"
  data-widget-id="YOUR_WIDGET_UUID"
  data-visitor-name="John Doe"
  data-visitor-email="john@example.com"
></script>
```

## Self-hosted configuration

```html
<script
  src="nexacon-chat.min.js"
  data-widget-id="YOUR_WIDGET_UUID"
  data-base-url="https://your-nexacon-server.com/api/v1.0"
  data-ejabberd-ws="wss://your-ejabberd.com:5443/ws"
></script>
```
