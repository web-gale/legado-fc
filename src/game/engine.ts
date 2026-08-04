import { CLUBS, clubsForCountry } from "./data";
import type {
  Achievement,
  Attributes,
  CareerState,
  NewCareer,
  Offer,
  Position,
  TrainingFocus,
} from "./types";
const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
const money = (n: number) => Math.max(0, Math.round(n));
function rng(seed: number) {
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}
const weights: Record<Position, Partial<Record<keyof Attributes, number>>> = {
  POR: {
    fisico: 0.15,
    resistencia: 0.1,
    tecnica: 0.12,
    defensa: 0.25,
    mentalidad: 0.23,
    liderazgo: 0.15,
  },
  LD: {
    velocidad: 0.2,
    fisico: 0.12,
    resistencia: 0.17,
    pase: 0.12,
    tecnica: 0.11,
    defensa: 0.2,
    mentalidad: 0.08,
  },
  LI: {
    velocidad: 0.2,
    fisico: 0.12,
    resistencia: 0.17,
    pase: 0.12,
    tecnica: 0.11,
    defensa: 0.2,
    mentalidad: 0.08,
  },
  DFC: {
    velocidad: 0.08,
    fisico: 0.2,
    resistencia: 0.1,
    pase: 0.08,
    defensa: 0.3,
    mentalidad: 0.16,
    liderazgo: 0.08,
  },
  MCD: {
    fisico: 0.13,
    resistencia: 0.15,
    pase: 0.14,
    vision: 0.12,
    tecnica: 0.1,
    defensa: 0.2,
    mentalidad: 0.16,
  },
  MC: {
    resistencia: 0.12,
    pase: 0.2,
    vision: 0.18,
    tecnica: 0.18,
    defensa: 0.1,
    mentalidad: 0.14,
    liderazgo: 0.08,
  },
  MP: {
    velocidad: 0.08,
    definicion: 0.14,
    pase: 0.18,
    vision: 0.2,
    tecnica: 0.2,
    mentalidad: 0.12,
    liderazgo: 0.08,
  },
  ED: {
    velocidad: 0.22,
    resistencia: 0.08,
    definicion: 0.14,
    pase: 0.12,
    vision: 0.1,
    tecnica: 0.22,
    mentalidad: 0.12,
  },
  EI: {
    velocidad: 0.22,
    resistencia: 0.08,
    definicion: 0.14,
    pase: 0.12,
    vision: 0.1,
    tecnica: 0.22,
    mentalidad: 0.12,
  },
  DC: {
    velocidad: 0.12,
    fisico: 0.14,
    definicion: 0.28,
    tecnica: 0.14,
    mentalidad: 0.18,
    resistencia: 0.07,
    liderazgo: 0.07,
  },
};
export function calculateOverall(p: Position, a: Attributes) {
  return Math.round(
    Object.entries(weights[p]).reduce(
      (s, [k, w]) => s + a[k as keyof Attributes] * (w ?? 0),
      0,
    ),
  );
}
export function calculateMarketValue(
  s: Pick<
    CareerState,
    | "age"
    | "overall"
    | "attributes"
    | "form"
    | "clubPrestige"
    | "popularity"
    | "fitness"
    | "nationalCaps"
    | "titles"
    | "history"
  >,
) {
  const age =
    s.age <= 20
      ? 0.58 + (s.age - 14) * 0.08
      : s.age <= 27
        ? 1.06 + (s.age - 21) * 0.025
        : Math.max(0.18, 1.2 - (s.age - 27) * 0.085);
  const base = Math.pow(Math.max(1, s.overall - 43), 2.18) * 2600;
  const pot = s.age < 24 ? 0.78 + s.attributes.potencial / 240 : 1;
  const prod = s.history.length
    ? 1 + clamp(s.history.at(-1)!.rating - 6.4, -0.5, 2) * 0.12
    : 1;
  return money(
    base *
      age *
      pot *
      (0.78 + s.form / 220) *
      (0.7 + s.clubPrestige / 260) *
      (0.82 + s.fitness / 500) *
      (1 + Math.min(20, s.nationalCaps) / 180) *
      (1 + Math.min(12, s.titles.length) / 80) *
      prod *
      (1 + s.popularity / 900),
  );
}
function initialAttributes(p: Position, pot: number): Attributes {
  const a: Attributes = {
    velocidad: 48,
    fisico: 42,
    resistencia: 48,
    definicion: 42,
    pase: 48,
    vision: 47,
    tecnica: 50,
    defensa: 40,
    mentalidad: 45,
    liderazgo: 38,
    potencial: pot,
  };
  Object.keys(weights[p]).forEach((k) => {
    if (k !== "potencial") a[k as keyof Attributes] += 7;
  });
  return a;
}

