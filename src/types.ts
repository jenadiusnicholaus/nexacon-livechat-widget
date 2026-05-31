export interface ChatOptions {
  widgetId: string;
  baseUrl?: string;
  ejabberdWsUrl?: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorId?: string;
  preChatForm?: boolean; // show name/email form before connecting (default: true if no visitorName)
}

export interface WidgetConfig {
  widget_id: string;
  welcome_message: string;
  primary_color: string;
  bot?: { bot_name: string; bot_jid: string };
}

export interface GuestSession {
  guest_jid: string;
  token: string;
  room_jid: string;
  expires_in: number;
  ticket_id: number;
  routed_to: "agent" | "bot";
  handler_jid: string;
  welcome_message: string;
}

export interface ChatMessage {
  id: string;
  from: string;
  body: string;
  timestamp: Date;
  type: "visitor" | "agent" | "bot" | "system";
}

export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";
