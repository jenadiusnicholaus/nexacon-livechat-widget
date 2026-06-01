import { Strophe, $msg, $pres } from "strophe.js";

export type MessageHandler = (from: string, body: string) => void;
export type StateHandler = (
  state: "connected" | "disconnected" | "error",
  detail?: string,
) => void;

export class nxClient {
  private connection: any = null;
  private wsUrl: string;
  private jid: string;
  private password: string;
  private roomJid: string;
  private nick: string;
  private isConnected = false;

  onMessage: MessageHandler = () => {};
  onStateChange: StateHandler = () => {};

  constructor(options: {
    wsUrl: string;
    jid: string;
    password: string;
    roomJid: string;
  }) {
    // Convert HTTPS to WSS for WebSocket connection
    this.wsUrl = options.wsUrl
      .replace(/^https:\/\//, "wss://")
      .replace(/^http:\/\//, "ws://");
    this.jid = options.jid;
    this.password = options.password;
    this.roomJid = options.roomJid;
    this.nick = options.jid.split("@")[0];
  }

  connect(): void {
    try {
      this.connection = new Strophe.Connection(this.wsUrl);

      this.connection.connect(this.jid, this.password, (status: number) => {
        switch (status) {
          case Strophe.Status.CONNECTING:
            this.onStateChange("error", "Connecting...");
            break;
          case Strophe.Status.CONNECTED:
            this.isConnected = true;
            this.onConnected();
            break;
          case Strophe.Status.AUTHFAIL:
            this.onStateChange("error", "Authentication failed");
            break;
          case Strophe.Status.CONNFAIL:
            this.onStateChange("error", "Connection failed");
            break;
          case Strophe.Status.DISCONNECTED:
            this.isConnected = false;
            this.onStateChange("disconnected");
            break;
          default:
            // Other statuses
            break;
        }
      });
    } catch (error) {
      this.onStateChange("error", "Failed to initialize connection");
    }
  }

  private onConnected(): void {
    // Send initial presence
    this.connection.send($pres());

    // Add message handler
    this.connection.addHandler(
      (stanza: any) => this.handleMessage(stanza),
      null,
      "message",
      "groupchat",
      this.roomJid,
    );

    // Join the MUC room
    this.joinRoom();

    this.onStateChange("connected");
  }

  private handleMessage(stanza: any): boolean {
    const from = stanza.getAttribute("from");
    const body = stanza.querySelector("body");

    if (body) {
      const bodyText = Strophe.getText(body);
      const senderNick = from.split("/")[1] || from;

      // Don't handle messages from self
      if (senderNick !== this.nick) {
        this.onMessage(from, bodyText);
      }
    }

    return true;
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
      this.isConnected = false;
    }
  }

  sendMessage(body: string): void {
    if (!this.isConnected || !this.connection) {
      return;
    }

    this.connection.send(
      $msg({
        to: this.roomJid,
        type: "groupchat",
      })
        .c("body")
        .t(body),
    );
  }

  private joinRoom(): void {
    if (!this.connection) return;

    this.connection.send(
      $pres({
        to: `${this.roomJid}/${this.nick}`,
      }).c("x", { xmlns: "http://jabber.org/protocol/muc" }),
    );
  }
}
