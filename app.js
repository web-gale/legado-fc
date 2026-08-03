/* ==========================================================================
   LEGADO FC - CYBER DASHBOARD ENGINE
   ========================================================================== */

const LEAGUES = {
  // --- SUDAMÉRICA ---
  "Paraguay - Primera División": ["Cerro Porteño", "Olimpia", "Libertad", "Guaraní", "Nacional", "Sportivo Luqueño", "2 de Mayo", "Sol de América", "Tacuary", "General Caballero JLM", "Ameliano", "Koa"],
  "Paraguay - División Intermedia (2ª)": ["Rubio Ñu", "Resistencia", "Guaireña", "Fernando de la Mora", "San Lorenzo", "Independiente CG", "12 de Octubre", "Encarnación FC", "Pastoreo FC", "Colegiales"],

  "Argentina - Liga Profesional": ["River Plate", "Boca Juniors", "Racing Club", "Independiente", "San Lorenzo", "Talleres", "Estudiantes LP", "Vélez Sarsfield", "Rosario Central", "Newell's Old Boys", "Huracán", "Argentinos Juniors"],
  "Argentina - Primera Nacional (2ª)": ["Quilmes", "Chacarita Juniors", "Ferro Carril Oeste", "Colón", "Aldosivi", "San Martín (T)", "San Martín (SJ)", "Gimnasia (J)", "All Boys", "Nueva Chicago"],

  "Brasil - Brasileirão (Série A)": ["Flamengo", "Palmeiras", "São Paulo", "Fluminense", "Gremio", "Botafogo", "Corinthians", "Atlético Mineiro", "Cruzeiro", "Internacional", "Vasco da Gama", "Bahia"],
  "Brasil - Série B (2ª)": ["Santos", "Coritiba", "Goiás", "America Mineiro", "Sport Recife", "Ceará", "Avaí", "Guarani", "Ponte Preta", "CRB"],

  "Uruguay - Primera División": ["Peñarol", "Nacional", "Defensor Sporting", "Danubio", "Montevideo Wanderers", "Boston River", "Liverpool FC", "Racing Montevideo", "River Plate (M)", "Cerro Largo"],
  "Uruguay - Segunda División": ["Juventud de Las Piedras", "Albion", "Rentistas", "Atenas", "Cerrito", "Sud América", "Rampla Juniors", "Bella Vista", "Potencia", "Tacuarembó FC"],

  "Ecuador - LigaPro (Serie A)": ["Liga de Quito", "Barcelona SC", "Emelec", "Independiente del Valle", "El Nacional", "Universidad Católica", "Delfín", "Aucas", "Macará", "Orense"],
  "Ecuador - Serie B (2ª)": ["Manta FC", "Imbabura", "Chacaritas", "Guayaquil City", "9 de Octubre", "Cuniburo", "Gualaceo", "Leones del Norte", "San Antonio", "Vargas Torres"],

  // --- EUROPA ---
  "España - LaLiga": ["Real Madrid", "FC Barcelona", "Atlético de Madrid", "Athletic Club", "Real Betis", "Sevilla FC", "Real Sociedad", "Villarreal", "Girona FC", "Valencia CF"],
  "España - LaLiga Hypermotion (2ª)": ["RCD Espanyol", "Real Valladolid", "SD Eibar", "Levante UD", "Real Zaragoza", "Real Sporting", "Real Oviedo", "Elche CF", "Racing de Santander", "Tenerife"],

  "Inglaterra - Premier League": ["Manchester City", "Arsenal", "Liverpool", "Aston Villa", "Tottenham Hotspur", "Chelsea", "Manchester United", "Newcastle United", "West Ham", "Brighton"],
  "Inglaterra - EFL Championship (2ª)": ["Leicester City", "Leeds United", "Southampton", "Ipswich Town", "West Bromwich Albion", "Norwich City", "Middlesbrough", "Coventry City", "Sunderland", "Watford"],

  "Italia - Serie A": ["Inter de Milán", "AC Milan", "Juventus", "Atalanta", "AS Roma", "SS Lazio", "Napoli", "Fiorentina", "Bologna", "Torino"],
  "Italia - Serie B (2ª)": ["Parma", "Como", "Venezia", "Cremonese", "Sampdoria", "Palermo", "Brescia", "Bari", "Spezia", "Pisa"],

  "Alemania - Bundesliga": ["Bayern Múnich", "Bayer Leverkusen", "Borussia Dortmund", "RB Leipzig", "Eintracht Frankfurt", "VfB Stuttgart", "VfL Wolfsburg", "Borussia Mönchengladbach", "SC Freiburg", "Werder Bremen"],
  "Alemania - 2. Bundesliga (2ª)": ["FC St. Pauli", "Holstein Kiel", "Fortuna Düsseldorf", "Hamburger SV", "Karlsruher SC", "Hannover 96", "Paderborn 07", "Schalke 04", "Hertha Berlín", "Nürnberg"],

  "Francia - Ligue 1": ["Paris Saint-Germain", "AS Mónaco", "Lille OSC", "Stade Brestois", "OGC Niza", "Olympique de Lyon", "RC Lens", "Olympique de Marsella", "Stade Rennais", "Toulouse FC"],
  "Francia - Ligue 2 (2ª)": ["AJ Auxerre", "Angers SCO", "AS Saint-Étienne", "Rodez AF", "Paris FC", "SM Caen", "Girondins de Burdeos", "EA Guingamp", "SC Bastia", "FC Metz"],

  // --- NORTEAMÉRICA Y CONCACAF ---
  "México - Liga MX": ["Club América", "Tigres UANL", "CF Monterrey", "CD Guadalajara", "Cruz Azul", "Pumas UNAM", "Deportivo Toluca", "CF Pachuca", "Club León", "Santos Laguna"],
  "México - Liga de Expansión MX (2ª)": ["Atlante FC", "Leones Negros UdeG", "Celaya", "Morelia", "Mineros de Zacatecas", "Venados FC", "Cimarrones de Sonora", "Cancún FC", "Tepatitlán FC", "Alebrijes de Oaxaca"],

  "Estados Unidos - MLS": ["Inter Miami CF", "Columbus Crew", "LAFC", "LA Galaxy", "FC Cincinnati", "Seattle Sounders", "Philadelphia Union", "New York Red Bulls", "Atlanta United", "Orlando City"],
  "Estados Unidos - USL Championship (2ª)": ["Louisville City FC", "Charleston Battery", "Tampa Bay Rowdies", "Phoenix Rising FC", "Sacramento Republic FC", "Orange County SC", "San Antonio FC", "Colorado Springs Switchbacks", "Pittsburgh Riverhounds", "Indy Eleven"],

  // --- ASIA ---
  "Arabia Saudita - Saudi Pro League": ["Al-Hilal", "Al-Nassr", "Al-Ittihad", "Al-Ahli", "Al-Ettifaq", "Al-Shabab", "Al-Taawoun", "Al-Fateh", "Al-Fayha", "Al-Khaleej"],
  "Arabia Saudita - Saudi First Division (2ª)": ["Al-Qadsiah", "Al-Orobah", "Al-Kholood", "Al-Arabi", "Al-Adalah", "Al-Faisaly", "Al-Batin", "Al-Jabalain", "Ohod Club", "Al-Jandal"]
};