function leagueMatchLimit(league: string) {
  if (/EFL Championship/.test(league)) return 46;
  if (/LaLiga Hypermotion/.test(league)) return 42;
  if (/Paraguay - Primera División/.test(league)) return 44;
  if (/División Intermedia/.test(league)) return 30;
  if (/Liga Profesional/.test(league)) return 30;
  if (/Uruguay - Primera División/.test(league)) return 37;
  if (/Uruguay - Segunda División|LigaPro|Ecuador - Serie B/.test(league))
    return 30;
  if (/Liga MX|Expansión MX/.test(league)) return 34;
  if (/Bundesliga|Saudi Pro League|Saudi First Division|MLS|Ligue 1|Ligue 2/.test(league))
    return 34;
  if (/Brasileirão|Série A|Série B|Premier League|LaLiga|Serie A|Serie B/.test(league))
    return 38;
  return 34;
}

function divisionOfLeague(league: string): 1 | 2 {
  return /2ª|Série B|Serie B|Ligue 2|Championship|Hypermotion|First Division|Expansión|2\. Bundesliga|USL/.test(
    league,
  )
    ? 2
    : 1;
}

function leagueForDivision(league: string, division: 1 | 2) {
  const country = league.split(" - ")[0];
  return CLUBS.find(
    (club) => club.country === country && club.division === division,
  )?.league;
}

export function nextLeagueAfterSeason(
  league: string,
  wonSecondDivision: boolean,
  relegated: boolean,
) {
  const division = divisionOfLeague(league);
  if (division === 2 && wonSecondDivision)
    return leagueForDivision(league, 1) ?? league;
  if (division === 1 && relegated)
    return leagueForDivision(league, 2) ?? league;
  return league;
}

const easyProduction: Record<
  Position,
  { goals: [number, number]; assists: [number, number] }
> = {
  POR: { goals: [0, 0.03], assists: [0.05, 0.16] },
  LD: { goals: [0.16, 0.34], assists: [0.55, 0.85] },
  LI: { goals: [0.16, 0.34], assists: [0.55, 0.85] },
  DFC: { goals: [0.1, 0.24], assists: [0.18, 0.38] },
  MCD: { goals: [0.28, 0.5], assists: [0.55, 0.82] },
  MC: { goals: [0.55, 0.82], assists: [0.75, 1.05] },
  MP: { goals: [0.9, 1.28], assists: [0.62, 0.98] },
  ED: { goals: [0.9, 1.3], assists: [0.52, 0.86] },
  EI: { goals: [0.9, 1.3], assists: [0.52, 0.86] },
  DC: { goals: [1, 1.48], assists: [0.5, 0.78] },
};

type CompetitionSet = {
  league: string;
  cups: string[];
  continental: string[];
};

