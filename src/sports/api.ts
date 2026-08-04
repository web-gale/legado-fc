export type SportId =
  | "football"
  | "basketball"
  | "baseball"
  | "formula1"
  | "handball"
  | "hockey"
  | "mma"
  | "nfl"
  | "rugby"
  | "volleyball"
  | "afl";

export type SportDefinition = {
  id: SportId;
  label: string;
  emoji: string;
  apiLabel: string;
  root: string;
  endpoint: "fixtures" | "games" | "races" | "fights";
  hasStandings?: boolean;
};

export const SPORTS: SportDefinition[] = [
  { id: "football", label: "Fútbol", emoji: "⚽", apiLabel: "API-Football", root: "https://v3.football.api-sports.io", endpoint: "fixtures", hasStandings: true },
  { id: "basketball", label: "Básquetbol", emoji: "🏀", apiLabel: "API-Basketball / NBA", root: "https://v1.basketball.api-sports.io", endpoint: "games" },
  { id: "baseball", label: "Béisbol", emoji: "⚾", apiLabel: "API-Baseball", root: "https://v1.baseball.api-sports.io", endpoint: "games" },
  { id: "formula1", label: "Fórmula 1", emoji: "🏎️", apiLabel: "API-Formula-1", root: "https://v1.formula-1.api-sports.io", endpoint: "races" },
  { id: "handball", label: "Handball", emoji: "🤾", apiLabel: "API-Handball", root: "https://v1.handball.api-sports.io", endpoint: "games" },
  { id: "hockey", label: "Hockey", emoji: "🏒", apiLabel: "API-Hockey", root: "https://v1.hockey.api-sports.io", endpoint: "games" },
  { id: "mma", label: "MMA", emoji: "🥊", apiLabel: "API-MMA", root: "https://v1.mma.api-sports.io", endpoint: "fights" },
  { id: "nfl", label: "NFL / NCAA", emoji: "🏈", apiLabel: "API-NFL", root: "https://v1.american-football.api-sports.io", endpoint: "games" },
  { id: "rugby", label: "Rugby", emoji: "🏉", apiLabel: "API-Rugby", root: "https://v1.rugby.api-sports.io", endpoint: "games" },
  { id: "volleyball", label: "Vóley", emoji: "🏐", apiLabel: "API-Volleyball", root: "https://v1.volleyball.api-sports.io", endpoint: "games" },
  { id: "afl", label: "AFL", emoji: "🦘", apiLabel: "API-AFL", root: "https://v1.afl.api-sports.io", endpoint: "games" },
];

export type Match = {
  id: string;
  sport: SportId;
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
  sport: SportId;
  requestedDate: string;
  matches: Match[];
  standings: Standing[];
  source: "live" | "cache" | "demo";
  provider: "API-SPORTS";
  updatedAt: string;
  quotaRemaining?: number;
  message?: string;
};

export type ApiSportsSettings = {
  apiKey: string;
  sport: SportId;
  leagueId: string;
  season: string;
  timezone: string;
};

// Backwards-compatible export for saved settings and imports from PR #5.
export type ApiFootballSettings = ApiSportsSettings;

type ApiEnvelope<T> = {
  errors?: Record<string, string> | string[];
  response?: T;
};

type ApiFootballFixture = {
  fixture: { id: number; date: string; status: { short: string; long: string } };
  league: { name: string; round?: string };
  teams: { home: { name: string; logo?: string }; away: { name: string; logo?: string } };
  goals: { home: number | null; away: number | null };
};

type ApiFootballStanding = {
  rank: number;
  team: { name: string; logo?: string };
  points: number;
  all: { played: number; win: number; draw: number; lose: number };
};

type GenericGame = Record<string, any>;

const PROXY_ROOT = String(import.meta.env.VITE_API_SPORTS_PROXY_URL || import.meta.env.VITE_API_FOOTBALL_PROXY_URL || "").replace(/\/$/, "");
const SETTINGS_KEY = "legado:api-sports:settings";
const LEGACY_SETTINGS_KEY = "legado:api-football:settings";
const CACHE_PREFIX = "legado:sports:api-sports:v2";
const CACHE_TTL = 15 * 60 * 1000;
const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE", "Q1", "Q2", "Q3", "Q4", "OT", "IN PLAY"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN", "FINAL", "FINISHED", "AFTER PENALTIES", "AFTER OVERTIME"]);

