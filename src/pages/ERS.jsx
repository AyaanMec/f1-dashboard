import '../App.css';

export default function ERS() {
  return (
    <div className="page">
      <div className="page-title">ERS / Battery Deployment</div>
      <div className="page-subtitle">Energy Recovery System data</div>

      <div className="card" style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
          <span style={{ fontSize: 32 }}>⚡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              ERS data is not available via free public APIs
            </div>
            <p style={{ color: '#888', lineHeight: 1.6, fontSize: 14 }}>
              Battery deployment, MGU-K harvest/deploy rates, and state-of-charge data are
              proprietary to the FOM (Formula One Management) and the individual teams.
              This data is not exposed through any currently available free API endpoint.
            </p>
          </div>
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            What is available via OpenF1 car_data
          </div>
          {[
            ['speed', 'Vehicle speed in km/h'],
            ['throttle', 'Throttle pedal position (0–100%)'],
            ['brake', 'Brake pedal (on/off)'],
            ['rpm', 'Engine RPM'],
            ['n_gear', 'Current gear (1–8)'],
            ['drs', 'DRS status'],
          ].map(([key, desc]) => (
            <div key={key} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #1a1a1a', fontSize: 13 }}>
              <code style={{ color: '#00d4ff', width: 80, flexShrink: 0 }}>{key}</code>
              <span style={{ color: '#aaa' }}>{desc}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            What ERS data would include (unavailable)
          </div>
          {[
            'MGU-K deployment per lap zone (kW)',
            'MGU-K harvest per braking zone (kW)',
            'Battery state of charge (%)',
            'MGU-H power output',
            'Total ERS deployment per lap',
          ].map(item => (
            <div key={item} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 13, color: '#555', borderBottom: '1px solid #111' }}>
              <span>✗</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <p style={{ color: '#555', fontSize: 12, marginTop: 16 }}>
          All car telemetry available from OpenF1 can be viewed on the{' '}
          <a href="/telemetry" style={{ color: '#00d4ff' }}>Telemetry</a> page.
        </p>
      </div>
    </div>
  );
}