function competitionsFor(league: string): CompetitionSet {
  const second = /2ª|Série B|Serie B|Ligue 2|Championship|Hypermotion|First Division|Expansión|2\. Bundesliga|USL/.test(
    league,
  );
  if (second) {
    if (league.startsWith("Paraguay")) return { league: "Campeón División Intermedia", cups: [], continental: [] };
    if (league.startsWith("Argentina")) return { league: "Campeón Primera Nacional", cups: ["Copa Argentina"], continental: [] };
    if (league.startsWith("Brasil")) return { league: "Brasileirão Série B", cups: ["Copa do Brasil"], continental: [] };
    if (league.startsWith("Uruguay")) return { league: "Campeonato Uruguayo de Segunda División Profesional", cups: ["Copa AUF Uruguay"], continental: [] };
    if (league.startsWith("Ecuador")) return { league: "LigaPro Serie B", cups: ["Copa Ecuador"], continental: [] };
    if (league.startsWith("España")) return { league: "LaLiga Hypermotion", cups: ["Copa del Rey"], continental: [] };
    if (league.startsWith("Inglaterra")) return { league: "EFL Championship", cups: ["FA Cup", "EFL Cup (Carabao Cup)"], continental: [] };
    if (league.startsWith("Italia")) return { league: "Serie B", cups: ["Coppa Italia"], continental: [] };
    if (league.startsWith("Alemania")) return { league: "2. Bundesliga", cups: ["DFB-Pokal"], continental: [] };
    if (league.startsWith("Francia")) return { league: "Ligue 2", cups: ["Coupe de France"], continental: [] };
    if (league.startsWith("México")) return { league: "Liga de Expansión MX", cups: ["Campeón de Campeones de Expansión"], continental: [] };
    if (league.startsWith("Estados Unidos")) return { league: "USL Championship", cups: ["USL Cup"], continental: [] };
    return { league: "Saudi First Division League", cups: [], continental: [] };
  }
  if (league.startsWith("Paraguay")) return { league: "Torneo Apertura", cups: ["Torneo Clausura", "Copa Paraguay", "Supercopa Paraguay"], continental: ["Copa CONMEBOL Libertadores", "Copa CONMEBOL Sudamericana", "Recopa Sudamericana"] };
  if (league.startsWith("Argentina")) return { league: "Liga Profesional de Fútbol", cups: ["Copa de la Liga Profesional", "Copa Argentina", "Supercopa Argentina", "Trofeo de Campeones", "Supercopa Internacional"], continental: ["Copa CONMEBOL Libertadores", "Copa CONMEBOL Sudamericana", "Recopa Sudamericana"] };
  if (league.startsWith("Brasil")) return { league: "Brasileirão Série A", cups: ["Copa do Brasil", "Supercopa do Brasil", "Campeonato Estadual"], continental: ["Copa CONMEBOL Libertadores", "Copa CONMEBOL Sudamericana", "Recopa Sudamericana"] };
  if (league.startsWith("Uruguay")) return { league: "Campeonato Uruguayo", cups: ["Torneo Intermedio", "Copa AUF Uruguay", "Supercopa Uruguaya"], continental: ["Copa CONMEBOL Libertadores", "Copa CONMEBOL Sudamericana", "Recopa Sudamericana"] };
  if (league.startsWith("Ecuador")) return { league: "LigaPro Serie A", cups: ["Copa Ecuador", "Supercopa de Ecuador"], continental: ["Copa CONMEBOL Libertadores", "Copa CONMEBOL Sudamericana", "Recopa Sudamericana"] };
  if (league.startsWith("España")) return { league: "LaLiga EA Sports", cups: ["Copa del Rey", "Supercopa de España"], continental: ["UEFA Champions League", "UEFA Europa League", "UEFA Conference League", "Supercopa de la UEFA"] };
  if (league.startsWith("Inglaterra")) return { league: "Premier League", cups: ["FA Cup", "EFL Cup (Carabao Cup)", "FA Community Shield"], continental: ["UEFA Champions League", "UEFA Europa League", "UEFA Conference League", "Supercopa de la UEFA"] };
  if (league.startsWith("Italia")) return { league: "Serie A (Scudetto)", cups: ["Coppa Italia", "Supercoppa Italiana"], continental: ["UEFA Champions League", "UEFA Europa League", "UEFA Conference League", "Supercopa de la UEFA"] };
  if (league.startsWith("Alemania")) return { league: "Bundesliga", cups: ["DFB-Pokal", "DFL-Supercup"], continental: ["UEFA Champions League", "UEFA Europa League", "UEFA Conference League", "Supercopa de la UEFA"] };
  if (league.startsWith("Francia")) return { league: "Ligue 1", cups: ["Coupe de France", "Trophée des Champions"], continental: ["UEFA Champions League", "UEFA Europa League", "UEFA Conference League", "Supercopa de la UEFA"] };
  if (league.startsWith("México")) return { league: "Liga MX", cups: ["Campeón de Campeones", "Supercopa de la Liga MX", "Leagues Cup"], continental: ["Copa de Campeones de la CONCACAF"] };
  if (league.startsWith("Estados Unidos")) return { league: "MLS Cup", cups: ["Supporters' Shield", "Campeón de Conferencia", "Lamar Hunt U.S. Open Cup", "Leagues Cup"], continental: ["Copa de Campeones de la CONCACAF"] };
  return { league: "Saudi Pro League", cups: ["Copa del Rey (King Cup)", "Supercopa de Arabia Saudita", "Copa de Campeones del Club Árabe (UAFA)"], continental: ["AFC Champions League Elite", "AFC Champions League 2"] };
}