const DEFAULT_STATE = {
  version: 1,
  created: false,
  tab: "carrera",
  player: {
    nombre: "Alvaro Galeano",
    posicion: "MP",
    club: "Olimpia",
    liga: "Paraguay - Primera División",
    edad: 14,
    atributos: {
      pase: 88,
      regate: 82,
      creatividad: 85,
      tiro: 80,
      fisico: 75,
      defensa: 45
    },
    partidosTotales: 12,
    golesTotales: 11,
    asistenciasTotales: 10,
    historial: []
  }
};

let state = JSON.parse(localStorage.getItem("legado_fc_save")) || JSON.parse(JSON.stringify(DEFAULT_STATE));

function save() {
  localStorage.setItem("legado_fc_save", JSON.stringify(state));
}

function overall(p) {
  const a = p.atributos;
  let sum = 0;
  let count = 0;
  for (let k in a) { sum += a[k]; count++; }
  return Math.round(sum / count);
}

function valorMercado(p) {
  return (overall(p) * 0.06).toFixed(1) + " M";
}

function simulateSeason() {
  const p = state.player;
  p.edad += 1;
  for (let attr in p.atributos) {
    p.atributos[attr] = Math.min(99, p.atributos[attr] + Math.floor(Math.random() * 4));
  }
  save();
  render();
}

