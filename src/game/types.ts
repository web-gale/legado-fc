export const POSITIONS = [
  "POR",
  "LD",
  "LI",
  "DFC",
  "MCD",
  "MC",
  "MP",
  "ED",
  "EI",
  "DC",
] as const;
export const PERSONALITIES = [
  "Ambicioso",
  "Leal",
  "Profesional",
  "Temperamental",
  "Líder",
  "Trabajador",
] as const;
export const TRAINING_FOCUSES = [
  "Explosividad",
  "Fuerza",
  "Finalización",
  "Creación",
  "Defensa",
  "Liderazgo",
  "Recuperación",
] as const;
export type Position = (typeof POSITIONS)[number];
export type Personality = (typeof PERSONALITIES)[number];
export type TrainingFocus = (typeof TRAINING_FOCUSES)[number];
export type Difficulty = "Promesa" | "Profesional" | "Leyenda";
export type Attributes = {
  velocidad: number;
  fisico: number;
  resistencia: number;
  definicion: number;
  pase: number;
  vision: number;
  tecnica: number;
  defensa: number;
  mentalidad: number;
  liderazgo: number;
  potencial: number;
};
export type SeasonRecord = {
  season: number;
  age: number;
  club: string;
  league: string;
  appearances: number;
  leagueMatches?: number;
  cupMatches?: number;
  internationalMatches?: number;
  minutes: number;
  goals: number;
  assists: number;
  cards: number;
  rating: number;
  overall: number;
  marketValue: number;
  popularity: number;
  salary: number;
  titles: string[];
  awards: string[];
  nationalCaps: number;
  nationalGoals: number;
  injury?: string;
  leagueMovement?: "Ascenso" | "Descenso";
  nextLeague?: string;
  transferFee?: number;
};
export type NewsItem = {
  id: string;
  type: "mercado" | "partido" | "selección" | "premio" | "lesión" | "mundo";
  headline: string;
  detail: string;
  season: number;
};
export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlockedAt: number;
};
export type Offer = {
  club: string;
  league: string;
  prestige: number;
  salary: number;
  fee: number;
  years: number;
  role: "Promesa" | "Rotación" | "Titular" | "Estrella";
  firstOffer?: boolean;
};
export type CareerState = {
  version: 1;
  saveId?: string;
  status: "active" | "retired";
  seed: number;
  season: number;
  age: number;
  name: string;
  nationality: string;
  position: Position;
  personality: Personality;
  difficulty: Difficulty;
  club: string;
  league: string;
  clubPrestige: number;
  contractYears: number;
  salary: number;
  attributes: Attributes;
  overall: number;
  form: number;
  fitness: number;
  morale: number;
  reputation: number;
  popularity: number;
  marketValue: number;
  moneyEarned: number;
  nationalCaps: number;
  nationalGoals: number;
  titles: string[];
  awards: string[];
  records: Record<string, number>;
  history: SeasonRecord[];
  news: NewsItem[];
  achievements: Achievement[];
  offers: Offer[];
  trainingFocus: TrainingFocus;
  riskMode: "prudente" | "equilibrado" | "máximo";
  lastSummary?: string;
  finalLegend?: string;
};
export type NewCareer = Pick<
  CareerState,
  "name" | "nationality" | "position" | "personality" | "difficulty"
>;