function easyTeamTitles(s: CareerState, r: () => number) {
  const set = competitionsFor(s.league);
  const titles = [set.league];
  if (set.cups.length && r() < 0.92)
    titles.push(set.cups[Math.floor(r() * set.cups.length)]);
  if (set.cups.length > 1 && s.clubPrestige >= 68 && r() < 0.62)
    titles.push(set.cups[Math.floor(r() * set.cups.length)]);
  if (set.continental.length && s.clubPrestige >= 65 && r() < 0.82)
    titles.push(set.continental[Math.floor(r() * set.continental.length)]);
  if (s.clubPrestige >= 78 && r() < 0.56)
    titles.push(r() < 0.68 ? "Mundial de Clubes de la FIFA" : "Copa Intercontinental de la FIFA");
  return titles.filter((title, index, all) => all.indexOf(title) === index);
}

function teamTitles(s: CareerState, r: () => number) {
  if (s.difficulty === "Promesa") return easyTeamTitles(s, r);
  const set = competitionsFor(s.league);
  const normal = s.difficulty === "Profesional";
  const titles: string[] = [];
  const domesticChance = normal
    ? 0.18 + s.clubPrestige / 320
    : 0.1 + s.clubPrestige / 420;
  if (r() < domesticChance)
    titles.push(
      r() > 0.42 || !set.cups.length
        ? set.league
        : set.cups[Math.floor(r() * set.cups.length)],
    );
  const internationalChance = normal
    ? 0.1 + s.clubPrestige / 800
    : 0.08;
  if (
    s.clubPrestige > 70 &&
    set.continental.length &&
    r() < internationalChance
  )
    titles.push(set.continental[Math.floor(r() * set.continental.length)]);
  return titles.filter((title, index, all) => all.indexOf(title) === index);
}

function seasonCalendar(
  s: CareerState,
  titles: string[],
  r: () => number,
) {
  const set = competitionsFor(s.league);
  const league = leagueMatchLimit(s.league);
  const easy = s.difficulty === "Promesa";
  let cups = 0;
  set.cups.forEach((competition, index) => {
    const champion = titles.includes(competition);
    const participates =
      champion ||
      index === 0 ||
      (s.clubPrestige >= 62 && r() < (easy ? 0.9 : 0.42));
    if (participates) cups += champion ? 6 : 1 + Math.floor(r() * 5);
  });
  const internationalTitle = titles.some((title) =>
    set.continental.includes(title),
  );
  const qualifiedInternational =
    divisionOfLeague(s.league) === 1 &&
    set.continental.length > 0 &&
    (internationalTitle ||
      (s.clubPrestige >= 60 &&
        r() < Math.min(0.92, (s.clubPrestige - 42) / 45)));
  const international = qualifiedInternational
    ? internationalTitle
      ? 13
      : 6 + Math.floor(r() * 7)
    : 0;
  return { league, cups, international, total: league + cups + international };
}

function regionalPlayerAward(league: string) {
  if (/Paraguay|Argentina|Brasil|Uruguay|Ecuador/.test(league)) return "Rey de América · Mejor jugador de Sudamérica";
  if (/España|Inglaterra|Italia|Alemania|Francia/.test(league)) return "Jugador del Año de la UEFA";
  if (/México|Estados Unidos/.test(league)) return "Mejor Jugador de la CONCACAF";
  return "Futbolista Asiático del Año (AFC)";
}