const defaultSettings: ApiSportsSettings = {
  apiKey: "",
  sport: "football",
  leagueId: "250",
  season: String(new Date().getUTCFullYear()),
  timezone: "America/Asuncion",
};

const demoTeams: Record<SportId, Array<[string, string, number | null, number | null]>> = {
  football: [["Olimpia", "Cerro Porteño", null, null], ["River Plate", "Flamengo", null, null], ["Real Madrid", "Manchester City", 2, 1]],
  basketball: [["Boston Celtics", "Los Angeles Lakers", 108, 104], ["Olimpia Kings", "San José", null, null], ["Real Madrid", "FC Barcelona", null, null]],
  baseball: [["New York Yankees", "Boston Red Sox", 5, 3], ["Los Angeles Dodgers", "San Francisco Giants", null, null]],
  formula1: [["Gran Premio de Hungría", "Hungaroring", null, null], ["Gran Premio de Países Bajos", "Zandvoort", null, null]],
  handball: [["FC Barcelona", "THW Kiel", null, null], ["Dinamarca", "Francia", 31, 29]],
  hockey: [["Florida Panthers", "Edmonton Oilers", 4, 2], ["Canadá", "Estados Unidos", null, null]],
  mma: [["Cartelera principal", "Próximo combate", null, null], ["Peso ligero", "Evento mundial", null, null]],
  nfl: [["Kansas City Chiefs", "Buffalo Bills", null, null], ["Philadelphia Eagles", "Dallas Cowboys", null, null]],
  rugby: [["Nueva Zelanda", "Sudáfrica", null, null], ["Argentina", "Australia", null, null]],
  volleyball: [["Brasil", "Italia", null, null], ["Estados Unidos", "Polonia", 3, 2]],
  afl: [["Collingwood", "Brisbane Lions", null, null], ["Sydney Swans", "Geelong Cats", null, null]],
};

function sportDefinition(id: SportId) {
  return SPORTS.find((sport) => sport.id === id) ?? SPORTS[0];
}

function fallbackFor(sport: SportId, requestedDate = localDate()): SportsSnapshot {
  const definition = sportDefinition(sport);
  return {
    sport,
    requestedDate,
    provider: "API-SPORTS",
    source: "demo",
    updatedAt: new Date().toISOString(),
    message: `Datos de demostración de ${definition.label}`,
    matches: demoTeams[sport].map(([home, away, homeScore, awayScore], index) => ({
      id: `demo-${sport}-${index + 1}`,
      sport,
      league: `${definition.apiLabel} · Cobertura mundial`,
      date: requestedDate,
      time: homeScore === null ? "20:00" : "Final",
      home,
      away,
      homeScore,
      awayScore,
      status: homeScore === null ? "scheduled" : "finished",
    })),
    standings: sport === "football" ? [
      ["Olimpia", 25], ["Cerro Porteño", 23], ["Libertad", 21], ["Guaraní", 19], ["Nacional", 18], ["Sportivo Luqueño", 16],
    ].map(([team, points], index) => ({ rank: index + 1, team: String(team), played: 10, won: 8 - Math.floor(index / 2), drawn: index % 3, lost: Math.floor(index / 3), points: Number(points) })) : [],
  };
}

export function getApiSportsSettings(): ApiSportsSettings {
  try {
    const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    const legacy = JSON.parse(localStorage.getItem(LEGACY_SETTINGS_KEY) || "{}");
    const merged = { ...defaultSettings, ...legacy, ...(current || {}) };
    if (!SPORTS.some((sport) => sport.id === merged.sport)) merged.sport = "football";
    return merged;
  } catch {
    return defaultSettings;
  }
}

export const getApiFootballSettings = getApiSportsSettings;

export function saveApiSportsSettings(settings: ApiSportsSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    ...settings,
    apiKey: settings.apiKey.trim(),
    leagueId: settings.leagueId.replace(/\D/g, "") || defaultSettings.leagueId,
    season: settings.season.replace(/\D/g, "").slice(0, 4) || defaultSettings.season,
  }));
  localStorage.removeItem(`${CACHE_PREFIX}:${settings.sport}`);
}

