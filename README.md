# LEGADO FC — edición GitHub Pages

Videojuego web de simulación de carrera futbolística. Se ejecuta completamente en el navegador, sin backend ni base de datos externa.

## Publicar en GitHub Pages

1. Crea en GitHub un repositorio público llamado `legado-fc`.
2. Sube **el contenido de esta carpeta** a la raíz del repositorio.
3. En GitHub entra en **Settings → Pages**.
4. En **Build and deployment → Source**, selecciona **GitHub Actions**.
5. Abre la pestaña **Actions** y espera a que termine “Deploy LEGADO FC to GitHub Pages”.

La dirección será `https://TU-USUARIO.github.io/legado-fc/`.

## Ejecutar en tu computadora

Requiere Node.js 22 o posterior.

```bash
npm ci
npm run dev
```

## Compilar y probar

```bash
npm run seed
npm test
```

La versión lista para publicar queda en `dist/`. El ZIP entregado ya incluye una compilación verificada.

## Guardados y escudos

- La partida se guarda automáticamente en `LocalStorage` del navegador.
- El jugador puede exportar e importar su partida como `.json`.
- Los escudos se consultan en Wikidata/Wikimedia, se almacenan en caché local y usan iniciales como respaldo si no están disponibles.
- No existen cuentas online ni sincronización entre dispositivos; para trasladar una carrera se exporta el guardado.

## Estructura

- `src/App.tsx`: interfaz completa.
- `src/game/`: motor, tipos y base inicial.
- `public/data/league-seed.json`: 266 clubes, 26 ligas y 13 países.
- `docs/`: GDD, TRD y manuales.
- `.github/workflows/deploy-pages.yml`: publicación automática.
- `dist/`: compilación estática lista para GitHub Pages.

Los nombres y escudos de clubes pertenecen a sus respectivos titulares. Este proyecto no declara afiliación oficial con clubes, ligas o federaciones.