function easyIndividualAwards(position: Position, league: string, age: number, r: () => number) {
  const global = r() < 0.55 ? "Balón de Oro" : "Premio The Best FIFA";
  if (position === "POR")
    return ["Guante de Oro / Mejor guardameta", "Equipo Ideal de la Temporada", regionalPlayerAward(league), ...(age <= 21 ? ["Mejor Jugador Joven / Revelación"] : [])];
  if (["DFC", "LD", "LI", "MCD"].includes(position))
    return ["Mejor defensor de la temporada", "Equipo Ideal de la Temporada", regionalPlayerAward(league), ...(r() < 0.45 ? [global] : [])];
  if (["MC", "MP"].includes(position))
    return ["Máximo asistente de la liga", "MVP / Jugador de la Temporada", "Equipo Ideal de la Temporada", regionalPlayerAward(league), global];
  return ["Máximo Goleador / Bota de Oro", "MVP / Jugador de la Temporada", "Equipo Ideal de la Temporada", regionalPlayerAward(league), global, ...(r() < 0.55 ? ["Trofeo Gerd Müller"] : [])];
}
export function createCareer(
  input: NewCareer,
  seed = Date.now() % 2147483647,
): CareerState {
  const random = rng(seed),
    attributes = initialAttributes(
      input.position,
      input.difficulty === "Promesa"
        ? 97 + Math.floor(random() * 3)
        : 78 + Math.floor(random() * 17),
    ),
    local = clubsForCountry(input.nationality),
    pool = local.filter((c) => c.division === 2).length
      ? local.filter((c) => c.division === 2)
      : local,
    first = pool[Math.floor(random() * pool.length)] ?? CLUBS[0],
    initialOffer: Offer = {
      club: first.name,
      league: first.league,
      prestige: first.prestige,
      salary: 12000 + Math.round(random() * 9000),
      fee: 0,
      years: 3,
      role: "Promesa",
      firstOffer: true,
    };
  const s: CareerState = {
    version: 1,
    status: "active",
    seed,
    season: 1,
    age: 14,
    ...input,
    club: "Agente libre",
    league: `Mercado juvenil · ${input.nationality}`,
    clubPrestige: 38,
    contractYears: 0,
    salary: 0,
    attributes,
    overall: calculateOverall(input.position, attributes),
    form: 55,
    fitness: 94,
    morale: 72,
    reputation: 8,
    popularity: 5,
    marketValue: 120000,
    moneyEarned: 0,
    nationalCaps: 0,
    nationalGoals: 0,
    titles: [],
    awards: [],
    records: {},
    history: [],
    news: [
      {
        id: "first-offer",
        type: "mercado",
        headline: `Primera oferta para ${input.name}`,
        detail: `${first.name} quiere incorporar a la joven promesa de ${input.nationality}.`,
        season: 1,
      },
    ],
    achievements: [],
    offers: [initialOffer],
    trainingFocus: "Creación",
    riskMode: "equilibrado",
  };
  s.marketValue = calculateMarketValue(s);
  return s;
}
const trainingMap: Record<TrainingFocus, (keyof Attributes)[]> = {
  Explosividad: ["velocidad", "resistencia"],
  Fuerza: ["fisico", "resistencia"],
  Finalización: ["definicion", "tecnica"],
  Creación: ["pase", "vision", "tecnica"],
  Defensa: ["defensa", "mentalidad", "fisico"],
  Liderazgo: ["liderazgo", "mentalidad"],
  Recuperación: ["resistencia"],
};
function offers(s: CareerState, r: () => number): Offer[] {
  if (s.age < 16 || s.form < 48) return [];
  return CLUBS.filter(
    (c) =>
      c.name !== s.club &&
      c.prestige <= s.overall + 22 &&
      c.prestige >= Math.max(48, s.clubPrestige - 5),
  )
    .sort(
      (a, b) =>
        Math.abs(a.prestige - (s.overall + r() * 10)) -
        Math.abs(b.prestige - (s.overall + r() * 10)),
    )
    .slice(0, s.form > 72 ? 3 : 2)
    .map((c) => ({
      club: c.name,
      league: c.league,
      prestige: c.prestige,
      salary: money(s.salary * (0.95 + c.prestige / 62) * (0.85 + r() * 0.45)),
      fee: money(s.marketValue * (0.88 + r() * 0.52)),
      years: 2 + Math.floor(r() * 4),
      role:
        s.overall > c.prestige + 3
          ? "Estrella"
          : s.overall > c.prestige - 5
            ? "Titular"
            : s.age < 20
              ? "Promesa"
              : "Rotación",
    }));
}
function unlock(
  s: CareerState,
  id: string,
  name: string,
  description: string,
): Achievement | null {
  return s.achievements.some((a) => a.id === id)
    ? null
    : { id, name, description, unlockedAt: s.age };
}
export function simulateSeason(current: CareerState): CareerState {
  if (current.status === "retired" || current.club === "Agente libre")
    return current;
  const random = rng(current.seed + current.season * 7919),
    d =
      current.difficulty === "Promesa"
        ? 1.12
        : current.difficulty === "Leyenda"
          ? 0.9
          : 1,
    s: CareerState = JSON.parse(JSON.stringify(current));
  const curve =
      s.age <= 18
        ? 3.4
        : s.age <= 22
          ? 2.5
          : s.age <= 28
            ? 1.05
            : s.age <= 32
              ? 0.15
              : -0.85 - (s.age - 32) * 0.18,
    persona =
      s.personality === "Profesional" || s.personality === "Trabajador"
        ? 1.16
        : s.personality === "Temperamental"
          ? 0.92
          : 1,
    intensity =
      s.riskMode === "prudente" ? 0.78 : s.riskMode === "máximo" ? 1.22 : 1,
    targets = trainingMap[s.trainingFocus];
  (Object.keys(s.attributes) as (keyof Attributes)[]).forEach((k) => {
    if (k === "potencial") return;
    const focus = targets.includes(k) ? 1 : 0.18,
      ceiling = Math.max(0, s.attributes.potencial - s.attributes[k]);
    const delta =
      curve < 0
        ? curve * (0.7 + random() * 0.6)
        : curve *
          focus *
          persona *
          intensity *
          d *
          (0.45 + ceiling / 38) *
          (0.75 + random() * 0.5);
    s.attributes[k] = Math.round(clamp(s.attributes[k] + delta, 20, 99));
  });
  s.overall = calculateOverall(s.position, s.attributes);
  const risk =
    0.025 +
    (100 - s.attributes.resistencia) / 900 +
    Math.max(0, s.age - 30) / 180 +
    (s.riskMode === "máximo" ? 0.06 : s.riskMode === "prudente" ? -0.012 : 0) -
    (s.trainingFocus === "Recuperación" ? 0.03 : 0);
  const easy = s.difficulty === "Promesa";
  const normal = s.difficulty === "Profesional";
  let injury: string | undefined,
    missed = 0;
  if (!easy && random() < risk) {
    const x = random();
    injury =
      x > 0.94
        ? "Rotura de ligamentos"
        : x > 0.82
          ? "Fractura"
          : x > 0.57
            ? "Lesión muscular"
            : x > 0.28
              ? "Esguince"
              : "Sobrecarga";
    missed =
      injury === "Rotura de ligamentos"
        ? 22
        : injury === "Fractura"
          ? 15
          : injury === "Lesión muscular"
            ? 8
            : injury === "Esguince"
              ? 5
              : 2;
    s.fitness = clamp(s.fitness - missed * 1.6);
  } else
    s.fitness = clamp(
      s.fitness + (s.trainingFocus === "Recuperación" ? 8 : 3),
      35,
      100,
    );
  const titles = teamTitles(s, random),
    calendar = seasonCalendar(s, titles, random),
    role = clamp((s.overall - s.clubPrestige + 28) / 55, 0.18, 0.96),
    pj = easy
      ? calendar.total
      : normal
        ? Math.min(
            calendar.total,
            Math.max(
              Math.ceil(calendar.total * 0.8),
              Math.round(
                (calendar.total - missed) * (0.9 + random() * 0.08),
              ),
            ),
          )
        : Math.min(
            calendar.total,
            Math.max(
              2,
              Math.round(
                (calendar.total - missed) * role * (0.86 + random() * 0.26),
              ),
            ),
          ),
    mins = easy
      ? pj * 90
      : Math.round(
          pj * (s.overall >= s.clubPrestige - 3 ? 78 : 42 + random() * 22),
        ),
    attack =
      s.position === "DC"
        ? 1
        : ["MP", "ED", "EI"].includes(s.position)
          ? 0.68
          : ["MC", "LD", "LI"].includes(s.position)
            ? 0.27
            : 0.07,
    generatedGoals = Math.max(
      0,
      Math.round(
        pj *
          attack *
          (s.attributes.definicion / 100) *
          (0.28 + random() * 0.44),
      ),
    ),
    generatedAssists = Math.max(
      0,
      Math.round(
        pj *
          (["MP", "MC", "ED", "EI"].includes(s.position) ? 0.42 : 0.17) *
          (s.attributes.pase / 100) *
          (0.55 + random() * 0.6),
      ),
    ),
    easyTarget = easyProduction[s.position],
    easyGoalRate =
      easyTarget.goals[0] +
      random() * (easyTarget.goals[1] - easyTarget.goals[0]),
    easyAssistRate =
      easyTarget.assists[0] +
      random() * (easyTarget.assists[1] - easyTarget.assists[0]),
    g = easy
      ? Math.max(generatedGoals, Math.ceil(pj * easyGoalRate))
      : normal
        ? Math.max(generatedGoals, Math.ceil(pj * 0.58))
        : generatedGoals,
    a = easy
      ? Math.max(generatedAssists, Math.ceil(pj * easyAssistRate))
      : normal
        ? Math.max(generatedAssists, Math.ceil(pj * 0.2))
        : generatedAssists,
    cards = Math.round(
      pj *
        (["DFC", "MCD", "LD", "LI"].includes(s.position) ? 0.14 : 0.055) *
        (0.6 + random()),
    ),
    rating = Number(
      clamp(
        5.7 +
          (s.overall - s.clubPrestige) / 27 +
          (g / Math.max(8, pj)) * 1.7 +
          (a / Math.max(8, pj)) * 1.2 +
          (random() - 0.45) * 0.65,
        5.4,
        9.4,
      ).toFixed(2),
    );
  s.form = Math.round(clamp(38 + rating * 5.2 + random() * 12));
  s.morale = Math.round(
    clamp(s.morale + (rating - 6.6) * 9 + (random() - 0.5) * 8),
  );
  const call =
      s.age >= 17 &&
      s.overall + s.form / 6 + s.clubPrestige / 9 > 78 + random() * 15,
    caps = call ? 2 + Math.floor(random() * 8) : 0,
    ng = Math.round((caps * attack * s.attributes.definicion) / 260);
  s.nationalCaps += caps;
  s.nationalGoals += ng;
  const competitionSet = competitionsFor(s.league);
  const awards: string[] = easy
    ? easyIndividualAwards(s.position, s.league, s.age, random)
    : [];
  if (!easy && rating > 7.65 && pj > 20)
    awards.push(s.age <= 21 ? "Mejor joven" : "Jugador del año");
  if (!easy && g > 24) awards.push("Máximo goleador");
  if (easy && s.age <= 21) awards.push("Mejor jugador joven");
  s.titles.push(...titles);
  s.awards.push(...awards);
  s.salary = money(s.salary * (1.04 + Math.max(0, rating - 6.4) * 0.08));
  s.moneyEarned += s.salary;
  s.reputation = Math.round(
    clamp(
      s.reputation +
        Math.max(1, (rating - 6.1) * 5 + titles.length * 4 + awards.length * 6),
    ),
  );
  s.popularity = Math.round(
    clamp(
      s.popularity +
        Math.max(
          0,
          g / 8 +
            a / 12 +
            titles.length * 5 +
            awards.length * 8 +
            caps / 3 +
            (s.personality === "Líder" ? 2 : 0),
        ),
    ),
  );
  const rec = {
    season: s.season,
    age: s.age,
    club: s.club,
    league: s.league,
    appearances: pj,
    leagueMatches: calendar.league,
    cupMatches: calendar.cups,
    internationalMatches: calendar.international,
    minutes: mins,
    goals: g,
    assists: a,
    cards,
    rating,
    overall: s.overall,
    marketValue: 0,
    popularity: s.popularity,
    salary: s.salary,
    titles,
    awards,
    nationalCaps: caps,
    nationalGoals: ng,
    injury,
  };
  s.history.push(rec);
  s.marketValue = calculateMarketValue(s);
  rec.marketValue = s.marketValue;
  s.records.goals = (s.records.goals ?? 0) + g;
  s.records.assists = (s.records.assists ?? 0) + a;
  s.records.appearances = (s.records.appearances ?? 0) + pj;
  s.records.maxValue = Math.max(s.records.maxValue ?? 0, s.marketValue);
  const wonSecondDivision =
      divisionOfLeague(rec.league) === 2 &&
      titles.includes(competitionSet.league),
    relegationRisk = clamp(
      (66 - s.clubPrestige) / 55 + Math.max(0, 6.65 - rating) * 0.14,
      0,
      0.3,
    ),
    relegated =
      divisionOfLeague(rec.league) === 1 &&
      !titles.includes(competitionSet.league) &&
      random() < relegationRisk,
    nextLeague = nextLeagueAfterSeason(
      rec.league,
      wonSecondDivision,
      relegated,
    );
  if (nextLeague !== rec.league) {
    rec.leagueMovement = wonSecondDivision ? "Ascenso" : "Descenso";
    rec.nextLeague = nextLeague;
    s.league = nextLeague;
    s.clubPrestige = Math.round(
      clamp(s.clubPrestige + (wonSecondDivision ? 8 : -8), 38, 96),
    );
  }
  s.news = [
    ...(rec.leagueMovement
      ? [
          {
            id: `${s.season}-league-movement`,
            type: "mundo" as const,
            headline: `${s.club} consigue el ${rec.leagueMovement.toLowerCase()}`,
            detail: `La próxima temporada jugará en ${nextLeague}.`,
            season: s.season,
          },
        ]
      : []),
    {
      id: `${s.season}-season`,
      type: "partido",
      headline: `${s.name} cierra el año con ${g} goles y ${a} asistencias`,
      detail: `${pj} partidos (${calendar.league} de liga · ${calendar.cups} de copas · ${calendar.international} internacionales) · valoración ${rating}`,
      season: s.season,
    },
    ...(injury
      ? [
          {
            id: `${s.season}-injury`,
            type: "lesión" as const,
            headline: `${injury}: pausa obligada`,
            detail: `La lesión afectó el ritmo durante ${missed} partidos.`,
            season: s.season,
          },
        ]
      : []),
    ...(caps
      ? [
          {
            id: `${s.season}-national`,
            type: "selección" as const,
            headline: `${s.nationality} convoca a ${s.name}`,
            detail: `${caps} partidos internacionales.`,
            season: s.season,
          },
        ]
      : []),
    ...s.news,
  ].slice(0, 24);
  s.offers = offers(s, random);
  s.contractYears--;
  const ach = [
    s.age === 14
      ? unlock(s, "debut", "Primer paso", "Completa tu primera temporada.")
      : null,
    (s.records.goals ?? 0) >= 50
      ? unlock(s, "goals50", "Cincuenta", "Marca 50 goles.")
      : null,
    s.nationalCaps >= 1
      ? unlock(
          s,
          "national",
          "La camiseta nacional",
          "Debuta con la selección.",
        )
      : null,
    s.marketValue >= 50e6
      ? unlock(s, "elite", "Élite de mercado", "Alcanza €50 M.")
      : null,
  ].filter(Boolean) as Achievement[];
  s.achievements.push(...ach);
  s.lastSummary = `${pj} PJ (${calendar.league} liga · ${calendar.cups} copas · ${calendar.international} internacional) · ${g} G · ${a} A · ${rating} valoración${rec.leagueMovement ? ` · ${rec.leagueMovement} a ${nextLeague}` : ""}${injury ? ` · ${injury}` : ""}`;
  s.age++;
  s.season++;
  if (
    s.age >= 42 ||
    (s.age >= 35 && s.fitness + s.overall < 110 + random() * 35)
  )
    return retireCareer(s);
  return s;
}
export function acceptOffer(c: CareerState, o: Offer) {
  const s: CareerState = JSON.parse(JSON.stringify(c)),
    old = s.club;
  s.club = o.club;
  s.league = o.league;
  s.clubPrestige = o.prestige;
  s.salary = o.salary;
  s.contractYears = o.years;
  s.offers = [];
  s.news.unshift({
    id: `transfer-${s.season}`,
    type: "mercado",
    headline: `${s.name} firma por ${o.club}`,
    detail: o.firstOffer
      ? `Primer contrato profesional: ${o.years} años como ${o.role.toLowerCase()}.`
      : `${old} recibe €${Math.round(o.fee / 1e5) / 10} M.`,
    season: s.season,
  });
  s.records.maxTransfer = Math.max(s.records.maxTransfer ?? 0, o.fee);
  return s;
}
export function renewContract(c: CareerState) {
  const s: CareerState = JSON.parse(JSON.stringify(c));
  if (s.club === "Agente libre") return s;
  s.contractYears = 3;
  s.salary = money(s.salary * 1.18);
  s.offers = [];
  s.morale = clamp(s.morale + 6);
  return s;
}
export function retireCareer(c: CareerState) {
  const s: CareerState = JSON.parse(JSON.stringify(c));
  s.status = "retired";
  const score = Math.round(
    (s.records.goals ?? 0) * 1.5 +
      (s.records.assists ?? 0) +
      (s.records.appearances ?? 0) * 0.18 +
      s.titles.length * 18 +
      s.awards.length * 25 +
      s.nationalCaps * 0.5 +
      s.overall * 2 +
      s.popularity * 1.5,
  );
  s.records.legacyScore = score;
  s.finalLegend =
    score > 900
      ? "Inmortal del fútbol"
      : score > 650
        ? "Leyenda nacional"
        : score > 450
          ? "Estrella internacional"
          : score > 260
            ? "Ídolo del club"
            : score > 120
              ? "Profesional respetado"
              : "Promesa que dejó huella";
  return s;
}
