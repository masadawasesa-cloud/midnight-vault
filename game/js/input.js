// The Midnight Vault — keyboard and mouse state, read by the game loop.
// The game is played with keyboard and mouse: WASD to move, SHIFT to sneak,
// E to interact, Q to dump the bag, and a mouse click throws a coin.
'use strict';

// MV itself is declared once, in config.js — every file shares that object.

MV.Input = {
  keys: {},
  mouseX: 0,
  mouseY: 0,
  clickQueue: [], // world-space points the player clicked, consumed by the game

  attach(canvas) {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      const cx = ((e.clientX - r.left) / r.width) * canvas.width;
      const cy = ((e.clientY - r.top) / r.height) * canvas.height;
      if (cx < MV.FIELD_W && cy > MV.TOP) this.clickQueue.push({ x: cx, y: cy - MV.TOP });
    });
  },

  down(...names) {
    return names.some((n) => this.keys[n]);
  },

  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down('a', 'arrowleft')) x -= 1;
    if (this.down('d', 'arrowright')) x += 1;
    if (this.down('w', 'arrowup')) y -= 1;
    if (this.down('s', 'arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  },
};
