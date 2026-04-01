export const OPENF1_BASE = 'https://api.openf1.org/v1';
export const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

export const POLL_INTERVAL_LIVE_TIMING = 5_000;
export const POLL_INTERVAL_WEATHER = 30_000;
export const POLL_INTERVAL_SESSION = 600_000;

export const CURRENT_YEAR = new Date().getFullYear();
// Years available for selection (F1 started 1950, allow up to next year)
export const MIN_YEAR = 1950;
export const MAX_YEAR = CURRENT_YEAR + 1;

export const TIRE_COLORS = {
  SOFT: '#e8002d',
  MEDIUM: '#ffd700',
  HARD: '#ffffff',
  INTER: '#43b02a',
  WET: '#0067ff',
  UNKNOWN: '#888888',
};

export const COMPOUND_LABEL = {
  SOFT: 'S',
  MEDIUM: 'M',
  HARD: 'H',
  INTER: 'I',
  WET: 'W',
};

export const SESSION_TYPE_LABELS = {
  Race: 'Race',
  Qualifying: 'Qualifying',
  Sprint: 'Sprint',
  'Sprint Qualifying': 'Sprint Quali',
  'Practice 1': 'FP1',
  'Practice 2': 'FP2',
  'Practice 3': 'FP3',
};

export const TELEMETRY_COLORS = {
  speed: '#00d4ff',
  throttle: '#00ff88',
  brake: '#ff3333',
  rpm: '#ff9900',
  gear: '#ffffff',
  drs: '#aa00ff',
};
