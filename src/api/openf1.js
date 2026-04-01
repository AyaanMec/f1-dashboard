import { OPENF1_BASE } from '../utils/constants';

async function fetchOpenF1(endpoint, params = {}) {
  const url = new URL(`${OPENF1_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const delays = [1000, 2000, 4000];
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url.toString());
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, delays[attempt]));
      continue;
    }
    if (!res.ok) throw new Error(`OpenF1 ${endpoint} returned ${res.status}`);
    return res.json();
  }
  throw new Error(`OpenF1 ${endpoint} rate limited`);
}

export async function getMeetings(year) {
  return fetchOpenF1('meetings', { year });
}

export async function getLatestMeeting(year) {
  const meetings = await getMeetings(year || new Date().getFullYear());
  const now = Date.now();
  const past = meetings
    .filter(m => new Date(m.date_start).getTime() <= now)
    .sort((a, b) => new Date(b.date_start) - new Date(a.date_start));
  return past[0] || null;
}

export async function getMeetingByKey(meetingKey) {
  const res = await fetchOpenF1('meetings', { meeting_key: meetingKey });
  return res[0] || null;
}

export async function getSessions(meetingKey) {
  return fetchOpenF1('sessions', { meeting_key: meetingKey });
}

export async function getSessionByKey(sessionKey) {
  const res = await fetchOpenF1('sessions', { session_key: sessionKey });
  return res[0] || null;
}

export async function getLatestRaceSession(meetingKey) {
  const sessions = await getSessions(meetingKey);
  // Prefer Race session; fall back to latest session by date
  const race = sessions.find(s => s.session_type === 'Race');
  if (race) return race;
  return sessions.sort((a, b) => new Date(b.date_start) - new Date(a.date_start))[0] || null;
}

export async function getDrivers(sessionKey) {
  return fetchOpenF1('drivers', { session_key: sessionKey });
}

export async function getLaps(sessionKey, driverNumber) {
  const params = { session_key: sessionKey };
  if (driverNumber) params.driver_number = driverNumber;
  return fetchOpenF1('laps', params);
}

export async function getCarData(sessionKey, driverNumber) {
  return fetchOpenF1('car_data', { session_key: sessionKey, driver_number: driverNumber });
}

export async function getIntervals(sessionKey) {
  return fetchOpenF1('intervals', { session_key: sessionKey });
}

export async function getPositions(sessionKey) {
  return fetchOpenF1('position', { session_key: sessionKey });
}

export async function getStints(sessionKey, driverNumber) {
  const params = { session_key: sessionKey };
  if (driverNumber) params.driver_number = driverNumber;
  return fetchOpenF1('stints', params);
}

export async function getPitStops(sessionKey) {
  return fetchOpenF1('pit', { session_key: sessionKey });
}

export async function getTeamRadio(sessionKey) {
  return fetchOpenF1('team_radio', { session_key: sessionKey });
}

export async function getWeather(sessionKey) {
  return fetchOpenF1('weather', { session_key: sessionKey });
}

export async function getRaceControl(sessionKey) {
  return fetchOpenF1('race_control', { session_key: sessionKey });
}

/**
 * Location data — actual x/y/z coordinates for cars on track.
 * Omit driverNumber to get all cars.
 */
export async function getLocations(sessionKey, driverNumber) {
  const params = { session_key: sessionKey };
  if (driverNumber) params.driver_number = driverNumber;
  return fetchOpenF1('location', params);
}

/**
 * Latest x/y position per driver (last entry per driver_number).
 */
export async function getLatestLocations(sessionKey) {
  const locs = await getLocations(sessionKey);
  const latest = {};
  for (const l of locs) {
    if (!latest[l.driver_number] || l.date > latest[l.driver_number].date) {
      latest[l.driver_number] = l;
    }
  }
  return Object.values(latest);
}

/**
 * Returns the latest position entry per driver for a session.
 * OpenF1 /position returns a time-series; we want the most recent per driver.
 */
export async function getLatestPositions(sessionKey) {
  const positions = await getPositions(sessionKey);
  const latest = {};
  for (const p of positions) {
    if (!latest[p.driver_number] || p.date > latest[p.driver_number].date) {
      latest[p.driver_number] = p;
    }
  }
  return Object.values(latest).sort((a, b) => a.position - b.position);
}

/**
 * Returns the latest interval entry per driver.
 */
export async function getLatestIntervals(sessionKey) {
  const intervals = await getIntervals(sessionKey);
  const latest = {};
  for (const i of intervals) {
    if (!latest[i.driver_number] || i.date > latest[i.driver_number].date) {
      latest[i.driver_number] = i;
    }
  }
  return Object.values(latest);
}

/**
 * Returns the latest lap per driver.
 */
export async function getLatestLaps(sessionKey) {
  const laps = await getLaps(sessionKey);
  const latest = {};
  for (const l of laps) {
    if (!latest[l.driver_number] || l.lap_number > latest[l.driver_number].lap_number) {
      latest[l.driver_number] = l;
    }
  }
  return Object.values(latest);
}
