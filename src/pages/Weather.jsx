import useLatestSession from '../hooks/useLatestSession';
import useSessionStatus from '../hooks/useSessionStatus';
import useLivePolling from '../hooks/useLivePolling';
import { getWeather } from '../api/openf1';
import WeatherChart from '../components/charts/WeatherChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import SessionBadge from '../components/SessionBadge';
import { degreesToCardinal } from '../utils/timeFormatters';
import { POLL_INTERVAL_WEATHER } from '../utils/constants';
import '../App.css';

function StatCard({ label, value, unit }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="stat-value">{value ?? '--'}</span>
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
}

export default function Weather() {
  const { sessionKey, session, meeting, loading: sessionLoading } = useLatestSession();
  const status = useSessionStatus(session);
  const isLive = status === 'live';

  const { data: weatherData, loading, error, lastUpdated } = useLivePolling(
    () => getWeather(sessionKey),
    isLive ? POLL_INTERVAL_WEATHER : null,
    [sessionKey]
  );

  if (sessionLoading) return <div className="page"><LoadingSpinner message="Resolving session…" /></div>;

  const latest = weatherData?.length ? weatherData[weatherData.length - 1] : null;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div className="page-title">Weather</div>
        <SessionBadge status={status} />
      </div>
      <div className="page-subtitle">
        {meeting?.meeting_name || ''} · {session?.session_name || ''}
        {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && !weatherData && <LoadingSpinner message="Loading weather data…" />}

      {latest && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <StatCard label="Air Temperature" value={latest.air_temperature?.toFixed(1)} unit="°C" />
          <StatCard label="Track Temperature" value={latest.track_temperature?.toFixed(1)} unit="°C" />
          <StatCard label="Humidity" value={latest.humidity} unit="%" />
          <StatCard
            label="Wind"
            value={`${latest.wind_speed ?? '--'} km/h ${degreesToCardinal(latest.wind_direction)}`}
          />
          <StatCard
            label="Rainfall"
            value={latest.rainfall ? 'WET' : 'DRY'}
          />
          <StatCard label="Pressure" value={latest.pressure} unit="mbar" />
        </div>
      )}

      {weatherData && weatherData.length > 0 && (
        <div className="card">
          <div style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>Session weather trend</div>
          <WeatherChart data={weatherData} />
        </div>
      )}

      {!loading && !error && !latest && (
        <p style={{ color: '#666' }}>No weather data available for this session.</p>
      )}
    </div>
  );
}