export const saveApiFootballSettings = saveApiSportsSettings;

function statusFrom(code: unknown, long: unknown): Match["status"] {
  const normalized = String(code || long || "").toUpperCase();
  if (LIVE_CODES.has(normalized) || /LIVE|QUARTER|PERIOD|IN PLAY/.test(normalized)) return "live";
  if (FINISHED_CODES.has(normalized) || /FINISH|FINAL|AFTER/.test(normalized)) return "finished";
  return "scheduled";
}

function mapFootballFixture(item: ApiFootballFixture): Match {
  const status = statusFrom(item.fixture.status.short, item.fixture.status.long);
  const date = new Date(item.fixture.date);
  return {
    id: String(item.fixture.id), sport: "football",
    league: `${item.league.name}${item.league.round ? ` · ${item.league.round}` : ""}`,
    date: item.fixture.date.slice(0, 10),
    time: status === "finished" ? "Final" : date.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit", hour12: false }),
    home: item.teams.home.name, away: item.teams.away.name,
    homeScore: item.goals.home, awayScore: item.goals.away,
    status, homeBadge: item.teams.home.logo, awayBadge: item.teams.away.logo,
  };
}

function scoreValue(value: any): number | null {
  if (typeof value === "number") return value;
  if (typeof value?.total === "number") return value.total;
  if (typeof value?.points === "number") return value.points;
  return null;
}

function mapGenericGame(item: GenericGame, sport: SportId): Match {
  const rawDate = item.date || item.game?.date || item.race?.date || new Date().toISOString();
  const status = statusFrom(item.status?.short || item.game?.status?.short, item.status?.long || item.game?.status?.long);
  const home = item.teams?.home || item.competitors?.[0] || item.driver || item.fighter?.first;
  const away = item.teams?.away || item.competitors?.[1] || item.circuit || item.fighter?.second;
  const homeName = home?.name || item.competition?.name || item.name || "Evento principal";
  const awayName = away?.name || item.category || item.type || "Cobertura mundial";
  return {
    id: String(item.id || item.game?.id || item.race?.id || `${sport}-${rawDate}-${homeName}`),
    sport,
    league: item.league?.name || item.competition?.name || sportDefinition(sport).apiLabel,
    date: String(rawDate).slice(0, 10),
    time: status === "finished" ? "Final" : String(item.time || new Date(rawDate).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit", hour12: false })),
    home: homeName,
    away: awayName,
    homeScore: scoreValue(item.scores?.home ?? item.score?.home),
    awayScore: scoreValue(item.scores?.away ?? item.score?.away),
    status,
    homeBadge: home?.logo || home?.image,
    awayBadge: away?.logo || away?.image,
  };
}

function mapStanding(row: ApiFootballStanding): Standing {
  return { rank: row.rank, team: row.team.name, played: row.all.played, won: row.all.win, drawn: row.all.draw, lost: row.all.lose, points: row.points, badge: row.team.logo };
}

async function request<T>(definition: SportDefinition, endpoint: string, params: URLSearchParams, apiKey: string) {
  const directRoot = definition.root;
  const url = PROXY_ROOT
    ? `${PROXY_ROOT}/${definition.id}/${endpoint}?${params}`
    : `${directRoot}/${endpoint}?${params}`;
  const headers: HeadersInit = { Accept: "application/json" };
  if (!PROXY_ROOT) headers["x-apisports-key"] = apiKey;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error(`${definition.apiLabel} ${response.status}`);
  const data = await response.json() as ApiEnvelope<T>;
  const errors = data.errors && (Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors).length);
  if (errors || data.response === undefined) throw new Error(`${definition.apiLabel} rechazó la solicitud`);
  const quota = Number(response.headers.get("x-ratelimit-requests-remaining"));
  return { data: data.response, quota: Number.isFinite(quota) ? quota : undefined };
}

function localDate(timezone = defaultSettings.timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeDate(value: string | undefined, timezone = defaultSettings.timezone) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? String(value) : localDate(timezone);
}

