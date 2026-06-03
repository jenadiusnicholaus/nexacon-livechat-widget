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

  async createRoom(
    nxToken: string,
    title: string,
    description?: string,
  ): Promise<{
    id: string;
    title: string;
    description: string;
    jid: string;
  }> {
    const url = `${this.baseUrl}/nx/groups/`;
    console.log("Creating room at:", url);
    console.log("Headers:", {
      "Content-Type": "application/json",
      Authorization: `Bearer ${nxToken.substring(0, 20)}...`,
      "API-Key": this.apiKey,
      "Secret-Key": this.secretKey.substring(0, 10) + "...",
    });
    console.log("Body:", { title, description: description || "" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${nxToken}`,
        "API-Key": this.apiKey,
        "Secret-Key": this.secretKey,
      },
      body: JSON.stringify({
        title,
        description: description || "",
      }),
    });

    console.log("Room creation response status:", res.status);
    console.log("Room creation response ok:", res.ok);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Room creation error details:", err);
      throw new Error(
        `Room creation failed (${res.status}): ${JSON.stringify(err)}`,
      );
    }

    const data = await res.json();
    console.log("Room created successfully:", data);
    return data as Promise<{
      id: string;
      title: string;
      description: string;
      jid: string;
    }>;
  }

  async addRoomMember(
    nxToken: string,
    roomJid: string,
    nxid: string,
    affiliation: "member" | "admin" | "owner" = "member",
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    const res = await fetch(`${this.baseUrl}/nx/groups/${roomJid}/members/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${nxToken}`,
        "API-Key": this.apiKey,
        "Secret-Key": this.secretKey,
      },
      body: JSON.stringify({
        nxid,
        affiliation,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Add room member failed (${res.status}): ${JSON.stringify(err)}`,
      );
    }

    return res.json() as Promise<{
      success: boolean;
      message?: string;
    }>;
  }
}