function drawRadar(canvasId, stats) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const center = width / 2;
  const radius = center - 30;

  ctx.clearRect(0, 0, width, height);

  const keys = Object.keys(stats);
  const total = keys.length;

  // Dibujar red poligonal
  ctx.strokeStyle = "rgba(0, 216, 246, 0.2)";
  for (let level = 1; level <= 4; level++) {
    ctx.beginPath();
    let r = (radius / 4) * level;
    for (let i = 0; i < total; i++) {
      let angle = (i * 2 * Math.PI / total) - Math.PI / 2;
      let x = center + r * Math.cos(angle);
      let y = center + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Dibujar polígono de jugador
  ctx.beginPath();
  ctx.fillStyle = "rgba(0, 216, 246, 0.3)";
  ctx.strokeStyle = "#00d8f6";
  ctx.lineWidth = 2;
  keys.forEach((key, i) => {
    let angle = (i * 2 * Math.PI / total) - Math.PI / 2;
    let value = stats[key] / 100;
    let x = center + radius * value * Math.cos(angle);
    let y = center + radius * value * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Etiquetas
  ctx.fillStyle = "#8a9bb8";
  ctx.font = "10px Rajdhani, sans-serif";
  keys.forEach((key, i) => {
    let angle = (i * 2 * Math.PI / total) - Math.PI / 2;
    let x = center + (radius + 18) * Math.cos(angle) - 12;
    let y = center + (radius + 18) * Math.sin(angle) + 4;
    ctx.fillText(key.toUpperCase(), x, y);
  });
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (!state.created) {
    app.innerHTML = `
      <div class="profile-card" style="max-width: 500px; margin: 40px auto;">
        <h1 style="font-family: var(--font-heading); color: var(--cyan-bright); margin-bottom: 20px;">CREAR FUTBOLISTA</h1>
        <form id="create-form">
          <div style="margin-bottom: 15px;">
            <label style="color: var(--text-muted); display:block;">Nombre del Jugador:</label>
            <input type="text" id="p-nombre" required value="Álvaro Galeano" style="width:100%; padding: 10px; background: var(--bg-dark); border:1px solid var(--border-cyan); color:#fff;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="color: var(--text-muted); display:block;">Posición:</label>
            <select id="p-posicion" style="width:100%; padding: 10px; background: var(--bg-dark); border:1px solid var(--border-cyan); color:#fff;">
              <option value="MP">Mediapunta (MP)</option>
              <option value="DC">Delantero Centro (DC)</option>
              <option value="MC">Centrocampista (MC)</option>
            </select>
          </div>
          <button type="submit" class="btn-cyan" style="width:100%; justify-content:center;">INICIAR LEGADO</button>
        </form>
      </div>
    `;

    document.getElementById("create-form").onsubmit = (e) => {
      e.preventDefault();
      state.player.nombre = document.getElementById("p-nombre").value;
      state.player.posicion = document.getElementById("p-posicion").value;
      state.created = true;
      save();
      render();
    };
    return;
  }

  const p = state.player;

  app.innerHTML = `
    <!-- NAVBAR TOP -->
    <div class="navbar">
      <div class="brand">LEGADO FC</div>
      <div class="nav-tabs">
        <button class="active">Carrera</button>
        <button>Temporada</button>
        <button>Mercado</button>
        <button>Estadísticas</button>
      </div>
      <div class="nav-stats">
        <span>⚡ 100</span>
        <span>📅 15 JUN 2026</span>
        <span>💰 $${valorMercado(p)}</span>
      </div>
    </div>

    <!-- DASHBOARD PRINCIPAL -->
    <div class="dashboard-grid">
      <!-- HERO IZQUIERDO -->
      <div class="hero-panel">
        <div class="sub-header">DECISIÓN DE CARRERA ———</div>
        <h1 class="hero-title">Tu carrera.<br>Tus decisiones.<br>Tu legado.</h1>
        <p class="hero-desc">${p.nombre} está en un momento clave de su carrera.<br>${p.club} quiere asegurar su futuro.<br>Tú decides el siguiente paso.</p>
        <div>
          <button class="btn-cyan" onclick="simulateSeason()">Continuar carrera &gt;</button>
        </div>
      </div>

      <!-- PROFILE DERECHO -->
      <div class="profile-card">
        <div class="player-header">
          <div style="width: 50px; height: 50px; background: #800; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">CP</div>
          <div>
            <h2>${p.nombre}</h2>
            <div class="player-sub">
              <span>👤 ${p.edad} AÑOS</span>
              <span>🎯 ${p.posicion}</span>
              <span>🛡️ ${p.club}</span>
            </div>
          </div>
        </div>

        <div class="dashboard-inner-grid">
          <div class="radar-container">
            <h4 style="font-family: var(--font-heading); color: var(--text-muted); margin-bottom: 10px;">PERFIL TÉCNICO</h4>
            <canvas id="radarCanvas" width="200" height="200"></canvas>
          </div>

          <div>
            <h4 style="font-family: var(--font-heading); color: var(--text-muted); margin-bottom: 10px;">DECISIÓN DE CONTRATO</h4>
            <div class="decision-box" onclick="simulateSeason()">
              <strong style="color: var(--cyan-bright);">QUEDARTE</strong>
              <p style="font-size:0.8rem; color:var(--text-muted);">Renueva con ${p.club} y sigue tu desarrollo.</p>
            </div>
            <div class="decision-box orange" onclick="simulateSeason()">
              <strong style="color: var(--orange-bright);">NUEVO DESAFÍO</strong>
              <p style="font-size:0.8rem; color:var(--text-muted);">Acepta una oferta del exterior y da el salto.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- METRICAS INFERIORES -->
    <div class="footer-metrics">
      <div>
        <div class="metric-title">LÍNEA DE TIEMPO</div>
        <div class="timeline" style="margin-top: 10px;">
          <div class="timeline-node"></div>
          <div class="timeline-node active"></div>
          <div class="timeline-node"></div>
          <div class="timeline-node"></div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-title">MEDIA</div>
        <div class="metric-value">${overall(p)}</div>
      </div>

      <div class="metric-card">
        <div class="metric-title">POTENCIAL</div>
        <div class="metric-value">88</div>
      </div>

      <div class="metric-card">
        <div class="metric-title">VALOR</div>
        <div class="metric-value">$${valorMercado(p)}</div>
      </div>

      <div class="metric-card">
        <div class="metric-title">POPULARIDAD</div>
        <div class="metric-value">31</div>
      </div>
    </div>
  `;

  setTimeout(() => drawRadar("radarCanvas", p.atributos), 50);
}

document.addEventListener("DOMContentLoaded", render);
