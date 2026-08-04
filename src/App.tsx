import { useEffect, useMemo, useRef, useState } from "react";
import {
  acceptOffer,
  createCareer,
  renewContract,
  retireCareer,
  simulateSeason,
} from "./game/engine";
import { COUNTRIES, POSITION_LABELS, SEASON_PHASES } from "./game/data";
import { resolveClubCrest } from "./game/crests";
import {
  getApiSportsSettings,
  loadSportsSnapshot,
  saveApiSportsSettings,
  testApiSportsConnection,
  SPORTS,
  type ApiSportsSettings,
  type SportId,
  type SportsSnapshot,
} from "./sports/api";
import {
  PERSONALITIES,
  POSITIONS,
  TRAINING_FOCUSES,
  type CareerState,
  type Difficulty,
  type NewCareer,
  type Position,
  type SeasonRecord,
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
    const key = `legado-crest:v3:${club}:${country}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      setLogo(cached);
      return;
    }
    resolveClubCrest(club, league)
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
          : `${club} · escudo original verificado`
      }
    >
      {logo && !failed ? (
        // The resolver validates the club identity before accepting a crest.
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

function achievementIcon(name: string, type: "title" | "award") {
  if (/Mundial|Intercontinental/.test(name)) return "🌍";
  if (/Champions|Libertadores|CONCACAF|AFC|Sudamericana|Europa|Conference/.test(name)) return "🏆";
  if (/Balón de Oro|The Best/.test(name)) return "🥇";
  if (/Goleador|Bota de Oro|Gerd Müller/.test(name)) return "👟";
  if (/Guante|guardameta/.test(name)) return "🧤";
  if (/Equipo Ideal|World11/.test(name)) return "⭐";
  return type === "title" ? "🏆" : "🎖️";
}

function SeasonReport({
  report,
  close,
}: {
  report: SeasonRecord | null;
  close: () => void;
}) {
  if (!report) return null;
  return (
    <div className="backdrop season-report-backdrop">
      <section className="modal season-report" role="dialog" aria-modal="true" aria-labelledby="season-report-title">
        <button className="x" onClick={close} aria-label="Cerrar informe">×</button>
        <p className="eyebrow">TEMPORADA {report.season} COMPLETADA</p>
        <h2 id="season-report-title">Noche de campeones</h2>
        <p>{report.club} · {report.league}</p>
        <div className="report-stats">
          <Stat label="PARTIDOS" value={report.appearances} sub={`${report.leagueMatches ?? report.appearances} liga · ${report.cupMatches ?? 0} copas · ${report.internationalMatches ?? 0} internacional`} />
          <Stat label="GOLES" value={report.goals} sub={`${(report.goals / Math.max(1, report.appearances)).toFixed(2)} por partido`} />
          <Stat label="ASISTENCIAS" value={report.assists} sub={`${(report.assists / Math.max(1, report.appearances)).toFixed(2)} por partido`} />
          <Stat label="VALORACIÓN" value={report.rating} />
        </div>
        <div className="honours-grid">
          <article className="honours team-honours">
            <span className="honours-kicker">🏆 TÍTULOS DEL EQUIPO</span>
            <h3>{report.titles.length ? `${report.titles.length} conquistas` : "Sin títulos esta temporada"}</h3>
            {report.titles.map((title) => (
              <div className="honour" key={title}>
                <b>{achievementIcon(title, "title")}</b>
                <span><strong>{title}</strong><small>Campeón con {report.club}</small></span>
              </div>
            ))}
          </article>
          <article className="honours player-honours">
            <span className="honours-kicker">🎖️ PREMIOS INDIVIDUALES</span>
            <h3>{report.awards.length ? `${report.awards.length} reconocimientos` : "Sin premios esta temporada"}</h3>
            {report.awards.map((award) => (
              <div className="honour" key={award}>
                <b>{achievementIcon(award, "award")}</b>
                <span><strong>{award}</strong><small>Temporada {report.season}</small></span>
              </div>
            ))}
          </article>
        </div>
        <button className="primary wide" onClick={close}>Continuar carrera <Icon n="arrow" /></button>
      </section>
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
              <option value="Promesa">Fácil · Éxito total</option>
              <option value="Profesional">Normal · Carrera legendaria</option>
              <option value="Leyenda">Difícil · Máximo desafío</option>
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
function CareerGame() {
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
    [seasonReport, setSeasonReport] = useState<SeasonRecord | null>(null),
    [busy, setBusy] = useState(false),
    [save, setSave] = useState("Partida local lista"),
    [cardPhoto, setCardPhoto] = useState<string | null>(null),
    [cardBusy, setCardBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const photoFile = useRef<HTMLInputElement>(null);
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
    setSeasonReport(n.history.at(-1) ?? null);
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
  const loadCardPhoto = (f?: File) => {
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setCardPhoto(String(reader.result));
    reader.readAsDataURL(f);
  };
  const downloadLegacyCard = async () => {
    if (state.status !== "retired") return;
    setCardBusy(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas no disponible");
      canvas.width = 1080;
      canvas.height = 1350;
      const orange = "#ff4a16", cyan = "#27c9d7", ink = "#080d0e", pale = "#f2eee6";
      const fit = (value: string, max: number, initial: number, weight = 800) => {
        let size = initial;
        ctx.font = `${weight} ${size}px Arial, sans-serif`;
        while (ctx.measureText(value).width > max && size > 22) {
          size -= 2;
          ctx.font = `${weight} ${size}px Arial, sans-serif`;
        }
        return size;
      };
      const text = (value: string, x: number, y: number, size: number, color = pale, weight = 800, align: CanvasTextAlign = "left") => {
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.font = `${weight} ${size}px Arial, sans-serif`;
        ctx.fillText(value, x, y);
      };
      const stat = (label: string, value: string | number, x: number, y: number) => {
        text(String(value), x, y, 54, pale, 900, "center");
        text(label, x, y + 33, 17, "#9ba4a5", 800, "center");
      };
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
      gradient.addColorStop(0, "#132022");
      gradient.addColorStop(.55, ink);
      gradient.addColorStop(1, "#28110b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1350);
      ctx.fillStyle = "rgba(39,201,215,.10)";
      ctx.beginPath();
      ctx.arc(170, 310, 330, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = orange;
      ctx.fillRect(0, 0, 1080, 14);
      ctx.fillRect(70, 1168, 940, 3);
      text("LEGADO", 70, 85, 44, pale, 900);
      text("FC", 270, 85, 44, orange, 900);
      text("CARRERA FINALIZADA", 1010, 78, 17, cyan, 900, "right");
      text(String(state.overall), 880, 225, 128, pale, 900, "center");
      text("VALORACIÓN FINAL", 880, 264, 17, "#9ba4a5", 800, "center");
      ctx.strokeStyle = orange;
      ctx.lineWidth = 4;
      ctx.strokeRect(762, 115, 236, 175);
      if (cardPhoto) {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Foto inválida"));
          image.src = cardPhoto;
        });
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(70, 135, 510, 520, 24);
        ctx.clip();
        const scale = Math.max(510 / image.width, 520 / image.height);
        const width = image.width * scale, height = image.height * scale;
        ctx.drawImage(image, 70 + (510 - width) / 2, 135 + (520 - height) / 2, width, height);
        ctx.restore();
      } else {
        ctx.fillStyle = "#172628";
        ctx.fillRect(70, 135, 510, 520);
        ctx.fillStyle = "#24383a";
        ctx.beginPath();
        ctx.arc(325, 300, 112, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(325, 610, 235, 210, 0, Math.PI, 0);
        ctx.fill();
        const initials = state.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("");
        text(initials, 325, 340, 86, cyan, 900, "center");
      }
      text(state.name.toUpperCase(), 70, 735, fit(state.name.toUpperCase(), 900, 67), pale, 900);
      text(`${state.nationality.toUpperCase()}  ·  ${state.position}  ·  RETIRO A LOS ${state.age}`, 72, 780, 23, orange, 900);
      stat("PARTIDOS", state.records.appearances ?? 0, 140, 890);
      stat("GOLES", state.records.goals ?? 0, 340, 890);
      stat("ASISTENCIAS", state.records.assists ?? 0, 540, 890);
      stat("SELECCIÓN", state.nationalCaps, 740, 890);
      stat("TÍTULOS", state.titles.length, 940, 890);
      text("TRAYECTORIA", 70, 1015, 18, cyan, 900);
      const clubs = [...new Set(state.history.map((season) => season.club).filter(Boolean))];
      const route = clubs.length ? clubs.join("  ›  ") : state.club;
      text(route, 70, 1065, fit(route, 940, 31, 700), pale, 700);
      text("LEGADO", 70, 1140, 18, cyan, 900);
      const legend = state.finalLegend ?? "Profesional respetado";
      text(legend, 70, 1215, fit(legend, 650, 46), pale, 900);
      text(`${state.history.length} TEMPORADAS  ·  VALOR MÁX. ${cash(state.records.maxValue ?? state.marketValue)}`, 70, 1260, 20, "#9ba4a5", 700);
      text(`PUNTUACIÓN ${state.records.legacyScore ?? 0}`, 1010, 1230, 22, orange, 900, "right");
      text("TU HISTORIA. TU CARRERA. TU LEGADO.", 1010, 1280, 15, "#9ba4a5", 800, "right");
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png", 1);
      a.download = `legado-fc-${state.name.trim().replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
    } catch {
      alert("No se pudo generar la imagen. Prueba con otra foto.");
    } finally {
      setCardBusy(false);
    }
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
            Escudos originales obtenidos desde proveedores deportivos y fuentes
            verificadas. Si ninguna imagen coincide de forma segura, se muestran
            las iniciales del club.
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
          {state.status === "retired" && (
            <section className="legacy-download">
              <div>
                <p className="eyebrow">TARJETA FINAL · PNG 1080 × 1350</p>
                <h2>Comparte la historia de tu carrera</h2>
                <p>
                  Genera una imagen con tus estadísticas, trayectoria y legado.
                  Puedes añadir una foto personal; nunca sale de este dispositivo.
                </p>
              </div>
              <div className="legacy-download-actions">
                <button className="secondary" onClick={() => photoFile.current?.click()}>
                  {cardPhoto ? "Cambiar foto" : "Añadir foto (opcional)"}
                </button>
                {cardPhoto && (
                  <button className="secondary" onClick={() => setCardPhoto(null)}>
                    Quitar foto
                  </button>
                )}
                <button className="primary" onClick={downloadLegacyCard} disabled={cardBusy}>
                  {cardBusy ? "Generando imagen…" : "Descargar tarjeta PNG"}
                </button>
                <input
                  ref={photoFile}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => loadCardPhoto(event.target.files?.[0])}
                />
              </div>
            </section>
          )}
        </section>
      )}
      <footer>
        <span>LEGADO FC · MOTOR DE CARRERA v1</span>
        <span>{save}</span>
        <button onClick={() => setNewOpen(true)}>Nueva carrera</button>
      </footer>
      <NewCareer open={newOpen} close={() => setNewOpen(false)} create={make} />
      <SeasonReport report={seasonReport} close={() => setSeasonReport(null)} />
    </main>
  );
}

