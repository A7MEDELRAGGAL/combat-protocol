import { spawn } from "node:child_process";

const PORT = 4191;
const BASE = `http://127.0.0.1:${PORT}`;
const server = spawn(process.execPath, ["server.mjs"], { env: { ...process.env, PORT: String(PORT) }, stdio: ["ignore", "pipe", "pipe"] });
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    if ((await fetch(`${BASE}/health`)).ok) break;
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 150));
}

function openClient(name) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${PORT}/ws?room=test`);
    const messages = [];
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      messages.push(data);
      if (data.type === "welcome") resolve({ socket, messages, id: data.selfId });
    });
    socket.addEventListener("error", reject);
    socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "join", name })));
    setTimeout(() => reject(new Error("welcome timeout")), 5000);
  });
}

const waitFor = (messages, predicate, timeout = 5000) => new Promise((resolve, reject) => {
  const start = Date.now();
  const timer = setInterval(() => {
    const found = messages.find(predicate);
    if (found) {
      clearInterval(timer);
      resolve(found);
    } else if (Date.now() - start > timeout) {
      clearInterval(timer);
      reject(new Error("message timeout"));
    }
  }, 30);
});

try {
  const one = await openClient("One");
  const two = await openClient("Two");
  one.socket.send(JSON.stringify({ type: "state", x: 0, y: 0, z: 0, yaw: 0, pitch: 0, weapon: "ar4" }));
  two.socket.send(JSON.stringify({ type: "state", x: 0, y: 0, z: 6, yaw: Math.PI, pitch: 0, weapon: "ar4" }));
  await new Promise((resolve) => setTimeout(resolve, 200));
  one.socket.send(JSON.stringify({ type: "shot", origin: { x: 0, y: 1, z: 0 }, direction: { x: 0, y: 0, z: 1 }, damage: 20 }));
  const hit = await waitFor(one.messages, (message) => message.type === "hit");
  const snapshotMessage = await waitFor(one.messages, (message) => message.type === "snapshot" && message.players.length === 2);
  const roster = await waitFor(two.messages, (message) => message.type === "roster" && message.players.length === 2);
  console.log(JSON.stringify({
    players: snapshotMessage.players.map((player) => ({ name: player.name, health: player.health })),
    hit,
    roster: roster.players.map((player) => player.name),
  }));
  one.socket.close();
  two.socket.close();
} finally {
  server.kill();
}
