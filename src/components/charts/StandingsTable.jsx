import { getTeamColor } from '../../utils/driverColors';
import '../../App.css';

export function DriverStandingsTable({ standings }) {
  if (!standings.length) return <p style={{ color: '#666', padding: 20 }}>No standings data available.</p>;

  return (
    <table className="f1-table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Driver</th>
          <th>Team</th>
          <th>Nationality</th>
          <th style={{ textAlign: 'right' }}>Points</th>
          <th style={{ textAlign: 'right' }}>Wins</th>
        </tr>
      </thead>
      <tbody>
        {standings.map(s => {
          const pos = parseInt(s.position, 10);
          const color = getTeamColor(s.Constructors?.[0]?.name);
          return (
            <tr key={s.Driver.driverId}>
              <td>
                <span className={`pos-badge${pos <= 3 ? ` p${pos}` : ''}`}>{pos}</span>
              </td>
              <td>
                <span className="team-dot" style={{ background: color }} />
                <strong>{s.Driver.givenName} {s.Driver.familyName}</strong>
                <span style={{ color: '#555', marginLeft: 6, fontSize: 12 }}>#{s.Driver.permanentNumber}</span>
              </td>
              <td style={{ color: '#888' }}>{s.Constructors?.[0]?.name || '—'}</td>
              <td style={{ color: '#666', fontSize: 12 }}>{s.Driver.nationality}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{s.points}</td>
              <td style={{ textAlign: 'right', color: '#888' }}>{s.wins}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ConstructorStandingsTable({ standings }) {
  if (!standings.length) return <p style={{ color: '#666', padding: 20 }}>No standings data available.</p>;

  return (
    <table className="f1-table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Constructor</th>
          <th>Nationality</th>
          <th style={{ textAlign: 'right' }}>Points</th>
          <th style={{ textAlign: 'right' }}>Wins</th>
        </tr>
      </thead>
      <tbody>
        {standings.map(s => {
          const pos = parseInt(s.position, 10);
          const color = getTeamColor(s.Constructor.name);
          return (
            <tr key={s.Constructor.constructorId}>
              <td>
                <span className={`pos-badge${pos <= 3 ? ` p${pos}` : ''}`}>{pos}</span>
              </td>
              <td>
                <span className="team-dot" style={{ background: color }} />
                <strong>{s.Constructor.name}</strong>
              </td>
              <td style={{ color: '#666', fontSize: 12 }}>{s.Constructor.nationality}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{s.points}</td>
              <td style={{ textAlign: 'right', color: '#888' }}>{s.wins}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
