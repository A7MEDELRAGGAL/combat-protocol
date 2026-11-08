import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import {
  addPlayer,
  applyShot,
  createRoom,
  publicPlayer,
  removePlayer,
  sanitizeName,
  sanitizeRoom,
  snapshot,
  tickRoom,
  updatePlayer,
} from "./js/multiplayer-room.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const MAX_FRAME = 128 * 1024;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
};

const rooms = new Map();
const clients = new Set();

function roomFor(id) {
  const roomId = sanitizeRoom(id);
  if (!rooms.has(roomId)) rooms.set(roomId, createRoom(roomId));
  return rooms.get(roomId);
}

function roomClients(roomId) {
  return [...clients].filter((client) => client.roomId === roomId && client.player);
}

function broadcast(roomId, message) {
  const payload = JSON.stringify(message);
  for (const client of roomClients(roomId)) client.sendText(payload);
}

function roster(room) {
  return [...room.players.values()].map(publicPlayer);
}

function broadcastRoster(room) {
  broadcast(room.id, { type: "roster", players: roster(room) });
}

class WebSocketClient {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.closed = false;
    this.player = null;
    this.roomId = null;
    this.onmessage = null;
    this.onclose = null;
    socket.on("data", (chunk) => this.receive(chunk));
    socket.on("close", () => this.finish());
    socket.on("error", () => this.finish());
  }

  receive(chunk) {
    if (this.closed) return;
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        const high = this.buffer.readUInt32BE(2);
        const low = this.buffer.readUInt32BE(6);
        length = high * 2 ** 32 + low;
        offset = 10;
      }
      if (length > MAX_FRAME) {
        this.close(1009, "frame too large");
        return;
      }
      const maskOffset = offset;
      if (masked) offset += 4;
      if (this.buffer.length < offset + length) return;
      const payload = Buffer.from(this.buffer.subarray(offset, offset + length));
      if (masked) {
        const mask = this.buffer.subarray(maskOffset, maskOffset + 4);
        for (let index = 0; index < payload.length; index += 1) payload[index] ^= mask[index % 4];
      }
      this.buffer = this.buffer.subarray(offset + length);
      if (opcode === 0x8) {
        this.close(1000, "bye");
        return;
      }
      if (opcode === 0x9) {
        this.sendFrame(0xa, payload);
        continue;
      }
      if (opcode === 0xa) continue;
      if (opcode !== 0x1 && opcode !== 0x0) continue;
      if (this.onmessage) this.onmessage(payload.toString("utf8"));
    }
  }

  sendFrame(opcode, payload) {
    if (this.closed || this.socket.destroyed) return;
    const length = payload.length;
    let header;
    if (length < 126) {
      header = Buffer.from([0x80 | opcode, length]);
    } else if (length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 127;
      header.writeUInt32BE(0, 2);
      header.writeUInt32BE(length, 6);
    }
    this.socket.write(Buffer.concat([header, payload]));
  }

  sendText(text) {
    this.sendFrame(0x1, Buffer.from(text));
  }

  close(code = 1000, reason = "") {
    if (this.closed) return;
    const payload = Buffer.alloc(2 + Buffer.byteLength(reason));
    payload.writeUInt16BE(code, 0);
    payload.write(reason, 2);
    this.sendFrame(0x8, payload);
    this.finish();
    this.socket.destroy();
  }

  finish() {
    if (this.closed) return;
    this.closed = true;
    clients.delete(this);
    if (this.roomId && this.player) {
      const room = rooms.get(this.roomId);
      if (room) {
        removePlayer(room, this.player.id);
        broadcast(this.roomId, { type: "leave", id: this.player.id });
        broadcastRoster(room);
        if (room.players.size === 0) rooms.delete(room.id);
      }
    }
    if (this.onclose) this.onclose();
  }
}

function acceptWebSocket(req, socket, head) {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return null;
  }
  const accept = createHash("sha1").update(key + WS_GUID).digest("base64");
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );
  if (head?.length) socket.unshift(head);
  return new WebSocketClient(socket);
}

function handleMessage(client, raw) {
  if (!raw || raw.length > MAX_FRAME) return;
  let message;
  try {
    message = JSON.parse(raw);
  } catch {
    return;
  }
  if (!message || typeof message.type !== "string") return;
  if (message.type === "join") {
    if (client.player) return;
    const room = roomFor(client.roomId);
    const player = addPlayer(room, {
      id: client.id,
      name: sanitizeName(message.name),
      color: typeof message.color === "string" ? message.color.slice(0, 16) : "#d8a35a",
      operator: typeof message.operator === "string" ? message.operator.slice(0, 16) : "vanguard",
      skin: typeof message.skin === "string" ? message.skin.slice(0, 16) : "standard",
    });
    if (!player) {
      client.close(1013, "room full");
      return;
    }
    client.player = player;
    client.sendText(
      JSON.stringify({
        type: "welcome",
        selfId: player.id,
        room: room.id,
        players: snapshot(room),
      }),
    );
    broadcast(room.id, { type: "join", player: publicPlayer(player) });
    broadcastRoster(room);
    return;
  }
  if (!client.player) return;
  const room = rooms.get(client.roomId);
  if (!room) return;
  if (message.type === "state") {
    updatePlayer(room, client.player.id, message);
    return;
  }
  if (message.type === "shot") {
    const result = applyShot(room, client.player.id, message.origin, message.direction, message.damage, Date.now(), room.obstacles);
    if (process.env.MP_DEBUG) {
      console.log("shot", client.player.name, JSON.stringify(message.origin), JSON.stringify(message.direction), JSON.stringify(result), JSON.stringify(snapshot(room)));
    }
    broadcast(room.id, {
      type: "shot",
      id: client.player.id,
      origin: message.origin,
      direction: message.direction,
      weapon: client.player.weapon,
    });
    if (result.hit) {
      broadcast(room.id, {
        type: "hit",
        targetId: result.targetId,
        shooterId: result.shooterId,
        health: result.health,
        damage: result.damage,
      });
      if (result.killed) {
        broadcast(room.id, {
          type: "kill",
          targetId: result.targetId,
          shooterId: result.shooterId,
          targetName: room.players.get(result.targetId)?.name ?? "Player",
          shooterName: room.players.get(result.shooterId)?.name ?? "Player",
        });
      }
    }
    return;
  }
  if (message.type === "chat") {
    const text = String(message.text ?? "").replace(/[\r\n]/g, " ").trim().slice(0, 120);
    if (!text) return;
    broadcast(room.id, {
      type: "chat",
      id: client.player.id,
      name: client.player.name,
      text,
    });
  }
}

setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    const respawns = tickRoom(room, now);
    for (const respawn of respawns) {
      broadcast(room.id, { type: "respawn", id: respawn.id });
    }
    broadcast(room.id, { type: "snapshot", players: snapshot(room) });
  }
}, 66);

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", app: "Combat Protocol", version: "2.0.0", multiplayer: true }));
    return;
  }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = normalize(join(root, pathname));
  if (!filePath.startsWith(root + sep)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
    const data = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname !== "/ws") {
    socket.destroy();
    return;
  }
  const client = acceptWebSocket(req, socket, head);
  if (!client) return;
  client.id = randomUUID();
  client.roomId = sanitizeRoom(url.searchParams.get("room"));
  clients.add(client);
  client.onmessage = (raw) => handleMessage(client, raw);
});

server.listen(port, host, () => {
  console.log(`Combat Protocol running at http://${host}:${port}`);
  console.log(`Multiplayer WebSocket: ws://${host}:${port}/ws`);
  console.log(`Serving ${root}`);
});
