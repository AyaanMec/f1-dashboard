import { createContext, useState, useEffect, useCallback } from 'react';
import { getMeetings } from '../api/openf1';
import { getRaceSchedule } from '../api/jolpica';

export const RaceContext = createContext({
  selectedYear: new Date().getFullYear(),
  selectedMeetingKey: null,
  selectedSessionKey: null,
  selectedRound: null,
  meetings: [],
  sessions: [],
  setYear: () => {},
  setMeeting: () => {},
  setSession: () => {},
  setRound: () => {},
});

export function RaceProvider({ children }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMeetingKey, setSelectedMeetingKey] = useState(null);
  const [selectedSessionKey, setSelectedSessionKey] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [jolpicaRaces, setJolpicaRaces] = useState([]);

  // Load meetings for the selected year
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [openf1Meetings, jRaces] = await Promise.all([
          getMeetings(selectedYear).catch(() => []),
          getRaceSchedule(selectedYear).catch(() => []),
        ]);
        if (!cancelled) {
          setMeetings(openf1Meetings.sort((a, b) => new Date(a.date_start) - new Date(b.date_start)));
          setJolpicaRaces(jRaces);
        }
      } catch {
        if (!cancelled) { setMeetings([]); setJolpicaRaces([]); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedYear]);

  // Reset race/session when year changes
  useEffect(() => {
    setSelectedMeetingKey(null);
    setSelectedSessionKey(null);
    setSelectedRound(null);
  }, [selectedYear]);

  const setYear = useCallback(y => setSelectedYear(Number(y)), []);
  const setMeeting = useCallback((meetingKey, round) => {
    setSelectedMeetingKey(meetingKey);
    setSelectedRound(round || null);
    setSelectedSessionKey(null);
  }, []);
  const setSession = useCallback(sessionKey => setSelectedSessionKey(sessionKey), []);
  const setRound = useCallback(round => setSelectedRound(round), []);

  return (
    <RaceContext.Provider value={{
      selectedYear, selectedMeetingKey, selectedSessionKey, selectedRound,
      meetings, jolpicaRaces,
      setYear, setMeeting, setSession, setRound,
    }}>
      {children}
    </RaceContext.Provider>
  );
}
