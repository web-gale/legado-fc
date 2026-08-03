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

const easyProduction: Record<Position, { goals: number; assists: number }> = {
  POR: { goals: 0, assists: 0.08 },
  LD: { goals: 0.16, assists: 0.55 },
  LI: { goals: 0.16, assists: 0.55 },
  DFC: { goals: 0.12, assists: 0.2 },
  MCD: { goals: 0.28, assists: 0.55 },
  MC: { goals: 0.55, assists: 0.75 },
  MP: { goals: 0.9, assists: 0.8 },
  ED: { goals: 0.9, assists: 0.65 },
  EI: { goals: 0.9, assists: 0.65 },
  DC: { goals: 1.05, assists: 0.5 },
};

function easyTeamTitles(s: CareerState, r: () => number) {
  const secondDivision = /2ª|Série B|Serie B|Ligue 2|Championship|Hypermotion|First Division|Expansión/.test(
    s.league,
  );
  if (secondDivision) {
    return [
      "Campeón de segunda división",
      ...(s.clubPrestige >= 52 && r() < 0.72 ? ["Copa nacional"] : []),
    ];
  }
  return [
    s.clubPrestige >= 66 ? "Liga nacional" : "Copa nacional",
    ...(s.clubPrestige >= 62 && r() < 0.88 ? ["Copa nacional"] : []),
    ...(s.clubPrestige >= 74 && r() < 0.76 ? ["Título continental"] : []),
    ...(s.clubPrestige >= 84 && r() < 0.48 ? ["Mundial de Clubes"] : []),
  ].filter((title, index, all) => all.indexOf(title) === index);
}

function easyIndividualAwards(position: Position) {
  if (position === "POR")
    return ["Mejor guardameta", "Guante de Oro", "Equipo ideal de la temporada"];
  if (["DFC", "LD", "LI", "MCD"].includes(position))
    return ["Mejor defensor", "Jugador del año", "Equipo ideal de la temporada"];
  if (["MC", "MP"].includes(position))
    return ["Mejor asistente", "Jugador del año", "Equipo ideal de la temporada"];
  return ["Máximo goleador", "Jugador del año", "Equipo ideal de la temporada"];
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
  const role = clamp((s.overall - s.clubPrestige + 28) / 55, 0.18, 0.96),
    pj = easy
      ? leagueMatchLimit(s.league)
      : Math.max(
          2,
          Math.round((32 - missed) * role * (0.86 + random() * 0.26)),
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
    g = easy
      ? Math.max(generatedGoals, Math.ceil(pj * easyTarget.goals))
      : generatedGoals,
    a = easy
      ? Math.max(generatedAssists, Math.ceil(pj * easyTarget.assists))
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
  const titles: string[] = easy ? easyTeamTitles(s, random) : [];
  if (!easy && random() < 0.1 + s.clubPrestige / 420)
    titles.push(random() > 0.42 ? "Liga nacional" : "Copa nacional");
  if (!easy && s.clubPrestige > 74 && random() < 0.08)
    titles.push("Título continental");
  const awards: string[] = easy ? easyIndividualAwards(s.position) : [];
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
  s.news = [
    {
      id: `${s.season}-season`,
      type: "partido",
      headline: `${s.name} cierra el año con ${g} goles y ${a} asistencias`,
      detail: `${pj} partidos · valoración ${rating}`,
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
  s.lastSummary = `${pj} PJ · ${g} G · ${a} A · ${rating} valoración${injury ? ` · ${injury}` : ""}`;
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
