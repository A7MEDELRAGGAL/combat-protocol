import { clamp } from "./utils.js";

export class AudioEngine {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.context = null;
    this.master = null;
    this.noiseBuffer = null;
    this.ambient = null;
    this.reloadTimers = [];
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.master) this.master.gain.value = enabled ? 0.5 : 0;
    if (!enabled) {
      this.cancelReload();
      this.stopAmbient();
    }
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer(1.4);
    }
    if (this.context.state === "suspended") this.context.resume();
    return this.context;
  }

  createNoiseBuffer(seconds) {
    const context = this.context;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  spatialBus(origin = null, listenerPos = null, listenerYaw = 0, maxDistance = 58) {
    const context = this.ensure();
    if (!context) return null;
    if (!origin || !listenerPos) {
      return { target: this.master, scale: 1, muffle: 1 };
    }
    const dx = (origin.x ?? 0) - (listenerPos.x ?? 0);
    const dz = (origin.z ?? 0) - (listenerPos.z ?? 0);
    const distance = Math.hypot(dx, dz);
    const scale = Math.pow(clamp(1 - distance / maxDistance, 0.08, 1), 1.35);
    const muffle = clamp(1 - distance / (maxDistance * 1.25), 0.35, 1);
    const rightX = Math.cos(listenerYaw || 0);
    const rightZ = -Math.sin(listenerYaw || 0);
    const panValue = distance > 0.25 ? clamp((dx * rightX + dz * rightZ) / distance, -0.92, 0.92) : 0;

    if (typeof context.createStereoPanner === "function") {
      const panner = context.createStereoPanner();
      panner.pan.setValueAtTime(panValue, context.currentTime);
      panner.connect(this.master);
      return { target: panner, scale, muffle };
    }
    return { target: this.master, scale, muffle };
  }

  noise(duration, filterFrequency, gainValue, type = "bandpass", destination = null) {
    const context = this.ensure();
    if (!context) return;
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = Math.max(40, filterFrequency);
    filter.Q.value = 0.85;
    const gain = context.createGain();
    const now = context.currentTime;
    gain.gain.setValueAtTime(Math.max(0.0002, gainValue), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(destination ?? this.master);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  tone(frequency, duration, type = "sine", gainValue = 0.08, slideTo = null, destination = null) {
    const context = this.ensure();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), now);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    gain.gain.setValueAtTime(Math.max(0.0002, gainValue), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(destination ?? this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  shot(id, suppressed = false) {
    if (!this.enabled) return;
    const profiles = {
      ar4: [0.14, 1200, 0.16, 110],
      smg9: [0.09, 1700, 0.12, 150],
      dmr7: [0.24, 800, 0.22, 75],
      p12: [0.11, 1400, 0.13, 130],
      sr9: [0.32, 620, 0.28, 52],
      lmg6: [0.16, 980, 0.17, 95],
      sg12: [0.28, 540, 0.25, 62],
      br7: [0.2, 900, 0.21, 82],
      vpr5: [0.075, 1850, 0.1, 170],
    };
    const [duration, frequency, gain, low] = profiles[id] ?? profiles.ar4;
    if (suppressed) {
      this.noise(duration * 0.65, frequency * 0.52, gain * 0.45, "lowpass");
      this.tone(low * 1.25, duration * 0.55, "sine", gain * 0.28, 60);
      return;
    }
    this.noise(duration, frequency, gain);
    this.tone(low, duration * 0.9, "triangle", gain * 0.42, 45);
  }

  enemyShot(origin = null, listenerPos = null, listenerYaw = 0, weaponId = "ar4") {
    if (!this.enabled) return;
    const bus = this.spatialBus(origin, listenerPos, listenerYaw, 56);
    if (!bus) return;
    const freqBase = weaponId === "sr9" ? 680 : weaponId === "sg12" ? 600 : weaponId === "smg9" ? 1350 : 1020;
    this.noise(0.11, freqBase * bus.muffle, 0.085 * bus.scale, "bandpass", bus.target);
    this.tone(92, 0.085, "square", 0.04 * bus.scale, 52, bus.target);
  }

  explosion(origin = null, listenerPos = null, listenerYaw = 0) {
    if (!this.enabled) return;
    const bus = this.spatialBus(origin, listenerPos, listenerYaw, 72);
    if (!bus) return;
    this.noise(0.58, 280 * bus.muffle, 0.34 * bus.scale, "lowpass", bus.target);
    this.noise(0.24, 1150 * bus.muffle, 0.16 * bus.scale, "bandpass", bus.target);
    this.tone(88, 0.48, "sawtooth", 0.24 * bus.scale, 24, bus.target);
    this.tone(54, 0.55, "sine", 0.28 * bus.scale, 20, bus.target);
  }

  cancelReload() {
    for (const timer of this.reloadTimers) clearTimeout(timer);
    this.reloadTimers = [];
  }

  reload(durationSeconds = 2.0) {
    if (!this.enabled) return;
    this.cancelReload();
    this.tone(520, 0.04, "square", 0.04);
    const midMs = Math.max(140, Math.round(durationSeconds * 320));
    const lockMs = Math.max(320, Math.round(durationSeconds * 740));
    this.reloadTimers.push(setTimeout(() => this.tone(360, 0.05, "square", 0.035), midMs));
    this.reloadTimers.push(setTimeout(() => this.tone(720, 0.035, "square", 0.034), lockMs));
  }

  empty() {
    if (!this.enabled) return;
    this.tone(240, 0.035, "square", 0.04);
  }

  hit(headshot = false) {
    if (!this.enabled) return;
    this.tone(headshot ? 1540 : 1050, 0.055, "sine", 0.065, headshot ? 1860 : 1220);
  }

  impact() {
    if (!this.enabled) return;
    this.noise(0.06, 2400, 0.05, "highpass");
  }

  hurt() {
    if (!this.enabled) return;
    this.tone(125, 0.16, "sawtooth", 0.075, 55);
    this.noise(0.11, 320, 0.055, "lowpass");
  }

  enemyDown() {
    if (!this.enabled) return;
    this.tone(440, 0.12, "triangle", 0.055, 185);
  }

  footstep(sprint = false) {
    if (!this.enabled) return;
    this.noise(sprint ? 0.07 : 0.06, sprint ? 520 : 380, sprint ? 0.035 : 0.024, "lowpass");
  }

  slide() {
    if (!this.enabled) return;
    this.noise(0.28, 640, 0.065, "bandpass");
    this.tone(160, 0.2, "triangle", 0.03, 75);
  }

  land() {
    if (!this.enabled) return;
    this.noise(0.09, 260, 0.055, "lowpass");
    this.tone(82, 0.08, "sine", 0.045, 42);
  }

  melee() {
    if (!this.enabled) return;
    this.noise(0.09, 1650, 0.08, "bandpass");
    this.tone(280, 0.08, "triangle", 0.05, 110);
  }

  pickup() {
    if (!this.enabled) return;
    this.tone(660, 0.05, "sine", 0.045, 880);
    setTimeout(() => this.tone(990, 0.06, "sine", 0.04, 1180), 55);
  }

  ability(abilityId = "breach-charge") {
    if (!this.enabled) return;
    if (abilityId === "recon-pulse") {
      this.tone(540, 0.22, "sine", 0.06, 1280);
      this.noise(0.16, 1800, 0.035, "bandpass");
    } else if (abilityId === "combat-stim") {
      this.tone(460, 0.14, "triangle", 0.055, 920);
      this.noise(0.12, 2200, 0.03, "highpass");
    } else if (abilityId === "aegis-barrier") {
      this.tone(190, 0.18, "sawtooth", 0.055, 380);
      this.noise(0.14, 720, 0.045, "lowpass");
    } else {
      this.tone(320, 0.1, "square", 0.05, 520);
    }
  }

  radioBeep() {
    if (!this.enabled) return;
    this.tone(1180, 0.045, "sine", 0.03);
    setTimeout(() => this.tone(1420, 0.04, "sine", 0.026), 60);
  }

  ui() {
    if (!this.enabled) return;
    this.tone(620, 0.035, "sine", 0.03);
  }

  startAmbient() {
    if (!this.enabled || this.ambient) return;
    const context = this.ensure();
    if (!context) return;
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;
    const gain = context.createGain();
    gain.gain.value = 0.018;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    this.ambient = { source, gain };
  }

  stopAmbient() {
    if (!this.ambient) return;
    try {
      this.ambient.source.stop();
    } catch {
      // already stopped
    }
    this.ambient = null;
  }
}
