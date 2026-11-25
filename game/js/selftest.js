// The Midnight Vault — a scripted self-test, run only with ?test=1.
// It plays the game with the dev hooks: guards patrol, then the thief is
// walked through the whole heist (keycard, power, vault, diamond, exit)
// and the results are written into the page for a headless browser to read.
'use strict';

window.addEventListener('DOMContentLoaded', () => {
  if (!new URLSearchParams(location.search).has('test')) return;
  const game = window.__game;
  const out = [];
  const step = (ms) => {
    const n = Math.round(ms / (1000 / 60));
    for (let i = 0; i < n; i++) game.update(MV.STEP);
  };
  try {
    game.mode = 'play';

    // 1. Forty-five seconds of patrol: every guard must cover real ground.
    const path = game.guards.map(() => 0);
    let prev = game.guards.map((g) => [g.x, g.y]);
    for (let i = 0; i < 450; i++) {
      step(100);
      game.guards.forEach((g, j) => {
        path[j] += MV.Geo.dist(g.x, g.y, prev[j][0], prev[j][1]);
        prev[j] = [g.x, g.y];
      });
    }
    out.push(`patrol paths: ${path.map((v) => Math.round(v)).join(', ')}`);
    out.push(`meter after idle at spawn: ${Math.round(game.meter)}`);

    // 2. Pickpocket: stay glued behind Pak Darma for just over a second.
    const darma = game.guards[0];
    for (let i = 0; i < 14 && !game.player.hasKeycard; i++) {
      game.player.x = darma.x - Math.cos(darma.angle) * 26;
      game.player.y = darma.y - Math.sin(darma.angle) * 26;
      step(100);
    }
    out.push(`keycard: ${game.player.hasKeycard}`);

    // 3. Cut the power at the security console.
    game.player.x = 775;
    game.player.y = 92;
    MV.Input.keys['e'] = true;
    step(40);
    MV.Input.keys['e'] = false;
    step(40);
    out.push(`powerOff: ${game.powerOff}`);

    // 4. Open the vault door with the card.
    game.player.x = 616;
    game.player.y = 620;
    MV.Input.keys['e'] = true;
    step(40);
    MV.Input.keys['e'] = false;
    step(40);
    out.push(`doorOpen: ${game.level.doorOpen}`);

    // 5. Take the diamond: the lockdown and the fourth guard arrive.
    game.player.x = 773;
    game.player.y = 642;
    step(120);
    out.push(`diamond: ${game.player.hasDiamond}, lockdown: ${Math.round(game.lockdown)}, guards: ${game.guards.length}`);

    // 6. Reach the loading dock: the run is won.
    game.player.x = 95;
    game.player.y = 720;
    step(120);
    out.push(`final mode: ${game.mode}`);
    out.push(`rating line: ${game.mode === 'win' ? game.rating() : 'n/a'}`);
    out.push('SELFTEST DONE');
  } catch (err) {
    out.push(`SELFTEST ERROR: ${err.message}`);
  }
  const pre = document.createElement('pre');
  pre.id = 'testout';
  pre.textContent = out.join('\n');
  document.body.appendChild(pre);
});
