// The Midnight Vault — tiny synthesized sounds, no audio files.
// A muted flag lives here so the panel and the game agree on it.
'use strict';

// MV itself is declared once, in config.js — every file shares that object.

MV.Audio = {
  ctx: null,
  muted: false,

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  tone(freq, dur, type, vol, slideTo) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  pickup() { this.tone(660, 0.09, 'triangle', 0.07, 990); },
  coin() { this.tone(1240, 0.16, 'sine', 0.09, 880); },
  keycard() { this.tone(520, 0.1, 'square', 0.05, 780); },
  power() { this.tone(220, 0.4, 'sawtooth', 0.06, 55); },
  door() { this.tone(140, 0.35, 'sawtooth', 0.05, 90); },
  laser() { this.tone(1500, 0.07, 'square', 0.045); },
  alert() { this.tone(392, 0.16, 'square', 0.07); this.tone(392, 0.16, 'square', 0.07); },
  caught() { this.tone(330, 0.5, 'sawtooth', 0.09, 82); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.08), i * 110)); },
};
