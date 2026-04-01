import { useState, useEffect } from 'react';
import useLatestSession from '../hooks/useLatestSession';
import { getDrivers, getLaps, getCarData } from '../api/openf1';
import TelemetryChart from '../components/charts/TelemetryChart';
import DriverSelector from '../components/DriverSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import SessionBadge from '../components/SessionBadge';
import useSessionStatus from '../hooks/useSessionStatus';
import { formatLapTime } from '../utils/timeFormatters';
import { getTeamColor } from '../utils/driverColors';
import '../App.css';

const DOWNSAMPLE = 8;

function buildDistanceSeries(carData) {
  if (!carData.length) return [];
  const sorted = [...carData].sort((a, b) => a.date < b.date ? -1 : 1);
  let dist = 0;
  let prevTime = null;
  return sorted.map(pt => {
    const t = new Date(pt.date).getTime();
    if (prevTime !== null) {
      const dtSec = (t - prevTime) / 1000;
      dist += (pt.speed / 3.6) * dtSec;
    }
    prevTime = t;
    return {
      distance: Math.round(dist),
      speed: pt.speed,
      throttle: pt.throttle,
      brake: pt.brake ? 100 : 0,
      rpm: Math.round(pt.rpm / 100),
      gear: (pt.n_gear || 0) * 10,
      drs: pt.drs,
    };
  }).filter((_, i) => i % DOWNSAMPLE === 0);
}

async function fetchDriverTelemetry(sessionKey, driverNumber) {
  const laps = await getLaps(sessionKey, driverNumber);
  const validLaps = laps.filter(l => l.lap_duration && l.is_pit_out_lap === false);
  if (!validLaps.length) throw new Error('No valid laps found for this driver');
  validLaps.sort((a, b) => a.lap_duration - b.lap_duration);
  const fastest = validLaps[0];

  const carData = await getCarData(sessionKey, driverNumber);
  const lapStart = fastest.date_start;
  const lapEnd = new Date(new Date(fastest.date_start).getTime() + fastest.lap_duration * 1000).toISOString();
  const lapCar = carData.filter(d => d.date >= lapStart && d.date <= lapEnd);

  return { lap: fastest, series: buildDistanceSeries(lapCar.length > 0 ? lapCar : carData.slice(0, 500)) };
}

