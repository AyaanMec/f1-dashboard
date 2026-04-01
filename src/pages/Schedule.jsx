import { useState, useEffect, useContext } from 'react';
import { RaceContext } from '../context/RaceContext';
import { getRaceSchedule } from '../api/jolpica';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import { formatRaceDate } from '../utils/timeFormatters';
import '../App.css';

function SessionRow({ label, dateStr }) {
  if (!dateStr) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ color: '#bbb' }}>{formatRaceDate(dateStr)}</span>
    </div>
  );
}

export default function Schedule() {
  const { selectedYear } = useContext(RaceContext);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getRaceSchedule(selectedYear)
      .then(setRaces)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const today = new Date();

  if (loading) return <div className="page"><LoadingSpinner message="Loading schedule…" /></div>;
  if (error) return <div className="page"><ErrorBanner message={error} onRetry={() => setLoading(true)} /></div>;
  if (!races.length) return <div className="page"><p style={{ color: '#666' }}>No schedule available for {selectedYear}.</p></div>;

  return (
    <div className="page">
      <div className="page-title">{selectedYear} Season Schedule</div>
      <div className="page-subtitle">{races.length} rounds</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {races.map(race => {
          const raceDate = new Date(race.date);
          const isPast = raceDate < today;
          const isNext = !isPast && races.findIndex(r => new Date(r.date) >= today) === races.indexOf(race);
          const isOpen = expanded === race.round;

          return (
            <div
              key={race.round}
              style={{
                background: isNext ? '#1a0a00' : '#111',
                border: `1px solid ${isNext ? '#e8002d' : '#222'}`,
                borderRadius: 8,
                overflow: 'hidden',
                opacity: isPast ? 0.6 : 1,
              }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : race.round)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, color: '#fff',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  minWidth: 32, height: 32, borderRadius: '50%', background: isNext ? '#e8002d' : '#222',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>
                  {race.round}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{race.raceName}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {race.Circuit?.circuitName} · {formatRaceDate(race.date)}
                  </div>
                </div>
                {isNext && <span style={{ color: '#e8002d', fontSize: 11, fontWeight: 700 }}>NEXT</span>}
                {isPast && <span style={{ color: '#444', fontSize: 11 }}>DONE</span>}
                <span style={{ color: '#555', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div style={{ padding: '0 16px 14px 60px' }}>
                  <SessionRow label="Practice 1"  dateStr={race.FirstPractice?.date} />
                  <SessionRow label="Practice 2"  dateStr={race.SecondPractice?.date} />
                  <SessionRow label="Practice 3"  dateStr={race.ThirdPractice?.date} />
                  <SessionRow label="Sprint"       dateStr={race.Sprint?.date} />
                  <SessionRow label="Qualifying"   dateStr={race.Qualifying?.date} />
                  <SessionRow label="Race"         dateStr={race.date} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
