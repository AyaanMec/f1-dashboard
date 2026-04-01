import { getTeamColor } from '../utils/driverColors';

export default function DriverSelector({ drivers = [], value, onChange, label = 'Driver' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <label style={{ color: '#aaa', fontSize: 13, fontWeight: 600 }}>{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        style={{
          background: '#1a1a1a', color: '#fff', border: '1px solid #333',
          borderRadius: 6, padding: '8px 12px', fontSize: 14, cursor: 'pointer',
          minWidth: 180,
        }}
      >
        <option value="">Select driver…</option>
        {drivers.map(d => (
          <option key={d.driver_number} value={d.driver_number}>
            {d.name_acronym || d.full_name} — #{d.driver_number}
          </option>
        ))}
      </select>
      {value && drivers.length > 0 && (() => {
        const driver = drivers.find(d => d.driver_number === value);
        const color = driver ? getTeamColor(driver.team_name) : '#888';
        return (
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: color, display: 'inline-block',
          }} />
        );
      })()}
    </div>
  );
}
