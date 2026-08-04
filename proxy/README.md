# Proxy seguro de API-SPORTS

Este proxy mantiene `API_SPORTS_KEY` fuera de GitHub y del navegador. Acepta únicamente solicitudes GET desde `https://web-gale.github.io`, limita los endpoints disponibles y conserva respuestas durante 15 minutos.

La clave debe guardarse como secreto del entorno con el nombre `API_SPORTS_KEY`; nunca debe escribirse en `wrangler.toml`, `.env.example` ni en el código fuente. Después del despliegue, la URL pública se asigna a `VITE_API_SPORTS_PROXY_URL` al compilar LEGADO FC.
