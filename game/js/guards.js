// The Midnight Vault — the guards: named people with routes, habits and
// states, plus the sweeping cameras. A guard walks its patrol, pauses,
// investigates noises, and hunts when the alarm meter fills.
'use strict';

// MV itself is declared once, in config.js — every file shares that object.

MV.Guard = class {
  constructor(def, startAt) {
    this.def = def;
    this.name = def.name;
    const [sx, sy] = startAt || def.route[0];
    this.x = sx;
    this.y = sy;
    this.r = 13;
    this.angle = 0;
    this.wp = 1 % def.route.length;
    this.mode = 'patrol'; // patrol, pause, phone, investigate, look, chase
    this.pauseT = 0;
    this.lookT = 0;
    this.target = null; // point of interest for investigate and chase
    this.seesPlayer = false;
    this.phoneT = 6 + Math.random() * 8; // Sari's habit runs on its own clock
    this.quip = null; // the line currently in this guard's speech bubble
    this.quipT = 5 + Math.random() * 8; // time until the next quip
    this.quipShow = 0; // time left with the bubble up
    this.sidestepT = 0;
    this.lastX = sx;
    this.lastY = sy;
    this.stuckT = 0;
  }

  get speed() {
    return this.mode === 'chase' ? this.def.speed * 1.55 : this.def.speed;
  }

  coneRange(dark) {
    return dark ? MV.CONE_RANGE_DARK : MV.CONE_RANGE;
  }

  coneHalf(dark) {
    return dark ? MV.CONE_HALF_DARK : MV.CONE_HALF;
  }

  // Walk toward a point, sliding around furniture. Returns true on arrival.
  walkTo(tx, ty, dt, solids) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 7) return true;
    let hx = dx / d;
    let hy = dy / d;
    if (this.sidestepT > 0) {
      this.sidestepT -= dt;
      const c = Math.cos(0.95);
      const s = Math.sin(0.95);
      const rx = hx * c - hy * s;
      const ry = hx * s + hy * c;
      hx = rx;
      hy = ry;
    }
    const step = Math.min(d, this.speed * dt);
    const [nx, ny] = MV.Geo.slideCircle(this.x + hx * step, this.y + hy * step, this.r, solids);
    this.x = nx;
    this.y = ny;
    const want = Math.atan2(hy, hx);
    let diff = want - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.angle += MV.Geo.clamp(diff, -7 * dt, 7 * dt);
    // Stuck against a corner? Sidestep for a moment.
    const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    if (moved < this.speed * dt * 0.25) {
      this.stuckT += dt;
      if (this.stuckT > 0.45) {
        this.sidestepT = 0.35;
        this.stuckT = 0;
      }
    } else {
      this.stuckT = 0;
    }
    this.lastX = this.x;
    this.lastY = this.y;
    return false;
  }

  investigate(x, y) {
    if (this.mode === 'chase') return;
    this.mode = 'investigate';
    this.target = { x, y };
  }

  update(dt, solids, player) {
    switch (this.mode) {
      case 'patrol': {
        const [tx, ty] = this.def.route[this.wp];
        if (this.walkTo(tx, ty, dt, solids)) {
          this.mode = 'pause';
          this.pauseT = this.def.pause;
        }
        break;
      }
      case 'pause': {
        this.pauseT -= dt;
        this.angle += Math.sin(performance.now() / 700 + this.x) * 0.25 * dt;
        if (this.pauseT <= 0) {
          this.wp = (this.wp + 1) % this.def.route.length;
          this.mode = 'patrol';
        }
        break;
      }
      case 'phone': {
        this.pauseT -= dt;
        if (this.pauseT <= 0) {
          this.wp = (this.wp + 1) % this.def.route.length;
          this.mode = 'patrol';
        }
        break;
      }
      case 'investigate': {
        if (this.target && this.walkTo(this.target.x, this.target.y, dt, solids)) {
          this.mode = 'look';
          this.lookT = 2.1;
        }
        break;
      }
      case 'look': {
        this.lookT -= dt;
        this.angle += 1.5 * dt;
        if (this.lookT <= 0) this.mode = 'patrol';
        break;
      }
      case 'chase': {
        if (player) this.walkTo(player.x, player.y, dt, solids);
        break;
      }
      default:
        this.mode = 'patrol';
    }
    // Occasional one-line quips keep a still frame feeling alive.
    if (this.quipShow > 0) this.quipShow -= dt;
    if (this.def.quips && this.mode !== 'chase' && this.mode !== 'investigate') {
      this.quipT -= dt;
      if (this.quipT <= 0) {
        this.quip = this.def.quips[Math.floor(Math.random() * this.def.quips.length)];
        this.quipShow = 2.8;
        this.quipT = 9 + Math.random() * 9;
      }
    }
    // Sari stops to check her phone while on patrol, a window to slip past.
    if (this.def.phone && (this.mode === 'patrol' || this.mode === 'pause')) {
      this.phoneT -= dt;
      if (this.phoneT <= 0) {
        this.mode = 'phone';
        this.pauseT = 3;
        this.phoneT = 12 + Math.random() * 7;
      }
    }
  }
};

// A camera sweeps its arc on a sine clock. It dies when the power is cut.
MV.updateCamera = function (cam, t) {
  cam.angle = cam.base + Math.sin(t * cam.speed) * cam.sweep;
  return cam;
};

// Is the player inside this guard's cone right now, with clear sight?
MV.guardSees = function (guard, player, dark, blockers) {
  const range = guard.coneRange(dark);
  const d = MV.Geo.dist(guard.x, guard.y, player.x, player.y);
  if (d > range) return 0;
  let diff = Math.atan2(player.y - guard.y, player.x - guard.x) - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > guard.coneHalf(dark)) return 0;
  if (!MV.Geo.losClear(guard.x, guard.y, player.x, player.y, blockers)) return 0;
  // Strength falls with distance and with angle: dead centre is seen at
  // once, the cone's edge only glimpsed (perception has layers).
  const edge = 1 - 0.45 * (Math.abs(diff) / guard.coneHalf(dark));
  return (1 - d / range) * edge;
};
