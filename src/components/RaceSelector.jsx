import { useContext, useState, useEffect } from 'react';
import { RaceContext } from '../context/RaceContext';
import { getSessions } from '../api/openf1';
import { MIN_YEAR, MAX_YEAR, SESSION_TYPE_LABELS } from '../utils/constants';

const selectStyle = {
  background: '#1a1a1a',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 13,
  cursor: 'pointer',
};

export default function RaceSelector() {
  const {
    selectedYear, selectedMeetingKey, selectedSessionKey,
    meetings, setYear, setMeeting, setSession,
  } = useContext(RaceContext);

  const [sessions, setSessions] = useState([]);

  // Load sessions when a meeting is selected
  useEffect(() => {
    if (!selectedMeetingKey) { setSessions([]); return; }
    getSessions(selectedMeetingKey)
      .then(s => setSessions(s.sort((a, b) => new Date(a.date_start) - new Date(b.date_start))))
      .catch(() => setSessions([]));
  }, [selectedMeetingKey]);

  const years = [];
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) years.push(y);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {/* Year */}
      <select value={selectedYear} onChange={e => setYear(e.target.value)} style={selectStyle}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      {/* Race/Meeting */}
      <select
        value={selectedMeetingKey || ''}
        onChange={e => {
          const mk = e.target.value ? Number(e.target.value) : null;
          const meeting = meetings.find(m => m.meeting_key === mk);
          setMeeting(mk, meeting?.round);
        }}
        style={{ ...selectStyle, minWidth: 160 }}
      >
        <option value="">Latest race</option>
        {meetings.map(m => (
          <option key={m.meeting_key} value={m.meeting_key}>
            {m.meeting_name || m.country_name}
          </option>
        ))}
      </select>

      {/* Session (only shown when a meeting is selected) */}
      {selectedMeetingKey && sessions.length > 0 && (
        <select
          value={selectedSessionKey || ''}
          onChange={e => setSession(e.target.value ? Number(e.target.value) : null)}
          style={selectStyle}
        >
          <option value="">Race session</option>
          {sessions.map(s => (
            <option key={s.session_key} value={s.session_key}>
              {SESSION_TYPE_LABELS[s.session_name] || s.session_name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
