# Manual técnico — GitHub Pages

Esta edición es 100% client-side. React presenta la interfaz; `src/game` contiene el dominio, el seed y la simulación pura. `createCareer`, `simulateSeason`, `acceptOffer`, `renewContract` y `retireCareer` son la interfaz del motor. El PRNG xorshift utiliza una semilla de carrera y temporada para producir resultados reproducibles.

El estado canónico se guarda en `LocalStorage` bajo `legado-career`. La exportación JSON permite crear copias y la importación valida la versión antes de reemplazar el estado. No hay API, servidor, credenciales ni base de datos remota.

Para añadir una posición, actualiza tipos, etiquetas y ponderaciones. Para añadir un entrenamiento, actualiza tipos, mapa de atributos e interfaz. Para añadir clubes, modifica `src/game/data.ts` y ejecuta `npm run seed` para regenerar `public/data/league-seed.json`. Evita `Math.random()` dentro del motor para conservar reproducibilidad.

Los atributos deben permanecer entre 20 y 99, la edad entre 14 y 42, y los montos no pueden ser negativos. Después de cualquier cambio ejecuta `npm test`. Vite produce rutas relativas en `dist`, necesarias para repositorios publicados en subcarpetas de GitHub Pages.

El flujo `.github/workflows/deploy-pages.yml` instala con `npm ci`, compila y publica `dist` mediante las acciones oficiales de GitHub Pages.
