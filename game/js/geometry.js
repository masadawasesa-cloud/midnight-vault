// The Midnight Vault — small geometry helpers: distances, segment tests,
// line of sight against the bank's solid furniture, and circle collision.
'use strict';

// MV itself is declared once, in config.js — every file shares that object.

MV.Geo = {
  clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  },

  dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  },

  // Does segment a-b touch or cross rectangle r (expanded by pad)?
  segHitsRect(ax, ay, bx, by, r, pad) {
    const x0 = r.x - pad;
    const y0 = r.y - pad;
    const x1 = r.x + r.w + pad;
    const y1 = r.y + r.h + pad;
    if (ax >= x0 && ax <= x1 && ay >= y0 && ay <= y1) return true;
    if (bx >= x0 && bx <= x1 && by >= y0 && by <= y1) return true;
    return (
      this.segsCross(ax, ay, bx, by, x0, y0, x1, y0) ||
      this.segsCross(ax, ay, bx, by, x1, y0, x1, y1) ||
      this.segsCross(ax, ay, bx, by, x1, y1, x0, y1) ||
      this.segsCross(ax, ay, bx, by, x0, y1, x0, y0)
    );
  },

  segsCross(ax, ay, bx, by, cx, cy, dx, dy) {
    const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    if (d === 0) return false;
    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
    const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  },

  // Line of sight between two points, blocked by any solid in the list.
  losClear(x1, y1, x2, y2, solids) {
    for (const s of solids) {
      if (this.segHitsRect(x1, y1, x2, y2, s, 0)) return false;
    }
    return true;
  },

  // How far a ray travels before it meets a solid, capped at maxDist.
  rayReach(x, y, angle, maxDist, solids) {
    const bx = x + Math.cos(angle) * maxDist;
    const by = y + Math.sin(angle) * maxDist;
    let best = maxDist;
    for (const s of solids) {
      if (!this.segHitsRect(x, y, bx, by, s, 0)) continue;
      // Binary search the first contact point along this ray.
      let lo = 0;
      let hi = best;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        const mx = x + Math.cos(angle) * mid;
        const my = y + Math.sin(angle) * mid;
        if (this.segHitsRect(x, y, mx, my, s, -0.01)) hi = mid;
        else lo = mid;
      }
      best = Math.min(best, hi);
    }
    return best;
  },

  // Push a circle out of every solid it overlaps. Returns corrected x, y.
  slideCircle(x, y, r, solids) {
    for (const s of solids) {
      const nx = MV.Geo.clamp(x, s.x, s.x + s.w);
      const ny = MV.Geo.clamp(y, s.y, s.y + s.h);
      const dx = x - nx;
      const dy = y - ny;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r * r) continue;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        x = nx + (dx / d) * r;
        y = ny + (dy / d) * r;
      } else {
        // Centre inside the rect: leave through the nearest face.
        const left = x - s.x;
        const right = s.x + s.w - x;
        const top = y - s.y;
        const bottom = s.y + s.h - y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) x = s.x - r;
        else if (m === right) x = s.x + s.w + r;
        else if (m === top) y = s.y - r;
        else y = s.y + s.h + r;
      }
    }
    return [x, y];
  },
};
