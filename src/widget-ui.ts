import { ChatMessage } from "./types";

const CSS = `
#nx-chat-bubble {
  position: fixed; bottom: 24px; right: 24px; z-index: 99999;
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;
  user-select: none;
  animation: nx-pulse 2s infinite;
}
@keyframes nx-pulse {
  0%, 100% { box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 8px 32px rgba(102, 126, 234, 0.6); }
}
#nx-chat-bubble:hover { transform: scale(1.1); box-shadow: 0 12px 36px rgba(102, 126, 234, 0.5); }
#nx-chat-bubble svg { width: 30px; height: 30px; fill: #fff; }

#nx-chat-window {
  position: fixed; bottom: 100px; right: 24px; z-index: 99998;
  width: 400px; height: 580px;
  border-radius: 20px; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  display: flex; flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px; background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
  transform: scale(0.9) translateY(20px); opacity: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,0.8);
}
#nx-chat-window.nx-open {
  transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
}

#nx-chat-header {
  padding: 16px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
#nx-chat-header::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: nx-shimmer 3s infinite;
}
@keyframes nx-shimmer {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
#nx-chat-header .nx-info {
  display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; flex: 1;
}
#nx-chat-header .nx-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
}
#nx-chat-header .nx-avatar img {
  width: 100%; height: 100%; object-fit: cover;
}
#nx-chat-header .nx-avatar .nx-avatar-placeholder {
  font-size: 18px; font-weight: 600;
}
#nx-chat-header .nx-title { font-weight: 700; font-size: 16px; }
#nx-chat-header .nx-sub { font-size: 12px; opacity: 0.9; margin-top: 2px; }
#nx-chat-header button {
  background: rgba(255,255,255,0.2); border: none; color: #fff; cursor: pointer;
  font-size: 20px; line-height: 1; padding: 8px; border-radius: 50%;
  transition: background 0.2s, transform 0.2s;
  position: relative; z-index: 1; flex-shrink: 0;
}
#nx-chat-header button:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg); }

#nx-chat-messages {
  flex: 1; overflow-y: auto; padding: 20px; display: flex;
  flex-direction: column; gap: 14px; background: transparent;
  scroll-behavior: smooth;
}
#nx-chat-messages::-webkit-scrollbar { width: 6px; }
#nx-chat-messages::-webkit-scrollbar-track { background: transparent; }
#nx-chat-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
.nx-msg { max-width: 80%; line-height: 1.5; animation: nx-fadeIn 0.3s ease-out; }
@keyframes nx-fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.nx-msg.nx-visitor {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 20px 20px 6px 20px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.nx-msg.nx-agent, .nx-msg.nx-bot {
  align-self: flex-start;
  background: #fff; color: #1a1a2e;
  border-radius: 20px 20px 20px 6px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
}
.nx-msg.nx-system {
  align-self: center; font-size: 12px;
  color: #888; background: rgba(0,0,0,0.03); padding: 6px 12px;
  border-radius: 12px;
}
.nx-msg .nx-sender { font-size: 11px; opacity: 0.7; margin-bottom: 4px; font-weight: 600; }
.nx-msg .nx-time { font-size: 10px; opacity: 0.5; margin-top: 4px; text-align: right; }

#nx-chat-input-area {
  display: flex; flex-direction: column; gap: 8px; padding: 16px 20px;
  background: #fff; border-top: 1px solid rgba(0,0,0,0.06); flex-shrink: 0;
}
#nx-chat-input {
  flex: 1; border: 2px solid #e8e8f0; border-radius: 24px;
  padding: 12px 18px; font-size: 14px; outline: none;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #f8f9ff;
}
#nx-chat-input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); background: #fff; }
#nx-chat-send {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
#nx-chat-send:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }
#nx-chat-send svg { width: 20px; height: 20px; fill: #fff; }

#nx-chat-typing {
  align-self: flex-start; font-size: 12px;
  color: #888; padding: 8px 0; display: none;
  animation: nx-fadeIn 0.3s ease-out;
}
#nx-chat-typing.nx-visible { display: block; }
#nx-chat-typing::before {
  content: '';
  display: inline-block;
  width: 8px; height: 8px;
  background: #667eea;
  border-radius: 50%;
  margin-right: 8px;
  animation: nx-bounce 1s infinite;
}
@keyframes nx-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

#nx-ai-suggestions {
  display: flex; gap: 8px; flex-wrap: nowrap;
  padding: 0 20px 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
#nx-ai-suggestions::-webkit-scrollbar { height: 4px; }
#nx-ai-suggestions::-webkit-scrollbar-track { background: transparent; }
#nx-ai-suggestions::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
.nx-suggestion {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 12px;
  color: #667eea;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
  scroll-snap-align: start;
}
.nx-suggestion:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

#nx-prechat-form {
  position: absolute; inset: 0; z-index: 10;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
  display: none; flex-direction: column;
  justify-content: center; padding: 32px 28px; gap: 16px;
}
#nx-prechat-form.nx-visible { display: flex; }
#nx-prechat-form h4 { margin: 0 0 6px; font-size: 18px; color: #1a1a2e; font-weight: 700; }
#nx-prechat-form p { margin: 0; font-size: 13px; color: #666; }
#nx-prechat-form input {
  border: 2px solid #e8e8f0; border-radius: 12px;
  padding: 12px 16px; font-size: 14px; outline: none;
  font-family: inherit; width: 100%; box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #f8f9ff;
}
#nx-prechat-form input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); background: #fff; }
#nx-prechat-form button {
  padding: 14px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff; font-size: 15px;
  font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
#nx-prechat-form button:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }

@media (max-width: 420px) {
  #nx-chat-window { width: calc(100vw - 20px); right: 10px; bottom: 90px; height: 60vh; }
  #nx-chat-bubble { bottom: 20px; right: 20px; }
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
  private aiSuggestionsEl!: HTMLElement;
  private isOpen = false;
  private primaryColor = "#007bff";

  onSend: (text: string) => void = () => {};
  onOpen: () => void = () => {};
  onSuggestionClick: (text: string) => void = () => {};

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

  setHandlerAvatar(avatarUrl: string): void {
    const avatarEl = document.getElementById("nx-header-avatar");
    if (!avatarEl) return;

    if (avatarUrl) {
      avatarEl.innerHTML = `<img src="${avatarUrl}" alt="Avatar" />`;
    } else {
      avatarEl.innerHTML = `<div class="nx-avatar-placeholder">🤖</div>`;
    }
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
      // Auto-hide typing indicator after 10 seconds if no response
      setTimeout(() => this.showTyping(false), 10000);
    }

    // Hide typing indicator when agent/bot responds
    if (msg.type === "agent" || msg.type === "bot") {
      this.showTyping(false);
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
    info.className = "nx-info";

    const avatar = document.createElement("div");
    avatar.className = "nx-avatar";
    avatar.id = "nx-header-avatar";
    const avatarPlaceholder = document.createElement("div");
    avatarPlaceholder.className = "nx-avatar-placeholder";
    avatarPlaceholder.textContent = "🤖";
    avatar.appendChild(avatarPlaceholder);

    const textInfo = document.createElement("div");
    this.headerTitle = document.createElement("div");
    this.headerTitle.className = "nx-title";
    this.headerTitle.textContent = "Support";
    this.headerSub = document.createElement("div");
    this.headerSub.className = "nx-sub";
    this.headerSub.textContent = "● Connecting...";
    textInfo.appendChild(this.headerTitle);
    textInfo.appendChild(this.headerSub);

    info.appendChild(avatar);
    info.appendChild(textInfo);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close chat");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    });

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

    this.aiSuggestionsEl = document.createElement("div");
    this.aiSuggestionsEl.id = "nx-ai-suggestions";

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
    sendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.submitInput();
    });

    inputArea.appendChild(this.aiSuggestionsEl);
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

    // Prevent any form submission
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

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
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this._preChatSubmit) {
        this._preChatSubmit(nameInput.value.trim(), emailInput.value.trim());
      }
    });
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        emailInput.focus();
      }
    });
    emailInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        btn.click();
      }
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
    this.preChatFormEl.classList.add("nx-visible");
    (document.getElementById("nx-prechat-name") as HTMLInputElement)?.focus();
  }

  hidePreChatForm(): void {
    this.preChatFormEl.classList.remove("nx-visible");
  }

  showAISuggestions(suggestions: string[]): void {
    this.aiSuggestionsEl.innerHTML = "";
    suggestions.forEach((suggestion) => {
      const btn = document.createElement("button");
      btn.className = "nx-suggestion";
      btn.textContent = suggestion;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onSuggestionClick(suggestion);
      });
      this.aiSuggestionsEl.appendChild(btn);
    });
  }

  hideAISuggestions(): void {
    this.aiSuggestionsEl.innerHTML = "";
  }
}
