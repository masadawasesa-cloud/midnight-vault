// The Midnight Vault — shared constants: stage size, palette and tuning.
// Every other file reads from this one object, declared here exactly once.
'use strict';

const MV = {
  W: 1280, // full canvas width, panel included
  H: 800, // full canvas height
  TOP: 42, // height of the status strip above the playfield
  FIELD_W: 928, // playfield width, the panel takes the rest
  PANEL_X: 928,

  STEP: 1 / 60, // fixed timestep, seconds

  // The thief
  PLAYER_R: 13,
  WALK_SPEED: 172,
  SNEAK_FACTOR: 0.55,
  WEIGHT_SLOW_PER_KG: 0.028, // top speed lost per kilo carried
  WEIGHT_SLOW_MAX: 0.45,

  // Being seen
  METER_MAX: 100,
  METER_DRAIN: 15, // per second while nobody sees the player
  GUARD_FILL_FAR: 16, // per second at the edge of a vision cone
  GUARD_FILL_NEAR: 62, // per second at point blank
  CAMERA_FILL: 46,
  LASER_FILL: 40,
  SNEAK_FILL_FACTOR: 0.55,

  // Guards
  CONE_RANGE: 232,
  CONE_RANGE_DARK: 178, // flashlight reach once the power is cut
  CONE_HALF: 0.46, // radians
  CONE_HALF_DARK: 0.4,
  CHASE_TIME: 4.2, // seconds a full meter buys the hunters
  LOCKDOWN_SECONDS: 75,

  COINS_START: 3,
  COIN_RANGE: 340,
  COIN_LURE_RADIUS: 160,

  COLORS: {
    ink: '#0d1119',
    panelBg: '#10151f',
    panelLine: '#2a3446',
    text: '#c7d2e4',
    dim: '#8fa3c0',
    gold: '#ffd94d',
    danger: '#ff5347',
    calm: '#7dd87d',
    amber: '#ffb347',
    cone: 'rgba(255, 214, 90, 0.20)',
    coneEdge: 'rgba(255, 214, 90, 0.5)',
    torch: 'rgba(255, 240, 190, 0.16)',
    camCone: 'rgba(255, 83, 71, 0.16)',
  },
};
