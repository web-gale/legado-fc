import { useEffect, useMemo, useRef, useState } from "react";
import {
  acceptOffer,
  createCareer,
  renewContract,
  retireCareer,
  simulateSeason,
} from "./game/engine";
import { COUNTRIES, POSITION_LABELS, SEASON_PHASES } from "./game/data";
import {
  PERSONALITIES,
  POSITIONS,
  TRAINING_FOCUSES,
  type CareerState,
  type Difficulty,
  type NewCareer,
  type Position,
} from "./game/types";
type Tab = "carrera" | "temporada" | "mercado" | "estadísticas" | "legado";
const cash = (n: number) =>
  n >= 1e6
    ? `€${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} M`
    : `€${Math.round(n / 1e3)} mil`;
const attrs = [
  "velocidad",
  "fisico",
  "resistencia",
  "definicion",
  "pase",
  "vision",
  "tecnica",
  "defensa",
  "mentalidad",
  "liderazgo",
] as const;
const names = {
  velocidad: "Velocidad",
  fisico: "Físico",
  resistencia: "Resistencia",
  definicion: "Definición",
  pase: "Pase",
  vision: "Visión",
  tecnica: "Técnica",
  defensa: "Defensa",
  mentalidad: "Mentalidad",
  liderazgo: "Liderazgo",
};
function Icon({
  n,
}: {
  n: "bolt" | "calendar" | "money" | "settings" | "arrow" | "shield";
}) {
  const p = {
    bolt: "M13 2 4 14h7l-1 8 9-13h-7l1-7Z",
    calendar: "M5 3v3m14-3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
    money: "M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    settings:
      "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-13v2m0 15v2m9.5-9.5h-2m-15 0h-2m16.2-6.2-1.4 1.4M6.2 17.8l-1.4 1.4m14.4 0-1.4-1.4M6.2 6.2 4.8 4.8",
    arrow: "m9 18 6-6-6-6",
    shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z",
  };
  return (
    <svg viewBox="0 0 24 24">
      <path d={p[n]} />
    </svg>
  );
}
function Radar({ s }: { s: CareerState }) {
  const ks = [
      "pase",
      "tecnica",
      "definicion",
      "velocidad",
      "fisico",
      "defensa",
    ] as const,
    cx = 150,
    cy = 130,
    r = 88;
  const pts = (v: number) =>
    ks
      .map((_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        return `${cx + (Math.cos(a) * r * v) / 100},${cy + (Math.sin(a) * r * v) / 100}`;
      })
      .join(" ");
  return (
    <svg
      className="radar"
      viewBox="0 0 300 260"
      role="img"
      aria-label="Perfil técnico"
    >
      {[25, 50, 75, 100].map((v) => (
        <polygon key={v} points={pts(v)} className="grid" />
      ))}
      {ks.map((k, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        return (
          <text
            key={k}
            x={cx + Math.cos(a) * 115}
            y={cy + Math.sin(a) * 105}
            textAnchor="middle"
          >
            {names[k].toUpperCase()}
          </text>
        );
      })}
      <polygon points={pts(62)} className="avg" />
      <polygon
        points={ks
          .map((k, i) => {
            const a = -Math.PI / 2 + (i * Math.PI) / 3;
            return `${cx + (Math.cos(a) * r * s.attributes[k]) / 100},${cy + (Math.sin(a) * r * s.attributes[k]) / 100}`;
          })
          .join(" ")}
        className="player"
      />
    </svg>
  );
}
function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </article>
  );
}

