import { useState, useEffect } from 'react';
import useLatestSession from '../hooks/useLatestSession';
import useSessionStatus from '../hooks/useSessionStatus';
import useLivePolling from '../hooks/useLivePolling';
import {
  getDrivers, getLatestPositions, getLatestIntervals, getLatestLaps,
  getStints, getWeather, getRaceControl,
} from '../api/openf1';
import SessionBadge from '../components/SessionBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import { getTeamColor } from '../utils/driverColors';
import { formatLapTime, degreesToCardinal } from '../utils/timeFormatters';
import { POLL_INTERVAL_LIVE_TIMING, POLL_INTERVAL_WEATHER, TIRE_COLORS, COMPOUND_LABEL } from '../utils/constants';
import '../App.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function currentTire(stints, driverNumber) {
  const ds = stints.filter(s => s.driver_number === driverNumber);
  if (!ds.length) return null;
  return ds.reduce((a, b) => (a.stint_number > b.stint_number ? a : b));
}

function buildRows(drivers, positions, intervals, laps, stints) {
  const driverMap = Object.fromEntries(drivers.map(d => [d.driver_number, d]));
  const intMap    = Object.fromEntries(intervals.map(i => [i.driver_number, i]));
  const lapMap    = Object.fromEntries(laps.map(l => [l.driver_number, l]));

  return positions.map(p => {
    const driver   = driverMap[p.driver_number] || {};
    const interval = intMap[p.driver_number]    || {};
    const lap      = lapMap[p.driver_number]    || {};
    const stint    = currentTire(stints, p.driver_number);
    return {
      position:     p.position,
      driverNumber: p.driver_number,
      code:         driver.name_acronym || `${p.driver_number}`,
      fullName:     driver.full_name || '',
      team:         driver.team_name || '',
      lapNumber:    lap.lap_number   ?? null,
      lapDuration:  lap.lap_duration ?? null,
      gapToLeader:  interval.gap_to_leader ?? null,
      interval:     interval.interval      ?? null,
      color:        getTeamColor(driver.team_name),
      compound:     stint?.compound  ?? null,
      tyreAge:      stint?.tyre_age_at_start != null && lap.lap_number != null
                      ? lap.lap_number - (stint.lap_start ?? 0) + 1
                      : null,
      pitCount:     stints.filter(s => s.driver_number === p.driver_number).length - 1,
    };
  });
}

function fmtGap(val, isLeader) {
  if (isLeader) return '—';
  if (val == null) return '—';
  return `+${Number(val).toFixed(3)}`;
}

// ── Tire badge ────────────────────────────────────────────────────────────────
function TireBadge({ compound, age }) {
  if (!compound) return <span style={{ color: '#333' }}>—</span>;
  const color = TIRE_COLORS[(compound || '').toUpperCase()] || '#555';
  const label = COMPOUND_LABEL[(compound || '').toUpperCase()] || '?';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        background: color, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 900, color: color === '#ffffff' ? '#000' : '#000',
        flexShrink: 0,
      }}>
        {label}
      </span>
      {age != null && (
        <span style={{ fontSize: 10, color: '#555' }}>{age}L</span>
      )}
    </span>
  );
}

