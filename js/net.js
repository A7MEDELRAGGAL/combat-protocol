/** Small WebSocket client for the room protocol. */
export class MultiplayerClient {
  constructor({ name, room, onEvent, onStatus, url = null }) {
    this.name = name;
    this.room = room;
    this.onEvent = onEvent;
    this.onStatus = onStatus;
    this.url = url;
    this.socket = null;
    this.selfId = null;
    this.closedByUser = false;
    this.reconnectTimer = null;
  }

  connect(extra = {}) {
    this.closedByUser = false;
    this.joinExtra = extra;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const target = this.url ?? `${protocol}//${window.location.host}/ws`;
    const url = `${target}?room=${encodeURIComponent(this.room)}`;
    this.onStatus?.({ state: "connecting" });
    try {
      this.socket = new WebSocket(url);
    } catch (error) {
      this.onStatus?.({ state: "offline", message: error?.message ?? "WebSocket unavailable" });
      return;
    }
    this.socket.addEventListener("open", () => {
      this.socket.send(JSON.stringify({
        type: "join",
        name: this.name,
        operator: this.joinExtra?.operator ?? "vanguard",
        skin: this.joinExtra?.skin ?? "standard",
      }));
    });
    this.socket.addEventListener("message", (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type === "welcome") {
        this.selfId = message.selfId;
        this.onStatus?.({ state: "online", room: message.room, selfId: this.selfId });
      }
      this.onEvent?.(message);
    });
    this.socket.addEventListener("close", () => {
      this.selfId = null;
      this.onStatus?.({ state: "offline" });
      if (!this.closedByUser) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 2500);
      }
    });
    this.socket.addEventListener("error", () => {
      this.onStatus?.({ state: "error", message: "تعذر الاتصال بخادم اللعب الجماعي" });
    });
  }

  sendState(state) {
    if (this.socket?.readyState !== WebSocket.OPEN || !this.selfId) return;
    this.socket.send(JSON.stringify({ type: "state", ...state }));
  }

  sendShot({ origin, direction, damage }) {
    if (this.socket?.readyState !== WebSocket.OPEN || !this.selfId) return;
    this.socket.send(JSON.stringify({ type: "shot", origin, direction, damage }));
  }

  sendChat(text) {
    if (this.socket?.readyState !== WebSocket.OPEN || !this.selfId) return;
    this.socket.send(JSON.stringify({ type: "chat", text }));
  }

  disconnect() {
    this.closedByUser = true;
    clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
    this.selfId = null;
  }
}
