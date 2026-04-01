import { useEffect, useRef, useState } from 'react';
import { getCircuitLayout } from '../utils/circuitLayouts';
import { getTeamColor } from '../utils/driverColors';

export default function TrackMap({ meeting, positions = [], drivers = [], width = '100%' }) {
  const pathRef = useRef(null);
  const animRef = useRef(null);
  const progressRef = useRef({});
  const lastFrameRef = useRef(null);
  const [carPositions, setCarPositions] = useState([]);

  const layout = meeting
    ? getCircuitLayout(meeting.meeting_name, meeting.location || meeting.country_name)
    : null;

  const driverMap = Object.fromEntries(drivers.map(d => [d.driver_number, d]));
  const posToDriver = Object.fromEntries(positions.map(p => [p.position, p.driver_number]));
  const numCars = positions.length || 20;

  useEffect(() => {
    let frameCount = 0;

    function loop(ts) {
      const dt = lastFrameRef.current
        ? Math.min((ts - lastFrameRef.current) / 1000, 0.05)
        : 0.016;
      lastFrameRef.current = ts;

      for (let i = 0; i < numCars; i++) {
        const driverNum = posToDriver[i + 1] ?? (i + 1);
        if (progressRef.current[driverNum] === undefined) {
          progressRef.current[driverNum] = (numCars - i) / numCars;
        }
        const speed = 0.06 - i * 0.001;
        progressRef.current[driverNum] = (progressRef.current[driverNum] + speed * dt) % 1;
      }

      frameCount++;
      if (frameCount % 2 === 0 && pathRef.current) {
        const pathLen = pathRef.current.getTotalLength();
        const next = [];
        for (let i = 0; i < numCars; i++) {
          const driverNum = posToDriver[i + 1] ?? (i + 1);
          const driver = driverMap[driverNum];
          const progress = progressRef.current[driverNum] ?? 0;
          const pt = pathRef.current.getPointAtLength(progress * pathLen);
          next.push({
            key: driverNum,
            x: pt.x,
            y: pt.y,
            color: driver ? getTeamColor(driver.team_name) : '#555',
            acronym: driver?.name_acronym ?? null,
            position: i + 1,
          });
        }
        setCarPositions(next);
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [numCars, driverMap, posToDriver]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!layout) {
    return (
      <div style={{
        background: '#0a0a0a', borderRadius: 8, border: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        aspectRatio: '4/3', color: '#333', fontSize: 13,
      }}>
        No circuit data
      </div>
    );
  }

  return (
    <div style={{ background: '#080808', borderRadius: 8, border: '1px solid #1a1a1a', width }}>
      <svg
        viewBox={layout.viewBox}
        style={{ width: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="trackGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="carGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Track glow layer */}
        <path d={layout.path} fill="none" stroke="#e8002d" strokeWidth={14}
          strokeLinejoin="round" strokeLinecap="round" opacity={0.15} />
        {/* Track border */}
        <path d={layout.path} fill="none" stroke="#2a2a2a" strokeWidth={10}
          strokeLinejoin="round" strokeLinecap="round" />
        {/* Track surface */}
        <path d={layout.path} fill="none" stroke="#484848" strokeWidth={5}
          strokeLinejoin="round" strokeLinecap="round" />
        {/* Track centre line */}
        <path d={layout.path} fill="none" stroke="#666" strokeWidth={1}
          strokeDasharray="6 8" strokeLinejoin="round" strokeLinecap="round" opacity={0.4} />

        {/* Hidden path for getPointAtLength */}
        <path ref={pathRef} d={layout.path} fill="none" stroke="none"
          style={{ visibility: 'hidden' }} />

        {/* Cars */}
        {carPositions.map(car => (
          <g key={car.key} filter="url(#carGlow)">
            <circle cx={car.x} cy={car.y} r={5.5} fill={car.color} opacity={0.9} />
            <circle cx={car.x} cy={car.y} r={3} fill={car.color} />
          </g>
        ))}
      </svg>
    </div>
  );
}
