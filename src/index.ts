import { ApiClient } from "./api-client";
import { nxClient } from "./xmpp-client";
import { WidgetUI } from "./widget-ui";
import {
  ChatMessage,
  ChatOptions,
  ConnectionState,
  GuestSession,
} from "./types";

export class NexaconChatWidget {
  private options: ChatOptions;
  private api: ApiClient;
  private xmpp: nxClient | null = null;
  private ui: WidgetUI;
  private state: ConnectionState = "idle";
  private sessionStarted = false;
  private currentSession: GuestSession | null = null;
  private botName: string | null = null;
  private readonly STORAGE_KEY = "nexacon_visitor_session";
  private readonly STORAGE_EXPIRY_DAYS = 2;

  constructor(options: ChatOptions) {
    this.options = {
      widgetId: options.widgetId,
      visitorName: options.visitorName || "",
      visitorEmail: options.visitorEmail || "",
      visitorId: options.visitorId || crypto.randomUUID(),
      preChatForm: options.preChatForm ?? !options.visitorName,
      apiUrl: options.apiUrl,
      apiKey: options.apiKey,
      secretKey: options.secretKey,
    };

    this.api = new ApiClient(options.apiKey, options.secretKey, options.apiUrl);
    this.ui = new WidgetUI();

    this.ui.onSend = (text) => this.sendMessage(text);
    this.ui.onSuggestionClick = (text) => this.sendMessage(text);
    this.ui.onOpen = () => {
      if (!this.sessionStarted) {
        this.sessionStarted = true;

        // Try to load from storage first
        const stored = this.loadSessionFromStorage();
        if (stored) {
          this.options.visitorName = stored.visitorName;
          this.options.visitorEmail = stored.visitorEmail;
          this.options.visitorId = stored.visitorId;
          this.startSession(stored.session);
        } else if (this.options.preChatForm) {
          this.ui.showPreChatForm(async (name, email) => {
            this.options.visitorName = name || "Visitor";
            this.options.visitorEmail = email;
            this.ui.hidePreChatForm();

            // Get nxToken for the guest user
            try {
              const nxTokenData = await this.api.getNxToken(name);
              this.options.visitorId = nxTokenData.jid;
              // Store nxToken for chat history retrieval
              sessionStorage.setItem("nexacon_nx_token", nxTokenData.nx_token);
            } catch (err) {
              console.error("Failed to get nxToken:", err);
            }

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
      this.botName = config.bot?.bot_name || null;
      this.ui.mount();
      if (config.primary_color) this.ui.setColor(config.primary_color);
      if (config.bot?.bot_name) this.ui.setHandlerName(config.bot.bot_name);
      if (config.bot_avatar_url)
        this.ui.setHandlerAvatar(config.bot_avatar_url);
    } catch {
      this.ui.mount();
    }
  }

  private async startSession(existingSession?: GuestSession): Promise<void> {
    // Only show connecting status for new sessions
    if (!existingSession) {
      this.setState("connecting");
      this.ui.setStatus("● Connecting...");
      this.ui.enableInput(false);
    }

    try {
      const session =
        existingSession ||
        (await this.api.createGuestSession(this.options.widgetId, {
          visitorId: this.options.visitorId,
          name: this.options.visitorName,
          email: this.options.visitorEmail,
        }));

      this.currentSession = session;

      // Save to storage if it's a new session
      if (!existingSession) {
        this.saveSessionToStorage(session);
      } else {
        // Fetch chat history for returning visitor
        try {
          const nxToken = sessionStorage.getItem("nexacon_nx_token");
          if (nxToken) {
            const history = await this.api.fetchChatHistory(
              session.session_id,
              nxToken,
              50,
            );
            // Display history messages
            history.forEach((msg: any) => {
              const chatMsg: ChatMessage = {
                id: crypto.randomUUID(),
                from: msg.from === session.session_id ? "me" : msg.from,
                body: msg.body,
                timestamp: new Date(msg.timestamp || Date.now()),
                type: msg.from === session.session_id ? "visitor" : "agent",
              };
              this.ui.addMessage(chatMsg);
            });
          }
        } catch (historyErr) {
          // Ignore history fetch errors, continue with session
          console.log("Could not fetch chat history:", historyErr);
        }
      }

      // Only add system messages for new sessions
      if (!existingSession) {
        this.addSystemMessage(
          session.welcome_message || "Welcome! How can we help?",
        );
        this.addSystemMessage(
          session.routed_to === "agent"
            ? "You are connected to a support agent."
            : "You are connected to our AI assistant.",
        );
      }

      // Show AI suggestions only for new sessions
      if (!existingSession) {
        const suggestions = [
          "What services do you offer?",
          "How can I contact support?",
          "Tell me about pricing",
          "I need help with my account",
        ];
        this.ui.showAISuggestions(suggestions);
      }

      const handlerName =
        session.handler.split("@")[0].replace(/-/g, " ") || "Support";
      if (session.routed_to === "agent") {
        this.ui.setHandlerName(handlerName);
        this.ui.setHandlerAvatar(""); // Reset to default emoji for human agent
      } else {
        // Keep bot name from config if available
        if (this.botName) {
          this.ui.setHandlerName(this.botName);
        }
      }

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

  private saveSessionToStorage(session: GuestSession): void {
    const nxToken = sessionStorage.getItem("nexacon_nx_token");
    const data = {
      session,
      visitorName: this.options.visitorName,
      visitorEmail: this.options.visitorEmail,
      visitorId: this.options.visitorId,
      nxToken,
      expiry: Date.now() + this.STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private loadSessionFromStorage(): {
    session: GuestSession;
    visitorName: string;
    visitorEmail: string;
    visitorId: string;
    nxToken?: string;
  } | null {
    const stored = sessionStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      const data = JSON.parse(stored);
      if (Date.now() > data.expiry) {
        sessionStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      // Restore nxToken to sessionStorage
      if (data.nxToken) {
        sessionStorage.setItem("nexacon_nx_token", data.nxToken);
      }
      return {
        session: data.session,
        visitorName: data.visitorName,
        visitorEmail: data.visitorEmail,
        visitorId: data.visitorId,
        nxToken: data.nxToken,
      };
    } catch {
      sessionStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  private clearSessionFromStorage(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
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
    const apiUrl = script.getAttribute("data-api-url") || undefined;
    const apiKey = script.getAttribute("data-api-key") || "";
    const secretKey = script.getAttribute("data-secret-key") || "";

    init({ widgetId, visitorName, visitorEmail, apiUrl, apiKey, secretKey });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}
