const COUNTRY_QIDS: Record<string, string> = {
  Paraguay: "Q733",
  Argentina: "Q414",
  Brasil: "Q155",
  Uruguay: "Q77",
  Ecuador: "Q736",
  España: "Q29",
  Inglaterra: "Q145",
  Italia: "Q38",
  Alemania: "Q183",
  Francia: "Q142",
  México: "Q96",
  "Estados Unidos": "Q30",
  "Arabia Saudita": "Q851",
};

// Ambiguous short names are pinned to their verified Wikidata entities.
// This prevents Nacional, River Plate, Independiente, Racing or Liverpool
// from ever borrowing another club's crest.
const ENTITY_OVERRIDES: Record<string, string> = {
  "Paraguay:Guaraní": "Q605044",
  "Paraguay:Nacional": "Q603101",
  "Paraguay:Ameliano": "Q15294976",
  "Paraguay:Independiente CG": "Q602815",
  "Paraguay:General Caballero JLM": "Q60853020",
  "Argentina:River Plate": "Q15799",
  "Argentina:Independiente": "Q214978",
  "Argentina:Racing Club": "Q276533",
  "Argentina:San Lorenzo": "Q218282",
  "Argentina:San Martín (T)": "Q1022938",
  "Argentina:San Martín (SJ)": "Q80921",
  "Argentina:Gimnasia (J)": "Q1022923",
  "Brasil:Guarani": "Q1133475",
  "Uruguay:Nacional": "Q499616",
  "Uruguay:River Plate (M)": "Q980573",
  "Uruguay:Racing Montevideo": "Q1417183",
  "Uruguay:Liverpool FC": "Q1131189",
  "Inglaterra:Liverpool": "Q1130849",
};

const SEARCH_ALIASES: Record<string, string> = {
  "Paraguay:Guaraní": "Club Guaraní",
  "Paraguay:Nacional": "Club Nacional Asunción",
  "Paraguay:Ameliano": "Sportivo Ameliano",
  "Paraguay:Independiente CG": "Independiente de Campo Grande",
  "Paraguay:General Caballero JLM": "General Caballero Juan León Mallorquín",
  "Argentina:Independiente": "Club Atlético Independiente Avellaneda",
  "Argentina:San Lorenzo": "San Lorenzo de Almagro",
  "Argentina:River Plate": "Club Atlético River Plate Buenos Aires",
  "Argentina:San Martín (T)": "San Martín de Tucumán",
  "Argentina:San Martín (SJ)": "San Martín de San Juan",
  "Argentina:Gimnasia (J)": "Gimnasia y Esgrima de Jujuy",
  "Brasil:Gremio": "Grêmio Foot-Ball Porto Alegrense",
  "Brasil:America Mineiro": "América Futebol Clube Minas Gerais",
  "Brasil:Sport Recife": "Sport Club do Recife",
  "Brasil:Guarani": "Guarani Futebol Clube",
  "Uruguay:Nacional": "Club Nacional de Football",
  "Uruguay:River Plate (M)": "Club Atlético River Plate Montevideo",
  "Uruguay:Racing Montevideo": "Racing Club de Montevideo",
  "Uruguay:Liverpool FC": "Liverpool Fútbol Club Montevideo",
  "Ecuador:El Nacional": "Club Deportivo El Nacional",
  "España:Racing de Santander": "Real Racing Club de Santander",
  "Inglaterra:Liverpool": "Liverpool Football Club",
  "Francia:Paris FC": "Paris Football Club",
};

type SearchResult = { title: string; snippet?: string };
type Entity = {
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>>;
  sitelinks?: Record<string, { title: string }>;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(club|atletico|football|futbol|futebol|fc|cf|cd|sc|ac|afc|ss|as|real|deportivo|sportivo)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const words = (value: string) => new Set(normalize(value).split(" ").filter(Boolean));

export function crestCandidateScore(club: string, entity: Entity) {
  const label = entity.labels?.es?.value ?? entity.labels?.en?.value ?? "";
  const description = `${entity.descriptions?.es?.value ?? ""} ${entity.descriptions?.en?.value ?? ""}`;
  const logo = entity.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
  if (!/(f[uú]tbol|football|soccer|sports? club|club deportivo|club de sport)/i.test(description)) return -500;
  const wanted = words(club);
  const found = words(label);
  const common = [...wanted].filter((word) => found.has(word)).length;
  const coverage = common / Math.max(1, wanted.size);
  const exact = normalize(club) === normalize(label);
  return (exact ? 100 : 0) + coverage * 60 - Math.abs(found.size - wanted.size) * 2 + (typeof logo === "string" ? 10 : 0);
}

export async function resolveClubCrest(club: string, league: string) {
  if (club === "Agente libre") return null;
  const country = league.split(" - ")[0];
  const countryQid = COUNTRY_QIDS[country];
  if (!countryQid) return null;
  const term = SEARCH_ALIASES[`${country}:${club}`] ?? club;
  const override = ENTITY_OVERRIDES[`${country}:${club}`];
  let ids: string[] = override ? [override] : [];
  if (!override) {
    const search = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: `\"${term}\" haswbstatement:P17=${countryQid}`,
      srnamespace: "0",
      srlimit: "10",
      format: "json",
      origin: "*",
    });
    const searchResponse = await fetch(`https://www.wikidata.org/w/api.php?${search}`);
    if (!searchResponse.ok) return null;
    const searchData = (await searchResponse.json()) as { query?: { search?: SearchResult[] } };
    ids = (searchData.query?.search ?? []).map((item) => item.title).filter((id) => /^Q\d+$/.test(id));
  }
  if (!ids.length) return null;
  const details = new URLSearchParams({
    action: "wbgetentities",
    ids: ids.join("|"),
    props: "labels|descriptions|claims|sitelinks",
    languages: "es|en",
    languagefallback: "1",
    format: "json",
    origin: "*",
  });
  const detailsResponse = await fetch(`https://www.wikidata.org/w/api.php?${details}`);
  if (!detailsResponse.ok) return null;
  const detailsData = (await detailsResponse.json()) as { entities?: Record<string, Entity> };
  const ranked = ids
    .map((id) => ({ entity: detailsData.entities?.[id], score: crestCandidateScore(term, detailsData.entities?.[id] ?? {}) }))
    .filter((candidate) => candidate.entity && (override || candidate.score >= 20))
    .sort((a, b) => b.score - a.score);
  const entity = ranked[0]?.entity;
  const filename = entity?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
  if (typeof filename === "string")
    return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}?width=160`;

  // Some valid club entities do not expose Wikidata's logo property. In that
  // case use the lead image from the club's own Wikipedia article, never from
  // an unrelated search result.
  const site = ["eswiki", "enwiki", "ptwiki", "dewiki", "frwiki", "itwiki"].find(
    (key) => entity?.sitelinks?.[key]?.title,
  );
  if (!site || !entity?.sitelinks?.[site]) return null;
  const pageImage = new URLSearchParams({
    action: "query",
    prop: "pageimages",
    titles: entity.sitelinks[site].title,
    piprop: "thumbnail",
    pithumbsize: "160",
    format: "json",
    origin: "*",
  });
  const language = site.replace("wiki", "");
  const pageResponse = await fetch(`https://${language}.wikipedia.org/w/api.php?${pageImage}`);
  if (!pageResponse.ok) return null;
  const pageData = (await pageResponse.json()) as {
    query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
  };
  return Object.values(pageData.query?.pages ?? {})[0]?.thumbnail?.source ?? null;
}
