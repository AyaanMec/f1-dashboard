/**
 * Determine the status of an OpenF1 session object.
 * @param {Object|null} session
 * @returns {'live'|'finished'|'upcoming'|'unknown'}
 */
export default function useSessionStatus(session) {
  if (!session) return 'unknown';
  const now = Date.now();
  const start = session.date_start ? new Date(session.date_start).getTime() : null;
  const end = session.date_end ? new Date(session.date_end).getTime() : null;

  if (!start) return 'unknown';
  if (now < start) return 'upcoming';
  if (end && now > end) return 'finished';
  // Within window
  if (end && now >= start && now <= end) return 'live';
  // No end time — assume 4-hour max session duration
  if (now >= start && now <= start + 4 * 3600 * 1000) return 'live';
  return 'finished';
}
