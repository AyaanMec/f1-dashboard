import { useState, useEffect } from 'react';
import useLatestSession from '../hooks/useLatestSession';
import { getTeamRadio, getDrivers } from '../api/openf1';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import SessionBadge from '../components/SessionBadge';
import useSessionStatus from '../hooks/useSessionStatus';
import { getTeamColor } from '../utils/driverColors';
import '../App.css';

const PAGE_SIZE = 20;

function RadioClip({ recording, driver }) {
  const [audioError, setAudioError] = useState(false);
  const color = driver ? getTeamColor(driver.team_name) : '#888';
  const time = new Date(recording.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{
      background: '#111', border: '1px solid #1e1e1e', borderRadius: 8,
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            {driver?.name_acronym || `#${recording.driver_number}`}
          </div>
          <div style={{ fontSize: 11, color: '#666' }}>{time}</div>
        </div>
      </div>
      {audioError ? (
        <span style={{ color: '#666', fontSize: 12, fontStyle: 'italic' }}>Recording unavailable</span>
      ) : (
        <audio
          controls
          src={recording.recording_url}
          onError={() => setAudioError(true)}
          style={{ height: 32, flex: 1, minWidth: 200, accentColor: color }}
        />
      )}
    </div>
  );
}

export default function TeamRadio() {
  const { sessionKey, session, meeting, loading: sessionLoading } = useLatestSession();
  const status = useSessionStatus(session);

  const [recordings, setRecordings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filterDriver, setFilterDriver] = useState('');

  useEffect(() => {
    if (!sessionKey) return;
    setLoading(true);
    setError(null);
    setPage(1);
    Promise.all([getTeamRadio(sessionKey), getDrivers(sessionKey)])
      .then(([radio, drvs]) => {
        setRecordings(radio.sort((a, b) => b.date.localeCompare(a.date)));
        setDrivers(drvs);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionKey]);

  if (sessionLoading) return <div className="page"><LoadingSpinner message="Resolving session…" /></div>;

  const driverMap = Object.fromEntries(drivers.map(d => [d.driver_number, d]));

  const filtered = filterDriver
    ? recordings.filter(r => String(r.driver_number) === filterDriver)
    : recordings;

  const total = filtered.length;
  const paged = filtered.slice(0, page * PAGE_SIZE);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div className="page-title">Team Radio</div>
        <SessionBadge status={status} />
      </div>
      <div className="page-subtitle">
        {meeting?.meeting_name || ''} · {session?.session_name || ''} · {total} recordings
      </div>

      {/* Driver filter */}
      {drivers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <select
            value={filterDriver}
            onChange={e => { setFilterDriver(e.target.value); setPage(1); }}
            style={{
              background: '#1a1a1a', color: '#fff', border: '1px solid #333',
              borderRadius: 6, padding: '8px 12px', fontSize: 13,
            }}
          >
            <option value="">All drivers</option>
            {drivers.sort((a, b) => a.driver_number - b.driver_number).map(d => (
              <option key={d.driver_number} value={d.driver_number}>
                {d.name_acronym} #{d.driver_number}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingSpinner message="Loading team radio…" />}

      {!loading && !error && (
        <>
          {paged.length === 0 ? (
            <p style={{ color: '#666' }}>No team radio recordings for this session.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paged.map((r, i) => (
                <RadioClip key={`${r.driver_number}-${r.date}-${i}`} recording={r} driver={driverMap[r.driver_number]} />
              ))}
            </div>
          )}

          {paged.length < total && (
            <button
              onClick={() => setPage(p => p + 1)}
              style={{
                marginTop: 16, background: '#1a1a1a', color: '#fff', border: '1px solid #333',
                borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14,
              }}
            >
              Load more ({total - paged.length} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
