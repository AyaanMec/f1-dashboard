export default function SessionBadge({ status }) {
  const styles = {
    live: { background: '#e8002d', color: '#fff', animation: 'pulse 1.5s ease-in-out infinite' },
    finished: { background: '#333', color: '#aaa' },
    upcoming: { background: '#5c4a00', color: '#ffd700' },
    unknown: { background: '#222', color: '#666' },
  };

  const labels = {
    live: '● LIVE',
    finished: 'FINISHED',
    upcoming: 'UPCOMING',
    unknown: '—',
  };

  const s = styles[status] || styles.unknown;

  return (
    <>
      <span style={{
        ...s,
        padding: '3px 8px', borderRadius: 4,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
      }}>
        {labels[status] || '—'}
      </span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
    </>
  );
}
