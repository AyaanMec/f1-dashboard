/**
 * Convert a lap time string (H:MM:SS.mmm or MM:SS.mmm or SS.mmm) to seconds.
 */
export function lapTimeToSeconds(timeStr) {
  if (!timeStr || timeStr === 'nan' || timeStr === '') return null;
  const parts = String(timeStr).split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(parts[0]);
}

/**
 * Format seconds into a human-readable lap time string (M:SS.mmm).
 */
export function formatLapTime(seconds) {
  if (seconds == null || isNaN(seconds)) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${mins}:${secs}`;
}

/**
 * Format an interval/gap value (seconds float) as +X.XXX or the raw string.
 */
export function formatGap(value) {
  if (value == null) return '--';
  if (typeof value === 'string') return value;
  if (value === 0) return 'Leader';
  return `+${value.toFixed(3)}`;
}

/**
 * Convert wind direction in degrees to a compass cardinal string.
 */
export function degreesToCardinal(deg) {
  if (deg == null) return '--';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * Format a date string into a short human-readable format.
 */
export function formatRaceDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a datetime string into local time display.
 */
export function formatSessionTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}
