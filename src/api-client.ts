import { GuestSession, WidgetConfig } from "./types";

const BASE_URL = "https://nxservice.quantumvision-tech.com/api/v1.0";

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string, baseUrl?: string) {
    this.baseUrl = (baseUrl || BASE_URL).replace(/\/$/, "");
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  async getWidgetConfig(widgetId: string): Promise<WidgetConfig> {
    const res = await fetch(
      `${this.baseUrl}/live-chat/widget/${widgetId}/config/`,
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
    },
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
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Guest session failed (${res.status}): ${JSON.stringify(err)}`,
      );
    }

    return res.json() as Promise<GuestSession>;
  }

  async fetchChatHistory(
    peer: string,
    nxToken: string,
    limit: number = 50,
  ): Promise<any[]> {
    const res = await fetch(
      `${this.baseUrl}/nx/history/?limit=${limit}&peer=${encodeURIComponent(peer)}`,
      {
        method: "GET",
        headers: {
          "X-NX-Token": nxToken,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch chat history (${res.status})`);
    }

    return res.json() as Promise<any[]>;
  }

  async getNxToken(
    username: string,
    djangoToken?: string,
  ): Promise<{
    nx_token: string;
    jid: string;
    ws_url: string;
    username: string;
    expires_in: number;
  }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "x-Secret-key": this.secretKey,
    };

    if (djangoToken) {
      headers["Authorization"] = `Bearer ${djangoToken}`;
    }

    const res = await fetch(`${this.baseUrl}/nexacon-auth/nxm-token/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username,
        host: "nxservice.quantumvision-tech.com",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `nxToken generation failed (${res.status}): ${JSON.stringify(err)}`,
      );
    }

    return res.json() as Promise<{
      nx_token: string;
      jid: string;
      ws_url: string;
      username: string;
      expires_in: number;
    }>;
  }
}
