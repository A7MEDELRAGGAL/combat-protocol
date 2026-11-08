function isEditableElement(target) {
  if (!target || typeof target !== "object") return false;
  const tag = String(target.tagName ?? "").toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(target.isContentEditable);
}

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.look = { x: 0, y: 0 };
    this.jumpQueued = false;
    this.locked = false;
    this.enabled = false;
    this.mobile = {
      moveX: 0,
      moveY: 0,
      lookX: 0,
      lookY: 0,
      fire: false,
      ads: false,
      crouch: false,
      sprint: false,
      jump: false,
      interact: false,
      ability: false,
      melee: false,
    };
    this.onKey = null;
    this.onLockChange = null;
    this.onWheel = null;

    this.handleKeyDown = (event) => {
      if (isEditableElement(event.target) || isEditableElement(document.activeElement)) {
        if (event.code === "Escape") {
          event.target?.blur?.();
          document.activeElement?.blur?.();
        }
        return;
      }
      if (["Space", "Tab", "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
      if (!this.enabled && event.code !== "Escape" && event.code !== "Tab" && event.code !== "KeyM") return;
      this.keys.add(event.code);
      if (event.code === "Space") this.jumpQueued = true;
      if (this.onKey) this.onKey(event.code, event);
    };
    this.handleKeyUp = (event) => {
      this.keys.delete(event.code);
    };
    this.handleMouseMove = (event) => {
      if (!this.locked || !this.enabled) return;
      this.look.x += event.movementX;
      this.look.y += event.movementY;
    };
    this.handleMouseDown = (event) => {
      if (!this.enabled || isEditableElement(event.target)) return;
      if (event.button === 0 || event.button === 2) this.keys.add(`Mouse${event.button}`);
    };
    this.handleMouseUp = (event) => {
      this.keys.delete(`Mouse${event.button}`);
    };
    this.handlePointerLock = () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (this.onLockChange) this.onLockChange(this.locked);
    };
    this.handleWheel = (event) => {
      if (!this.enabled || isEditableElement(event.target)) return;
      if (this.onWheel) this.onWheel(Math.sign(event.deltaY));
    };
    this.handleContextMenu = (event) => event.preventDefault();

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("pointerlockchange", this.handlePointerLock);
    window.addEventListener("wheel", this.handleWheel, { passive: true });
    canvas.addEventListener("contextmenu", this.handleContextMenu);
  }

  requestLock() {
    if (this.canvas.requestPointerLock) this.canvas.requestPointerLock();
  }

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.look.x = 0;
      this.look.y = 0;
      this.mobile.fire = false;
      this.mobile.interact = false;
    }
  }

  isDown(code) {
    if (code === "Mouse0") return this.keys.has("Mouse0") || this.mobile.fire;
    if (code === "Mouse2") return this.keys.has("Mouse2") || this.mobile.ads;
    if (code === "KeyE") return this.keys.has("KeyE") || this.mobile.interact;
    if (code === "ShiftLeft") return this.keys.has("ShiftLeft") || this.mobile.sprint;
    if (code === "KeyC") return this.keys.has("KeyC") || this.mobile.crouch;
    return this.keys.has(code);
  }

  consumeLook() {
    const result = { x: this.look.x + this.mobile.lookX, y: this.look.y + this.mobile.lookY };
    this.look.x = 0;
    this.look.y = 0;
    this.mobile.lookX = 0;
    this.mobile.lookY = 0;
    return result;
  }

  getMoveAxes() {
    let forward = 0;
    let strafe = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) forward += 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) forward -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) strafe += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) strafe -= 1;
    forward += this.mobile.moveY;
    strafe += this.mobile.moveX;
    if (forward > 1) forward = 1;
    if (forward < -1) forward = -1;
    if (strafe > 1) strafe = 1;
    if (strafe < -1) strafe = -1;
    return { forward, strafe };
  }

  consumeJump() {
    if (this.jumpQueued || this.mobile.jump) {
      this.jumpQueued = false;
      this.mobile.jump = false;
      return true;
    }
    return false;
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("pointerlockchange", this.handlePointerLock);
    window.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("contextmenu", this.handleContextMenu);
  }
}
