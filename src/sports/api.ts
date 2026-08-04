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
  provider: "API-Football";
  updatedAt: string;
  quotaRemaining?: number;
};

export type ApiFootballSettings = {
  apiKey: string;
  leagueId: string;
  season: string;
  timezone: string;
};

type ApiFootballEnvelope<T> = {
  errors?: Record<string, string> | string[];
  response?: T;
};

type ApiFootballFixture = {
  fixture: { id: number; date: string; status: { short: string; long: string } };
  league: { name: string; round?: string };
  teams: {
    home: { name: string; logo?: string };
    away: { name: string; logo?: string };
  };
  goals: { home: number | null; away: number | null };
};

type ApiFootballStanding = {
  rank: number;
  team: { name: string; logo?: string };
  points: number;
  all: { played: number; win: number; draw: number; lose: number };
};

const API_ROOT = "https://v3.football.api-sports.io";
const PROXY_ROOT = String(import.meta.env.VITE_API_FOOTBALL_PROXY_URL || "").replace(/\/$/, "");
const SETTINGS_KEY = "legado:api-football:settings";
const CACHE_KEY = "legado:sports:api-football:v1";
const CACHE_TTL = 15 * 60 * 1000;
const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN"]);

const defaultSettings: ApiFootballSettings = {
  apiKey: "",
  leagueId: "250", // Paraguay · Primera División
  season: String(new Date().getUTCFullYear()),
  timezone: "America/Asuncion",
};

const fallback: SportsSnapshot = {
  provider: "API-Football",
  source: "demo",
  updatedAt: new Date().toISOString(),
  matches: [
    { id: "lf-1", league: "LEGADO FC · Partido destacado", date: "2026-08-04", time: "20:00", home: "Olimpia", away: "Cerro Porteño", homeScore: null, awayScore: null, status: "scheduled" },
    { id: "lf-2", league: "Copa continental", date: "2026-08-05", time: "21:30", home: "River Plate", away: "Flamengo", homeScore: null, awayScore: null, status: "scheduled" },
    { id: "lf-3", league: "Europa", date: "2026-08-03", time: "Final", home: "Real Madrid", away: "Manchester City", homeScore: 2, awayScore: 1, status: "finished" },
  ],
  standings: [
    ["Olimpia", 25], ["Cerro Porteño", 23], ["Libertad", 21], ["Guaraní", 19], ["Nacional", 18], ["Sportivo Luqueño", 16],
  ].map(([team, points], index) => ({ rank: index + 1, team: String(team), played: 10, won: 8 - Math.floor(index / 2), drawn: index % 3, lost: Math.floor(index / 3), points: Number(points) })),
};

export const API_FOOTBALL_ENDPOINTS = [
  "countries", "seasons", "leagues", "standings", "teams", "fixtures", "fixtures/events",
  "fixtures/lineups", "fixtures/statistics", "fixtures/players", "players", "players/topscorers",
  "players/topassists", "transfers", "trophies", "injuries", "predictions", "odds",
] as const;

export function getApiFootballSettings(): ApiFootballSettings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return defaultSettings;
  }
}

export function saveApiFootballSettings(settings: ApiFootballSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    ...settings,
    apiKey: settings.apiKey.trim(),
    leagueId: settings.leagueId.replace(/\D/g, "") || defaultSettings.leagueId,
    season: settings.season.replace(/\D/g, "").slice(0, 4) || defaultSettings.season,
  }));
  localStorage.removeItem(CACHE_KEY);
}

function mapFixture(item: ApiFootballFixture): Match {
  const statusCode = item.fixture.status.short;
  const date = new Date(item.fixture.date);
  const status = LIVE_CODES.has(statusCode) ? "live" : FINISHED_CODES.has(statusCode) ? "finished" : "scheduled";
  return {
    id: String(item.fixture.id),
    league: `${item.league.name}${item.league.round ? ` · ${item.league.round}` : ""}`,
    date: item.fixture.date.slice(0, 10),
    time: status === "finished" ? "Final" : date.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit", hour12: false }),
    home: item.teams.home.name,
    away: item.teams.away.name,
    homeScore: item.goals.home,
    awayScore: item.goals.away,
    status,
    homeBadge: item.teams.home.logo,
    awayBadge: item.teams.away.logo,
  };
}

function mapStanding(row: ApiFootballStanding): Standing {
  return {
    rank: row.rank,
    team: row.team.name,
    played: row.all.played,
    won: row.all.win,
    drawn: row.all.draw,
    lost: row.all.lose,
    points: row.points,
    badge: row.team.logo,
  };
}

async function request<T>(endpoint: string, params: URLSearchParams, apiKey: string) {
  const url = `${PROXY_ROOT || API_ROOT}/${endpoint}?${params}`;
  const headers: HeadersInit = { Accept: "application/json" };
  if (!PROXY_ROOT) headers["x-apisports-key"] = apiKey;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error(`API-Football ${response.status}`);
  const data = await response.json() as ApiFootballEnvelope<T>;
  const errors = data.errors && (Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors).length);
  if (errors || !data.response) throw new Error("API-Football returned an error");
  const quota = Number(response.headers.get("x-ratelimit-requests-remaining"));
  return { data: data.response, quota: Number.isFinite(quota) ? quota : undefined };
}

function readCache(allowStale = false): SportsSnapshot | null {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as SportsSnapshot | null;
    if (!cached?.matches?.length) return null;
    if (!allowStale && Date.now() - Date.parse(cached.updatedAt) > CACHE_TTL) return null;
    return { ...cached, source: "cache" };
  } catch {
    return null;
  }
}

export async function loadSportsSnapshot(force = false): Promise<SportsSnapshot> {
  if (!force) {
    const fresh = readCache();
    if (fresh) return fresh;
  }
  const settings = getApiFootballSettings();
  if (!PROXY_ROOT && !settings.apiKey) return readCache(true) ?? fallback;
  try {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const [fixtures, table] = await Promise.all([
      request<ApiFootballFixture[]>("fixtures", new URLSearchParams({ date: today, timezone: settings.timezone }), settings.apiKey),
      request<Array<{ league: { standings: ApiFootballStanding[][] } }>>("standings", new URLSearchParams({ league: settings.leagueId, season: settings.season }), settings.apiKey),
    ]);
    const matches = fixtures.data.slice(0, 12).map(mapFixture);
    const standings = (table.data[0]?.league.standings.flat() || []).slice(0, 16).map(mapStanding);
    if (!matches.length) throw new Error("No fixtures available today");
    const quotas = [fixtures.quota, table.quota].filter((n): n is number => n !== undefined);
    const snapshot: SportsSnapshot = {
      matches,
      standings,
      source: "live",
      provider: "API-Football",
      updatedAt: new Date().toISOString(),
      quotaRemaining: quotas.length ? Math.min(...quotas) : undefined,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch {
    return readCache(true) ?? fallback;
  }
}