function ClubCrest({
  club,
  league = "",
  compact = false,
}: {
  club: string;
  league?: string;
  compact?: boolean;
}) {
  const [logo, setLogo] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    // Reset visual state whenever the club identity changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFailed(false);
    if (club === "Agente libre") {
      setLogo(null);
      return;
    }
    const country = league.split(" - ")[0];
    const key = `legado-crest:${club}:${country}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      setLogo(cached);
      return;
    }
    const query = encodeURIComponent(`${club} ${country} football club`);
    fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${query}&language=es&uselang=es&type=item&limit=7&format=json&origin=*`)
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        const candidate = data?.search?.find((item: {description?:string}) => /fútbol|football|soccer/i.test(item.description ?? "")) ?? data?.search?.[0];
        if (!candidate?.id) return null;
        const details = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${candidate.id}&props=claims&format=json&origin=*`).then(r => r.ok ? r.json() : null);
        const filename = details?.entities?.[candidate.id]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
        return filename ? `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}?width=160` : null;
      })
      .then((src) => {
        if (src) {
          localStorage.setItem(key, src);
          setLogo(src);
        } else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [club, league]);
  const initials =
    club === "Agente libre"
      ? "AL"
      : club
          .split(/\s+/)
          .slice(0, 2)
          .map((x) => x[0])
          .join("")
          .toUpperCase();
  return (
    <div
      className={`club-crest ${compact ? "compact" : ""}`}
      title={
        club === "Agente libre"
          ? "Jugador sin club"
          : `${club} · imagen de Wikipedia/Wikimedia`
      }
    >
      {logo && !failed ? (
        // Wikimedia serves the original crest and the URL is discovered at runtime.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={`Escudo de ${club}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
