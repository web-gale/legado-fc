const SPORTS = {
  football: "https://v3.football.api-sports.io",
  basketball: "https://v1.basketball.api-sports.io",
  baseball: "https://v1.baseball.api-sports.io",
  formula1: "https://v1.formula-1.api-sports.io",
  handball: "https://v1.handball.api-sports.io",
  hockey: "https://v1.hockey.api-sports.io",
  mma: "https://v1.mma.api-sports.io",
  nfl: "https://v1.american-football.api-sports.io",
  rugby: "https://v1.rugby.api-sports.io",
  volleyball: "https://v1.volleyball.api-sports.io",
  afl: "https://v1.afl.api-sports.io",
};

const ALLOWED_ENDPOINTS = new Set(["status", "fixtures", "games", "races", "fights", "standings"]);
const ALLOWED_ORIGINS = new Set(["https://web-gale.github.io", "http://localhost:5173"]);

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://web-gale.github.io",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept",
    Vary: "Origin",
  };
}

export default {
  async fetch(request, env, context) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "GET" || !ALLOWED_ORIGINS.has(origin)) return new Response("Forbidden", { status: 403 });
    if (!env.API_SPORTS_KEY) return new Response("API secret is not configured", { status: 503, headers: cors(origin) });

    const url = new URL(request.url);
    const [sport, endpoint] = url.pathname.split("/").filter(Boolean);
    if (!SPORTS[sport] || !ALLOWED_ENDPOINTS.has(endpoint)) return new Response("Not found", { status: 404, headers: cors(origin) });

    const upstream = `${SPORTS[sport]}/${endpoint}?${url.searchParams}`;
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const response = await fetch(upstream, {
      headers: { Accept: "application/json", "x-apisports-key": env.API_SPORTS_KEY },
    });
    const safe = new Response(response.body, {
      status: response.status,
      headers: {
        ...cors(origin),
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": response.ok ? "public, max-age=60, s-maxage=900" : "no-store",
      },
    });
    if (response.ok) context.waitUntil(cache.put(cacheKey, safe.clone()));
    return safe;
  },
};

