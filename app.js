/* ==========================================================================
   LEGADO FC - MOTOR DE JUEGO & LÓGICA DE SIMULACIÓN
   ========================================================================== */

// --- ESTADO INICIAL / ESTRUCTURA ---
const DEFAULT_STATE = {
  version: 1,
  created: false,
  tab: "carrera",
  player: {
    nombre: "",
    posicion: "DC",
    atributos: {
      definicion: 50,
      tecnica: 50,
      velocidad: 50,
      fisico: 50,
      mentalidad: 50,
      resistencia: 50,
      defensa: 50
    },
    edad: 14,
    club: "Libre",
    salario: 0,
    contrato: 0,
    golesTotales: 0,
    asistenciasTotales: 0,
    partidosTotales: 0,
    titulos: [],
    historial: []
  },
  noticias: []
};

let state = JSON.parse(localStorage.getItem("legado_fc_save")) || JSON.parse(JSON.stringify(DEFAULT_STATE));

// --- PERSISTENCIA ---
function save() {
  localStorage.setItem("legado_fc_save", JSON.stringify(state));
}

function resetGame() {
  if (confirm("¿Estás seguro de reiniciar tu carrera? Se perderán los datos actual.")) {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    save();
    render();
  }
}

// --- CÁLCULOS MATEMÁTICOS ---
function overall(p) {
  const a = p.atributos;
  const w = p.posicion === "POR"
    ? { defensa: 0.35, fisico: 0.25, mentalidad: 0.2, resistencia: 0.1, pase: 0.1 }
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
  const factorEdad = Math.max(0.5, (35 - p.edad) / 15);
  return Math.round(media * 150000 * factorEdad);
}

// --- SIMULACIÓN DE TEMPORADA ---
function simulateSeason() {
  if (state.player.edad >= 40) {
    alert("¡Te has retirado del fútbol profesional a los 40 años! Revisa tu legado.");
    return;
  }

  const p = state.player;
  p.edad += 1;

  // Mejora de atributos según edad
  const crecimiento = p.edad <= 23 ? 3 : p.edad <= 29 ? 1 : -2;
  for (let attr in p.atributos) {
    p.atributos[attr] = Math.min(99, Math.max(30, p.atributos[attr] + crecimiento));
  }

  // Partidos y rendimiento
  const partidos = Math.floor(Math.random() * 15) + 25;
  const goles = p.posicion === "POR" ? 0 : Math.floor(Math.random() * (p.atributos.definicion / 4));
  const asistencias = p.posicion === "POR" ? 0 : Math.floor(Math.random() * (p.atributos.tecnica / 5));

  p.partidosTotales += partidos;
  p.golesTotales += goles;
  p.asistenciasTotales += asistencias;

  p.historial.push({
    edad: p.edad,
    club: p.club,
    partidos,
    goles,
    asistencias,
    media: overall(p)
  });

  state.noticias.unshift(`Temporada finalizada: Jugaste ${partidos} partidos, marcaste ${goles} goles y diste ${asistencias} asistencias.`);
  save();
  render();
}

// --- RENDERIZADO Y UI ---
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (!state.created) {
    app.innerHTML = `
      <div class="card">
        <h1>Crear tu Futbolista</h1>
        <form id="create-form">
          <label>Nombre del Jugador:</label>
          <input type="text" id="p-nombre" required placeholder="Ej. Álvaro Galeano">
          
          <label>Posición:</label>
          <select id="p-posicion">
            <option value="DC">Delantero Centro (DC)</option>
            <option value="MC">Centrocampista (MC)</option>
            <option value="DFC">Defensa Central (DFC)</option>
            <option value="POR">Portero (POR)</option>
          </select>
          
          <button type="submit" class="btn">Comenzar Carrera</button>
        </form>
      </div>
    `;

    document.getElementById("create-form").onsubmit = (e) => {
      e.preventDefault();
      state.player.nombre = document.getElementById("p-nombre").value;
      state.player.posicion = document.getElementById("p-posicion").value;
      state.player.club = "Club Local";
      state.created = true;
      save();
      render();
    };
    return;
  }

  const p = state.player;
  const media = overall(p);

  app.innerHTML = `
    <header>
      <h1>LEGADO FC</h1>
      <p>${p.nombre} | ${p.posicion} | ${p.edad} Años | OVR: <strong>${media}</strong></p>
    </header>

    <nav class="tabs">
      <button onclick="setTab('carrera')" class="${state.tab === 'carrera' ? 'active' : ''}">Carrera</button>
      <button onclick="setTab('estadisticas')" class="${state.tab === 'estadisticas' ? 'active' : ''}">Estadísticas</button>
      <button onclick="setTab('opciones')" class="${state.tab === 'opciones' ? 'active' : ''}">Opciones</button>
    </nav>

    <main class="content">
      ${
        state.tab === 'carrera' ? `
          <div class="card">
            <h2>Estado Actual</h2>
            <p><strong>Club:</strong> ${p.club}</p>
            <p><strong>Valor de Mercado:</strong> $${valorMercado(p).toLocaleString()}</p>
            <button onclick="simulateSeason()" class="btn btn-primary">Simular Siguiente Temporada</button>
          </div>
          <div class="card">
            <h3>Noticias Recientes</h3>
            <ul>${state.noticias.map(n => `<li>${n}</li>`).join('')}</ul>
          </div>
        ` : state.tab === 'estadisticas' ? `
          <div class="card">
            <h2>Historial de Carrera</h2>
            <p>Partidos Totales: ${p.partidosTotales} | Goles: ${p.golesTotales} | Asistencias: ${p.asistenciasTotales}</p>
            <table>
              <thead>
                <tr><th>Edad</th><th>Club</th><th>PJ</th><th>Goles</th><th>Asist.</th><th>Media</th></tr>
              </thead>
              <tbody>
                ${p.historial.map(h => `
                  <tr>
                    <td>${h.edad}</td>
                    <td>${h.club}</td>
                    <td>${h.partidos}</td>
                    <td>${h.goles}</td>
                    <td>${h.asistencias}</td>
                    <td>${h.media}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="card">
            <h2>Gestión de Partida</h2>
            <button onclick="exportSave()" class="btn">Exportar Partida (.JSON)</button>
            <button onclick="triggerImport()" class="btn">Importar Partida (.JSON)</button>
            <button onclick="resetGame()" class="btn btn-danger">Reiniciar Carrera</button>
          </div>
        `
      }
    </main>
  `;
}

// --- MANEJO DE PESTAÑAS Y ARCHIVOS ---
function setTab(tabName) {
  state.tab = tabName;
  save();
  render();
}

function exportSave() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `legado_fc_${state.player.nombre.replace(/\s+/g, '_')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function triggerImport() {
  const fileInput = document.getElementById("import-file");
  if (fileInput) fileInput.click();
}

// Inicialización de evento de archivo seguro
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
          alert("El archivo no es una partida válida de LEGADO FC.");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    };
  }
  render();
});
