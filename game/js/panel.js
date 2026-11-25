// The Midnight Vault — the labelled status panel and the top strip.
// Everything the judge (and the player) needs to read the run at a glance:
// detection, alarm stage, power, keycard, visibility, noise, the guards,
// a bank map, a legend and the controls. Plus the title and end screens.
'use strict';

// MV itself is declared once, in config.js — every file shares that object.

MV.Panel = {
  fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  fmtMoney(v) {
    return '$' + v.toLocaleString('en-US');
  },

  detectionWord(game) {
    if (game.anyChase) return ['HUNTED', MV.COLORS.danger];
    if (game.meter > 55) return ['SPOTTED', MV.COLORS.danger];
    if (game.meter > 18 || game.anySee) return ['SUSPICIOUS', MV.COLORS.amber];
    return ['UNSEEN', MV.COLORS.calm];
  },

  alarmWord(game) {
    if (game.lockdown > 0) return 'LOCKDOWN';
    if (game.alarms > 0 || game.anyChase) return 'ALARM RAISED';
    if (game.meter > 18) return 'WATCHFUL';
    return 'CALM';
  },

  goalWord(game) {
    const p = game.player;
    if (p.hasDiamond) return 'Diamond in the bag — reach the loading dock!';
    if (!p.hasKeycard) return 'Pickpocket the keycard from Pak Darma';
    if (!game.level.doorOpen) return 'Open the vault door with the keycard';
    return 'Take the Star Diamond from its pedestal';
  },

  topStrip(ctx, game) {
    const p = game.player;
    ctx.fillStyle = '#0a0e15';
    ctx.fillRect(0, 0, MV.W, MV.TOP);
    ctx.fillStyle = MV.COLORS.gold;
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('THE MIDNIGHT VAULT', 14, 27);
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillStyle = MV.COLORS.text;
    const pop = 1 + 0.3 * (game.lootPop || 0);
    ctx.save();
    ctx.translate(230, 27);
    ctx.scale(pop, pop);
    ctx.fillText(`LOOT  ${this.fmtMoney(p.bagValue)}`, 0, 0);
    ctx.restore();
    ctx.fillText(`BAG  ${p.bagKg.toFixed(1)} kg`, 380, 27);
    ctx.fillText(`TIME  ${this.fmtTime(game.time)}`, 500, 27);
    // Alarm pips.
    ctx.fillStyle = MV.COLORS.dim;
    ctx.fillText('ALARM', 610, 27);
    for (let i = 0; i < 3; i++) {
      const active = game.lockdown > 0 || game.alarms > i;
      ctx.fillStyle = active ? MV.COLORS.danger : '#26314a';
      ctx.fillRect(668 + i * 20, 14, 15, 15);
    }
    // Right end of the strip: the run's live rating, or the lockdown clock.
    ctx.textAlign = 'right';
    if (game.lockdown > 0) {
      ctx.fillStyle = MV.COLORS.danger;
      ctx.font = '800 15px system-ui, sans-serif';
      ctx.fillText(`LOCKDOWN ${this.fmtTime(game.lockdown)}`, 1266, 27);
    } else {
      ctx.fillStyle = game.maxMeter < 35 && game.alarms === 0 ? MV.COLORS.gold : MV.COLORS.dim;
      ctx.font = '800 14px system-ui, sans-serif';
      ctx.fillText(game.maxMeter < 35 && game.alarms === 0 ? 'ON TRACK: GHOST' : 'GHOST SLIPPED AWAY', 1266, 27);
    }
    ctx.textAlign = 'left';
  },

  section(ctx, x, y, title) {
    ctx.fillStyle = MV.COLORS.dim;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText(title, x, y);
    ctx.strokeStyle = MV.COLORS.panelLine;
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.lineTo(MV.W - 14, y + 5);
    ctx.stroke();
  },

  row(ctx, x, y, label, value, color) {
    ctx.fillStyle = MV.COLORS.dim;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText(label, x, y);
    ctx.fillStyle = color || MV.COLORS.text;
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value, MV.W - 14, y);
    ctx.textAlign = 'left';
  },

  draw(ctx, game) {
    const p = game.player;
    const X = MV.PANEL_X;
    ctx.fillStyle = MV.COLORS.panelBg;
    ctx.fillRect(X, MV.TOP, MV.W - X, MV.H - MV.TOP);
    ctx.strokeStyle = MV.COLORS.panelLine;
    ctx.beginPath();
    ctx.moveTo(X + 0.5, MV.TOP);
    ctx.lineTo(X + 0.5, MV.H);
    ctx.stroke();
    const x = X + 14;
    let y = MV.TOP + 26;

    // Detection: the word and the meter.
    const [word, wordColor] = this.detectionWord(game);
    ctx.fillStyle = MV.COLORS.dim;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText('DETECTION', x, y);
    ctx.fillStyle = wordColor;
    ctx.font = '900 25px system-ui, sans-serif';
    ctx.fillText(word, x, y + 30);
    ctx.fillStyle = '#1a2231';
    ctx.fillRect(x, y + 40, MV.W - X - 28, 12);
    const mw = (MV.W - X - 28) * (game.meter / MV.METER_MAX);
    const grad = ctx.createLinearGradient(x, 0, x + MV.W - X - 28, 0);
    grad.addColorStop(0, '#7dd87d');
    grad.addColorStop(0.55, '#ffb347');
    grad.addColorStop(1, '#ff5347');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y + 40, mw, 12);
    ctx.strokeStyle = MV.COLORS.panelLine;
    ctx.strokeRect(x, y + 40, MV.W - X - 28, 12);
    y += 74;

    // Status rows.
    this.section(ctx, x, y, 'STATUS');
    y += 22;
    this.row(ctx, x, y, 'ALARM STAGE', this.alarmWord(game), game.lockdown > 0 || game.anyChase ? MV.COLORS.danger : MV.COLORS.text);
    y += 19;
    this.row(ctx, x, y, 'POWER', game.powerOff ? 'OFF — DARK' : 'ON', game.powerOff ? MV.COLORS.amber : MV.COLORS.text);
    y += 19;
    this.row(ctx, x, y, 'KEYCARD', p.hasKeycard ? 'IN POCKET' : 'ON PAK DARMA', p.hasKeycard ? MV.COLORS.calm : MV.COLORS.text);
    y += 19;
    this.row(ctx, x, y, 'VISIBILITY', game.powerOff ? 'IN DARK' : 'IN LIGHT', game.powerOff ? MV.COLORS.calm : MV.COLORS.amber);
    y += 19;
    this.row(ctx, x, y, 'NOISE', p.noiseWord, p.noiseWord === 'LOUD' ? MV.COLORS.danger : MV.COLORS.text);
    y += 19;
    this.row(ctx, x, y, 'SECRET LOOT', p.secretFound ? 'CROWN STAMP — FOUND' : '? — HIDDEN SOMEWHERE', p.secretFound ? MV.COLORS.gold : MV.COLORS.dim);
    y += 21;
    ctx.fillStyle = MV.COLORS.dim;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText('GOAL', x, y);
    ctx.fillStyle = MV.COLORS.text;
    ctx.font = '600 12px system-ui, sans-serif';
    const goal = this.goalWord(game);
    ctx.fillText(goal.length > 46 ? goal.slice(0, 46) : goal, x, y + 16);
    if (goal.length > 46) ctx.fillText(goal.slice(46), x, y + 32);
    y += 52;

    // Gadgets.
    this.section(ctx, x, y, 'GADGETS');
    y += 24;
    ctx.fillStyle = MV.COLORS.gold;
    for (let i = 0; i < game.coins; i++) {
      ctx.beginPath();
      ctx.arc(x + 8 + i * 20, y - 4, 6, 0, 6.29);
      ctx.fill();
    }
    ctx.fillStyle = MV.COLORS.text;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText('COINS — CLICK TO THROW', x + 74, y);
    y += 20;
    ctx.fillText('DUMP BAG — Q (drop loot, run light)', x, y);
    y += 16;

    // Guards.
    this.section(ctx, x, y, 'GUARDS');
    y += 22;
    for (const g of game.guards) {
      const d = Math.round(MV.Geo.dist(g.x, g.y, p.x, p.y) / 10);
      ctx.fillStyle = g.def.color;
      ctx.beginPath();
      ctx.arc(x + 5, y - 4, 5, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = MV.COLORS.text;
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillText(g.name, x + 16, y);
      const state = g.mode === 'chase' ? 'HUNTING' : g.seesPlayer ? 'SEES YOU' : g.mode === 'phone' ? 'ON PHONE' : g.mode === 'investigate' || g.mode === 'look' ? 'CHECKING' : 'PATROL';
      ctx.fillStyle = state === 'HUNTING' ? MV.COLORS.danger : state === 'SEES YOU' ? MV.COLORS.amber : MV.COLORS.dim;
      ctx.textAlign = 'right';
      ctx.fillText(`${state} · ${d}m`, MV.W - 14, y);
      ctx.textAlign = 'left';
      y += 18;
    }
    y += 6;

    // Bank map, schematic.
    this.section(ctx, x, y, 'BANK MAP');
    y += 12;
    const mw2 = MV.W - X - 28;
    const mh = 118;
    const sx = mw2 / 928;
    const sy = mh / 758;
    ctx.fillStyle = '#0a0e15';
    ctx.fillRect(x, y, mw2, mh);
    for (const r of MV.Level.rooms) {
      ctx.fillStyle = r.id === 'vault' ? '#3a3f47' : '#232d42';
      ctx.fillRect(x + r.x * sx, y + r.y * sy, r.w * sx, r.h * sy);
      ctx.strokeStyle = MV.COLORS.panelLine;
      ctx.strokeRect(x + r.x * sx, y + r.y * sy, r.w * sx, r.h * sy);
    }
    ctx.fillStyle = game.player.hasDiamond ? '#7dd87d' : '#8a2f27';
    ctx.fillRect(x + 40 * sx, y + 700 * sy, 110 * sx, 44 * sy);
    if (!game.diamondTaken) {
      ctx.fillStyle = MV.COLORS.gold;
      ctx.beginPath();
      ctx.arc(x + 773 * sx, y + 619 * sy, 3.5, 0, 6.29);
      ctx.fill();
    }
    for (const g of game.guards) {
      ctx.fillStyle = g.def.color;
      ctx.beginPath();
      ctx.arc(x + g.x * sx, y + g.y * sy, 3, 0, 6.29);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + p.x * sx, y + p.y * sy, 3.6, 0, 6.29);
    ctx.fill();
    y += mh + 18;

    // Legend.
    this.section(ctx, x, y, 'LEGEND');
    y += 21;
    const legend = [
      ['#dde5f2', 'Pillar — blocks sight'],
      ['rgba(255,214,90,0.85)', 'Vision cone — stay out'],
      ['rgba(255,83,71,0.85)', 'Camera — dies with the power'],
      ['#ff5347', 'Laser — cross on the blink'],
      ['#c8f4ff', 'Star Diamond — the prize'],
      ['#7dd87d', 'Exit — opens after the diamond'],
    ];
    ctx.font = '600 11.5px system-ui, sans-serif';
    for (const [c, label] of legend) {
      ctx.fillStyle = c;
      ctx.fillRect(x, y - 8, 10, 10);
      ctx.fillStyle = MV.COLORS.text;
      ctx.fillText(label, x + 17, y);
      y += 16;
    }
    y += 4;

    // Controls.
    this.section(ctx, x, y, 'CONTROLS');
    y += 20;
    ctx.fillStyle = MV.COLORS.text;
    ctx.font = '600 11.5px system-ui, sans-serif';
    const controls = [
      'WASD / Arrows — Move',
      'SHIFT — Sneak (slow, silent)',
      'E — Interact: switch, vault door',
      'CLICK — Throw a coin',
      'Q — Dump the bag    R — Restart',
      'M — Mute',
    ];
    for (const c of controls) {
      ctx.fillText(c, x, y);
      y += 15;
    }
  },

  overlay(ctx, title, titleColor, lines, footer) {
    ctx.fillStyle = 'rgba(5, 8, 13, 0.82)';
    ctx.fillRect(0, MV.TOP, MV.FIELD_W, MV.H - MV.TOP);
    ctx.textAlign = 'center';
    ctx.fillStyle = titleColor;
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillText(title, MV.FIELD_W / 2, 210);
    ctx.fillStyle = MV.COLORS.text;
    ctx.font = '600 16px system-ui, sans-serif';
    let y = 262;
    for (const line of lines) {
      ctx.fillText(line, MV.FIELD_W / 2, y);
      y += 27;
    }
    ctx.fillStyle = MV.COLORS.gold;
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(footer, MV.FIELD_W / 2, y + 22);
    ctx.textAlign = 'left';
  },

  titleScreen(ctx) {
    this.overlay(
      ctx,
      'THE MIDNIGHT VAULT',
      MV.COLORS.gold,
      [
        'Tonight, one thief — they call him Hantu, the Ghost — walks into',
        'Bank Swasta Nusantara. In its vault sits the Star Diamond, gone',
        'to a museum under guard at dawn. It has to be tonight.',
        '',
        'Lift the keycard from Pak Darma. Cut the power if you dare.',
        'Every kilo you steal slows you down and makes you louder.',
        'Take the diamond, and the whole bank locks down behind you.',
      ],
      'Press ENTER to begin the heist'
    );
  },

  caughtScreen(ctx, game) {
    this.overlay(
      ctx,
      'CAUGHT',
      MV.COLORS.danger,
      [
        game.caughtReason,
        '',
        `He carried ${this.fmtMoney(game.player.bagValue)} for ${this.fmtTime(game.time)} before the net closed.`,
        'The vault keeps its secret for one more night.',
      ],
      'Press R to try again'
    );
  },

  winScreen(ctx, game) {
    const p = game.player;
    const rating = game.rating();
    this.overlay(
      ctx,
      'CLEAN GETAWAY',
      MV.COLORS.calm,
      [
        `The Star Diamond is gone before dawn, and so is Hantu.`,
        '',
        `Loot carried out: ${this.fmtMoney(p.bagValue)} in ${p.lootCount} pieces, ${p.bagKg.toFixed(1)} kg`,
        `Time inside: ${this.fmtTime(game.time)} · Alarms raised: ${game.alarms}`,
        `Closest call: detection peaked at ${Math.round(game.maxMeter)}%`,
        p.secretFound ? 'The Crown Stamp went with him too. Nobody will miss it for years.' : 'Something small and priceless stayed behind, unfound.',
        '',
        `RATING: ${rating}`,
      ],
      'Press R to run it again'
    );
  },
};