function readCache(sport: SportId, requestedDate: string, allowStale = false): SportsSnapshot | null {
  try {
    const cached = JSON.parse(localStorage.getItem(`${CACHE_PREFIX}:${sport}:${requestedDate}`) || "null") as SportsSnapshot | null;
    if (!cached || cached.sport !== sport) return null;
    if (!allowStale && Date.now() - Date.parse(cached.updatedAt) > CACHE_TTL) return null;
    return { ...cached, source: "cache" };
  } catch {
    return null;
  }
}

export async function testApiSportsConnection(settings = getApiSportsSettings()) {
  const definition = sportDefinition(settings.sport);
  if (!PROXY_ROOT && !settings.apiKey) return { ok: false, message: "Ingresa una clave de API‑SPORTS." };
  try {
    const status = await request<any>(definition, "status", new URLSearchParams(), settings.apiKey);
    return { ok: true, quotaRemaining: status.quota, message: `${definition.apiLabel} conectada. La cuenta respondió correctamente.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo validar la conexión." };
  }
}

export async function loadSportsSnapshot(force = false, selectedSport?: SportId, selectedDate?: string): Promise<SportsSnapshot> {
  const settings = { ...getApiSportsSettings(), ...(selectedSport ? { sport: selectedSport } : {}) };
  const definition = sportDefinition(settings.sport);
  const requestedDate = normalizeDate(selectedDate, settings.timezone);
  if (!force) {
    const fresh = readCache(settings.sport, requestedDate);
    if (fresh) return fresh;
  }
  if (!PROXY_ROOT && !settings.apiKey) return readCache(settings.sport, requestedDate, true) ?? fallbackFor(settings.sport, requestedDate);
  try {
    const eventParams = definition.endpoint === "races"
      ? new URLSearchParams({ season: settings.season, type: "race" })
      : new URLSearchParams({ date: requestedDate, timezone: settings.timezone });
    const events = await request<any[]>(definition, definition.endpoint, eventParams, settings.apiKey);
    let standings: Standing[] = [];
    let quotaRemaining = events.quota;
    if (definition.hasStandings) {
      try {
        const table = await request<Array<{ league: { standings: ApiFootballStanding[][] } }>>(definition, "standings", new URLSearchParams({ league: settings.leagueId, season: settings.season }), settings.apiKey);
        standings = (table.data[0]?.league.standings.flat() || []).slice(0, 16).map(mapStanding);
        if (table.quota !== undefined) quotaRemaining = quotaRemaining === undefined ? table.quota : Math.min(quotaRemaining, table.quota);
      } catch {
        standings = [];
      }
    }
    const mappedMatches = events.data.map((item) => settings.sport === "football" ? mapFootballFixture(item as ApiFootballFixture) : mapGenericGame(item, settings.sport));
    const datedMatches = definition.endpoint === "races"
      ? mappedMatches.filter((match) => match.date === requestedDate)
      : mappedMatches;
    const liveMatches = datedMatches.slice(0, 20);
    const snapshot: SportsSnapshot = {
      sport: settings.sport,
      requestedDate,
      matches: liveMatches,
      standings,
      source: "live",
      provider: "API-SPORTS",
      updatedAt: new Date().toISOString(),
      quotaRemaining,
      message: liveMatches.length ? `Eventos de ${definition.label} del ${requestedDate}` : `Conexión válida; no hay eventos de ${definition.label} el ${requestedDate}.`,
    };
    localStorage.setItem(`${CACHE_PREFIX}:${settings.sport}:${requestedDate}`, JSON.stringify(snapshot));
    return snapshot;
  } catch (error) {
    const cached = readCache(settings.sport, requestedDate, true);
    if (cached) return { ...cached, message: "Sin conexión nueva; mostrando la última actualización guardada." };
    return { ...fallbackFor(settings.sport, requestedDate), message: error instanceof Error ? error.message : "Datos de respaldo activos." };
  }
}

export const API_SPORTS_ENDPOINTS = SPORTS.map(({ id, apiLabel, endpoint, root }) => ({ id, apiLabel, endpoint, root }));
export const API_FOOTBALL_ENDPOINTS = ["countries", "seasons", "leagues", "standings", "teams", "fixtures", "fixtures/events", "fixtures/lineups", "fixtures/statistics", "players", "transfers", "trophies", "injuries", "predictions", "odds"] as const;
