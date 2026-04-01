import { useState, useEffect, useContext } from 'react';
import { RaceContext } from '../context/RaceContext';
import { getRaceResults } from '../api/jolpica';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import { getTeamColor } from '../utils/driverColors';
import { formatRaceDate } from '../utils/timeFormatters';
import '../App.css';

export default function Results() {
  const { selectedYear, selectedRound } = useContext(RaceContext);
  const [raceData, setRaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getRaceResults(selectedYear, selectedRound)
      .then(setRaceData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedYear, selectedRound]);

  if (loading) return <div className="page"><LoadingSpinner message="Loading results…" /></div>;
  if (error) return <div className="page"><ErrorBanner message={error} /></div>;
  if (!raceData) return <div className="page"><p style={{ color: '#666' }}>No results available.</p></div>;

  const fastestLapDriver = raceData.results.find(r => r.FastestLap?.rank === '1');

  return (
    <div className="page">
      <div className="page-title">{raceData.raceName}</div>
      <div className="page-subtitle">
        Round {raceData.round} · {raceData.season} · {formatRaceDate(raceData.date)}
        {raceData.circuit && ` · ${raceData.circuit.circuitName}`}
      </div>

      <div className="card">
        <table className="f1-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Driver</th>
              <th>Team</th>
              <th>Laps</th>
              <th>Time / Status</th>
              <th style={{ textAlign: 'right' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {raceData.results.map(r => {
              const pos = parseInt(r.position, 10);
              const color = getTeamColor(r.Constructor?.name);
              const isFastest = r.Driver.driverId === fastestLapDriver?.Driver?.driverId;
              const isWinner = pos === 1;
              return (
                <tr key={r.Driver.driverId} style={isWinner ? { background: '#1a1500' } : {}}>
                  <td>
                    <span className={`pos-badge${pos <= 3 ? ` p${pos}` : ''}`}>{r.positionText}</span>
                  </td>
                  <td>
                    <span className="team-dot" style={{ background: color }} />
                    <strong>{r.Driver.givenName} {r.Driver.familyName}</strong>
                    {isFastest && (
                      <span title="Fastest Lap" style={{ marginLeft: 6, color: '#aa00ff', fontSize: 12 }}>⬟ FL</span>
                    )}
                  </td>
                  <td style={{ color: '#888' }}>{r.Constructor?.name}</td>
                  <td style={{ color: '#666' }}>{r.laps}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {r.Time?.time || r.status}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: r.points > 0 ? '#fff' : '#555' }}>
                    {r.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
