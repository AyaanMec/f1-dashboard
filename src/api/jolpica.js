import { JOLPICA_BASE } from '../utils/constants';

async function fetchJolpica(path) {
  const url = `${JOLPICA_BASE}/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jolpica ${path} returned ${res.status}`);
  return res.json();
}

export async function getRaceSchedule(year) {
  const data = await fetchJolpica(`${year}.json?limit=30`);
  return data?.MRData?.RaceTable?.Races || [];
}

export async function getDriverStandings(year, round) {
  const path = round
    ? `${year}/${round}/driverStandings.json`
    : `${year}/driverStandings.json`;
  const data = await fetchJolpica(path);
  const lists = data?.MRData?.StandingsTable?.StandingsLists || [];
  return lists[0]?.DriverStandings || [];
}

export async function getConstructorStandings(year, round) {
  const path = round
    ? `${year}/${round}/constructorStandings.json`
    : `${year}/constructorStandings.json`;
  const data = await fetchJolpica(path);
  const lists = data?.MRData?.StandingsTable?.StandingsLists || [];
  return lists[0]?.ConstructorStandings || [];
}

export async function getRaceResults(year, round) {
  const path = round
    ? `${year}/${round}/results.json?limit=25`
    : `${year}/last/results.json?limit=25`;
  const data = await fetchJolpica(path);
  const races = data?.MRData?.RaceTable?.Races || [];
  if (!races[0]) return null;
  return {
    raceName: races[0].raceName,
    season: races[0].season,
    round: races[0].round,
    date: races[0].date,
    circuit: races[0].Circuit,
    results: races[0].Results || [],
  };
}

export async function getQualifyingResults(year, round) {
  const path = round
    ? `${year}/${round}/qualifying.json?limit=25`
    : `${year}/last/qualifying.json?limit=25`;
  const data = await fetchJolpica(path);
  const races = data?.MRData?.RaceTable?.Races || [];
  if (!races[0]) return null;
  return {
    raceName: races[0].raceName,
    season: races[0].season,
    results: races[0].QualifyingResults || [],
  };
}
