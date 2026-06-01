import { ApiClient } from "./api-client";
import { nxClient } from "./xmpp-client";
import { WidgetUI } from "./widget-ui";
import { ChatMessage, ChatOptions, ConnectionState } from "./types";

export class NexaconChatWidget {
  private options: Required<ChatOptions>;
  private api: ApiClient;
  private xmpp: nxClient | null = null;
  private ui: WidgetUI;
  private state: ConnectionState = "idle";
  private sessionStarted = false;

  constructor(options: ChatOptions) {
    this.options = {
      widgetId: options.widgetId,
      visitorName: options.visitorName || "",
      visitorEmail: options.visitorEmail || "",
      visitorId: options.visitorId || crypto.randomUUID(),
      preChatForm: options.preChatForm ?? !options.visitorName,
    };

    this.api = new ApiClient();
    this.ui = new WidgetUI();

    this.ui.onSend = (text) => this.sendMessage(text);
    this.ui.onOpen = () => {
      if (!this.sessionStarted) {
        this.sessionStarted = true;
        if (this.options.preChatForm) {
          this.ui.showPreChatForm((name, email) => {
            this.options.visitorName = name || "Visitor";
            this.options.visitorEmail = email;
            this.ui.hidePreChatForm();
            this.startSession();
          });
        } else {
          this.options.visitorName = this.options.visitorName || "Visitor";
          this.startSession();
        }
      }
    };
  }

  async init(): Promise<void> {
    try {
      const config = await this.api.getWidgetConfig(this.options.widgetId);
      this.ui.mount();
      if (config.primary_color) this.ui.setColor(config.primary_color);
      if (config.bot?.bot_name) this.ui.setHandlerName(config.bot.bot_name);
    } catch {
      this.ui.mount();
    }
  }

  private async startSession(): Promise<void> {
    this.setState("connecting");
    this.ui.setStatus("● Connecting...");
    this.ui.enableInput(false);

    try {
      const session = await this.api.createGuestSession(this.options.widgetId, {
        visitorId: this.options.visitorId,
        name: this.options.visitorName,
        email: this.options.visitorEmail,
      });

      this.addSystemMessage(
        session.welcome_message || "Welcome! How can we help?",
      );
      this.addSystemMessage(
        session.routed_to === "agent"
          ? "You are connected to a support agent."
          : "You are connected to our AI assistant.",
      );

      const handlerName =
        session.handler.split("@")[0].replace(/-/g, " ") || "Support";
      this.ui.setHandlerName(
        session.routed_to === "agent" ? handlerName : "Support Bot",
      );

      this.connectXmpp(
        session.session_id,
        session.token,
        session.channel,
        session.ws_url,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState("error");
      this.ui.setStatus("● Connection failed");
      this.addSystemMessage(`Could not connect: ${msg}`);
    }
  }

  private connectXmpp(
    jid: string,
    token: string,
    roomJid: string,
    wsUrl: string,
  ): void {
    this.xmpp = new nxClient({
      wsUrl: wsUrl,
      jid,
      password: token,
      roomJid,
    });

    this.xmpp.onMessage = (from, body) => {
      this.ui.showTyping(false);
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        from,
        body,
        timestamp: new Date(),
        type: "agent",
      };
      this.ui.addMessage(msg);
    };

    this.xmpp.onStateChange = (state, detail) => {
      if (state === "connected") {
        this.setState("connected");
        this.ui.setStatus("● Online");
        this.ui.enableInput(true);
      } else if (state === "disconnected") {
        this.setState("disconnected");
        this.ui.setStatus("● Disconnected");
        this.ui.enableInput(false);
      } else if (state === "error") {
        this.setState("error");
        this.ui.setStatus("● Error");
        this.addSystemMessage(detail || "Connection error");
      }
    };

    this.xmpp.connect();
  }

  private sendMessage(text: string): void {
    if (!text.trim()) return;

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      from: "me",
      body: text,
      timestamp: new Date(),
      type: "visitor",
    };
    this.ui.addMessage(msg);

    if (this.xmpp && this.state === "connected") {
      this.xmpp.sendMessage(text);
    } else {
      this.addSystemMessage("Not connected. Your message could not be sent.");
    }
  }

  private addSystemMessage(body: string): void {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      from: "system",
      body,
      timestamp: new Date(),
      type: "system",
    };
    this.ui.addMessage(msg);
  }

  private setState(state: ConnectionState): void {
    this.state = state;
  }

  destroy(): void {
    this.xmpp?.disconnect();
    document.getElementById("nx-chat-bubble")?.remove();
    document.getElementById("nx-chat-window")?.remove();
  }
}

export function init(options: ChatOptions): NexaconChatWidget {
  const widget = new NexaconChatWidget(options);
  widget.init();
  return widget;
}

function autoInit(): void {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    "script[data-widget-id]",
  );

  scripts.forEach((script) => {
    const widgetId = script.getAttribute("data-widget-id");
    if (!widgetId) return;

    const visitorName = script.getAttribute("data-visitor-name") || undefined;
    const visitorEmail = script.getAttribute("data-visitor-email") || undefined;

    init({ widgetId, visitorName, visitorEmail });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}
