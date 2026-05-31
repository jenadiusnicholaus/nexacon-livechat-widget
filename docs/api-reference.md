# API Reference

## Script Tag Attributes

| Attribute | Required | Default | Description |
|---|---|---|---|
| `data-widget-id` | **Yes** | — | Widget UUID from the Nexacon dashboard |
| `data-base-url` | No | Nexacon cloud | REST API base URL |
| `data-ejabberd-ws` | No | Nexacon cloud | Ejabberd WebSocket URL |
| `data-visitor-name` | No | `"Visitor"` | Pre-fill visitor display name |
| `data-visitor-email` | No | `""` | Pre-fill visitor email |

## Programmatic Init

```html
<script src="nexacon-chat.min.js"></script>
<script>
  const widget = NexaconChat.init({
    widgetId: 'YOUR_WIDGET_UUID',
    baseUrl: 'https://your-server.com/api/v1.0',       // optional
    ejabberdWsUrl: 'wss://your-ejabberd.com:5443/ws',  // optional
    visitorName: 'John Doe',                            // optional
    visitorEmail: 'john@example.com',                   // optional
    visitorId: 'user-123',                              // optional — stable ID for returning visitors
  });

  // Destroy widget
  widget.destroy();
</script>
```

## `NexaconChat.init(options)` → `NexaconChatWidget`

Returns a widget instance. Options:

```typescript
interface ChatOptions {
  widgetId: string;          // required
  baseUrl?: string;
  ejabberdWsUrl?: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorId?: string;        // stable ID to track returning visitors
}
```

## `widget.destroy()`

Removes the widget from the page and closes the XMPP connection.
