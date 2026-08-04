export type Match = {
  id: string;
  league: string;
  date: string;
  time: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "finished" | "scheduled" | "live";
  homeBadge?: string;
  awayBadge?: string;
};

export type Standing = {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  badge?: string;
};

export type SportsSnapshot = {
  matches: Match[];
  standings: Standing[];
  source: "live" | "cache" | "demo";
  updatedAt: string;
};

const API_ROOT = "https://www.thesportsdb.com/api/v1/json";
const PUBLIC_KEY = import.meta.env.VITE_SPORTSDB_PUBLIC_KEY || "3";
const LEAGUE_ID = import.meta.env.VITE_SPORTSDB_LEAGUE_ID || "4328";
const CACHE_KEY = "legado:sports:v1";

const fallback: SportsSnapshot = {
  source: "demo",
  updatedAt: new Date().toISOString(),
  matches: [
    { id: "lf-1", league: "LEGADO FC · Partido destacado", date: "2026-08-04", time: "20:00", home: "Olimpia", away: "Cerro Porteño", homeScore: null, awayScore: null, status: "scheduled" },
    { id: "lf-2", league: "Copa continental", date: "2026-08-05", time: "21:30", home: "River Plate", away: "Flamengo", homeScore: null, awayScore: null, status: "scheduled" },
    { id: "lf-3", league: "Europa", date: "2026-08-03", time: "Final", home: "Real Madrid", away: "Manchester City", homeScore: 2, awayScore: 1, status: "finished" },
  ],
  standings: [
    ["Arsenal", 25], ["Manchester City", 23], ["Liverpool", 21], ["Chelsea", 19], ["Tottenham", 18], ["Manchester United", 16],
  ].map(([team, points], index) => ({ rank: index + 1, team: String(team), played: 10, won: 8 - Math.floor(index / 2), drawn: index % 3, lost: Math.floor(index / 3), points: Number(points) })),
};

function mapMatch(event: Record<string, string | null>): Match {
  const homeScore = event.intHomeScore == null ? null : Number(event.intHomeScore);
  const awayScore = event.intAwayScore == null ? null : Number(event.intAwayScore);
  const progress = String(event.strProgress || "").toLowerCase();
  const status = progress && !/finished|ft|match finished/.test(progress)
    ? "live"
    : homeScore == null
      ? "scheduled"
      : "finished";
  return {
    id: String(event.idEvent), league: String(event.strLeague || "Fútbol"), date: String(event.dateEvent || ""),
    time: String(event.strTime || (status === "finished" ? "Final" : "A confirmar")).slice(0, 5),
    home: String(event.strHomeTeam || "Local"), away: String(event.strAwayTeam || "Visitante"),
    homeScore, awayScore, status,
    homeBadge: event.strHomeTeamBadge || undefined, awayBadge: event.strAwayTeamBadge || undefined,
  };
}

function mapStanding(row: Record<string, string | null>, index: number): Standing {
  return {
    rank: Number(row.intRank || index + 1), team: String(row.strTeam || "Equipo"), played: Number(row.intPlayed || 0),
    won: Number(row.intWin || 0), drawn: Number(row.intDraw || 0), lost: Number(row.intLoss || 0),
    points: Number(row.intPoints || 0), badge: row.strBadge || undefined,
  };
}

async function json(url: string) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Sports API ${response.status}`);
  return response.json();
}

export async function loadSportsSnapshot(): Promise<SportsSnapshot> {
  try {
    const season = `${new Date().getUTCFullYear() - 1}-${new Date().getUTCFullYear()}`;
    const [past, next, table] = await Promise.all([
      json(`${API_ROOT}/${PUBLIC_KEY}/eventspastleague.php?id=${LEAGUE_ID}`),
      json(`${API_ROOT}/${PUBLIC_KEY}/eventsnextleague.php?id=${LEAGUE_ID}`),
      json(`${API_ROOT}/${PUBLIC_KEY}/lookuptable.php?l=${LEAGUE_ID}&s=${season}`),
    ]);
    const matches = [...(past.events || []).slice(-4), ...(next.events || []).slice(0, 6)].map(mapMatch);
    const standings = (table.table || []).slice(0, 12).map(mapStanding);
    if (!matches.length) throw new Error("Empty sports response");
    const snapshot: SportsSnapshot = { matches, standings, source: "live", updatedAt: new Date().toISOString() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as SportsSnapshot | null;
      if (cached?.matches?.length) return { ...cached, source: "cache" };
    } catch { /* invalid cache */ }
    return fallback;
  }
}
