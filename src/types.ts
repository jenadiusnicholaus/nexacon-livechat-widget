export interface ChatOptions {
  widgetId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorId?: string;
  preChatForm?: boolean; // show name/email form before connecting (default: true if no visitorName)
  apiUrl?: string; // custom API base URL
}

export interface WidgetConfig {
  widget_id: string;
  welcome_message: string;
  primary_color: string;
  bot_avatar_url: string;
  bot?: {
    id: number;
    bot_name: string;
    ai_model: string;
    ai_model_endpoint: string | null;
    personality: string;
    training_data: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    bot_jid: string;
  };
}

export interface GuestSession {
  session_id: string;
  token: string;
  channel: string;
  ws_url: string;
  expires_in: number;
  ticket_id: number;
  routed_to: "agent" | "bot";
  handler: string;
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