type PortalSection = "inicio" | "deportes" | "juegos" | "prode" | "analisis" | "cuenta";
type PortalLanguage = "ES" | "EN" | "PT";

const portalCopy = {
  ES: { live: "Deportes en vivo", games: "Juegos", prediction: "Prode", analysis: "Análisis", play: "Jugar modo carrera", headline: "Todo el deporte. Un solo legado.", intro: "Resultados mundiales, estadísticas, análisis y juegos de fútbol, básquetbol, tenis motor, béisbol, hockey, rugby y mucho más." },
  EN: { live: "Live sports", games: "Games", prediction: "Predictions", analysis: "Analysis", play: "Play career mode", headline: "Every sport. One legacy.", intro: "Worldwide scores, stats, analysis and games across football, basketball, motorsport, baseball, hockey, rugby and more." },
  PT: { live: "Esportes ao vivo", games: "Jogos", prediction: "Bolão", analysis: "Análises", play: "Jogar modo carreira", headline: "Todo esporte. Um só legado.", intro: "Resultados mundiais, estatísticas, análises e jogos de futebol, basquete, automobilismo, beisebol, hóquei, rúgbi e muito mais." },
};

const articles = [
  { tag: "ANÁLISIS", title: "Por qué los mediapuntas vuelven a decidir partidos", text: "Cómo cambian los espacios entre líneas y qué atributos hacen diferencial a un creador moderno." },
  { tag: "BÁSQUETBOL", title: "El ritmo que define un partido cerrado", text: "Posesiones, eficiencia y decisiones que explican por qué una ventaja cambia en segundos." },
  { tag: "MOTOR", title: "Una vuelta perfecta se construye por sectores", text: "La lectura simple de ritmo, neumáticos y estrategia para vivir cada Gran Premio con otros ojos." },
  { tag: "HISTORIA", title: "Las carreras que transformaron su deporte", text: "Ídolos, capitanes y campeones que convirtieron una temporada en un legado mundial." },
  { tag: "RUGBY", title: "Territorio, posesión y presión", text: "Las métricas que revelan quién controla de verdad un partido internacional." },
  { tag: "DATOS", title: "Estadísticas deportivas sin complicaciones", text: "Una guía visual para interpretar resultados y rendimiento más allá del marcador." },
];

