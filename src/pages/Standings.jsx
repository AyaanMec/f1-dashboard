import { useState, useEffect, useContext } from 'react';
import { RaceContext } from '../context/RaceContext';
import { getDriverStandings, getConstructorStandings } from '../api/jolpica';
import { DriverStandingsTable, ConstructorStandingsTable } from '../components/charts/StandingsTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import '../App.css';

const TAB_BTN = (active) => ({
  background: active ? '#e8002d' : '#1a1a1a',
  color: active ? '#fff' : '#888',
  border: '1px solid #333',
  borderRadius: 6,
  padding: '8px 18px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
});

export default function Standings() {
  const { selectedYear, selectedRound } = useContext(RaceContext);
  const [tab, setTab] = useState('drivers');
  const [drivers, setDrivers] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getDriverStandings(selectedYear, selectedRound),
      getConstructorStandings(selectedYear, selectedRound),
    ])
      .then(([d, c]) => { setDrivers(d); setConstructors(c); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedYear, selectedRound]);

  const roundLabel = selectedRound ? ` after Round ${selectedRound}` : '';

  return (
    <div className="page">
      <div className="page-title">{selectedYear} Championship Standings{roundLabel}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={TAB_BTN(tab === 'drivers')} onClick={() => setTab('drivers')}>Drivers</button>
        <button style={TAB_BTN(tab === 'constructors')} onClick={() => setTab('constructors')}>Constructors</button>
      </div>

      {loading && <LoadingSpinner message="Loading standings…" />}
      {error && <ErrorBanner message={error} />}
      {!loading && !error && (
        <div className="card">
          {tab === 'drivers'
            ? <DriverStandingsTable standings={drivers} />
            : <ConstructorStandingsTable standings={constructors} />
          }
        </div>
      )}
    </div>
  );
}