export default function Telemetry() {
  const { sessionKey, session, meeting, loading: sessionLoading } = useLatestSession();
  const status = useSessionStatus(session);

  const [drivers, setDrivers] = useState([]);

  // Driver A
  const [driverA, setDriverA] = useState(null);
  const [lapA, setLapA] = useState(null);
  const [dataA, setDataA] = useState([]);
  const [loadingA, setLoadingA] = useState(false);
  const [errorA, setErrorA] = useState(null);

  // Driver B (compare)
  const [compareMode, setCompareMode] = useState(false);
  const [driverB, setDriverB] = useState(null);
  const [lapB, setLapB] = useState(null);
  const [dataB, setDataB] = useState([]);
  const [loadingB, setLoadingB] = useState(false);
  const [errorB, setErrorB] = useState(null);

  const [visibleChannels, setVisibleChannels] = useState({
    speed: true, throttle: true, brake: true, rpm: true, gear: false,
  });

  useEffect(() => {
    if (!sessionKey) return;
    getDrivers(sessionKey)
      .then(d => setDrivers(d.sort((a, b) => a.driver_number - b.driver_number)))
      .catch(() => setDrivers([]));
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey || !driverA) { setDataA([]); setLapA(null); return; }
    setLoadingA(true);
    setErrorA(null);
    fetchDriverTelemetry(sessionKey, driverA)
      .then(({ lap, series }) => { setLapA(lap); setDataA(series); })
      .catch(e => setErrorA(e.message))
      .finally(() => setLoadingA(false));
  }, [sessionKey, driverA]);

  useEffect(() => {
    if (!sessionKey || !driverB || !compareMode) { setDataB([]); setLapB(null); return; }
    setLoadingB(true);
    setErrorB(null);
    fetchDriverTelemetry(sessionKey, driverB)
      .then(({ lap, series }) => { setLapB(lap); setDataB(series); })
      .catch(e => setErrorB(e.message))
      .finally(() => setLoadingB(false));
  }, [sessionKey, driverB, compareMode]);

  const toggleChannel = ch => setVisibleChannels(prev => ({ ...prev, [ch]: !prev[ch] }));

  if (sessionLoading) return <div className="page"><LoadingSpinner message="Resolving session…" /></div>;

  const driverObjA = drivers.find(d => d.driver_number === driverA);
  const driverObjB = drivers.find(d => d.driver_number === driverB);
  const colorA = driverObjA ? getTeamColor(driverObjA.team_name) : '#00d4ff';
  const colorB = driverObjB ? getTeamColor(driverObjB.team_name) : '#ff87bc';

  const isLoading = loadingA || loadingB;
  const hasData = dataA.length > 0;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div className="page-title">Car Telemetry</div>
        <SessionBadge status={status} />
      </div>
      <div className="page-subtitle">
        {meeting?.meeting_name || ''} · {session?.session_name || ''}
      </div>

      {/* Driver selectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>

        {/* Driver A row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{
            width: 24, height: 24, borderRadius: '50%', background: colorA,
            display: 'inline-block', flexShrink: 0,
          }} />
          <DriverSelector drivers={drivers} value={driverA} onChange={setDriverA} label="Driver" />
          {lapA && (
            <span style={{ color: '#888', fontSize: 13 }}>
              Fastest: <strong style={{ color: '#fff' }}>{formatLapTime(lapA.lap_duration)}</strong>
              <span style={{ color: '#555' }}> Lap {lapA.lap_number}</span>
            </span>
          )}
        </div>

        {/* Compare toggle + Driver B row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setCompareMode(m => !m); if (compareMode) { setDriverB(null); setDataB([]); } }}
            style={{
              background: compareMode ? '#2a1a2a' : '#1a1a1a',
              color: compareMode ? '#ff87bc' : '#888',
              border: `1px solid ${compareMode ? '#ff87bc' : '#333'}`,
              borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            {compareMode ? '✕ Remove Compare' : '+ Compare Driver'}
          </button>

          {compareMode && (
            <>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', background: colorB,
                display: 'inline-block', flexShrink: 0, borderStyle: 'dashed',
                borderWidth: 2, borderColor: colorB, opacity: 0.9,
              }} />
              <DriverSelector drivers={drivers} value={driverB} onChange={setDriverB} label="Compare" />
              {lapB && (
                <span style={{ color: '#888', fontSize: 13 }}>
                  Fastest: <strong style={{ color: '#fff' }}>{formatLapTime(lapB.lap_duration)}</strong>
                  <span style={{ color: '#555' }}> Lap {lapB.lap_number}</span>
                  {lapA && (
                    <span style={{
                      marginLeft: 8,
                      color: lapB.lap_duration < lapA.lap_duration ? '#00ff88' : '#ff5555',
                      fontWeight: 700,
                    }}>
                      {lapB.lap_duration < lapA.lap_duration ? '▼' : '▲'}
                      {formatLapTime(Math.abs(lapB.lap_duration - lapA.lap_duration))}
                    </span>
                  )}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Channel toggles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(visibleChannels).map(([ch, on]) => (
          <button
            key={ch}
            onClick={() => toggleChannel(ch)}
            style={{
              background: on ? '#1a1a1a' : '#111',
              color: on ? '#fff' : '#444',
              border: `1px solid ${on ? colorA : '#333'}`,
              borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            {ch.toUpperCase()}
          </button>
        ))}
      </div>

      {errorA && <ErrorBanner message={errorA} />}
      {errorB && <ErrorBanner message={`Compare: ${errorB}`} />}

      {!driverA && !isLoading && (
        <p style={{ color: '#666' }}>Select a driver to view telemetry.</p>
      )}

      {isLoading && <LoadingSpinner message="Loading telemetry data…" />}

      {!isLoading && hasData && (
        <div className="card">
          {/* Legend chips */}
          {compareMode && driverObjA && driverObjB && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 24, height: 3, background: colorA, display: 'inline-block', borderRadius: 2 }} />
                <span style={{ fontSize: 13, color: '#ccc' }}>{driverObjA.name_acronym} (solid)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 24, height: 3, background: colorB, display: 'inline-block', borderRadius: 2, borderTop: `2px dashed ${colorB}` }} />
                <span style={{ fontSize: 13, color: '#ccc' }}>{driverObjB.name_acronym} (dashed)</span>
              </div>
            </div>
          )}
          <TelemetryChart
            data={dataA}
            compareData={compareMode ? dataB : null}
            driverALabel={driverObjA?.name_acronym || 'A'}
            driverBLabel={driverObjB?.name_acronym || 'B'}
            driverAColor={colorA}
            driverBColor={colorB}
            visibleChannels={visibleChannels}
          />
          <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>
            RPM shown ÷ 100 · Gear shown × 10 · Distance derived from speed × Δt
            {compareMode && ' · Driver B interpolated to Driver A distance axis'}
          </p>
        </div>
      )}
    </div>
  );
}