function NewCareer({
  open,
  close,
  create,
}: {
  open: boolean;
  close: () => void;
  create: (x: NewCareer) => void;
}) {
  const [name, setName] = useState("Álvaro Galeano"),
    [nationality, setNationality] = useState("Paraguay"),
    [position, setPosition] = useState<Position>("MP"),
    [personality, setPersonality] =
      useState<(typeof PERSONALITIES)[number]>("Profesional"),
    [difficulty, setDifficulty] = useState<Difficulty>("Profesional");
  if (!open) return null;
  return (
    <div className="backdrop">
      <section className="modal" role="dialog" aria-modal="true">
        <button className="x" onClick={close}>
          ×
        </button>
        <p className="eyebrow">NUEVO LEGADO</p>
        <h2>Crea tu futbolista</h2>
        <p>Empieza a los 14 años. Cada elección afectará toda tu carrera.</p>
        <div className="form">
          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Nacionalidad
            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            >
              {COUNTRIES.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>
          </label>
          <label>
            Posición
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p} · {POSITION_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Personalidad
            <select
              value={personality}
              onChange={(e) =>
                setPersonality(e.target.value as typeof personality)
              }
            >
              {PERSONALITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Dificultad
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option>Promesa</option>
              <option>Profesional</option>
              <option>Leyenda</option>
            </select>
          </label>
        </div>
        <button
          className="primary wide"
          onClick={() =>
            create({
              name: name.trim(),
              nationality: nationality.trim(),
              position,
              personality,
              difficulty,
            })
          }
        >
          Comenzar carrera <Icon n="arrow" />
        </button>
      </section>
    </div>
  );
}
export default function Home() {
  const [state, setState] = useState<CareerState>(() =>
      createCareer(
        {
          name: "Álvaro Galeano",
          nationality: "Paraguay",
          position: "MP",
          personality: "Profesional",
          difficulty: "Profesional",
        },
        20260803,
      ),
    ),
    [tab, setTab] = useState<Tab>("carrera"),
    [theme, setTheme] = useState<"dark" | "light">(() =>
      typeof window !== "undefined"
        ? ((localStorage.getItem("legado-theme") as "dark" | "light" | null) ??
          "dark")
        : "dark",
    ),
    [newOpen, setNewOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [save, setSave] = useState("Partida local lista");
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const saved = localStorage.getItem("legado-career");
    if (saved)
      try {
        // Hydrate the client-only career after LocalStorage becomes available.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(JSON.parse(saved));
        setSave("Partida local cargada");
      } catch {
        setSave("Nueva partida local");
      }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("legado-theme", theme);
  }, [theme]);
  const persist = async (s: CareerState) => {
    setSave("Guardando…");
    try {
      localStorage.setItem("legado-career", JSON.stringify(s));
      setSave("Guardado en este dispositivo");
    } catch {
      setSave("Espacio insuficiente · exporta una copia");
    }
  };
  const advance = async () => {
    setBusy(true);
    const n = simulateSeason(state);
    setState(n);
    await persist(n);
    setBusy(false);
    if (n.status === "retired") setTab("legado");
  };
  const make = (x: NewCareer) => {
    const n = createCareer(x);
    setState(n);
    setNewOpen(false);
    setTab("carrera");
    persist(n);
  };
  const offer = (i: number) => {
    const n = acceptOffer(state, state.offers[i]);
    setState(n);
    persist(n);
  };
  const renew = () => {
    const n = renewContract(state);
    setState(n);
    persist(n);
  };
  const retire = () => {
    if (state.age < 32 || !confirm("¿Cerrar definitivamente esta carrera?"))
      return;
    const n = retireCareer(state);
    setState(n);
    setTab("legado");
    persist(n);
  };
  const exp = () => {
    const b = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      }),
      a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `legado-${state.name.replace(/\s+/g, "-")}.json`;
    a.click();
  };
  const imp = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const x = JSON.parse(String(r.result));
        if (x.version !== 1 || !Array.isArray(x.history)) throw 0;
        delete x.saveId;
        setState(x);
        persist(x);
      } catch {
        alert("Guardado inválido");
      }
    };
    r.readAsText(f);
  };
  const progress = useMemo(
    () => Math.round(((state.age - 14) / 28) * 100),
    [state.age],
  );
  return (
    <main className="shell">
      <header>
        <button className="brand" onClick={() => setTab("carrera")}>
          <b>LEGADO</b> <em>FC</em>
        </button>
        <nav>
          {(["carrera", "temporada", "mercado", "estadísticas"] as Tab[]).map(
            (t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ),
          )}
        </nav>
        <div className="meta">
          <span>
            <Icon n="bolt" />
            {state.fitness}
          </span>
          <span>
            <Icon n="calendar" />
            {state.age} años
          </span>
          <span>
            <Icon n="money" />
            {cash(state.moneyEarned)}
          </span>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Icon n="settings" />
          </button>
        </div>
      </header>
      <div className="mobile">
        {(["carrera", "temporada", "mercado", "estadísticas"] as Tab[]).map(
          (t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t.slice(0, 4)}
            </button>
          ),
        )}
      </div>
      {tab === "carrera" && (
        <section className="dashboard">
          <div className="hero">
            <p className="eyebrow">DECISIÓN DE CARRERA</p>
            <h1>
              Tu carrera.
              <br />
              Tus decisiones.
              <br />
              <span>Tu legado.</span>
            </h1>
            <p>
              {state.club === "Agente libre"
                ? `${state.name} aún no tiene club. Su primera oferta de ${state.nationality} ya está sobre la mesa.`
                : `${state.name} está escribiendo su historia en ${state.club}. La próxima temporada puede cambiarlo todo.`}
            </p>
            <button
              className="primary"
              onClick={() =>
                setTab(
                  state.status !== "active"
                    ? "legado"
                    : state.club === "Agente libre"
                      ? "mercado"
                      : "temporada",
                )
              }
            >
              {state.status !== "active"
                ? "Ver legado"
                : state.club === "Agente libre"
                  ? "Revisar primera oferta"
                  : "Continuar carrera"}
              <Icon n="arrow" />
            </button>
            <button className="link" onClick={() => setNewOpen(true)}>
              Crear nueva carrera ↗
            </button>
          </div>
          <div className="career">
            <div className="player-head">
              <ClubCrest club={state.club} league={state.league} />
              <div>
                <h2>{state.name}</h2>
                <p>
                  <b>{state.age} AÑOS</b> · {state.position} · {state.club}
                </p>
              </div>
            </div>
            <div className="decision-grid">
              <article>
                <p className="eyebrow">PERFIL TÉCNICO</p>
                <Radar s={state} />
                <small>
                  La especialización define tu techo. No puedes dominarlo todo.
                </small>
              </article>
              <article className="next">
                <p className="eyebrow">PRÓXIMO PASO</p>
                <h3>
                  {state.lastSummary
                    ? "Temporada completada"
                    : state.club === "Agente libre"
                      ? "Tu primera oferta ha llegado"
                      : "Tu historia te espera"}
                </h3>
                <p>
                  {state.lastSummary ??
                    (state.club === "Agente libre"
                      ? `${state.offers[0]?.club ?? "Un club de tu país"} quiere darte tu primera oportunidad profesional.`
                      : "Entrena, compite y decide el rumbo de tu carrera.")}
                </p>
                <button
                  className="choice cyan"
                  onClick={() => setTab("temporada")}
                >
                  <b>✓</b>
                  <span>
                    <strong>PREPARAR TEMPORADA</strong>
                    <small>Entrenamiento y riesgo</small>
                  </span>
                  <em>
                    DESARROLLO
                    <br />
                    DINÁMICO
                  </em>
                </button>
                <button
                  className="choice orange"
                  onClick={() => setTab("mercado")}
                >
                  <b>⌁</b>
                  <span>
                    <strong>EXPLORAR MERCADO</strong>
                    <small>
                      {state.offers.length
                        ? `${state.offers.length} ofertas activas`
                        : "Construye tu reputación"}
                    </small>
                  </span>
                  <em>
                    DECISIÓN
                    <br />
                    CLAVE
                  </em>
                </button>
              </article>
            </div>
          </div>
          <div className="career-line">
            <div>
              <p className="eyebrow">LÍNEA DE CARRERA</p>
              <div className="timeline">
                <span>14</span>
                <i style={{ width: `${progress}%` }} />
                <b style={{ left: `${progress}%` }}>
                  {state.age}
                  <small>ACTUAL</small>
                </b>
                <span>21</span>
                <span>28</span>
                <span>35</span>
                <span>42</span>
              </div>
            </div>
            <div className="kpis">
              <Stat label="MEDIA" value={state.overall} />
              <Stat label="POTENCIAL" value={state.attributes.potencial} />
              <Stat label="VALOR" value={cash(state.marketValue)} />
              <Stat label="POPULARIDAD" value={state.popularity} />
            </div>
          </div>
        </section>
      )}
      {tab === "temporada" && (
        <section className="page">
          <div className="page-head">
            <div>
              <p className="eyebrow">
                TEMPORADA {state.season} · {state.age} AÑOS
              </p>
              <h1>Prepara el próximo año</h1>
              <p>Elige una especialización y cuánto riesgo quieres asumir.</p>
            </div>
            <span className="save">● {save}</span>
          </div>
          <div className="season">
            <section className="panel">
              <h2>Foco de entrenamiento</h2>
              <p className="muted">
                Solo el área elegida recibe el crecimiento principal.
              </p>
              <div className="training">
                {TRAINING_FOCUSES.map((f) => (
                  <button
                    key={f}
                    className={state.trainingFocus === f ? "selected" : ""}
                    onClick={() => setState({ ...state, trainingFocus: f })}
                  >
                    <b>{f}</b>
                    <small>
                      {f === "Recuperación"
                        ? "Menos riesgo"
                        : "Especialización dirigida"}
                    </small>
                  </button>
                ))}
              </div>
              <h2>Intensidad</h2>
              <div className="segments">
                {(["prudente", "equilibrado", "máximo"] as const).map((r) => (
                  <button
                    key={r}
                    className={state.riskMode === r ? "selected" : ""}
                    onClick={() => setState({ ...state, riskMode: r })}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>
            <aside className="panel calendar">
              <p className="eyebrow">CALENDARIO ANUAL</p>
              <ol>
                {SEASON_PHASES.map((p, i) => (
                  <li key={p}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {p}
                  </li>
                ))}
              </ol>
              <div className="risk">
                <b>Riesgo {state.riskMode}</b>
                <p>
                  Edad, resistencia, carga e historial determinan las lesiones.
                </p>
              </div>
              <button
                className="primary wide"
                onClick={advance}
                disabled={
                  busy ||
                  state.status === "retired" ||
                  state.club === "Agente libre"
                }
              >
                {busy
                  ? "Simulando mundo…"
                  : state.status === "retired"
                    ? "Carrera finalizada"
                    : state.club === "Agente libre"
                      ? "Acepta primero una oferta"
                      : `Simular temporada ${state.season}`}
                <Icon n="arrow" />
              </button>
              {state.age >= 32 && state.status === "active" && (
                <button className="retire" onClick={retire}>
                  Retirarse voluntariamente
                </button>
              )}
            </aside>
          </div>
        </section>
      )}
      {tab === "mercado" && (
        <section className="page">
          <div className="page-head">
            <div>
              <p className="eyebrow">MERCADO Y CONTRATO</p>
              <h1>Elige tu próximo desafío</h1>
              <p>
                Tu agente filtra clubes según edad, rendimiento, valor y
                posición.
              </p>
            </div>
            <Stat
              label="CONTRATO"
              value={`${state.contractYears} años`}
              sub={`${cash(state.salary)} / año`}
            />
          </div>
          <div className="offers">
            <article className="offer current">
              <span>CLUB ACTUAL</span>
              <ClubCrest club={state.club} league={state.league} compact />
              <h2>{state.club}</h2>
              <p>
                {state.league} · Prestigio {state.clubPrestige}
              </p>
              <b>{cash(state.salary)}</b>
              <small>salario anual</small>
              {state.club !== "Agente libre" ? (
                <button onClick={renew}>Renovar 3 años</button>
              ) : (
                <small className="free-note">
                  Sin contrato · debes aceptar tu primera oferta
                </small>
              )}
            </article>
            {state.offers.map((o, i) => (
              <article className="offer" key={o.club}>
                <span>
                  {o.firstOffer ? "PRIMERA OFERTA" : "OFERTA"} ·{" "}
                  {o.role.toUpperCase()}
                </span>
                <ClubCrest club={o.club} league={o.league} compact />
                <h2>{o.club}</h2>
                <p>
                  {o.league} · Prestigio {o.prestige}
                </p>
                <b>{cash(o.salary)}</b>
                <small>
                  {o.years} años
                  {o.firstOffer
                    ? " · primer contrato"
                    : ` · traspaso ${cash(o.fee)}`}
                </small>
                <button onClick={() => offer(i)}>Aceptar oferta</button>
              </article>
            ))}
            {!state.offers.length && (
              <article className="offer">
                <h2>Sin ofertas formales</h2>
                <p>Completa una gran temporada para atraer clubes.</p>
              </article>
            )}
          </div>
          <p className="logo-source">
            Escudos obtenidos automáticamente desde Wikipedia/Wikimedia. Si no
            existe una imagen compatible, se muestran las iniciales del club.
          </p>
          <section className="panel news">
            <h2>Noticias del mundo</h2>
            {state.news.slice(0, 8).map((n) => (
              <article key={n.id}>
                <span>{n.type}</span>
                <div>
                  <h3>{n.headline}</h3>
                  <p>{n.detail}</p>
                </div>
                <time>T{n.season}</time>
              </article>
            ))}
          </section>
        </section>
      )}
      {tab === "estadísticas" && (
        <section className="page">
          <div className="page-head">
            <div>
              <p className="eyebrow">CENTRO DE RENDIMIENTO</p>
              <h1>Tu carrera en datos</h1>
            </div>
            <button className="secondary" onClick={exp}>
              Exportar carrera
            </button>
          </div>
          <div className="stats">
            <Stat label="PARTIDOS" value={state.records.appearances ?? 0} />
            <Stat label="GOLES" value={state.records.goals ?? 0} />
            <Stat label="ASISTENCIAS" value={state.records.assists ?? 0} />
            <Stat label="SELECCIÓN" value={state.nationalCaps} />
            <section className="panel chart">
              <p className="eyebrow">VALOR HISTÓRICO</p>
              <h2>{cash(state.marketValue)}</h2>
              <div>
                {state.history.map((h) => (
                  <i
                    key={h.season}
                    style={{
                      height: `${Math.max(8, (h.marketValue / Math.max(...state.history.map((x) => x.marketValue), 1)) * 100)}%`,
                    }}
                    title={`${h.age}: ${cash(h.marketValue)}`}
                  />
                ))}
              </div>
            </section>
            <section className="panel attributes">
              <p className="eyebrow">ATRIBUTOS</p>
              {attrs.map((a) => (
                <div key={a}>
                  <span>{names[a]}</span>
                  <i>
                    <b style={{ width: `${state.attributes[a]}%` }} />
                  </i>
                  <strong>{state.attributes[a]}</strong>
                </div>
              ))}
            </section>
          </div>
          <section className="panel table">
            <table>
              <thead>
                <tr>
                  <th>Edad</th>
                  <th>Club</th>
                  <th>PJ</th>
                  <th>Min</th>
                  <th>G</th>
                  <th>A</th>
                  <th>Val.</th>
                  <th>Media</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {[...state.history].reverse().map((s) => (
                  <tr key={s.season}>
                    <td>{s.age}</td>
                    <td>{s.club}</td>
                    <td>{s.appearances}</td>
                    <td>{s.minutes}</td>
                    <td>{s.goals}</td>
                    <td>{s.assists}</td>
                    <td>{s.rating}</td>
                    <td>{s.overall}</td>
                    <td>{cash(s.marketValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!state.history.length && (
              <p className="muted">
                Simula tu primera temporada para abrir el historial.
              </p>
            )}
          </section>
          <button className="secondary" onClick={() => file.current?.click()}>
            Importar guardado
          </button>
          <input
            ref={file}
            hidden
            type="file"
            accept="application/json"
            onChange={(e) => imp(e.target.files?.[0])}
          />
        </section>
      )}
      {tab === "legado" && (
        <section className="page legacy">
          <p className="eyebrow">INFORME PROFESIONAL DE CARRERA</p>
          <h1>
            {state.status === "retired"
              ? state.finalLegend
              : "Tu legado aún se está escribiendo"}
          </h1>
          <p>
            {state.status === "retired"
              ? `${state.name} se retira a los ${state.age} años después de ${state.history.length} temporadas.`
              : "Al retirarte, aquí aparecerá el expediente definitivo de tu vida futbolística."}
          </p>
          <div className="score">
            <span>PUNTUACIÓN DE LEGADO</span>
            <strong>{state.records.legacyScore ?? "—"}</strong>
          </div>
          <div className="legacy-grid">
            <Stat
              label="CLUBES"
              value={
                new Set(state.history.map((h) => h.club).concat(state.club))
                  .size
              }
            />
            <Stat label="TÍTULOS" value={state.titles.length} />
            <Stat label="PREMIOS" value={state.awards.length} />
            <Stat
              label="VALOR MÁXIMO"
              value={cash(state.records.maxValue ?? state.marketValue)}
            />
            <Stat
              label="MAYOR TRASPASO"
              value={cash(state.records.maxTransfer ?? 0)}
            />
            <Stat label="DINERO GANADO" value={cash(state.moneyEarned)} />
            <Stat label="POPULARIDAD" value={state.popularity} />
            <Stat label="SELECCIÓN" value={`${state.nationalCaps} PJ`} />
          </div>
        </section>
      )}
      <footer>
        <span>LEGADO FC · MOTOR DE CARRERA v1</span>
        <span>{save}</span>
        <button onClick={() => setNewOpen(true)}>Nueva carrera</button>
      </footer>
      <NewCareer open={newOpen} close={() => setNewOpen(false)} create={make} />
    </main>
  );
}
