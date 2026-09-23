# 930 ⚽

Juego web mobile-first: armá un XI histórico del fútbol argentino cuya suma de goles sea exactamente **930**.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm start          # sirve dist/ (usado en Railway)
npm test           # tests (Vitest)
npm run typecheck
npm run build
```

## Datos

`src/data/players.json` se genera con `npm run build:data` a partir de las fuentes guardadas en `data-sources/raw/`:

- RSSSF — Argentina All-Time Topscorers in League (fuente principal, Primera, carrera).
- Transfermarkt — listas de goleadores por temporada de Primera (Apertura, Clausura y Liga Profesional, desde 1990/91) y Primera Nacional (desde 2008/09), sumadas por jugador y controladas contra la lista histórica. Club, posición y época salen de esas mismas listas.

`goals` = goles oficiales con clubes argentinos (liga + copas nacionales + internacionales) cuando la fuente los da; si no, solo liga. Cada jugador trae su alcance (`scope`) y su fuente. Detalle, discrepancias y datos a revisar en `data-sources/REPORT.md`.

Fuentes adicionales: tablas de goleadores por club (Wikipedia: Independiente, Lanús/Museo Granate; Historia de Boca), tablas de Wikipedia descargadas con `node scripts/fetch-wikipedia.mjs` a `data-sources/raw/wikipedia/` (goleadores históricos de Primera y goleadores de River, San Lorenzo, Huracán, Tigre, Racing y Talleres, más la posición de cada jugador según su ficha) y altas manuales con cita (`data-sources/manual-additions.json`). El mismo fetch baja las tablas de goleadores por edición de Libertadores, Sudamericana, Supercopa, Copa Argentina, Copa de la Liga y Primera B Nacional / Primera Nacional (1986/87–2026), más las tablas históricas de Libertadores y Sudamericana, y el build las suma a los totales que eran solo de liga (`scripts/cup-tables.mjs`). En la nube, correr el fetch con `NODE_USE_ENV_PROXY=1`.

Nota: los términos de uso de Transfermarkt prohíben el acceso automatizado. No se descargan más datos de ahí.

## Estructura

```
src/lib         lógica pura (posiciones, formaciones, reglas, puntaje, solver, búsqueda, compartir)
src/components  UI
src/hooks       estado del juego
src/pages       Home
scripts         generación del dataset
sdd/specs       especificación (idea, requirements, design, plan, review)
```
