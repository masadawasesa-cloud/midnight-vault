// The Midnight Vault — drawing the bank: patterned floors, marble pillars,
// glowing ATMs, desks with paper and banded cash, deposit boxes, lasers,
// vision cones, and the darkness that falls when the power is cut.
'use strict';

// MV itself is declared once, in config.js — every file shares that object.

MV.Render = {
  conePath(ctx, x, y, angle, half, range, blockers) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const a = angle - half + (2 * half * i) / steps;
      const d = MV.Geo.rayReach(x, y, a, range, blockers);
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    ctx.closePath();
  },

  tiles(ctx, room, size, line) {
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = room.x + size; x < room.x + room.w; x += size) {
      ctx.moveTo(x, room.y);
      ctx.lineTo(x, room.y + room.h);
    }
    for (let y = room.y + size; y < room.y + room.h; y += size) {
      ctx.moveTo(room.x, y);
      ctx.lineTo(room.x + room.w, y);
    }
    ctx.stroke();
  },

  floors(ctx, t) {
    const R = MV.Level.rooms;
    const byId = {};
    R.forEach((r) => (byId[r.id] = r));
    // Lobby and teller hall: dark marble with a crimson runner in the lobby.
    ctx.fillStyle = '#26314a';
    ctx.fillRect(byId.lobby.x, byId.lobby.y, byId.lobby.w, byId.lobby.h);
    ctx.fillStyle = '#222b3f';
    ctx.fillRect(byId.teller.x, byId.teller.y, byId.teller.w, byId.teller.h);
    this.tiles(ctx, byId.lobby, 46, 'rgba(255,255,255,0.05)');
    this.tiles(ctx, byId.teller, 46, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = 'rgba(122, 30, 44, 0.30)';
    ctx.fillRect(104, 190, 92, 400);
    ctx.strokeStyle = 'rgba(255, 217, 77, 0.22)';
    ctx.strokeRect(104, 190, 92, 400);
    ctx.strokeStyle = 'rgba(255, 217, 77, 0.12)';
    ctx.strokeRect(110, 196, 80, 388);
    // Security: dark green-grey. Deposit: teal carpet. Vault: steel plates.
    ctx.fillStyle = '#1f2620';
    ctx.fillRect(byId.security.x, byId.security.y, byId.security.w, byId.security.h);
    this.tiles(ctx, byId.security, 29, 'rgba(255,255,255,0.04)');
    ctx.fillStyle = '#1d2b2e';
    ctx.fillRect(byId.deposit.x, byId.deposit.y, byId.deposit.w, byId.deposit.h);
    this.tiles(ctx, byId.deposit, 24, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = '#2b3038';
    ctx.fillRect(byId.vault.x, byId.vault.y, byId.vault.w, byId.vault.h);
    this.tiles(ctx, byId.vault, 58, 'rgba(255,255,255,0.07)');
    ctx.fillStyle = 'rgba(255,217,77,0.5)';
    for (let x = byId.vault.x + 8; x < byId.vault.x + byId.vault.w; x += 58) {
      for (let y = byId.vault.y + 8; y < byId.vault.y + byId.vault.h; y += 58) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
    // Room names written into the floor.
    ctx.fillStyle = 'rgba(230, 238, 255, 0.13)';
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L O B B Y', 157, 730);
    ctx.fillText('T E L L E R   H A L L', 476, 730);
    ctx.fillText('S E C U R I T Y', 783, 224);
    ctx.fillText('D E P O S I T', 783, 488);
    ctx.fillText('V A U L T', 783, 730);
    this.floorScatter(ctx, byId);
    void t;
  },

  // Deterministic scatter, so every render and screenshot shows the same
  // lived-in floor: paper scraps, dropped coins, marble veins, hairline
  // cracks, carpet flecks and vault scuffs. Drawn under the furniture.
  floorScatter(ctx, byId) {
    let s = 987654321;
    const rnd = () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
    const spot = (room, pad) => [
      room.x + pad + rnd() * (room.w - pad * 2),
      room.y + pad + rnd() * (room.h - pad * 2),
    ];
    for (const id of ['lobby', 'teller']) {
      const room = byId[id];
      // Marble veins: long, faint, wandering light lines.
      ctx.strokeStyle = 'rgba(210, 222, 240, 0.07)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) {
        let [x, y] = spot(room, 24);
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 3; k++) {
          x += (rnd() - 0.3) * 90;
          y += (rnd() - 0.5) * 46;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      // Paper scraps and dropped coins.
      for (let i = 0; i < 30; i++) {
        const [x, y] = spot(room, 16);
        if (rnd() < 0.6) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((rnd() - 0.5) * 0.9);
          ctx.fillStyle = 'rgba(232, 236, 244, 0.15)';
          ctx.fillRect(-4, -2.5, 8, 5);
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(255, 217, 77, 0.26)';
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, 6.29);
          ctx.fill();
        }
      }
      // Hairline cracks in the stone.
      ctx.strokeStyle = 'rgba(8, 11, 18, 0.4)';
      for (let i = 0; i < 5; i++) {
        const [x, y] = spot(room, 30);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rnd() - 0.5) * 34, y + (rnd() - 0.5) * 10);
        ctx.lineTo(x + (rnd() - 0.5) * 54, y + (rnd() - 0.5) * 22);
        ctx.stroke();
      }
    }
    // Carpet flecks in the deposit room.
    const dep = byId.deposit;
    for (let i = 0; i < 60; i++) {
      const [x, y] = spot(dep, 10);
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(140, 200, 190, 0.10)' : 'rgba(6, 10, 12, 0.20)';
      ctx.fillRect(x, y, 2.4, 2.4);
    }
    // A woven diamond motif across the deposit carpet, faint and regular.
    ctx.strokeStyle = 'rgba(140, 200, 190, 0.08)';
    for (let mx = dep.x + 26; mx < dep.x + dep.w - 12; mx += 46) {
      for (let my = dep.y + 26; my < dep.y + dep.h - 12; my += 46) {
        ctx.beginPath();
        ctx.moveTo(mx, my - 8);
        ctx.lineTo(mx + 8, my);
        ctx.lineTo(mx, my + 8);
        ctx.lineTo(mx - 8, my);
        ctx.closePath();
        ctx.stroke();
      }
    }
    // Dust specks on the security room floor.
    const sec = byId.security;
    for (let i = 0; i < 34; i++) {
      const [x, y] = spot(sec, 10);
      ctx.fillStyle = 'rgba(200, 214, 200, 0.10)';
      ctx.fillRect(x, y, 1.8, 1.8);
    }
    // Scuffs and gold dust in the vault.
    const v = byId.vault;
    ctx.strokeStyle = 'rgba(8, 10, 14, 0.35)';
    for (let i = 0; i < 7; i++) {
      const [x, y] = spot(v, 18);
      ctx.beginPath();
      ctx.arc(x, y, 5 + rnd() * 9, rnd() * 3, rnd() * 2 + 1.2);
      ctx.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const [x, y] = spot(v, 14);
      ctx.fillStyle = 'rgba(255, 217, 77, 0.20)';
      ctx.fillRect(x, y, 1.8, 1.8);
    }
  },

  furniture(ctx, s, t) {
    switch (s.kind) {
      case 'wall':
        ctx.fillStyle = '#39445c';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(s.x, s.y, s.w, 2);
        break;
      case 'atm': {
        ctx.fillStyle = '#2c3e57';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        const glow = 0.75 + Math.sin(t * 2 + s.y) * 0.25;
        ctx.fillStyle = `rgba(87, 230, 201, ${0.55 * glow})`;
        ctx.fillRect(s.x + 7, s.y + 9, s.w - 14, 24);
        ctx.fillStyle = '#0d2a24';
        ctx.font = '700 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', s.x + s.w / 2, s.y + 26);
        ctx.fillStyle = '#ffd94d';
        ctx.fillRect(s.x + 9, s.y + 44, 5, 5);
        ctx.fillStyle = '#141c2a';
        ctx.fillRect(s.x + 7, s.y + 52, s.w - 14, 5);
        break;
      }
      case 'planter':
        ctx.fillStyle = '#2e4632';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = '#3f7a44';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(s.x + 7 + ((i * 11) % 24), s.y + 8 + ((i * 17) % 22), 6.5, 0, 6.29);
          ctx.fill();
        }
        break;
      case 'bench':
        ctx.fillStyle = '#6b4f35';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(s.x, s.y + 8, s.w, 3);
        ctx.fillRect(s.x, s.y + 17, s.w, 3);
        break;
      case 'rope':
        ctx.strokeStyle = '#a02334';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y + 3);
        ctx.quadraticCurveTo(s.x + s.w / 2, s.y + 12, s.x + s.w, s.y + 3);
        ctx.stroke();
        ctx.fillStyle = '#ffd94d';
        [s.x, s.x + s.w / 2, s.x + s.w].forEach((px) => {
          ctx.beginPath();
          ctx.arc(px, s.y + 3, 4, 0, 6.29);
          ctx.fill();
        });
        break;
      case 'pillar': {
        const g = ctx.createLinearGradient(s.x, s.y, s.x + s.w, s.y);
        g.addColorStop(0, '#aeb9cc');
        g.addColorStop(0.5, '#dde5f2');
        g.addColorStop(1, '#98a5bb');
        ctx.fillStyle = g;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = 'rgba(70, 84, 110, 0.5)';
        ctx.beginPath();
        ctx.moveTo(s.x + 8, s.y + 4);
        ctx.lineTo(s.x + 5, s.y + s.h - 6);
        ctx.moveTo(s.x + s.w - 7, s.y + 6);
        ctx.lineTo(s.x + s.w - 10, s.y + s.h - 4);
        ctx.stroke();
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(s.x - 2, s.y - 3, s.w + 4, 5);
        ctx.fillRect(s.x - 2, s.y + s.h - 2, s.w + 4, 5);
        break;
      }
      case 'counter':
        ctx.fillStyle = '#4a3b2c';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(s.x, s.y + 3, s.w, 3);
        ctx.fillStyle = '#2c2119';
        for (let x = s.x + 34; x < s.x + s.w - 10; x += 62) ctx.fillRect(x, s.y + 10, 2, s.h - 16);
        ctx.fillStyle = '#1c2733';
        ctx.fillRect(s.x + s.w - 34, s.y + 6, 22, 13); // till
        ctx.fillStyle = '#57e6c9';
        ctx.fillRect(s.x + s.w - 31, s.y + 8, 16, 6);
        break;
      case 'desk':
        ctx.fillStyle = '#5a4632';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(s.x + 3, s.y + 3, s.w - 6, s.h - 6);
        // Paper stacks on top, one slightly askew.
        ctx.fillStyle = '#e8ecf4';
        ctx.fillRect(s.x + 10, s.y + 8, 20, 14);
        ctx.fillRect(s.x + 13, s.y + 6, 20, 14);
        ctx.fillStyle = '#cfd6e4';
        ctx.fillRect(s.x + s.w - 30, s.y + 12, 18, 12);
        ctx.fillStyle = '#ffd94d';
        ctx.beginPath();
        ctx.arc(s.x + s.w - 12, s.y + 10, 3.5, 0, 6.29);
        ctx.fill();
        break;
      case 'cabinet':
        ctx.fillStyle = '#3a4356';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        for (let y = s.y + 18; y < s.y + s.h; y += 18) {
          ctx.beginPath();
          ctx.moveTo(s.x + 3, y);
          ctx.lineTo(s.x + s.w - 3, y);
          ctx.stroke();
        }
        break;
      case 'console':
        ctx.fillStyle = '#232a35';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        for (let i = 0; i < 3; i++) {
          const mx = s.x + 10 + i * 46;
          ctx.fillStyle = '#0e2a1e';
          ctx.fillRect(mx, s.y + 6, 38, 22);
          ctx.strokeStyle = '#57e6c9';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mx + 3, s.y + 20);
          for (let k = 0; k < 6; k++) ctx.lineTo(mx + 3 + k * 6, s.y + 12 + ((k * 7 + i * 3) % 9));
          ctx.stroke();
        }
        break;
      case 'rack':
        ctx.fillStyle = '#20242c';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        for (let y = s.y + 8; y < s.y + s.h - 6; y += 14) {
          ctx.fillStyle = (Math.floor(y / 14 + t * 2) % 3 === 0) ? '#ff5347' : '#57e6c9';
          ctx.fillRect(s.x + 4, y, 3, 3);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(s.x + 10, y, s.w - 13, 3);
        }
        break;
      case 'boxes': {
        ctx.fillStyle = '#31435c';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        const vertical = s.h > s.w;
        const n = Math.floor((vertical ? s.h : s.w) / 22);
        for (let i = 1; i < n; i++) {
          ctx.beginPath();
          if (vertical) {
            ctx.moveTo(s.x, s.y + i * 22);
            ctx.lineTo(s.x + s.w, s.y + i * 22);
          } else {
            ctx.moveTo(s.x + i * 22, s.y);
            ctx.lineTo(s.x + i * 22, s.y + s.h);
          }
          ctx.stroke();
        }
        ctx.fillStyle = '#ffd94d';
        for (let i = 0; i < n; i++) {
          const cx = vertical ? s.x + s.w / 2 : s.x + i * 22 + 11;
          const cy = vertical ? s.y + i * 22 + 11 : s.y + s.h / 2;
          ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
        }
        break;
      }
      case 'table':
        ctx.fillStyle = '#46505e';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeRect(s.x + 3, s.y + 3, s.w - 6, s.h - 6);
        break;
      case 'pedestal':
        ctx.fillStyle = '#333a45';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = '#c9a227';
        ctx.strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
        break;
      case 'cart':
        ctx.strokeStyle = '#9fb2cc';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x, s.y, s.w, s.h);
        ctx.beginPath();
        for (let x = s.x + 10; x < s.x + s.w; x += 10) {
          ctx.moveTo(x, s.y);
          ctx.lineTo(x, s.y + s.h);
        }
        ctx.stroke();
        ctx.fillStyle = '#141c2a';
        [s.x + 8, s.x + s.w - 8].forEach((wx) => {
          ctx.beginPath();
          ctx.arc(wx, s.y + s.h + 3, 3.5, 0, 6.29);
          ctx.fill();
        });
        break;
      default:
        ctx.fillStyle = '#39445c';
        ctx.fillRect(s.x, s.y, s.w, s.h);
    }
  },

  lootItem(ctx, item, t) {
    const { x, y } = item;
    switch (item.kind) {
      case 'cash':
        ctx.fillStyle = '#2e7d3a';
        ctx.fillRect(x - 9, y - 5, 18, 10);
        ctx.fillStyle = '#3f9e4d';
        ctx.fillRect(x - 9, y - 8, 18, 10);
        ctx.fillStyle = '#e8ecf4';
        ctx.fillRect(x - 2, y - 8, 4, 12);
        break;
      case 'gold': {
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 5);
        ctx.lineTo(x - 6, y - 4);
        ctx.lineTo(x + 6, y - 4);
        ctx.lineTo(x + 10, y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd94d';
        ctx.fillRect(x - 6, y - 4, 12, 3);
        break;
      }
      case 'watch':
        ctx.fillStyle = '#8a6d1f';
        ctx.fillRect(x - 2, y - 9, 4, 18);
        ctx.fillStyle = '#ffd94d';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 6.29);
        ctx.fill();
        ctx.fillStyle = '#fff6d8';
        ctx.beginPath();
        ctx.arc(x, y, 3.4, 0, 6.29);
        ctx.fill();
        break;
      case 'gems':
        ctx.fillStyle = '#8a5adf';
        ctx.beginPath();
        ctx.arc(x, y + 2, 7.5, 0, 6.29);
        ctx.fill();
        ctx.fillStyle = '#c9a7ff';
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 4);
        ctx.lineTo(x, y - 9);
        ctx.lineTo(x + 3, y - 4);
        ctx.closePath();
        ctx.fill();
        break;
      case 'stamp':
        ctx.fillStyle = '#f2ede2';
        ctx.fillRect(x - 6, y - 8, 12, 16);
        ctx.strokeStyle = '#c23b2e';
        ctx.strokeRect(x - 4, y - 6, 8, 12);
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, 6.29);
        ctx.fill();
        break;
      case 'diamond': {
        const pulse = 0.7 + Math.sin(t * 3) * 0.3;
        const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
        g.addColorStop(0, `rgba(170, 240, 255, ${0.5 * pulse})`);
        g.addColorStop(1, 'rgba(170, 240, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 26, y - 26, 52, 52);
        ctx.fillStyle = '#c8f4ff';
        ctx.beginPath();
        ctx.moveTo(x, y - 11);
        ctx.lineTo(x + 8, y - 2);
        ctx.lineTo(x, y + 11);
        ctx.lineTo(x - 8, y - 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 2);
        ctx.lineTo(x + 8, y - 2);
        ctx.moveTo(x, y - 11);
        ctx.lineTo(x, y + 11);
        ctx.stroke();
        break;
      }
      default:
        break;
    }
  },

  guardFigure(ctx, g, t) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(g.x, g.y + 12, 13, 5, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = g.def.color;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, 6.29);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.stroke();
    // Cap with a brim toward the facing direction.
    const fx = Math.cos(g.angle);
    const fy = Math.sin(g.angle);
    ctx.fillStyle = '#1c2733';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 8.5, 0, 6.29);
    ctx.fill();
    ctx.fillRect(g.x + fx * 6 - 2.5, g.y + fy * 6 - 2.5, 5, 5);
    if (g.def.keycard) {
      ctx.fillStyle = '#ffd94d';
      ctx.fillRect(g.x - 3, g.y + 9, 6, 8); // the card on his belt
      ctx.fillStyle = '#b8c2d4';
      ctx.beginPath();
      ctx.arc(g.x, g.y - 2, 8.5, Math.PI * 1.05, Math.PI * 1.55);
      ctx.fill();
    }
    if (g.mode === 'phone') {
      ctx.fillStyle = '#e8f4ff';
      ctx.fillRect(g.x + fx * 13 - 3, g.y + fy * 13 - 4.5, 6, 9);
      ctx.fillStyle = 'rgba(120, 200, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 20 + Math.sin(t * 3) * 2, 0, 6.29);
      ctx.fill();
    }
    // Name label.
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(g.name).width + 8;
    ctx.fillStyle = 'rgba(8, 11, 18, 0.72)';
    ctx.fillRect(g.x - w / 2, g.y - 30, w, 13);
    ctx.fillStyle = '#dbe6f5';
    ctx.fillText(g.name, g.x, g.y - 20);
    // State marker.
    if (g.mode === 'chase') {
      ctx.fillStyle = '#ff5347';
      ctx.font = '900 17px system-ui, sans-serif';
      ctx.fillText('!', g.x, g.y - 34);
    } else if (g.seesPlayer || g.mode === 'investigate' || g.mode === 'look') {
      ctx.fillStyle = '#ffb347';
      ctx.font = '900 15px system-ui, sans-serif';
      ctx.fillText('?', g.x, g.y - 34);
    }
    // A speech bubble with one line of character, when the guard has one up.
    if (g.quipShow > 0 && g.quip) {
      ctx.font = '600 10px system-ui, sans-serif';
      const tw = ctx.measureText(g.quip).width + 12;
      const bx = g.x - tw / 2;
      const by = g.y - 58;
      ctx.fillStyle = 'rgba(240, 244, 250, 0.92)';
      ctx.beginPath();
      ctx.roundRect(bx, by, tw, 16, 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(g.x - 4, by + 16);
      ctx.lineTo(g.x + 4, by + 16);
      ctx.lineTo(g.x, by + 21);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#22304a';
      ctx.fillText(g.quip, g.x, by + 12);
    }
  },

  playerFigure(ctx, p, t) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 12, 13, 5, 0, 0, 6.29);
    ctx.fill();
    // A soft gold ring so the thief reads at a glance, even in a cone.
    ctx.strokeStyle = 'rgba(255, 217, 77, 0.55)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16.5, 0, 6.29);
    ctx.stroke();
    // The bag on his back grows with what he carries.
    const bag = 9 + Math.min(13, p.bagKg * 0.85);
    const bx = p.x - Math.cos(p.angle) * 10;
    const by = p.y - Math.sin(p.angle) * 10;
    ctx.fillStyle = p.bagKg > 9 ? '#7a4a21' : '#4d3a22';
    ctx.beginPath();
    ctx.arc(bx, by, bag * 0.62, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#141c2a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12.5, 0, 6.29);
    ctx.fill();
    ctx.strokeStyle = '#3d5a80';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Hood and the glint of an eye toward his heading.
    ctx.fillStyle = '#0a0f16';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7.5, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.fillRect(p.x + Math.cos(p.angle) * 6 - 1, p.y + Math.sin(p.angle) * 6 - 1, 2, 2);
    if (p.sneaking) {
      ctx.fillStyle = 'rgba(199, 210, 228, 0.6)';
      ctx.font = '600 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SNEAK', p.x, p.y - 20);
    }
    void t;
  },
};
