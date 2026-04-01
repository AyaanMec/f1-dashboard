import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import LiveTiming from './pages/LiveTiming';
import Standings from './pages/Standings';
import Schedule from './pages/Schedule';
import Results from './pages/Results';
import Telemetry from './pages/Telemetry';
import Weather from './pages/Weather';
import TeamRadio from './pages/TeamRadio';
import ERS from './pages/ERS';

export default function App() {
  return (
    <div style={{ backgroundColor: '#0c0c0c', minHeight: '100vh', color: '#fff', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <NavBar />
      <main style={{ paddingTop: 100 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/live" replace />} />
          <Route path="/live"      element={<LiveTiming />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/schedule"  element={<Schedule />} />
          <Route path="/results"   element={<Results />} />
          <Route path="/telemetry" element={<Telemetry />} />
          <Route path="/weather"   element={<Weather />} />
          <Route path="/radio"     element={<TeamRadio />} />
          <Route path="/ers"       element={<ERS />} />
        </Routes>
      </main>
    </div>
  );
}
