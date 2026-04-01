import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

export default function WeatherChart({ data }) {
  if (!data || data.length === 0) return <p style={{ color: '#666', padding: 20 }}>No weather data.</p>;

  // Sample down for performance
  const step = Math.max(1, Math.floor(data.length / 200));
  const samples = data.filter((_, i) => i % step === 0).map(w => ({
    time: new Date(w.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    airTemp: w.air_temperature,
    trackTemp: w.track_temperature,
    humidity: w.humidity,
    windSpeed: w.wind_speed,
    rainfall: w.rainfall ? 1 : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={samples} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis dataKey="time" tick={{ fill: '#666', fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis yAxisId="temp" tick={{ fill: '#666', fontSize: 11 }} unit="°C" domain={['auto', 'auto']} />
        <YAxis yAxisId="misc" orientation="right" tick={{ fill: '#666', fontSize: 11 }} domain={[0, 100]} />
        <Tooltip
          contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6, fontSize: 12 }}
          labelStyle={{ color: '#888' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />
        <Line yAxisId="temp" type="monotone" dataKey="airTemp" stroke="#00d4ff" dot={false} name="Air Temp (°C)" strokeWidth={2} />
        <Line yAxisId="temp" type="monotone" dataKey="trackTemp" stroke="#ff9900" dot={false} name="Track Temp (°C)" strokeWidth={2} />
        <Line yAxisId="misc" type="monotone" dataKey="humidity" stroke="#888" dot={false} name="Humidity (%)" strokeWidth={1} strokeDasharray="4 2" />
        <Line yAxisId="misc" type="monotone" dataKey="windSpeed" stroke="#44ff88" dot={false} name="Wind (km/h)" strokeWidth={1} />
      </LineChart>
    </ResponsiveContainer>
  );
}
