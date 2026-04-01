import { NavLink } from 'react-router-dom';
import RaceSelector from './RaceSelector';
import useLatestSession from '../hooks/useLatestSession';
import useSessionStatus from '../hooks/useSessionStatus';
import SessionBadge from './SessionBadge';

const NAV_LINKS = [
  { to: '/live', label: 'Live' },
  { to: '/results', label: 'Results' },
  { to: '/standings', label: 'Standings' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/telemetry', label: 'Telemetry' },
  { to: '/weather', label: 'Weather' },
  { to: '/radio', label: 'Radio' },
  { to: '/ers', label: 'ERS' },
];

export default function NavBar() {
  const { session } = useLatestSession();
  const status = useSessionStatus(session);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: '#0a0a0a', borderBottom: '2px solid #e8002d',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top row: logo + session badge + race selector */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '8px 20px', flexWrap: 'wrap',
      }}>
        <span style={{ color: '#e8002d', fontWeight: 900, fontSize: 18, letterSpacing: '0.05em', flexShrink: 0 }}>
          F1 DASHBOARD
        </span>
        <SessionBadge status={status} />
        {session && (
          <span style={{ color: '#666', fontSize: 12 }}>
            {session.session_name} — {session.location || ''}
          </span>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <RaceSelector />
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 0, padding: '0 12px', overflowX: 'auto' }}>
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              color: isActive ? '#fff' : '#888',
              background: isActive ? '#e8002d' : 'transparent',
              padding: '8px 14px',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              borderRadius: '4px 4px 0 0',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s, background 0.15s',
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
