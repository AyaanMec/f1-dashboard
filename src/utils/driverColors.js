// Team colors keyed by team name (lowercase, partial match)
const TEAM_COLORS = {
  'red bull': '#3671C6',
  'ferrari': '#E8002D',
  'mercedes': '#27F4D2',
  'mclaren': '#FF8000',
  'aston martin': '#229971',
  'alpine': '#FF87BC',
  'williams': '#64C4FF',
  'rb': '#6692FF',
  'racing bulls': '#6692FF',
  'kick sauber': '#52E252',
  'sauber': '#52E252',
  'haas': '#B6BABD',
};

export function getTeamColor(teamName) {
  if (!teamName) return '#888888';
  const lower = teamName.toLowerCase();
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#888888';
}

// Fallback colors for 20 drivers by index
const FALLBACK_COLORS = [
  '#3671C6', '#E8002D', '#27F4D2', '#FF8000', '#229971',
  '#FF87BC', '#64C4FF', '#6692FF', '#52E252', '#B6BABD',
  '#3671C6', '#E8002D', '#27F4D2', '#FF8000', '#229971',
  '#FF87BC', '#64C4FF', '#6692FF', '#52E252', '#B6BABD',
];

export function getDriverColor(driver, index = 0) {
  if (driver?.team_name) return getTeamColor(driver.team_name);
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}
