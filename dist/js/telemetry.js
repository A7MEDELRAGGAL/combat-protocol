const SCHEMA_VERSION = 1;

function createId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

function boundedPayload(payload) {
  if (!payload || typeof payload !== "object") return {};
  return Object.fromEntries(
    Object.entries(payload)
      .slice(0, 16)
      .map(([key, value]) => {
        if (typeof value === "number") return [key, Number.isFinite(value) ? value : 0];
        if (typeof value === "boolean" || typeof value === "string" || value === null) return [key, value];
        return [key, String(value)];
      }),
  );
}

export class Telemetry {
  constructor({ enabled = true, maxEvents = 500, clock = () => performance.now() } = {}) {
    this.enabled = enabled;
    this.maxEvents = Math.max(1, maxEvents);
    this.clock = clock;
    this.sessionId = createId("session");
    this.matchId = null;
    this.sequence = 0;
    this.lastTimestamp = 0;
    this.events = [];
  }

  emit(name, payload = {}) {
    if (!this.enabled) return null;
    const timestamp = Math.max(this.lastTimestamp, Number(this.clock()) || 0);
    this.lastTimestamp = timestamp;
    const event = {
      schemaVersion: SCHEMA_VERSION,
      sequence: ++this.sequence,
      sessionId: this.sessionId,
      matchId: this.matchId,
      name,
      timestamp,
      payload: boundedPayload(payload),
    };
    this.events.push(event);
    if (this.events.length > this.maxEvents) this.events.splice(0, this.events.length - this.maxEvents);
    return event;
  }

  startMatch(modeId, payload = {}) {
    this.matchId = createId("match");
    this.emit("match_started", { modeId, ...payload });
    return this.matchId;
  }

  endMatch(reason, payload = {}) {
    if (!this.matchId) return null;
    const matchId = this.matchId;
    this.emit("match_ended", { reason, ...payload });
    this.matchId = null;
    return matchId;
  }

  clear() {
    this.events.length = 0;
  }
}

export function createTelemetry(options) {
  return new Telemetry(options);
}
