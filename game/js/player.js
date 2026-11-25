// The Midnight Vault — the thief. He moves on WASD, sneaks on SHIFT, and
// every kilo in his bag makes him slower and louder: the greed mechanic
// the whole run turns on. Dump the bag with Q and run light again.
'use strict';

// MV itself is declared once, in config.js — every file shares that object.

MV.Player = class {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = MV.PLAYER_R;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.bagKg = 0;
    this.bagValue = 0;
    this.lootCount = 0;
    this.hasKeycard = false;
    this.hasDiamond = false;
    this.secretFound = false;
    this.stepPhase = 0;
  }

  get speedFactor() {
    const slow = Math.min(MV.WEIGHT_SLOW_MAX, this.bagKg * MV.WEIGHT_SLOW_PER_KG);
    return 1 - slow;
  }

  get speed() {
    return MV.WALK_SPEED * this.speedFactor * (this.sneaking ? MV.SNEAK_FACTOR : 1);
  }

  // How far the noise of his steps carries, in pixels.
  get noiseRadius() {
    if (!this.moving) return 0;
    if (this.sneaking) return 9;
    return 44 + this.bagKg * 2.4;
  }

  get noiseWord() {
    if (!this.moving) return 'STILL';
    if (this.sneaking) return 'SILENT';
    return this.bagKg > 6 ? 'LOUD' : 'AUDIBLE';
  }

  carry(item) {
    this.bagKg += item.kg;
    this.bagValue += item.value;
    this.lootCount += 1;
    if (item.secret) this.secretFound = true;
    if (item.goal) this.hasDiamond = true;
  }

  // The panic button: everything but the diamond hits the floor.
  dumpBag() {
    if (this.lootCount === 0) return 0;
    let lost = 0;
    // Value walked away from: everything carried except the diamond itself.
    lost = this.bagValue - (this.hasDiamond ? 10000 : 0);
    this.bagKg = this.hasDiamond ? 0.5 : 0;
    this.bagValue = this.hasDiamond ? 10000 : 0;
    this.lootCount = this.hasDiamond ? 1 : 0;
    return lost;
  }

  update(dt, solids) {
    const v = MV.Input.moveVector();
    this.sneaking = MV.Input.down('shift');
    this.moving = v.x !== 0 || v.y !== 0;
    if (!this.moving) return;
    this.angle = Math.atan2(v.y, v.x);
    const step = this.speed * dt;
    const [nx, ny] = MV.Geo.slideCircle(this.x + v.x * step, this.y + v.y * step, this.r, solids);
    this.x = MV.Geo.clamp(nx, 14 + this.r, 914 - this.r);
    this.y = MV.Geo.clamp(ny, 14 + this.r, 744 - this.r);
    this.stepPhase += dt * (this.sneaking ? 5 : 9);
  }
};
