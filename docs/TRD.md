# LEGADO FC — TRD

Arquitectura client-side TypeScript: React/Vinext + Tailwind/CSS. `lib/game` contiene el dominio, PRNG, seed completo y fórmulas puras; `app` presenta la interfaz; LocalStorage conserva la partida sin servidor y JSON permite exportarla/importarla. Wikidata identifica los clubes y Wikimedia entrega sus escudos bajo demanda, con caché local y respaldo por iniciales.

Persistencia híbrida: snapshot JSON canónico para continuar en una lectura y tablas normalizadas de temporadas/eventos/logros para consultas futuras. Identificadores UUID, consultas preparadas, JSON validado, montos enteros, fechas ISO, `state_version`, límites de payload y sin secretos en cliente. El save ID de alta entropía funciona como referencia de reanudación; la identidad de plataforma es opcional.

Objetivos: simulación anual <50 ms, gráficos ligeros, UI responsive, Worker ESM y migraciones incluidas. Escalabilidad: el motor puro puede moverse al servidor; repositorios permiten migrar a PostgreSQL/Prisma sin cambiar el dominio.

API: `POST /api/careers`, `GET /api/careers?id=`, `PUT /api/careers?id=` y `GET /api/health`. Errores JSON `{error:{code,message}}`.

Pruebas: build tipado, lint, render, creación, avance, invariantes de atributos/edad/valor, retiro, persistencia e interacción visual. Convenciones: componentes PascalCase, funciones camelCase, archivos kebab-case, efectos aislados y estado de dominio inmutable.