function PortalCrest({ src, name }: { src?: string; name: string }) {
  return src ? <img className="portal-badge" src={src} alt="" /> : <span className="portal-badge fallback">{name.slice(0, 2).toUpperCase()}</span>;
}

function SportSelector({ selected, select, busy = false }: { selected: SportId; select: (sport: SportId) => void; busy?: boolean }) {
  return <div className="sport-selector" aria-label="Elegir deporte">
    {SPORTS.map(sport => <button key={sport.id} className={selected === sport.id ? "active" : ""} disabled={busy} onClick={() => select(sport.id)}>
      <span>{sport.emoji}</span><strong>{sport.label}</strong>
    </button>)}
  </div>;
}

function MatchCenter({ snapshot, selectSport, busy, selectedDate, changeDate, reload }: { snapshot: SportsSnapshot; selectSport: (sport: SportId) => void; busy: boolean; selectedDate: string; changeDate: (date: string) => void; reload: () => void }) {
  const definition = SPORTS.find(sport => sport.id === snapshot.sport) ?? SPORTS[0];
  const today = new Date().toISOString().slice(0, 10);
  const shiftDate = (days: number) => {
    const date = new Date(`${selectedDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    changeDate(date.toISOString().slice(0, 10));
  };
  return <section className="portal-content">
    <div className="portal-section-head"><div><span className="portal-kicker">CENTRO MUNDIAL · {definition.apiLabel.toUpperCase()}</span><h1>{definition.emoji} {definition.label} en vivo.</h1><p>{snapshot.message}</p></div><span className={`api-state ${snapshot.source}`}>{busy ? "● Actualizando…" : snapshot.source === "live" ? `● API conectada${snapshot.quotaRemaining !== undefined ? ` · ${snapshot.quotaRemaining} consultas` : ""}` : snapshot.source === "cache" ? "● Última actualización guardada" : "● Datos de demostración"}</span></div>
    <SportSelector selected={snapshot.sport} select={selectSport} busy={busy} />
    <div className="date-browser" aria-label="Consultar resultados por fecha">
      <button disabled={busy} onClick={() => shiftDate(-1)} aria-label="Día anterior">←</button>
      <label><span>RESULTADOS DE LA FECHA</span><input type="date" max={today} value={selectedDate} disabled={busy} onChange={(event) => changeDate(event.target.value)} /></label>
      <button disabled={busy || selectedDate >= today} onClick={() => shiftDate(1)} aria-label="Día siguiente">→</button>
      <button className="date-today" disabled={busy || selectedDate === today} onClick={() => changeDate(today)}>Hoy</button>
      <button className="date-reload" disabled={busy} onClick={reload}>Actualizar</button>
    </div>
    <div className="match-layout">
      <div className="match-list">
        {snapshot.matches.map(match => <article className="match-card" key={match.id}>
          <div className="match-meta"><span>{match.league}</span><time>{match.date} · {match.time}</time></div>
          <div className="match-team"><PortalCrest src={match.homeBadge} name={match.home} /><strong>{match.home}</strong><b>{match.homeScore ?? "—"}</b></div>
          <div className="match-team"><PortalCrest src={match.awayBadge} name={match.away} /><strong>{match.away}</strong><b>{match.awayScore ?? "—"}</b></div>
          <small className={`match-status ${match.status}`}>{match.status === "live" ? "EN JUEGO" : match.status === "finished" ? "FINAL" : "PRÓXIMO"}</small>
        </article>)}
        {!snapshot.matches.length && <div className="empty-results"><b>📅</b><h3>No hay eventos en esta fecha</h3><p>Elegí otro día para consultar resultados anteriores o próximos encuentros.</p></div>}
      </div>
      <aside className="standings-card">
        <div className="standings-title"><span>{snapshot.standings.length ? "TABLA" : "COBERTURA"}</span><strong>{snapshot.standings.length ? "Clasificación" : definition.label}</strong></div>
        {snapshot.standings.length ? snapshot.standings.map(row => <div className="standing-row" key={`${row.rank}-${row.team}`}>
          <b>{row.rank}</b><PortalCrest src={row.badge} name={row.team} /><span>{row.team}</span><small>{row.played} PJ</small><strong>{row.points}</strong>
        </div>) : <div className="coverage-note"><b>{definition.emoji}</b><h3>Cobertura mundial</h3><p>Calendarios, resultados y eventos de {definition.label.toLowerCase()} desde competiciones de todo el mundo.</p><small>Fuente: API‑SPORTS · caché de 15 minutos</small></div>}
      </aside>
    </div>
  </section>;
}

function PredictionGame({ matches }: { matches: SportsSnapshot["matches"] }) {
  const candidates = matches.filter(x => x.status !== "finished").slice(0, 5);
  const [picks, setPicks] = useState<Record<string, "1" | "X" | "2">>(() => JSON.parse(localStorage.getItem("legado:prode") || "{}"));
  const pick = (id: string, value: "1" | "X" | "2") => {
    const next = { ...picks, [id]: value }; setPicks(next); localStorage.setItem("legado:prode", JSON.stringify(next));
  };
  return <section className="portal-content prode-page">
    <div className="portal-section-head"><div><span className="portal-kicker">PRODE LEGADO</span><h1>Demostrá cuánto sabés.</h1><p>Elegí local, empate o visitante. Tus pronósticos quedan guardados en este dispositivo.</p></div><div className="prediction-score"><strong>{Object.keys(picks).length}</strong><span>pronósticos</span></div></div>
    <div className="prediction-list">{candidates.map(match => <article key={match.id}>
      <div><small>{match.league} · {match.date}</small><strong>{match.home} <i>vs</i> {match.away}</strong></div>
      <div className="pick-buttons">{(["1", "X", "2"] as const).map(value => <button className={picks[match.id] === value ? "selected" : ""} onClick={() => pick(match.id, value)} key={value}>{value}</button>)}</div>
    </article>)}</div>
  </section>;
}

export default function App() {
  const [section, setSection] = useState<PortalSection>(() => location.hash === "#futbol" ? "deportes" : (location.hash.replace("#", "") as PortalSection) || "inicio");
  const [language, setLanguage] = useState<PortalLanguage>(() => (localStorage.getItem("legado:language") as PortalLanguage) || "ES");
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("legado:portal-theme") as "dark" | "light") || "dark");
  const [cookies, setCookies] = useState(() => localStorage.getItem("legado:cookies") || "");
  const initialSettings = useMemo(() => getApiSportsSettings(), []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [sports, setSports] = useState<SportsSnapshot>({ sport: initialSettings.sport, requestedDate: today, matches: [], standings: [], source: "demo", provider: "API-SPORTS", updatedAt: new Date().toISOString() });
  const [apiSettings, setApiSettings] = useState<ApiSportsSettings>(initialSettings);
  const [apiMessage, setApiMessage] = useState("Conexión automática protegida para todos los visitantes.");
  const [sportsBusy, setSportsBusy] = useState(false);
  const c = portalCopy[language];
  useEffect(() => { loadSportsSnapshot(false, initialSettings.sport, today).then(setSports); }, [initialSettings.sport, today]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("legado:portal-theme", theme); }, [theme]);
  const go = (next: PortalSection) => { setSection(next); location.hash = next; scrollTo({ top: 0, behavior: "smooth" }); };
  const setLang = (next: PortalLanguage) => { setLanguage(next); localStorage.setItem("legado:language", next); };
  const selectSport = async (sport: SportId) => {
    const next = { ...apiSettings, sport };
    setApiSettings(next);
    saveApiSportsSettings(next);
    setSportsBusy(true);
    setSports(await loadSportsSnapshot(false, sport, selectedDate));
    setSportsBusy(false);
  };
  const chooseDate = async (date: string) => {
    if (!date || date > today) return;
    setSelectedDate(date);
    setSportsBusy(true);
    setSports(await loadSportsSnapshot(false, apiSettings.sport, date));
    setSportsBusy(false);
  };
  const reloadSports = async () => {
    setSportsBusy(true);
    setSports(await loadSportsSnapshot(true, apiSettings.sport, selectedDate));
    setSportsBusy(false);
  };
  const connectApiSports = async () => {
    saveApiSportsSettings(apiSettings);
    setApiMessage("Validando la cuenta de API‑SPORTS…");
    setSportsBusy(true);
    const test = await testApiSportsConnection(apiSettings);
    if (!test.ok) {
      setApiMessage(test.message);
      setSportsBusy(false);
      return;
    }
    const snapshot = await loadSportsSnapshot(true, apiSettings.sport, selectedDate);
    setSports(snapshot);
    setSportsBusy(false);
    setApiMessage(`${test.message}${snapshot.message ? ` ${snapshot.message}` : ""}`);
  };

  if (section === "juegos") return <div className="portal-game"><button className="back-portal" onClick={() => go("inicio")}>← Volver a LEGADO FC</button><CareerGame /></div>;

  return <main className="portal-shell">
    <div className="portal-topline"><span>LEGADO FC · DEPORTES MUNDIALES, DATOS Y JUEGOS</span><div>{(["ES", "EN", "PT"] as const).map(lang => <button key={lang} className={language === lang ? "active" : ""} onClick={() => setLang(lang)}>{lang}</button>)}</div></div>
    <div className="portal-header">
      <button className="portal-brand" onClick={() => go("inicio")}><b>LEGADO</b><em>FC</em><small>EL DEPORTE DEJA LEGADO</small></button>
      <nav className="portal-nav">
        {(["inicio", "deportes", "juegos", "prode", "analisis"] as PortalSection[]).map(item => <button className={section === item ? "active" : ""} onClick={() => go(item)} key={item}>{item === "deportes" ? c.live : item === "juegos" ? c.games : item === "prode" ? c.prediction : item === "analisis" ? c.analysis : "Inicio"}</button>)}
      </nav>
      <div className="portal-actions"><button aria-label="Cambiar tema" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☾" : "☀"}</button><button className="account-button" onClick={() => go("cuenta")}>Mi perfil</button></div>
    </div>

    {section === "inicio" && <>
      <section className="portal-hero">
        <div><span className="portal-kicker">UNA VENTANA AL DEPORTE MUNDIAL</span><h1>{c.headline}</h1><p>{c.intro}</p><div className="hero-actions"><button className="portal-primary" onClick={() => go("deportes")}>Ver deportes en vivo →</button><button className="portal-secondary" onClick={() => go("juegos")}>{c.play}</button></div></div>
        <div className="hero-scoreboard"><span>{SPORTS.find(s => s.id === sports.sport)?.emoji} EVENTO DESTACADO</span>{sports.matches[0] ? <><div><strong>{sports.matches[0].home}</strong><b>{sports.matches[0].homeScore ?? "—"}</b></div><div><strong>{sports.matches[0].away}</strong><b>{sports.matches[0].awayScore ?? "—"}</b></div><small>{sports.matches[0].league} · {sports.matches[0].date}</small></> : <p>Cargando centro mundial…</p>}</div>
      </section>
      <section className="sports-ribbon"><SportSelector selected={sports.sport} select={(sport) => { selectSport(sport); go("deportes"); }} busy={sportsBusy} /></section>
      <section className="portal-strip"><div><b>01</b><span>RESULTADOS MUNDIALES</span><small>Eventos y calendarios</small></div><div><b>02</b><span>11 DEPORTES</span><small>Una experiencia unificada</small></div><div><b>03</b><span>MODO CARRERA</span><small>El juego original de fútbol</small></div><div><b>04</b><span>PRODE</span><small>Pronósticos deportivos</small></div></section>
      <section className="featured-game"><div><span className="portal-kicker">MINIJUEGO PRINCIPAL</span><h2>Construí tu propia carrera futbolística</h2><p>Elegí tu origen, posición y dificultad. Tomá decisiones, cambiá de club y convertí cada temporada en una historia única.</p><div className="difficulty-pills"><span>Fácil · Éxito total</span><span>Normal · Carrera legendaria</span><span>Difícil · Máximo desafío</span></div><button className="portal-primary" onClick={() => go("juegos")}>Empezar carrera →</button></div><div className="career-poster"><span>LEGADO</span><strong>TU NOMBRE<br/>EN LA HISTORIA</strong><small>Simulador de carrera · Temporada 2026</small></div></section>
      <section className="portal-articles"><div className="portal-section-head"><div><span className="portal-kicker">LECTURA DEPORTIVA</span><h2>Análisis sin fronteras</h2></div><button onClick={() => go("analisis")}>Ver todo →</button></div><div className="article-grid">{articles.slice(0, 3).map((a, i) => <article key={a.title}><span>0{i + 1} · {a.tag}</span><h3>{a.title}</h3><p>{a.text}</p></article>)}</div></section>
    </>}
    {section === "deportes" && <MatchCenter snapshot={sports} selectSport={selectSport} busy={sportsBusy} selectedDate={selectedDate} changeDate={chooseDate} reload={reloadSports} />}
    {section === "prode" && <PredictionGame matches={sports.matches} />}
    {section === "analisis" && <section className="portal-content"><div className="portal-section-head"><div><span className="portal-kicker">ANÁLISIS, HISTORIA Y DATOS</span><h1>Entender el deporte cambia cómo lo vivís.</h1></div></div><div className="analysis-grid">{articles.map((a, i) => <article key={`${a.title}-${i}`}><span>{a.tag} · LECTURA {i + 1}</span><h2>{a.title}</h2><p>{a.text}</p><button>Leer análisis →</button></article>)}</div></section>}
    {section === "cuenta" && <section className="portal-content account-page">
      <span className="portal-kicker">TU ESPACIO</span><h1>Perfil LEGADO</h1>
      <div className="account-panel"><div className="account-avatar">LF</div><div><h2>Jugador local</h2><p>Tus carreras, pronósticos, idioma y preferencias se guardan en este dispositivo.</p><button className="portal-primary" onClick={() => go("juegos")}>Abrir mi carrera</button></div></div>
      <div className="api-config">
        <div><span className="portal-kicker">DATOS DEPORTIVOS MUNDIALES</span><h2>API‑SPORTS conectada</h2><p>La conexión segura ya está disponible para todos. Consulta fútbol, básquetbol, NBA, béisbol, Fórmula 1, handball, hockey, MMA, NFL/NCAA, rugby, vóley y AFL, con caché de 15 minutos para proteger la cuota.</p></div>
        <div className="api-sport-config"><SportSelector selected={apiSettings.sport} select={(sport) => setApiSettings({ ...apiSettings, sport })} /></div>
        <div className="api-config-grid">
          {apiSettings.sport === "football" && <label>ID de liga<input inputMode="numeric" value={apiSettings.leagueId} onChange={(e) => setApiSettings({ ...apiSettings, leagueId: e.target.value })} /></label>}
          <label>Temporada<input inputMode="numeric" value={apiSettings.season} onChange={(e) => setApiSettings({ ...apiSettings, season: e.target.value })} /></label>
          <label>Zona horaria<input value={apiSettings.timezone} onChange={(e) => setApiSettings({ ...apiSettings, timezone: e.target.value })} /></label>
        </div>
        <div className="api-config-actions"><button className="portal-primary" disabled={sportsBusy} onClick={connectApiSports}>{sportsBusy ? "Comprobando…" : "Comprobar conexión mundial"}</button><small>{apiMessage}</small></div>
      </div>
      <p className="portal-muted">No necesitas registrarte ni introducir una clave. La prueba de conexión y la carga de eventos son independientes: una fecha sin encuentros se muestra correctamente como una jornada vacía.</p>
    </section>}

    <div className="portal-footer"><button className="portal-brand" onClick={() => go("inicio")}><b>LEGADO</b><em>FC</em></button><span>Deportes mundiales · Resultados · Estadísticas · Análisis · Juegos</span><span>© 2026 LEGADO FC</span></div>
    {!cookies && <section className="cookie-banner" aria-label="Preferencias de cookies"><div><strong>Cookies y privacidad</strong><p>Usamos almacenamiento local para guardar tu carrera, prode, idioma y preferencias. Los datos deportivos se consultan a un proveedor externo.</p></div><div><button onClick={() => { localStorage.setItem("legado:cookies", "essential"); setCookies("essential"); }}>Solo esenciales</button><button className="portal-primary" onClick={() => { localStorage.setItem("legado:cookies", "accepted"); setCookies("accepted"); }}>Aceptar</button></div></section>}
  </main>;
}
