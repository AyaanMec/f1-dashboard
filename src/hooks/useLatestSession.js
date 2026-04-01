import { useState, useEffect, useContext } from 'react';
import { RaceContext } from '../context/RaceContext';
import { getLatestMeeting, getSessions, getMeetings } from '../api/openf1';
import { POLL_INTERVAL_SESSION } from '../utils/constants';

/**
 * Resolves the current meeting_key and session_key based on RaceContext selection.
 * Falls back to the most recently completed race if no selection is made.
 */
export default function useLatestSession() {
  const { selectedYear, selectedMeetingKey, selectedSessionKey } = useContext(RaceContext);
  const [state, setState] = useState({
    meetingKey: null,
    sessionKey: null,
    session: null,
    meeting: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        let meeting = null;
        let session = null;

        if (selectedMeetingKey && selectedSessionKey) {
          // User has picked a specific race + session
          const meetings = await getMeetings(selectedYear || new Date().getFullYear());
          meeting = meetings.find(m => m.meeting_key === selectedMeetingKey) || null;
          const sessions = await getSessions(selectedMeetingKey);
          session = sessions.find(s => s.session_key === selectedSessionKey) || null;
        } else {
          // Auto: latest completed race
          meeting = await getLatestMeeting(selectedYear);
          if (meeting) {
            const sessions = await getSessions(meeting.meeting_key);
            const now = Date.now();
            // Find the latest session that has started
            const started = sessions
              .filter(s => new Date(s.date_start).getTime() <= now)
              .sort((a, b) => new Date(b.date_start) - new Date(a.date_start));
            // Prefer Race session in current meeting
            session = started.find(s => s.session_type === 'Race') || started[0] || null;
          }
        }

        if (!cancelled) {
          setState({
            meetingKey: meeting?.meeting_key || null,
            sessionKey: session?.session_key || null,
            session,
            meeting,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: err.message }));
        }
      }
    }

    resolve();
    const id = setInterval(resolve, POLL_INTERVAL_SESSION);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedYear, selectedMeetingKey, selectedSessionKey]);

  return state;
}
