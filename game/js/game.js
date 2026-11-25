// The Midnight Vault — the game itself: state, the detection and alarm
// rules, interactions, coins, lasers, lockdown, and the render order.
// Built fresh for this heist: one bank floor, three acts, one greedy bag.
'use strict';

// MV itself is declared once, in config.js — every file shares that object.

MV.Game = class {
  constructor() {
    this.mode = 'title'; // title, play, caught, win
    this.reset();
  }

  reset() {
    this.level = MV.Level.build();
    this.player = new MV.Player(this.level.spawn.x, this.level.spawn.y);
    const P = MV.Level.patrols;
    this.guards = [new MV.Guard(P.darma), new MV.Guard(P.bima), new MV.Guard(P.sari)];
    this.meter = 0;
    this.maxMeter = 0;
    this.time = 0;
    this.coins = MV.COINS_START;
    this.powerOff = false;
    this.alarms = 0;
    this.chaseT = 0;
    this.lockdown = 0;
    this.diamondTaken = false;
    this.anySee = false;
    this.anyChase = false;
    this.caughtReason = '';
    this.pickpocket = 0;
    this.laserCd = 0;
    this.wasE = false;
    this.wasQ = false;
    this.wasM = false;
    this.frozen = false;
    this.hitStop = 0;
    this.trauma = 0;
    this.shakeT = 0;
    this.lootPop = 0;
    this.fx = { texts: [], coins: [], pings: [], parts: [] };
  }

  rating() {
    if (this.alarms === 0 && this.maxMeter < 35) return 'GHOST — never seen, never heard';
    if (this.player.bagValue >= 17000) return 'MASTERTHIEF — clean hands, full bag';
    if (this.alarms >= 2) return 'DEMOLITION — loud, lucky, gone';
    return 'PROFESSIONAL — a clean night’s work';
  }

  say(x, y, msg, color) {
    this.fx.texts.push({ x, y, msg, color: color || '#ffd94d', t: 0, life: 1.7 });
  }

  // Juice, on the game-feel tiers: small events sparkle, big ones also
  // stop time for a blink and kick the camera (trauma squared, so light
  // kicks barely move and heavy ones punch).
  burst(x, y, n, color, speed, life, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.85);
      this.fx.parts.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 26,
        t: 0, life: life * (0.6 + Math.random() * 0.7),
        size: size * (0.6 + Math.random() * 0.8), color,
      });
    }
  }

  addTrauma(a) {
    this.trauma = Math.min(1, this.trauma + a);
  }

  laserOn(laser) {
    if (this.diamondTaken) return true;
    return ((this.time + laser.phase) % 2.6) < 1.5;
  }

  startAlarm() {
    this.alarms += 1;
    this.chaseT = MV.CHASE_TIME;
    this.addTrauma(0.5);
    this.hitStop = Math.max(this.hitStop, 0.05);
    for (const g of this.guards) g.mode = 'chase';
    MV.Audio.alert();
    this.say(this.player.x, this.player.y - 26, 'ALARM! RUN OR HIDE!', '#ff5347');
  }

  takeDiamond(item) {
    this.diamondTaken = true;
    this.lockdown = MV.LOCKDOWN_SECONDS;
    const P = MV.Level.patrols;
    const rudi = new MV.Guard(P.rudi, [120, 690]);
    rudi.investigate(660, 620);
    this.guards.push(rudi);
    this.burst(item.x, item.y, 26, '#bfefff', 150, 0.8, 2.6);
    this.burst(item.x, item.y, 14, '#ffd94d', 110, 0.7, 2.2);
    this.hitStop = Math.max(this.hitStop, 0.09);
    this.addTrauma(0.45);
    MV.Audio.alert();
    this.say(item.x, item.y - 24, 'THE DIAMOND IS GONE — LOCKDOWN!', '#ff5347');
    this.say(this.player.x, this.player.y - 44, 'Reach the loading dock!', '#7dd87d');
  }

  caught(reason) {
    this.mode = 'caught';
    this.caughtReason = reason;
    MV.Audio.caught();
  }

  // ---- interactions -------------------------------------------------------

  tryInteract() {
    const p = this.player;
    const sw = this.level.powerSwitch;
    if (!this.powerOff && MV.Geo.dist(p.x, p.y, sw.x, sw.y) < 47) {
      this.powerOff = true;
      MV.Audio.power();
      this.say(sw.x, sw.y + 34, 'POWER CUT — CAMERAS DEAD', '#ffb347');
      return;
    }
    if (!this.level.doorOpen && MV.Geo.dist(p.x, p.y, 646, 620) < 52) {
      if (p.hasKeycard) {
        this.level.doorOpen = true;
        const i = this.level.solids.indexOf(this.level.vaultDoor);
        if (i >= 0) this.level.solids.splice(i, 1);
        const j = this.level.blockers.indexOf(this.level.vaultDoor);
        if (j >= 0) this.level.blockers.splice(j, 1);
        MV.Audio.door();
        this.say(646, 570, 'THE VAULT IS OPEN', '#7dd87d');
      } else {
        MV.Audio.tone(180, 0.12, 'square', 0.06);
        this.say(646, 570, 'KEYCARD REQUIRED', '#ff5347');
      }
    }
  }

  throwCoin(tx, ty) {
    const p = this.player;
    if (this.coins <= 0) {
      this.say(p.x, p.y - 24, 'NO COINS LEFT', '#ff5347');
      return;
    }
    const d = MV.Geo.dist(p.x, p.y, tx, ty);
    if (d > MV.COIN_RANGE) {
      const s = MV.COIN_RANGE / d;
      tx = p.x + (tx - p.x) * s;
      ty = p.y + (ty - p.y) * s;
    }
    this.coins -= 1;
    this.fx.coins.push({ x0: p.x, y0: p.y, x1: tx, y1: ty, t: 0, dur: 0.38, landed: false });
  }

  landCoin(c) {
    MV.Audio.coin();
    this.burst(c.x1, c.y1, 5, '#ffd94d', 60, 0.4, 1.8);
    this.fx.pings.push({ x: c.x1, y: c.y1, t: 0 });
    let best = null;
    let bestD = MV.COIN_LURE_RADIUS;
    for (const g of this.guards) {
      const d = MV.Geo.dist(g.x, g.y, c.x1, c.y1);
      if (d < bestD) {
        bestD = d;
        best = g;
      }
    }
    if (best) best.investigate(c.x1, c.y1);
  }

  // ---- the fixed-step update ----------------------------------------------

  update(dt) {
    // Global keys work in every mode.
    const mDown = MV.Input.down('m');
    if (mDown && !this.wasM) MV.Audio.muted = !MV.Audio.muted;
    this.wasM = mDown;

    if (this.mode === 'title') {
      if (MV.Input.down('enter')) {
        MV.Audio.ensure();
        this.mode = 'play';
      }
      return;
    }
    if (this.mode === 'caught' || this.mode === 'win') {
      if (MV.Input.down('r') || MV.Input.down('enter')) {
        this.reset();
        this.mode = 'play';
      }
      return;
    }
    if (this.frozen) return;
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }
    if (MV.Input.down('r')) {
      this.reset();
      return;
    }

    const p = this.player;
    const level = this.level;
    this.time += dt;
    this.trauma = Math.max(0, this.trauma - 1.4 * dt);
    this.shakeT += dt;
    this.lootPop = Math.max(0, this.lootPop - dt * 4.5);
    this.laserCd = Math.max(0, this.laserCd - dt);

    const prevX = p.x;
    const prevY = p.y;
    p.update(dt, level.solids);

    // Interactions on the E edge.
    const eDown = MV.Input.down('e');
    if (eDown && !this.wasE) this.tryInteract();
    this.wasE = eDown;
    const qDown = MV.Input.down('q');
    if (qDown && !this.wasQ) {
      const before = p.bagKg;
      const lost = p.dumpBag();
      if (p.bagKg < before) {
        MV.Audio.tone(300, 0.15, 'triangle', 0.06, 170);
        this.say(p.x, p.y - 24, lost > 0 ? `BAG DUMPED — ${MV.Panel.fmtMoney(lost)} LEFT BEHIND` : 'BAG DUMPED', '#ffb347');
      }
    }
    this.wasQ = qDown;

    // Coins the player clicked to throw.
    while (MV.Input.clickQueue.length) {
      const c = MV.Input.clickQueue.shift();
      this.throwCoin(c.x, c.y);
    }

    // Pickpocketing Pak Darma: close, behind him, and unhurried.
    const darma = this.guards[0];
    if (!p.hasKeycard && darma.mode !== 'chase') {
      const d = MV.Geo.dist(p.x, p.y, darma.x, darma.y);
      const behind = d > 0.01 &&
        ((p.x - darma.x) * Math.cos(darma.angle) + (p.y - darma.y) * Math.sin(darma.angle)) / d < 0.25;
      if (d < 37 && behind) {
        this.pickpocket += dt;
        if (this.pickpocket >= 0.9) {
          p.hasKeycard = true;
          this.pickpocket = 0;
          MV.Audio.keycard();
          this.burst(darma.x, darma.y, 8, '#7dd87d', 70, 0.5, 2);
          this.say(darma.x, darma.y - 30, 'KEYCARD LIFTED', '#7dd87d');
        }
      } else {
        this.pickpocket = Math.max(0, this.pickpocket - dt * 2);
      }
    }

    // Loot pickup.
    for (const item of level.loot) {
      if (item.taken) continue;
      if (MV.Geo.dist(p.x, p.y, item.x, item.y) < 30) {
        item.taken = true;
        p.carry(item);
        MV.Audio.pickup();
        this.lootPop = 1;
        if (item.goal) this.burst(item.x, item.y, 6, '#ffd94d', 80, 0.5, 2);
        else if (item.secret) this.burst(item.x, item.y, 18, '#ffd94d', 120, 0.75, 2.4);
        else this.burst(item.x, item.y, 10, '#ffd94d', 90, 0.55, 2.1);
        if (item.goal) this.takeDiamond(item);
        else if (item.secret) this.say(item.x, item.y - 18, `SECRET FOUND: ${item.label} +${MV.Panel.fmtMoney(item.value)}`, '#ffd94d');
        else this.say(item.x, item.y - 18, `+${MV.Panel.fmtMoney(item.value)} ${item.label}`, '#c7d2e4');
      }
    }

    // Lasers: crossing a live beam, or standing in one, is loud.
    for (const l of level.lasers) {
      if (!this.laserOn(l)) continue;
      const crossed = MV.Geo.segsCross(prevX, prevY, p.x, p.y, l.x1, l.y1, l.x2, l.y2);
      const near = this.pointSegDist(p.x, p.y, l) < p.r + 2;
      if ((crossed || near) && this.laserCd <= 0) {
        this.laserCd = 0.7;
        this.meter = Math.min(MV.METER_MAX, this.meter + 24);
        MV.Audio.laser();
        this.burst(p.x, p.y, 8, '#ff5347', 100, 0.45, 2);
        this.say(p.x, p.y - 24, 'LASER TRIPPED', '#ff5347');
      }
    }

    // Guards and cameras.
    for (const g of this.guards) g.update(dt, level.solids, p);
    for (const cam of level.cameras) MV.updateCamera(cam, this.time);

    // Noise: footsteps carry, and a heavy bag carries further.
    const noise = p.noiseRadius;
    if (noise > 0) {
      for (const g of this.guards) {
        if (g.mode === 'chase') continue;
        if (MV.Geo.dist(g.x, g.y, p.x, p.y) < noise + g.r) {
          g.investigate(p.x, p.y);
        }
      }
    }

    // Sight and the detection meter.
    const dark = this.powerOff;
    let seen = 0;
    this.anySee = false;
    for (const g of this.guards) {
      let s = MV.guardSees(g, p, dark, level.blockers);
      if (g.mode === 'phone') s *= 0.2;
      g.seesPlayer = s > 0;
      g.seeStrength = s;
      if (s > 0) {
        this.anySee = true;
        const fill = MV.GUARD_FILL_FAR + (MV.GUARD_FILL_NEAR - MV.GUARD_FILL_FAR) * s;
        seen += fill * g.def.fill * (p.sneaking ? MV.SNEAK_FILL_FACTOR : 1) * dt;
      }
    }
    if (!dark) {
      for (const cam of level.cameras) {
        const d = MV.Geo.dist(cam.x, cam.y, p.x, p.y);
        if (d > cam.range) continue;
        let diff = Math.atan2(p.y - cam.y, p.x - cam.x) - cam.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) > 0.32) continue;
        if (!MV.Geo.losClear(cam.x, cam.y, p.x, p.y, level.blockers)) continue;
        this.anySee = true;
        seen += MV.CAMERA_FILL * (1 - d / cam.range) * (p.sneaking ? MV.SNEAK_FILL_FACTOR : 1) * dt;
      }
    }
    if (seen > 0) this.meter = Math.min(MV.METER_MAX, this.meter + seen);
    else this.meter = Math.max(0, this.meter - MV.METER_DRAIN * dt);
    this.maxMeter = Math.max(this.maxMeter, this.meter);

    // The alarm, the hunt, and the catch.
    this.anyChase = this.chaseT > 0;
    if (this.meter >= MV.METER_MAX && this.chaseT <= 0) this.startAlarm();
    if (this.chaseT > 0) {
      this.chaseT -= dt;
      for (const g of this.guards) {
        if (MV.Geo.dist(g.x, g.y, p.x, p.y) < 25) {
          this.caught(dark ? 'A hand closed on his shoulder in the dark. The flashlight found the rest.' : 'A guard’s hand closed on his shoulder. The whole bank woke at once.');
          return;
        }
      }
      if (this.chaseT <= 0) {
        for (const g of this.guards) if (g.mode === 'chase') g.mode = 'investigate';
        this.meter = 30;
      }
    }

    // Lockdown and the way out.
    if (this.lockdown > 0) {
      this.lockdown -= dt;
      if (this.lockdown <= 0) {
        this.caught('The shutters slammed down and every door sealed. Hantu was still inside.');
        return;
      }
    }
    const z = level.exitZone;
    if (p.hasDiamond && p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h) {
      this.mode = 'win';
      MV.Audio.win();
      return;
    }

    // Effects.
    for (const c of this.fx.coins) {
      c.t += dt;
      if (c.t >= c.dur && !c.landed) {
        c.landed = true;
        this.landCoin(c);
      }
    }
    this.fx.coins = this.fx.coins.filter((c) => c.t < c.dur + 0.05);
    for (const pg of this.fx.pings) pg.t += dt;
    this.fx.pings = this.fx.pings.filter((pg) => pg.t < 0.8);
    for (const tx of this.fx.texts) tx.t += dt;
    this.fx.texts = this.fx.texts.filter((tx) => tx.t < tx.life);
    for (const pt of this.fx.parts) {
      pt.t += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 150 * dt;
    }
    this.fx.parts = this.fx.parts.filter((pt) => pt.t < pt.life);
  }

  pointSegDist(px, py, l) {
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - l.x1) * dx + (py - l.y1) * dy) / len2;
    t = MV.Geo.clamp(t, 0, 1);
    return MV.Geo.dist(px, py, l.x1 + dx * t, l.y1 + dy * t);
  }

  // ---- rendering ------------------------------------------------------------

  render(ctx, t) {
    const level = this.level;
    const p = this.player;
    ctx.fillStyle = '#05080d';
    ctx.fillRect(0, 0, MV.W, MV.H);
    MV.Panel.topStrip(ctx, this);

    ctx.save();
    ctx.translate(0, MV.TOP);
    ctx.beginPath();
    ctx.rect(0, 0, MV.FIELD_W, MV.H - MV.TOP);
    ctx.clip();

    // Screen shake from decaying trauma: the world kicks, the panel never does.
    if (this.trauma > 0) {
      const sh = this.trauma * this.trauma;
      ctx.translate(
        (Math.sin(this.shakeT * 91) + Math.sin(this.shakeT * 47) * 0.6) * 8 * sh,
        Math.cos(this.shakeT * 83) * 6.5 * sh
      );
    }

    MV.Render.floors(ctx, t);

    // The loading dock: striped zone and the shutter in the bottom wall.
    const z = level.exitZone;
    ctx.fillStyle = p.hasDiamond ? 'rgba(125, 216, 125, 0.20)' : 'rgba(255, 83, 71, 0.10)';
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = p.hasDiamond ? '#7dd87d' : '#8a2f27';
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.setLineDash([]);
    ctx.fillStyle = '#39445c';
    ctx.fillRect(40, 744, 110, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let x = 46; x < 146; x += 12) ctx.fillRect(x, 745, 3, 12);
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = p.hasDiamond ? '#7dd87d' : '#ff8a80';
    ctx.fillText(p.hasDiamond ? 'EXIT — GO!' : 'EXIT — LOCKED', z.x + z.w / 2, z.y + 17);
    ctx.fillStyle = 'rgba(230,238,255,0.4)';
    ctx.font = '600 9px system-ui, sans-serif';
    ctx.fillText('LOADING DOCK', z.x + z.w / 2, z.y + 30);

    // Furniture, skipping the vault door, which is drawn as a wheel of steel.
    for (const s of level.solids) {
      if (s.kind === 'vaultdoor') continue;
      MV.Render.furniture(ctx, s, t);
    }
    this.drawVaultDoor(ctx, t);
    this.drawPowerSwitch(ctx, t);

    for (const item of level.loot) {
      if (!item.taken) MV.Render.lootItem(ctx, item, t);
    }
    this.drawLasers(ctx, t);

    // Vision cones, cameras first, then the guards.
    if (!this.powerOff) {
      for (const cam of level.cameras) {
        ctx.fillStyle = MV.COLORS.camCone;
        MV.Render.conePath(ctx, cam.x, cam.y, cam.angle, 0.32, cam.range, level.blockers);
        ctx.fill();
      }
    }
    for (const g of this.guards) {
      ctx.fillStyle = this.powerOff ? MV.COLORS.torch : MV.COLORS.cone;
      MV.Render.conePath(ctx, g.x, g.y, g.angle, g.coneHalf(this.powerOff), g.coneRange(this.powerOff), level.blockers);
      ctx.fill();
    }
    for (const cam of level.cameras) {
      ctx.fillStyle = '#1c2733';
      ctx.fillRect(cam.x - 7, cam.y - 7, 14, 14);
      ctx.fillStyle = this.powerOff ? '#39445c' : '#ff5347';
      ctx.beginPath();
      ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 3.4, 0, 6.29);
      ctx.fill();
    }

    // Noise ring around loud steps.
    if (p.moving && !p.sneaking && this.mode === 'play') {
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.noiseRadius, 0, 6.29);
      ctx.stroke();
    }

    for (const g of this.guards) MV.Render.guardFigure(ctx, g, t);
    MV.Render.playerFigure(ctx, p, t);

    // The pickpocket ring around Pak Darma.
    if (this.pickpocket > 0) {
      const d = this.guards[0];
      ctx.strokeStyle = '#7dd87d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 21, -Math.PI / 2, -Math.PI / 2 + (this.pickpocket / 0.9) * Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // The pickpocket prompt: name the action and the object, not just a ring.
    if (!p.hasKeycard && this.mode === 'play' && !this.frozen) {
      const d0 = this.guards[0];
      if (d0.mode !== 'chase' && MV.Geo.dist(p.x, p.y, d0.x, d0.y) < 62) {
        ctx.fillStyle = this.pickpocket > 0 ? '#7dd87d' : 'rgba(219, 230, 245, 0.9)';
        ctx.font = '700 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.pickpocket > 0 ? 'LIFTING HIS KEYCARD…' : 'STAY BEHIND HIM — LIFT THE KEYCARD', d0.x, d0.y - 46);
        ctx.textAlign = 'left';
      }
    }

    // Coins in flight and their pings.
    for (const c of this.fx.coins) {
      const k = Math.min(1, c.t / c.dur);
      const cx = c.x0 + (c.x1 - c.x0) * k;
      const cy = c.y0 + (c.y1 - c.y0) * k - Math.sin(k * Math.PI) * 26;
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, 6.29);
      ctx.fill();
    }
    for (const pg of this.fx.pings) {
      ctx.strokeStyle = `rgba(255, 217, 77, ${0.7 * (1 - pg.t / 0.8)})`;
      ctx.beginPath();
      ctx.arc(pg.x, pg.y, 6 + pg.t * 55, 0, 6.29);
      ctx.stroke();
    }

    // Darkness, once the power is cut: flashlights and a small glow remain.
    if (this.powerOff) {
      ctx.fillStyle = 'rgba(3, 5, 10, 0.86)';
      ctx.fillRect(0, 0, MV.FIELD_W, MV.H - MV.TOP);
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, 118);
      glow.addColorStop(0, 'rgba(255, 244, 214, 0.20)');
      glow.addColorStop(1, 'rgba(255, 244, 214, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(p.x - 118, p.y - 118, 236, 236);
      for (const g of this.guards) {
        ctx.fillStyle = 'rgba(255, 240, 190, 0.13)';
        MV.Render.conePath(ctx, g.x, g.y, g.angle, g.coneHalf(true), g.coneRange(true), level.blockers);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      // Faces stay readable in the dark.
      for (const g of this.guards) MV.Render.guardFigure(ctx, g, t);
      MV.Render.playerFigure(ctx, p, t);
    }

    // The alarm made visible: a red pulse at the field's edge while hunted.
    if (this.lockdown > 0 || this.chaseT > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.strokeStyle = `rgba(255, 83, 71, ${0.22 + 0.4 * pulse})`;
      ctx.lineWidth = 5;
      ctx.strokeRect(3, 3, MV.FIELD_W - 6, MV.H - MV.TOP - 6);
      ctx.lineWidth = 1;
    }

    // Sparkle particles on top of the world, under the words.
    for (const pt of this.fx.parts) {
      ctx.globalAlpha = Math.max(0, 1 - pt.t / pt.life);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // Floating texts on top of everything.
    for (const tx of this.fx.texts) {
      ctx.globalAlpha = Math.max(0, 1 - tx.t / tx.life);
      ctx.fillStyle = tx.color;
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tx.msg, tx.x, tx.y - tx.t * 20);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
    ctx.restore();

    MV.Panel.draw(ctx, this);
    if (this.mode === 'title') MV.Panel.titleScreen(ctx);
    else if (this.mode === 'caught') MV.Panel.caughtScreen(ctx, this);
    else if (this.mode === 'win') MV.Panel.winScreen(ctx, this);
  }

  drawVaultDoor(ctx, t) {
    const open = this.level.doorOpen;
    ctx.save();
    if (open) {
      ctx.fillStyle = '#05080d';
      ctx.fillRect(640, 586, 12, 68);
      ctx.globalAlpha = 0.85;
      ctx.translate(-56, 0);
    }
    const cx = 646;
    const cy = 620;
    ctx.fillStyle = '#39445c';
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#57657e';
    ctx.beginPath();
    ctx.arc(cx, cy, 29, 0, 6.29);
    ctx.fill();
    ctx.strokeStyle = '#2b3446';
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t * 0.05;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 6.29);
    ctx.fill();
    ctx.restore();
    if (!open) {
      ctx.fillStyle = this.player.hasKeycard ? '#7dd87d' : '#ff8a80';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.player.hasKeycard ? 'E — OPEN VAULT' : 'VAULT — KEYCARD', 646, 566);
      ctx.textAlign = 'left';
    }
  }

  drawPowerSwitch(ctx, t) {
    const sw = this.level.powerSwitch;
    ctx.fillStyle = '#1a222e';
    ctx.fillRect(sw.x - 13, sw.y - 11, 26, 22);
    ctx.strokeStyle = '#39445c';
    ctx.strokeRect(sw.x - 13, sw.y - 11, 26, 22);
    ctx.fillStyle = this.powerOff ? '#5a2320' : '#7dd87d';
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, 6, 0, 6.29);
    ctx.fill();
    const near = MV.Geo.dist(this.player.x, this.player.y, sw.x, sw.y) < 47;
    if (near && !this.powerOff && this.mode === 'play') {
      ctx.strokeStyle = `rgba(125, 216, 125, ${0.5 + Math.sin(t * 5) * 0.3})`;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, 13, 0, 6.29);
      ctx.stroke();
      ctx.fillStyle = '#7dd87d';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('E — CUT POWER', sw.x, sw.y - 20);
      ctx.textAlign = 'left';
    }
  }

  drawLasers(ctx, t) {
    for (const l of this.level.lasers) {
      ctx.fillStyle = '#232a35';
      ctx.fillRect(l.x1 - 4, l.y1 - 4, 8, 8);
      ctx.fillRect(l.x2 - 4, l.y2 - 4, 8, 8);
      const on = this.laserOn(l);
      if (on) {
        ctx.strokeStyle = 'rgba(255, 83, 71, 0.25)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
        ctx.strokeStyle = '#ff5347';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = '#ff8a80';
        ctx.beginPath();
        ctx.arc(l.x1, l.y1, 2.4, 0, 6.29);
        ctx.arc(l.x2, l.y2, 2.4, 0, 6.29);
        ctx.fill();
      } else {
        // A blink of warning just before the beam returns.
        const cyc = (this.time + l.phase) % 2.6;
        ctx.strokeStyle = cyc > 2.25 ? `rgba(255, 83, 71, ${0.25 + Math.sin(t * 14) * 0.2})` : 'rgba(255, 83, 71, 0.10)';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // ---- hooks for screenshots and scripted playtests -------------------------

  stateText() {
    const p = this.player;
    return {
      mode: this.mode,
      time: Math.round(this.time * 10) / 10,
      player: { x: Math.round(p.x), y: Math.round(p.y), kg: Math.round(p.bagKg * 10) / 10, value: p.bagValue, keycard: p.hasKeycard, diamond: p.hasDiamond },
      meter: Math.round(this.meter),
      alarms: this.alarms,
      lockdown: Math.round(this.lockdown),
      powerOff: this.powerOff,
      coins: this.coins,
      guards: this.guards.map((g) => ({ name: g.name, mode: g.mode, x: Math.round(g.x), y: Math.round(g.y), sees: g.seesPlayer })),
      lootTaken: this.level.loot.filter((i) => i.taken).length,
    };
  }

  stageFromQuery() {
    const shot = new URLSearchParams(location.search).get('shot');
    if (!shot) return;
    const P = MV.Level.patrols;
    void P;
    if (shot === 'title') return; // the default mode is the title screen
    this.mode = 'play';
    this.frozen = true;
    const p = this.player;
    const [darma, bima, sari] = this.guards;
    const take = (idx) => {
      const item = this.level.loot[idx];
      item.taken = true;
      p.carry(item);
    };
    if (shot === 'cover') {
      this.time = 95;
      take(0); take(1); take(3); take(4); // counter cash, desk cash, the watch
      p.hasKeycard = true;
      p.x = 430; p.y = 300; p.angle = 2.6; p.sneaking = true;
      darma.x = 520; darma.y = 300; darma.angle = Math.PI; darma.mode = 'pause'; darma.seesPlayer = true;
      bima.x = 618; bima.y = 380; bima.angle = 2.2; bima.mode = 'pause';
      sari.x = 760; sari.y = 440; sari.angle = -0.8; sari.mode = 'phone';
      sari.quip = 'One more scroll…'; sari.quipShow = 99;
      this.meter = 68; this.maxMeter = 68;
      this.coins = 2;
      MV.updateCamera(this.level.cameras[0], this.time);
      MV.updateCamera(this.level.cameras[1], this.time);
    } else if (shot === 'dark') {
      this.time = 140;
      this.powerOff = true;
      take(5); take(6); take(7); // both gold bars and the gem pouch
      p.hasKeycard = true;
      p.x = 770; p.y = 385; p.angle = 0.4; p.sneaking = true;
      darma.x = 430; darma.y = 300; darma.angle = 0.6; darma.mode = 'pause';
      bima.x = 470; bima.y = 120; bima.angle = 1.4; bima.mode = 'pause';
      bima.quip = 'All clear. All clear.'; bima.quipShow = 99;
      sari.x = 856; sari.y = 345; sari.angle = 2.75; sari.mode = 'patrol'; sari.seesPlayer = true;
      this.meter = 24; this.maxMeter = 41;
      this.coins = 2;
    } else if (shot === 'vault') {
      this.time = 13.05;
      take(0); take(2); take(5); take(10); // cash, a gold bar, the secret stamp
      p.hasKeycard = true;
      p.x = 700; p.y = 619; p.angle = 0; p.sneaking = false;
      this.tryOpenDoorForShot();
      darma.x = 200; darma.y = 300; darma.angle = 0.3; darma.mode = 'pause';
      bima.x = 618; bima.y = 545; bima.angle = 0.5; bima.mode = 'pause'; bima.seesPlayer = true;
      sari.x = 760; sari.y = 300; sari.angle = 2.9; sari.mode = 'phone';
      sari.quip = 'Five more minutes.'; sari.quipShow = 99;
      this.meter = 82; this.maxMeter = 82;
      this.alarms = 1;
      this.coins = 1;
    } else if (shot === 'lockdown') {
      // The cover: the diamond is his, the bank is awake, the dock is close.
      this.time = 210;
      take(0); take(3); take(4); take(5); // counter cash, desk cash, the watch, a gold bar
      const dia = this.level.loot[11];
      dia.taken = true;
      p.carry(dia);
      p.hasKeycard = true;
      this.diamondTaken = true;
      this.tryOpenDoorForShot();
      const rudi = new MV.Guard(P.rudi, [120, 690]);
      this.guards.push(rudi);
      this.lockdown = 41;
      this.alarms = 1;
      this.chaseT = 3;
      this.meter = 100; this.maxMeter = 100;
      this.coins = 1;
      this.trauma = 0.3;
      p.x = 128; p.y = 684; p.angle = 1.85; p.sneaking = false;
      rudi.x = 330; rudi.y = 648; rudi.angle = Math.PI + 0.25; rudi.mode = 'chase';
      rudi.quip = 'Nobody leaves. Nobody.'; rudi.quipShow = 99;
      darma.x = 452; darma.y = 452; darma.angle = 2.35; darma.mode = 'chase'; darma.seesPlayer = true;
      bima.x = 560; bima.y = 585; bima.angle = 2.7; bima.mode = 'chase'; bima.seesPlayer = true;
      sari.x = 706; sari.y = 428; sari.angle = 2.95; sari.mode = 'investigate';
      // A frozen trail of sparkles behind the runner, and the diamond's glint.
      const trail = [[150, 668], [176, 652], [205, 640], [238, 632], [268, 640], [296, 652]];
      for (const [x, y] of trail) this.fx.parts.push({ x, y, vx: 0, vy: 0, t: 0.1, life: 99, size: 3.4, color: '#ffd94d' });
      for (const [x, y] of [[118, 672], [138, 690], [128, 660]]) this.fx.parts.push({ x, y, vx: 0, vy: 0, t: 0.1, life: 99, size: 4.2, color: '#bfefff' });
      MV.updateCamera(this.level.cameras[0], this.time);
      MV.updateCamera(this.level.cameras[1], this.time);
    }
  }

  tryOpenDoorForShot() {
    this.level.doorOpen = true;
    const i = this.level.solids.indexOf(this.level.vaultDoor);
    if (i >= 0) this.level.solids.splice(i, 1);
    const j = this.level.blockers.indexOf(this.level.vaultDoor);
    if (j >= 0) this.level.blockers.splice(j, 1);
  }
};

// ---- boot -------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
  if (new URLSearchParams(location.search).has('shot')) document.body.classList.add('shot');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  MV.Input.attach(canvas);
  window.addEventListener('keydown', () => MV.Audio.ensure());
  canvas.addEventListener('mousedown', () => MV.Audio.ensure());

  const game = new MV.Game();
  game.stageFromQuery();
  window.__game = game;
  window.advanceTime = (ms) => {
    const wasFrozen = game.frozen;
    game.frozen = false;
    const n = Math.round(ms / (1000 / 60));
    for (let i = 0; i < n; i++) game.update(MV.STEP);
    game.frozen = wasFrozen;
  };
  window.render_game_to_text = () => JSON.stringify(game.stateText());

  let acc = 0;
  let last = performance.now();
  let shotReadySet = false;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    while (acc >= MV.STEP) {
      game.update(MV.STEP);
      acc -= MV.STEP;
    }
    game.render(ctx, now / 1000);
    if (!shotReadySet) {
      shotReadySet = true;
      window.__shotReady = true;
    }
  }
  requestAnimationFrame(frame);
});
