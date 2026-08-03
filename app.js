/* ==========================================================================
   LEGADO FC - MOTOR CON LIGAS Y CLUBES REALES
   ========================================================================== */

// --- BASE DE DATOS DE LIGAS Y CLUBES REALES ---
const LEAGUES = {
  "Paraguay": ["Cerro Porteño", "Olimpia", "Libertad", "Guaraní", "Nacional", "Sportivo Luqueño"],
  "Argentina": ["River Plate", "Boca Juniors", "Racing Club", "Independiente", "San Lorenzo", "Talleres"],
  "Brasil": ["Flamengo", "Palmeiras", "São Paulo", "Fluminense", "Gremio", "Botafogo"],
  "España": ["Real Madrid", "FC Barcelona", "Atlético de Madrid", "Athletic Club", "Real Betis", "Sevilla FC"],
  "Inglaterra": ["Manchester City", "Arsenal", "Real Madrid", "Liverpool", "Chelsea", "Manchester United"]
};

// --- ESTADO INICIAL ---
const DEFAULT_STATE = {
  version: 1,
  created: false,
  tab: "carrera",
  player: {
    nombre: "",
    posicion: "DC",
    liga: "Paraguay",
    club: "Cerro Porteño",
    atributos: {
      definicion: 55,
      tecnica: 52,
      velocidad: 58,
      fisico: 50,
      mentalidad: 50,
      resistencia: 55,
      defensa: 40
    },
    edad: 16,
    salario: 1200,
    golesTotales: 0,
    asistenciasTotales: 0,
    partidosTotales: 0,
    historial: []
  },
  noticias: []
};

let state = JSON.parse(localStorage.getItem("legado_fc_save")) || JSON.parse(JSON.stringify(DEFAULT_STATE));

function save() {
  localStorage.setItem("legado_fc_save", JSON.stringify(state));
}

function resetGame() {
  if (confirm("¿Estás seguro de reiniciar tu carrera? Se borrarán todos los datos.")) {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    save();
    render();
  }
}

// --- LÓGICA DE MEDIA (OVERALL) ---
function overall(p) {
  const a = p.atributos;
  const w = p.posicion === "POR"
    ? { defensa: 0.35, fisico: 0.25, mentalidad: 0.2, resistencia: 0.1, velocidad: 0.1 }
    : p.posicion === "DC"
    ? { definicion: 0.3, tecnica: 0.18, velocidad: 0.14, fisico: 0.14, mentalidad: 0.16, resistencia: 0.08 }
    : p.posicion === "MC"
    ? { tecnica: 0.25, mentalidad: 0.2, resistencia: 0.2, definicion: 0.15, defensa: 0.2 }
    : { defensa: 0.35, fisico: 0.25, mentalidad: 0.2, resistencia: 0.1, velocidad: 0.1 };

  let total = 0;
  for (let attr in a) {
    total += (a[attr] || 50) * (w[attr] || 0.14);
  }
  return Math.round(total);
}

function valorMercado(p) {
  const media = overall(p);
  const factorEdad = Math.max(0.4, (36 - p.edad) / 20);
  return Math.round(media * 180000 * factorEdad);
}

// --- SIMULAR TEMPORADA ---
function simulateSeason() {
  if (state.player.edad >= 40) {
    alert("¡Te has retirado del fútbol profesional a los 40 años! Gracias por tu legado.");
    return;
  }

  const p = state.player;
  p.edad += 1;

  // Crecimiento por edad
  const crecimiento = p.edad <= 22 ? 3 : p.edad <= 28 ? 1 : -2;
  for (let attr in p.atributos) {
    p.atributos[attr] = Math.min(99, Math.max(30, p.atributos[attr] + crecimiento));
  }

  // Partidos y rendimiento
  const partidos = Math.floor(Math.random() * 15) + 25;
  const goles = p.posicion === "POR" ? 0 : Math.floor(Math.random() * (p.atributos.definicion / 3.8));
  const asistencias = p.posicion === "POR" ? 0 : Math.floor(Math.random() * (p.atributos.tecnica / 4.5));

  p.partidosTotales += partidos;
  p.golesTotales += goles;
  p.asistenciasTotales += asistencias;

  p.historial.push({
    edad: p.edad,
    club: p.club,
    liga: p.liga,
    partidos,
    goles,
    asistencias,
    media: overall(p)
  });

  state.noticias.unshift(`T${p.edad - 16}: Jugaste ${partidos} partidos con ${p.club}, anotando ${goles} goles y ${asistencias} asistencias.`);
  save();
  render();
}

