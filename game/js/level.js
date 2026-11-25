// The Midnight Vault — the bank floor: rooms, walls, furniture, loot,
// lasers, cameras and patrol routes. One big floor in five zones: lobby,
// teller hall, security room, deposit room and the vault itself.
'use strict';

// MV itself is declared once, in config.js — every file shares that object.

MV.Level = {
  // Room rectangles in world coordinates, used for floors and the minimap.
  rooms: [
    { id: 'lobby', name: 'LOBBY', x: 14, y: 14, w: 286, h: 730 },
    { id: 'teller', name: 'TELLER HALL', x: 312, y: 14, w: 328, h: 730 },
    { id: 'security', name: 'SECURITY', x: 652, y: 14, w: 262, h: 226 },
    { id: 'deposit', name: 'DEPOSIT BOXES', x: 652, y: 252, w: 262, h: 248 },
    { id: 'vault', name: 'THE VAULT', x: 652, y: 512, w: 262, h: 232 },
  ],

  build() {
    const solids = []; // blocks movement
    const blockers = []; // blocks sight (a subset of the world)
    const add = (x, y, w, h, kind, sight) => {
      const r = { x, y, w, h, kind };
      solids.push(r);
      if (sight) blockers.push(r);
      return r;
    };

    // Outer shell. The bottom wall leaves a gap at the loading dock.
    add(0, 0, 928, 14, 'wall', true);
    add(0, 744, 40, 14, 'wall', true);
    add(150, 744, 778, 14, 'wall', true);
    add(0, 0, 14, 758, 'wall', true);
    add(914, 0, 14, 758, 'wall', true);

    // Wall A, lobby | teller hall, with three door gaps.
    add(300, 14, 12, 106, 'wall', true);
    add(300, 160, 12, 120, 'wall', true);
    add(300, 320, 12, 220, 'wall', true);
    add(300, 580, 12, 164, 'wall', true);

    // Wall B, teller hall | east rooms, with the security and deposit doors.
    add(640, 14, 12, 96, 'wall', true);
    add(640, 150, 12, 200, 'wall', true);
    add(640, 390, 12, 196, 'wall', true);
    add(640, 654, 12, 90, 'wall', true);

    // Walls C and D, dividing the east rooms from each other.
    add(640, 240, 274, 12, 'wall', true);
    add(640, 500, 274, 12, 'wall', true);

    // Lobby furniture: ATMs on the west wall, planters, a bench, rope line.
    add(14, 120, 40, 64, 'atm', true);
    add(14, 264, 40, 64, 'atm', true);
    add(14, 408, 40, 64, 'atm', true);
    add(250, 80, 36, 36, 'planter', true);
    add(250, 640, 36, 36, 'planter', true);
    add(90, 600, 120, 26, 'bench', false);
    add(90, 470, 150, 6, 'rope', false);

    // Teller hall: marble pillars, the long counter, desks, a cabinet.
    add(368, 240, 30, 30, 'pillar', true);
    add(540, 240, 30, 30, 'pillar', true);
    add(368, 500, 30, 30, 'pillar', true);
    add(540, 500, 30, 30, 'pillar', true);
    add(346, 352, 248, 26, 'counter', true);
    add(360, 90, 90, 40, 'desk', true);
    add(490, 640, 90, 40, 'desk', true);
    add(596, 60, 30, 90, 'cabinet', true);

    // Security room: the console with the power switch, server racks.
    add(700, 30, 150, 36, 'console', false);
    add(880, 60, 22, 120, 'rack', true);
    add(652, 120, 22, 80, 'rack', true);

    // Deposit room: box rows, the east box wall, a table for the gold.
    add(652, 262, 120, 22, 'boxes', false);
    add(652, 458, 120, 22, 'boxes', false);
    add(880, 300, 22, 140, 'boxes', true);
    add(730, 350, 90, 44, 'table', false);

    // The vault: pedestal and two loot carts.
    add(758, 604, 30, 30, 'pedestal', false);
    add(680, 690, 54, 30, 'cart', false);
    add(820, 540, 54, 30, 'cart', false);

    // The vault door itself: solid until the keycard opens it.
    const vaultDoor = add(640, 586, 12, 68, 'vaultdoor', true);

    const loot = [
      { kind: 'cash', x: 400, y: 365, value: 400, kg: 1.2, label: 'Cash stack' },
      { kind: 'cash', x: 470, y: 365, value: 400, kg: 1.2, label: 'Cash stack' },
      { kind: 'cash', x: 540, y: 365, value: 400, kg: 1.2, label: 'Cash stack' },
      { kind: 'cash', x: 405, y: 110, value: 400, kg: 1.2, label: 'Cash stack' },
      { kind: 'watch', x: 535, y: 660, value: 600, kg: 0.4, label: 'Gold watch' },
      { kind: 'gold', x: 752, y: 372, value: 1500, kg: 4, label: 'Gold bar' },
      { kind: 'gold', x: 797, y: 372, value: 1500, kg: 4, label: 'Gold bar' },
      { kind: 'gems', x: 700, y: 469, value: 900, kg: 0.8, label: 'Gem pouch' },
      { kind: 'cash', x: 707, y: 705, value: 800, kg: 1.2, label: 'Vault cash' },
      { kind: 'gold', x: 847, y: 555, value: 1500, kg: 4, label: 'Gold bar' },
      { kind: 'stamp', x: 862, y: 320, value: 2500, kg: 0.1, label: 'Crown Stamp', secret: true },
      { kind: 'diamond', x: 773, y: 619, value: 10000, kg: 0.5, label: 'The Star Diamond', goal: true },
    ].map((it, i) => ({ id: i, taken: false, bob: Math.random() * 6.28, ...it }));

    const lasers = [
      { x1: 700, y1: 566, x2: 856, y2: 566, phase: 0 },
      { x1: 700, y1: 672, x2: 856, y2: 672, phase: 1.3 },
      { x1: 726, y1: 580, x2: 726, y2: 660, phase: 0.7 },
    ];

    const cameras = [
      { x: 618, y: 40, base: 2.35, sweep: 0.55, speed: 0.5, range: 245 },
      { x: 282, y: 40, base: 2.6, sweep: 0.5, speed: 0.38, range: 235 },
    ];

    return {
      solids,
      blockers,
      vaultDoor,
      doorOpen: false,
      loot,
      lasers,
      cameras,
      exitZone: { x: 40, y: 700, w: 110, h: 44 },
      powerSwitch: { x: 775, y: 48 },
      spawn: { x: 90, y: 690 },
    };
  },

  patrols: {
    darma: {
      name: 'Pak Darma', role: 'Supervisor — carries the keycard', speed: 46, pause: 1.8,
      fill: 0.9, keycard: true, color: '#5b7ba6',
      quips: ['One more month to retirement…', 'Everything in its place.', 'Hm. Did I lock the side door?'],
      route: [[120, 140], [520, 140], [520, 300], [120, 300]],
    },
    bima: {
      name: 'Bima', role: 'Diligent — suspects fast', speed: 74, pause: 0.7,
      fill: 1.25, color: '#7a4a56',
      quips: ['All clear. All clear.', 'Stay sharp, Bima.', 'Night shift again…'],
      route: [[470, 120], [618, 300], [618, 470], [322, 470], [322, 300]],
    },
    sari: {
      name: 'Sari', role: 'Checks her phone — long pauses', speed: 58, pause: 1.1,
      fill: 1.0, phone: true, color: '#4a7a68',
      quips: ['One more scroll…', 'Hehe. That cat again.', 'Five more minutes.'],
      route: [[690, 300], [856, 300], [856, 440], [690, 440]],
    },
    rudi: {
      name: 'Rudi', role: 'Backup — called in by the alarm', speed: 82, pause: 0.5,
      fill: 1.15, color: '#6a5a8a',
      quips: ['Nobody leaves. Nobody.', 'Seal every door!'],
      route: [[120, 560], [520, 560], [520, 300], [120, 300]],
    },
  },
};
