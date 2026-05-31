export type MessageHandler = (from: string, body: string) => void;
export type StateHandler = (state: "connected" | "disconnected" | "error", detail?: string) => void;

export class XmppClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private jid: string;
  private password: string;
  private domain: string;
  private roomJid: string;
  private nick: string;
  private streamOpened = false;
  private authenticated = false;

  onMessage: MessageHandler = () => {};
  onStateChange: StateHandler = () => {};

  constructor(options: {
    wsUrl: string;
    jid: string;
    password: string;
    roomJid: string;
  }) {
    this.wsUrl = options.wsUrl;
    this.jid = options.jid;
    this.password = options.password;
    this.domain = options.jid.split("@")[1] || "nexacon.cloud";
    this.roomJid = options.roomJid;
    this.nick = options.jid.split("@")[0];
  }

  connect(): void {
    try {
      this.ws = new WebSocket(this.wsUrl, "xmpp");
    } catch {
      this.onStateChange("error", "WebSocket not supported or URL invalid");
      return;
    }

    this.ws.onopen = () => {
      this.streamOpened = false;
      this.authenticated = false;
      this.openStream();
    };

    this.ws.onmessage = (e: MessageEvent) => {
      this.handleData(e.data as string);
    };

    this.ws.onerror = () => {
      this.onStateChange("error", "WebSocket connection error");
    };

    this.ws.onclose = () => {
      this.onStateChange("disconnected");
    };
  }

  disconnect(): void {
    this.send("</stream:stream>");
    this.ws?.close();
  }

  sendMessage(body: string): void {
    const escaped = this.escapeXml(body);
    this.send(
      `<message to="${this.roomJid}" type="groupchat">` +
        `<body>${escaped}</body>` +
        `</message>`
    );
  }

  private openStream(): void {
    this.send(
      `<?xml version="1.0"?>` +
        `<stream:stream xmlns="jabber:client" ` +
        `xmlns:stream="http://etherx.jabber.org/streams" ` +
        `to="${this.domain}" version="1.0" xml:lang="en">`
    );
  }

  private handleData(data: string): void {
    if (!this.authenticated) {
      if (data.includes("mechanism") && data.includes("PLAIN")) {
        this.authenticate();
        return;
      }
      if (data.includes("<success")) {
        this.authenticated = true;
        this.streamOpened = false;
        this.openStream();
        return;
      }
      if (data.includes("<failure")) {
        this.onStateChange("error", "XMPP authentication failed");
        return;
      }
    }

    if (this.authenticated && !this.streamOpened) {
      if (data.includes("urn:ietf:params:xml:ns:xmpp-bind")) {
        this.streamOpened = true;
        this.bindResource();
        return;
      }
    }

    if (data.includes("<iq") && data.includes('type="result"') && data.includes("bind")) {
      this.joinRoom();
      this.onStateChange("connected");
      return;
    }

    if (data.includes("<message")) {
      this.parseMessage(data);
    }
  }

  private authenticate(): void {
    const user = this.jid.split("@")[0];
    const authStr = btoa(`\0${user}\0${this.password}`);
    this.send(
      `<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">` +
        `${authStr}</auth>`
    );
  }

  private bindResource(): void {
    this.send(
      `<iq type="set" id="bind1">` +
        `<bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">` +
        `<resource>widget</resource>` +
        `</bind></iq>`
    );
  }

  private joinRoom(): void {
    this.send(
      `<presence to="${this.roomJid}/${this.nick}">` +
        `<x xmlns="http://jabber.org/protocol/muc"/>` +
        `</presence>`
    );
  }

  private parseMessage(data: string): void {
    const fromMatch = data.match(/from="([^"]+)"/);
    const bodyMatch = data.match(/<body[^>]*>([^<]*)<\/body>/);
    const typeMatch = data.match(/type="([^"]+)"/);

    if (!fromMatch || !bodyMatch) return;
    if (typeMatch?.[1] === "error") return;

    const from = fromMatch[1];
    const body = bodyMatch[1];
    const senderNick = from.split("/")[1] || from;

    if (senderNick !== this.nick) {
      this.onMessage(from, body);
    }
  }

  private send(stanza: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(stanza);
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
