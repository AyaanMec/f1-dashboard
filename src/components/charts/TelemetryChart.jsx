import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TELEMETRY_COLORS } from '../../utils/constants';

/**
 * Merge two distance-based series into one flat array for Recharts.
 * Uses driver A's distance axis; interpolates driver B values at each point.
 */
function mergeSeries(dataA, dataB) {
  if (!dataB || dataB.length === 0) return dataA.map(p => ({ ...p }));

  // Build a lookup: distance → values for B
  const bByDist = dataB.reduce((acc, p) => { acc[p.distance] = p; return acc; }, {});
  const bDistances = dataB.map(p => p.distance);

  function interpolateB(targetDist, key) {
    // Find the two nearest B points
    let lo = null, hi = null;
    for (const d of bDistances) {
      if (d <= targetDist && (lo === null || d > lo)) lo = d;
      if (d >= targetDist && (hi === null || d < hi)) hi = d;
    }
    if (lo === null && hi === null) return null;
    if (lo === null) return bByDist[hi][key];
    if (hi === null) return bByDist[lo][key];
    if (lo === hi) return bByDist[lo][key];
    const t = (targetDist - lo) / (hi - lo);
    return bByDist[lo][key] + t * (bByDist[hi][key] - bByDist[lo][key]);
  }

  return dataA.map(p => ({
    ...p,
    speed_b: interpolateB(p.distance, 'speed'),
    throttle_b: interpolateB(p.distance, 'throttle'),
    brake_b: interpolateB(p.distance, 'brake'),
    rpm_b: interpolateB(p.distance, 'rpm'),
    gear_b: interpolateB(p.distance, 'gear'),
  }));
}

export default function TelemetryChart({
  data,
  compareData,
  driverALabel = 'Driver A',
  driverBLabel = 'Driver B',
  driverAColor,
  driverBColor,
  visibleChannels,
}) {
  if (!data || data.length === 0) return <p style={{ color: '#666', padding: 20 }}>No telemetry data.</p>;

  const show = visibleChannels || { speed: true, throttle: true, brake: true, rpm: true, gear: false };
  const colorA = driverAColor || TELEMETRY_COLORS.speed;
  const colorB = driverBColor || '#ff87bc';
  const merged = mergeSeries(data, compareData);
  const isCompare = compareData && compareData.length > 0;

  // Build channel config to avoid repetition
  const channels = [
    { key: 'speed',    yAxis: 'speed', color: TELEMETRY_COLORS.speed,    label: 'Speed (km/h)', dash: '' },
    { key: 'throttle', yAxis: 'pct',   color: TELEMETRY_COLORS.throttle, label: 'Throttle (%)', dash: '' },
    { key: 'brake',    yAxis: 'pct',   color: TELEMETRY_COLORS.brake,    label: 'Brake',        dash: '' },
    { key: 'rpm',      yAxis: 'speed', color: TELEMETRY_COLORS.rpm,      label: 'RPM',          dash: '4 2' },
    { key: 'gear',     yAxis: 'pct',   color: TELEMETRY_COLORS.gear,     label: 'Gear',         dash: '', type: 'stepAfter' },
  ];

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
        <XAxis
          dataKey="distance"
          tick={{ fill: '#666', fontSize: 10 }}
          tickFormatter={v => `${(v / 1000).toFixed(1)}km`}
          label={{ value: 'Distance', position: 'insideBottom', fill: '#555', fontSize: 11 }}
        />
        <YAxis yAxisId="speed" tick={{ fill: '#666', fontSize: 11 }} unit=" km/h" domain={[0, 380]} width={70} />
        <YAxis yAxisId="pct" orientation="right" tick={{ fill: '#666', fontSize: 11 }} domain={[0, 100]} unit="%" width={45} />
        <Tooltip
          contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6, fontSize: 12 }}
          labelStyle={{ color: '#888' }}
          labelFormatter={v => `${(v / 1000).toFixed(2)} km`}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#aaa' }} />

        {channels.map(ch => {
          if (!show[ch.key]) return null;
          const lineType = ch.type || 'monotone';
          return [
            // Driver A line
            <Line
              key={`${ch.key}_a`}
              yAxisId={ch.yAxis}
              type={lineType}
              dataKey={ch.key}
              stroke={isCompare ? colorA : ch.color}
              dot={false}
              name={isCompare ? `${driverALabel} ${ch.label}` : ch.label}
              strokeWidth={isCompare ? 1.5 : 2}
              strokeDasharray={ch.dash}
            />,
            // Driver B line (compare mode only)
            isCompare && (
              <Line
                key={`${ch.key}_b`}
                yAxisId={ch.yAxis}
                type={lineType}
                dataKey={`${ch.key}_b`}
                stroke={colorB}
                dot={false}
                name={`${driverBLabel} ${ch.label}`}
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
            ),
          ];
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
