import { ChatMessage } from "./types";

const CSS = `
#nx-chat-bubble {
  position: fixed; bottom: 24px; right: 24px; z-index: 99999;
  width: 56px; height: 56px; border-radius: 50%;
  background: #007bff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.22);
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
}
#nx-chat-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 22px rgba(0,0,0,0.28); }
#nx-chat-bubble svg { width: 28px; height: 28px; fill: #fff; }

#nx-chat-window {
  position: fixed; bottom: 92px; right: 24px; z-index: 99998;
  width: 360px; height: 520px;
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex; flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px; background: #fff;
  transform: scale(0.95) translateY(10px); opacity: 0;
  transition: transform 0.2s, opacity 0.2s;
  pointer-events: none;
}
#nx-chat-window.nx-open {
  transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
}

#nx-chat-header {
  padding: 14px 16px; background: #007bff; color: #fff;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
#nx-chat-header .nx-title { font-weight: 600; font-size: 15px; }
#nx-chat-header .nx-sub { font-size: 11px; opacity: 0.8; margin-top: 2px; }
#nx-chat-header button {
  background: none; border: none; color: #fff; cursor: pointer;
  font-size: 18px; line-height: 1; padding: 4px; opacity: 0.8;
}
#nx-chat-header button:hover { opacity: 1; }

#nx-chat-messages {
  flex: 1; overflow-y: auto; padding: 16px; display: flex;
  flex-direction: column; gap: 10px; background: #f7f8fc;
}
.nx-msg { max-width: 78%; line-height: 1.45; }
.nx-msg.nx-visitor {
  align-self: flex-end;
  background: #007bff; color: #fff;
  border-radius: 16px 16px 4px 16px;
  padding: 9px 13px;
}
.nx-msg.nx-agent, .nx-msg.nx-bot {
  align-self: flex-start;
  background: #fff; color: #222;
  border-radius: 16px 16px 16px 4px;
  padding: 9px 13px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.nx-msg.nx-system {
  align-self: center; font-size: 11px;
  color: #999; background: none; padding: 0;
}
.nx-msg .nx-sender { font-size: 10px; opacity: 0.65; margin-bottom: 3px; font-weight: 600; }
.nx-msg .nx-time { font-size: 10px; opacity: 0.55; margin-top: 3px; text-align: right; }

#nx-chat-input-area {
  display: flex; gap: 8px; padding: 12px;
  background: #fff; border-top: 1px solid #eee; flex-shrink: 0;
}
#nx-chat-input {
  flex: 1; border: 1px solid #ddd; border-radius: 20px;
  padding: 9px 14px; font-size: 14px; outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}
#nx-chat-input:focus { border-color: #007bff; }
#nx-chat-send {
  width: 38px; height: 38px; border-radius: 50%;
  background: #007bff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.15s;
}
#nx-chat-send:hover { background: #0056cc; }
#nx-chat-send svg { width: 18px; height: 18px; fill: #fff; }

#nx-chat-typing {
  align-self: flex-start; font-size: 12px;
  color: #999; padding: 4px 0; display: none;
}
#nx-chat-typing.nx-visible { display: block; }

#nx-prechat-form {
  position: absolute; inset: 0; z-index: 10;
  background: #fff; display: flex; flex-direction: column;
  justify-content: center; padding: 28px 24px; gap: 14px;
}
#nx-prechat-form h4 { margin: 0 0 4px; font-size: 16px; color: #222; }
#nx-prechat-form p { margin: 0; font-size: 13px; color: #777; }
#nx-prechat-form input {
  border: 1px solid #ddd; border-radius: 8px;
  padding: 10px 12px; font-size: 14px; outline: none;
  font-family: inherit; width: 100%; box-sizing: border-box;
  transition: border-color 0.15s;
}
#nx-prechat-form input:focus { border-color: #007bff; }
#nx-prechat-form button {
  padding: 11px; border: none; border-radius: 8px;
  background: #007bff; color: #fff; font-size: 14px;
  font-weight: 600; cursor: pointer; transition: background 0.15s;
}
#nx-prechat-form button:hover { background: #0056cc; }

@media (max-width: 420px) {
  #nx-chat-window { width: calc(100vw - 16px); right: 8px; bottom: 80px; }
}
`;

export class WidgetUI {
  private bubble!: HTMLElement;
  private window!: HTMLElement;
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private headerTitle!: HTMLElement;
  private headerSub!: HTMLElement;
  private typingEl!: HTMLElement;
  private preChatFormEl!: HTMLElement;
  private isOpen = false;
  private primaryColor = "#007bff";

  onSend: (text: string) => void = () => {};
  onOpen: () => void = () => {};