// --- RENDERIZADO DE INTERFAZ ---
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  // CREACIÓN DE PERSONAJE
  if (!state.created) {
    const defaultLiga = "Paraguay";
    app.innerHTML = `
      <div class="card">
        <h1>Crear tu Futbolista</h1>
        <form id="create-form">
          <div class="form-group">
            <label>Nombre del Jugador:</label>
            <input type="text" id="p-nombre" required placeholder="Ej. Álvaro Galeano">
          </div>
          
          <div class="form-group">
            <label>Posición:</label>
            <select id="p-posicion">
              <option value="DC">Delantero Centro (DC)</option>
              <option value="MC">Centrocampista (MC)</option>
              <option value="DFC">Defensa Central (DFC)</option>
              <option value="POR">Portero (POR)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Liga Inicial:</label>
            <select id="p-liga" onchange="updateClubOptions(this.value)">
              ${Object.keys(LEAGUES).map(l => `<option value="${l}">${l}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Club de Debut:</label>
            <select id="p-club">
              ${LEAGUES[defaultLiga].map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          
          <button type="submit" class="btn btn-primary">Comenzar Carrera Profesionial</button>
        </form>
      </div>
    `;

    document.getElementById("create-form").onsubmit = (e) => {
      e.preventDefault();
      state.player.nombre = document.getElementById("p-nombre").value;
      state.player.posicion = document.getElementById("p-posicion").value;
      state.player.liga = document.getElementById("p-liga").value;
      state.player.club = document.getElementById("p-club").value;
      state.created = true;
      save();
      render();
    };
    return;
  }

  // INTERFAZ PRINCIPAL
  const p = state.player;
  const media = overall(p);

  app.innerHTML = `
    <header>
      <h1>LEGADO FC</h1>
      <p><strong>${p.nombre}</strong> | ${p.posicion} | ${p.edad} Años | OVR: <span class="ovr-badge">${media}</span></p>
    </header>

    <nav class="tabs">
      <button onclick="setTab('carrera')" class="${state.tab === 'carrera' ? 'active' : ''}">Carrera</button>
      <button onclick="setTab('estadisticas')" class="${state.tab === 'estadisticas' ? 'active' : ''}">Estadísticas</button>
      <button onclick="setTab('opciones')" class="${state.tab === 'opciones' ? 'active' : ''}">Opciones</button>
    </nav>

    <main>
      ${
        state.tab === 'carrera' ? `
          <div class="card">
            <h2>Equipo Actual</h2>
            <p><strong>Club:</strong> ${p.club} (${p.liga})</p>
            <p><strong>Valor Estimado:</strong> $${valorMercado(p).toLocaleString()} USD</p>
            <button onclick="simulateSeason()" class="btn btn-primary">Simular Siguiente Temporada</button>
          </div>

          <div class="card">
            <h3>Novedades de la Carrera</h3>
            <ul class="news-list">
              ${state.noticias.length ? state.noticias.map(n => `<li class="news-item">${n}</li>`).join('') : '<li class="news-item">Tu carrera profesional acaba de comenzar.</li>'}
            </ul>
          </div>
        ` : state.tab === 'estadisticas' ? `
          <div class="card">
            <h2>Estadísticas Generales</h2>
            <p>Partidos: <strong>${p.partidosTotales}</strong> | Goles: <strong>${p.golesTotales}</strong> | Asistencias: <strong>${p.asistenciasTotales}</strong></p>
            <table>
              <thead>
                <tr>
                  <th>Edad</th>
                  <th>Club</th>
                  <th>PJ</th>
                  <th>Goles</th>
                  <th>Asist.</th>
                  <th>Media</th>
                </tr>
              </thead>
              <tbody>
                ${p.historial.map(h => `
                  <tr>
                    <td>${h.edad}</td>
                    <td>${h.club}</td>
                    <td>${h.partidos}</td>
                    <td>${h.goles}</td>
                    <td>${h.asistencias}</td>
                    <td><span class="ovr-badge">${h.media}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="card">
            <h2>Gestión de Datos</h2>
            <button onclick="exportSave()" class="btn">Exportar Partida (.JSON)</button>
            <button onclick="triggerImport()" class="btn">Importar Partida (.JSON)</button>
            <button onclick="resetGame()" class="btn btn-danger">Reiniciar Carrera</button>
          </div>
        `
      }
    </main>
  `;
}

// Actualizador dinámico de clubes en el formulario de inicio
window.updateClubOptions = function(ligaSelect) {
  const clubSelect = document.getElementById("p-club");
  if (!clubSelect) return;
  const clubs = LEAGUES[ligaSelect] || [];
  clubSelect.innerHTML = clubs.map(c => `<option value="${c}">${c}</option>`).join('');
};

function setTab(t) {
  state.tab = t;
  save();
  render();
}

function exportSave() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const a = document.createElement('a');
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `legado_fc_${state.player.nombre.replace(/\s+/g, '_')}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function triggerImport() {
  const fileInput = document.getElementById("import-file");
  if (fileInput) fileInput.click();
}

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("import-file");
  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const loadedState = JSON.parse(evt.target.result);
          if (!loadedState.player || !loadedState.version) throw new Error();
          state = loadedState;
          save();
          render();
          alert("Partida cargada exitosamente.");
        } catch {
          alert("Error: El archivo no es válido.");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    };
  }
  render();
});
