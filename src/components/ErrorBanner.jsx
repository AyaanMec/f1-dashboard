export default function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background: '#1a0000', border: '1px solid #e8002d', borderRadius: 8,
      padding: '16px 20px', margin: '20px 0', display: 'flex',
      alignItems: 'center', gap: 12,
    }}>
      <span style={{ color: '#e8002d', fontSize: 20 }}>⚠</span>
      <span style={{ color: '#ff6666', flex: 1, fontSize: 14 }}>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: '#e8002d', color: '#fff', border: 'none',
            borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
