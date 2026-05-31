import { GuestSession, WidgetConfig } from "./types";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async getWidgetConfig(widgetId: string): Promise<WidgetConfig> {
    const res = await fetch(
      `${this.baseUrl}/live-chat/widget/${widgetId}/config/`
    );
    if (!res.ok) {
      throw new Error(`Failed to load widget config (${res.status})`);
    }
    return res.json() as Promise<WidgetConfig>;
  }

  async createGuestSession(
    widgetId: string,
    options: {
      visitorId?: string;
      name?: string;
      email?: string;
    }
  ): Promise<GuestSession> {
    const body = {
      visitor_id: options.visitorId || crypto.randomUUID(),
      name: options.name || "Visitor",
      email: options.email || "",
      visitor_info: {},
    };

    const res = await fetch(
      `${this.baseUrl}/live-chat/widget/${widgetId}/guest-session/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Guest session failed (${res.status}): ${JSON.stringify(err)}`
      );
    }

    return res.json() as Promise<GuestSession>;
  }
}