  mount(): void {
    this.injectStyles();
    this.bubble = this.createBubble();
    this.window = this.createWindow();
    document.body.appendChild(this.bubble);
    document.body.appendChild(this.window);

    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.submitInput();
      }
    });
  }

  setColor(color: string): void {
    this.primaryColor = color;
    this.bubble.style.background = color;
    (
      this.window.querySelector("#nx-chat-header") as HTMLElement
    ).style.background = color;
    (
      this.window.querySelector("#nx-chat-send") as HTMLElement
    ).style.background = color;
    (
      document.querySelectorAll(".nx-msg.nx-visitor") as NodeListOf<HTMLElement>
    ).forEach((el) => (el.style.background = color));
  }

  setHandlerName(name: string): void {
    this.headerTitle.textContent = name;
  }

  setStatus(text: string): void {
    this.headerSub.textContent = text;
  }

  addMessage(msg: ChatMessage): void {
    const el = document.createElement("div");
    el.className = `nx-msg nx-${msg.type}`;

    if (msg.type !== "visitor" && msg.type !== "system") {
      const sender = document.createElement("div");
      sender.className = "nx-sender";
      sender.textContent = msg.from.split("/")[1] || msg.from.split("@")[0];
      el.appendChild(sender);
    }

    const body = document.createElement("div");
    body.textContent = msg.body;
    el.appendChild(body);

    if (msg.type !== "system") {
      const time = document.createElement("div");
      time.className = "nx-time";
      time.textContent = msg.timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      el.appendChild(time);
    }

    this.messagesEl.appendChild(el);
    this.scrollBottom();

    if (msg.type === "visitor" && msg.body) {
      this.showTyping(true);
    }
  }

  showTyping(show: boolean): void {
    this.typingEl.classList.toggle("nx-visible", show);
    if (show) this.scrollBottom();
  }

  clearInput(): void {
    this.inputEl.value = "";
  }

  enableInput(enabled: boolean): void {
    this.inputEl.disabled = !enabled;
    (this.window.querySelector("#nx-chat-send") as HTMLButtonElement).disabled =
      !enabled;
  }

  open(): void {
    this.isOpen = true;
    this.window.classList.add("nx-open");
    this.inputEl.focus();
  }

  close(): void {
    this.isOpen = false;
    this.window.classList.remove("nx-open");
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
      this.onOpen();
    }
  }

  private submitInput(): void {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.clearInput();
    this.onSend(text);
  }

  private scrollBottom(): void {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private injectStyles(): void {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  private createBubble(): HTMLElement {
    const el = document.createElement("div");
    el.id = "nx-chat-bubble";
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Open live chat");
    el.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
    el.addEventListener("click", () => this.toggle());
    return el;
  }

  private createWindow(): HTMLElement {
    const win = document.createElement("div");
    win.id = "nx-chat-window";
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", "Live chat");

    const header = document.createElement("div");
    header.id = "nx-chat-header";
    header.style.background = this.primaryColor;

    const info = document.createElement("div");
    this.headerTitle = document.createElement("div");
    this.headerTitle.className = "nx-title";
    this.headerTitle.textContent = "Support";
    this.headerSub = document.createElement("div");
    this.headerSub.className = "nx-sub";
    this.headerSub.textContent = "● Connecting...";
    info.appendChild(this.headerTitle);
    info.appendChild(this.headerSub);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close chat");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => this.close());

    header.appendChild(info);
    header.appendChild(closeBtn);

    this.preChatFormEl = this.createPreChatForm();
    win.appendChild(this.preChatFormEl);

    this.messagesEl = document.createElement("div");
    this.messagesEl.id = "nx-chat-messages";

    this.typingEl = document.createElement("div");
    this.typingEl.id = "nx-chat-typing";
    this.typingEl.textContent = "Agent is typing...";
    this.messagesEl.appendChild(this.typingEl);

    const inputArea = document.createElement("div");
    inputArea.id = "nx-chat-input-area";

    this.inputEl = document.createElement("input");
    this.inputEl.id = "nx-chat-input";
    this.inputEl.type = "text";
    this.inputEl.placeholder = "Type a message...";
    this.inputEl.disabled = true;

    const sendBtn = document.createElement("button");
    sendBtn.id = "nx-chat-send";
    sendBtn.type = "button";
    sendBtn.setAttribute("aria-label", "Send");
    sendBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>`;
    sendBtn.style.background = this.primaryColor;
    sendBtn.addEventListener("click", () => this.submitInput());

    inputArea.appendChild(this.inputEl);
    inputArea.appendChild(sendBtn);

    win.appendChild(header);
    win.appendChild(this.messagesEl);
    win.appendChild(inputArea);

    return win;
  }

  private createPreChatForm(): HTMLElement {
    const form = document.createElement("div");
    form.id = "nx-prechat-form";
    form.style.display = "none";

    const title = document.createElement("h4");
    title.textContent = "Start a conversation";
    const sub = document.createElement("p");
    sub.textContent = "We'll reply as soon as possible.";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Your name";
    nameInput.id = "nx-prechat-name";

    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.placeholder = "Email address (optional)";
    emailInput.id = "nx-prechat-email";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Start Chat";
    btn.style.background = this.primaryColor;
    btn.addEventListener("click", () => {
      if (this._preChatSubmit) {
        this._preChatSubmit(nameInput.value.trim(), emailInput.value.trim());
      }
    });
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") emailInput.focus();
    });
    emailInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });

    form.appendChild(title);
    form.appendChild(sub);
    form.appendChild(nameInput);
    form.appendChild(emailInput);
    form.appendChild(btn);
    return form;
  }

  private _preChatSubmit: ((name: string, email: string) => void) | null = null;

  showPreChatForm(onSubmit: (name: string, email: string) => void): void {
    this._preChatSubmit = onSubmit;
    this.preChatFormEl.style.display = "flex";
    (document.getElementById("nx-prechat-name") as HTMLInputElement)?.focus();
  }

  hidePreChatForm(): void {
    this.preChatFormEl.style.display = "none";
  }
}