// ── Race control feed ─────────────────────────────────────────────────────────
function RaceControlFeed({ messages }) {
  const FLAG_COLORS = {
    GREEN: '#00cc44', YELLOW: '#ffd700', RED: '#e8002d',
    BLUE: '#0088ff', CHEQUERED: '#fff', CLEAR: '#00cc44',
  };

  const filtered = messages
    .filter(m => m.message || m.flag)
    .slice(-20)
    .reverse();

  if (!filtered.length) return <span style={{ color: '#333', fontSize: 12 }}>No messages</span>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {filtered.map((m, i) => {
        const flagColor = FLAG_COLORS[(m.flag || '').toUpperCase()];
        return (
          <div key={i} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            padding: '5px 0', borderBottom: '1px solid #111', fontSize: 11,
          }}>
            {flagColor && (
              <span style={{
                width: 8, height: 8, borderRadius: 1, background: flagColor,
                flexShrink: 0, marginTop: 2,
              }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ color: '#bbb', lineHeight: 1.4 }}>{m.message}</div>
              {m.lap_number && (
                <div style={{ color: '#444', fontSize: 10, marginTop: 1 }}>Lap {m.lap_number}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Weather widget ────────────────────────────────────────────────────────────
function WeatherWidget({ data }) {
  if (!data || !data.length) return <span style={{ color: '#333', fontSize: 12 }}>No data</span>;
  const w = data[data.length - 1];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
      {[
        ['Air',     `${w.air_temperature ?? '—'}°C`],
        ['Track',   `${w.track_temperature ?? '—'}°C`],
        ['Humidity',`${w.humidity ?? '—'}%`],
        ['Wind',    `${w.wind_speed ?? '—'} km/h ${degreesToCardinal(w.wind_direction)}`],
        ['Rain',    w.rainfall ? '🌧 WET' : '☀ DRY'],
      ].map(([label, val]) => (
        <div key={label}>
          <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
          <div style={{ fontSize: 12, color: '#bbb', fontWeight: 600 }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ── Fastest lap card ──────────────────────────────────────────────────────────
function FastestLapCard({ rows }) {
  const valid = rows.filter(r => r.lapDuration);
  if (!valid.length) return null;
  const fl = valid.reduce((a, b) => a.lapDuration < b.lapDuration ? a : b);
  return (
    <div style={{ background: '#0e0014', border: '1px solid #44006a', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 9, color: '#aa00ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        ⬟ Fastest Lap
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{fl.code}</span>
          <span style={{ color: '#555', fontSize: 10, marginLeft: 6 }}>{fl.team}</span>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#aa00ff', fontWeight: 700 }}>
          {formatLapTime(fl.lapDuration)}
        </span>
      </div>
      {fl.lapNumber && <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>Lap {fl.lapNumber}</div>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LiveTiming() {
  const { sessionKey, session, meeting, loading: sessionLoading } = useLatestSession();
  const status  = useSessionStatus(session);
  const isLive  = status === 'live';
  const poll    = isLive ? POLL_INTERVAL_LIVE_TIMING : null;
  const pollW   = isLive ? POLL_INTERVAL_WEATHER : null;

  const [drivers, setDrivers] = useState([]);
  const [stints,  setStints]  = useState([]);

  useEffect(() => {
    if (!sessionKey) return;
    getDrivers(sessionKey).then(setDrivers).catch(() => {});
    getStints(sessionKey).then(setStints).catch(() => {});
  }, [sessionKey]);

  const { data: positions, error: posError } = useLivePolling(
    () => getLatestPositions(sessionKey), poll, [sessionKey]);
  const { data: intervals } = useLivePolling(
    () => getLatestIntervals(sessionKey), poll, [sessionKey]);
  const { data: laps, loading: lapsLoading, lastUpdated } = useLivePolling(
    () => getLatestLaps(sessionKey), poll, [sessionKey]);
  const { data: weather } = useLivePolling(
    () => getWeather(sessionKey), pollW, [sessionKey]);
  const { data: raceControl } = useLivePolling(
    () => getRaceControl(sessionKey), poll, [sessionKey]);

  if (sessionLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <LoadingSpinner message="Resolving session…" />
    </div>
  );

  const rows = (positions && intervals && laps && drivers.length)
    ? buildRows(drivers, positions, intervals, laps, stints)
    : [];

  const leaderLap = rows[0]?.lapNumber;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 280px',
      gridTemplateRows: 'auto 1fr',
      height: 'calc(100vh - 100px)',
      overflow: 'hidden',
      background: '#080808',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        gridColumn: '1 / -1',
        background: '#0c0c0c', borderBottom: '1px solid #1a1a1a',
        padding: '8px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SessionBadge status={status} />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
            {meeting?.meeting_name || '—'}
          </span>
          <span style={{ color: '#555', fontSize: 12 }}>
            {session?.session_name}
          </span>
          {leaderLap && (
            <span style={{
              background: '#1a1a1a', border: '1px solid #333',
              borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#888',
            }}>
              LAP {leaderLap}
            </span>
          )}
        </div>
        <div style={{ color: '#333', fontSize: 10 }}>
          {lastUpdated && `↻ ${lastUpdated.toLocaleTimeString()}`}
        </div>
      </div>

      {/* ── Timing tower ── */}
      <div style={{ overflowY: 'auto', background: '#080808' }}>
        {posError && <ErrorBanner message={posError} />}

        {lapsLoading && !rows.length
          ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <LoadingSpinner message="Loading timing…" />
            </div>
          : !rows.length
          ? <div style={{ padding: 40, textAlign: 'center', color: '#333' }}>
              {status === 'upcoming' ? 'Session has not started yet.' : 'No timing data available.'}
            </div>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0c0c0c', borderBottom: '2px solid #e8002d' }}>
                  {['POS','DRIVER','TEAM','TIRE','LAP','LAST LAP','GAP','INTERVAL','PITS'].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: h === 'POS' ? 'center' : 'left',
                      fontSize: 9, color: '#555', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isP1 = row.position === 1;
                  const rowBg = i % 2 === 0 ? '#080808' : '#0a0a0a';
                  return (
                    <tr key={row.driverNumber}
                      style={{ background: rowBg, borderBottom: '1px solid #111' }}>

                      {/* POS */}
                      <td style={{ padding: '10px 12px', textAlign: 'center', width: 40 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                          background: row.position <= 3
                            ? ['#d4af37','#888','#7c4a1e'][row.position-1]
                            : '#111',
                          color: row.position <= 3 ? '#000' : '#666',
                        }}>
                          {row.position}
                        </span>
                      </td>

                      {/* DRIVER */}
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 3, height: 20, background: row.color,
                            borderRadius: 1, flexShrink: 0,
                          }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', color: '#fff' }}>
                              {row.code}
                            </div>
                            <div style={{ fontSize: 10, color: '#444' }}>{row.fullName}</div>
                          </div>
                        </div>
                      </td>

                      {/* TEAM */}
                      <td style={{ padding: '10px 12px', fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>
                        {row.team}
                      </td>

                      {/* TIRE */}
                      <td style={{ padding: '10px 12px' }}>
                        <TireBadge compound={row.compound} age={row.tyreAge} />
                      </td>

                      {/* LAP */}
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#666', textAlign: 'center' }}>
                        {row.lapNumber ?? '—'}
                      </td>

                      {/* LAST LAP */}
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#ccc', whiteSpace: 'nowrap' }}>
                        {row.lapDuration ? formatLapTime(row.lapDuration) : '—'}
                      </td>

                      {/* GAP */}
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12,
                        color: isP1 ? '#555' : '#e8002d', whiteSpace: 'nowrap' }}>
                        {fmtGap(row.gapToLeader, isP1)}
                      </td>

                      {/* INTERVAL */}
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12,
                        color: '#666', whiteSpace: 'nowrap' }}>
                        {fmtGap(row.interval, isP1)}
                      </td>

                      {/* PITS */}
                      <td style={{ padding: '10px 12px', fontSize: 11, color: '#444', textAlign: 'center' }}>
                        {row.pitCount > 0 ? row.pitCount : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </div>

      {/* ── Right sidebar ── */}
      <div style={{
        borderLeft: '1px solid #1a1a1a',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 0,
        background: '#0c0c0c',
      }}>

        {/* Fastest lap */}
        {rows.length > 0 && (
          <div style={{ padding: 14, borderBottom: '1px solid #1a1a1a' }}>
            <FastestLapCard rows={rows} />
          </div>
        )}

        {/* Weather */}
        <div style={{ padding: 14, borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Weather
          </div>
          <WeatherWidget data={weather} />
        </div>

        {/* Race control */}
        <div style={{ padding: 14, flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Race Control
          </div>
          <RaceControlFeed messages={raceControl || []} />
        </div>
      </div>

    </div>
  );
}
