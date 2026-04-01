import { useState, useEffect } from 'react';
import { getPitStops, getStints, getRaceControl } from '../api/openf1';
import { TIRE_COLORS } from '../utils/constants';
import { getTeamColor } from '../utils/driverColors';

// ── helpers ──────────────────────────────────────────────────────────────────

function compound(name) {
  return TIRE_COLORS[(name || '').toUpperCase()] || '#555';
}

/**
 * Parse race_control messages into annotated events with a type.
 * Returns array of { lap_number, type, label, color }
 */
function parseRaceControl(messages) {
  const events = [];
  for (const m of messages) {
    const msg = (m.message || '').toUpperCase();
    const flag = (m.flag || '').toUpperCase();
    const lap = m.lap_number;
    if (!lap) continue;

    if (msg.includes('SAFETY CAR DEPLOYED') || msg.includes('SAFETY CAR PERIOD')) {
      events.push({ lap, type: 'SC', label: 'SC', color: '#ffd700' });
    } else if (msg.includes('VIRTUAL SAFETY CAR DEPLOYED') || msg.includes('VIRTUAL SAFETY CAR PERIOD')) {
      events.push({ lap, type: 'VSC', label: 'VSC', color: '#00d4ff' });
    } else if (flag === 'RED' || msg.includes('RED FLAG')) {
      events.push({ lap, type: 'RED', label: 'RED', color: '#e8002d' });
    } else if (msg.includes('SAFETY CAR IN THIS LAP') || msg.includes('SAFETY CAR ENDING')) {
      events.push({ lap, type: 'SC_END', label: 'SC↩', color: '#888' });
    } else if (msg.includes('VIRTUAL SAFETY CAR ENDING')) {
      events.push({ lap, type: 'VSC_END', label: 'VSC↩', color: '#888' });
    } else if (flag === 'CHEQUERED') {
      events.push({ lap, type: 'FINISH', label: '🏁', color: '#fff' });
    } else if (flag === 'YELLOW') {
      events.push({ lap, type: 'YELLOW', label: 'Y', color: '#ffd700' });
    }
  }
  // Deduplicate same type on same lap
  const seen = new Set();
  return events.filter(e => {
    const k = `${e.lap}-${e.type}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function LapAxis({ totalLaps, lapToX, width }) {
  const ticks = [];
  const step = totalLaps <= 30 ? 5 : totalLaps <= 60 ? 10 : 15;
  for (let l = 1; l <= totalLaps; l++) {
    if (l === 1 || l % step === 0 || l === totalLaps) ticks.push(l);
  }
  return (
    <div style={{ position: 'relative', height: 18, marginLeft: 56 }}>
      {ticks.map(l => (
        <span key={l} style={{
          position: 'absolute',
          left: lapToX(l),
          transform: 'translateX(-50%)',
          fontSize: 10, color: '#444',
        }}>
          {l}
        </span>
      ))}
    </div>
  );
}

function EventsStrip({ events, totalLaps, lapToX }) {
  return (
    <div style={{ position: 'relative', height: 22, marginLeft: 56, marginBottom: 4 }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: '#0a0a0a', borderRadius: 3 }} />
      <span style={{
        position: 'absolute', left: -52, top: '50%', transform: 'translateY(-50%)',
        fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>Events</span>
      {events.map((e, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: lapToX(e.lap),
          top: 0, bottom: 0,
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: e.color,
            color: e.color === '#fff' ? '#000' : '#000',
            fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 2,
            whiteSpace: 'nowrap', lineHeight: 1.4,
          }}>
            {e.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function DriverStintRow({ driver, stints, pits, totalLaps, lapToX, selected, onClick }) {
  const color = getTeamColor(driver?.team_name);
  const driverStints = stints.filter(s => s.driver_number === driver.driver_number);
  const driverPits = pits.filter(p => p.driver_number === driver.driver_number);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 0,
        height: 20, marginBottom: 2, cursor: 'pointer',
        background: selected ? '#141414' : 'transparent',
        borderRadius: 3,
      }}
    >
      {/* Driver label */}
      <div style={{
        width: 52, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{ width: 2, alignSelf: 'stretch', background: color, borderRadius: 1 }} />
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: selected ? color : '#666',
          letterSpacing: '0.04em',
        }}>
          {driver?.name_acronym ?? `#${driver.driver_number}`}
        </span>
      </div>

      {/* Stint bars + pit markers */}
      <div style={{ flex: 1, position: 'relative', height: 14 }}>
        {/* Base track */}
        <div style={{
          position: 'absolute', inset: '4px 0',
          background: '#1a1a1a', borderRadius: 2,
        }} />

        {/* Stint segments */}
        {driverStints.map((s, i) => {
          const lapStart = s.lap_start ?? 1;
          const lapEnd = s.lap_end ?? totalLaps;
          const left = lapToX(lapStart);
          const right = lapToX(lapEnd);
          return (
            <div key={i} title={`${s.compound} — Laps ${lapStart}–${lapEnd}`} style={{
              position: 'absolute',
              left, width: Math.max(right - left, 2),
              top: 2, bottom: 2,
              background: compound(s.compound),
              opacity: 0.75,
              borderRadius: 2,
            }} />
          );
        })}

        {/* Pit stop markers */}
        {driverPits.map((p, i) => (
          <div key={i} title={`Pit stop — Lap ${p.lap_number}${p.pit_duration ? ` (${p.pit_duration.toFixed(1)}s)` : ''}`} style={{
            position: 'absolute',
            left: lapToX(p.lap_number),
            top: 0, bottom: 0, width: 2,
            background: '#fff',
            borderRadius: 1,
            zIndex: 2,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export default function RaceTimeline({ sessionKey, drivers = [], laps = [], selectedDriverNum, onSelectDriver }) {
  const [stints, setStints] = useState([]);
  const [pits, setPits] = useState([]);
  const [raceControl, setRaceControl] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionKey) return;
    setLoading(true);
    Promise.all([
      getStints(sessionKey).catch(() => []),
      getPitStops(sessionKey).catch(() => []),
      getRaceControl(sessionKey).catch(() => []),
    ]).then(([s, p, rc]) => {
      setStints(s);
      setPits(p);
      setRaceControl(rc);
    }).finally(() => setLoading(false));
  }, [sessionKey]);

  const totalLaps = laps.length > 0
    ? Math.max(...laps.map(l => l.lap_number ?? 0), 1)
    : 60; // fallback

  const events = parseRaceControl(raceControl);

  // lapToX: converts a lap number to a % offset (as a string for CSS left)
  function lapToX(lap) {
    return `${((lap - 1) / Math.max(totalLaps - 1, 1)) * 100}%`;
  }

  if (!sessionKey) return null;

  // Sort drivers by current position if available
  const sortedDrivers = [...drivers].sort((a, b) => {
    const posA = laps.find(l => l.driver_number === a.driver_number)?.lap_number ?? 999;
    const posB = laps.find(l => l.driver_number === b.driver_number)?.lap_number ?? 999;
    return posB - posA;
  });

  return (
    <div style={{
      background: '#0c0c0c',
      borderTop: '1px solid #1a1a1a',
      padding: '12px 16px 16px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 10, color: '#555', textTransform: 'uppercase',
          letterSpacing: '0.1em', fontWeight: 600,
        }}>
          Race Timeline
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'SOFT', color: TIRE_COLORS.SOFT },
            { label: 'MED', color: TIRE_COLORS.MEDIUM },
            { label: 'HARD', color: TIRE_COLORS.HARD },
            { label: 'INTER', color: TIRE_COLORS.INTER },
            { label: 'WET', color: TIRE_COLORS.WET },
          ].map(t => (
            <span key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
              <span style={{ fontSize: 9, color: '#555' }}>{t.label}</span>
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 2, height: 10, background: '#fff', display: 'inline-block', borderRadius: 1 }} />
            <span style={{ fontSize: 9, color: '#555' }}>PIT</span>
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#333', fontSize: 12, padding: '8px 0' }}>Loading timeline…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 600 }}>
            <LapAxis totalLaps={totalLaps} lapToX={lapToX} />
            {events.length > 0 && (
              <EventsStrip events={events} totalLaps={totalLaps} lapToX={lapToX} />
            )}
            <div style={{ marginTop: 4 }}>
              {sortedDrivers.map(d => (
                <DriverStintRow
                  key={d.driver_number}
                  driver={d}
                  stints={stints}
                  pits={pits}
                  totalLaps={totalLaps}
                  lapToX={lapToX}
                  selected={selectedDriverNum === d.driver_number}
                  onClick={() => onSelectDriver?.(d.driver_number)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
