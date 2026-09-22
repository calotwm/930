# 930 ⚽

Juego web mobile-first: armá un XI histórico del fútbol argentino cuya suma de goles sea exactamente **930**.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests (Vitest)
npm run typecheck
npm run build
```

## Datos

`src/data/players.json` se genera con `npm run build:data` a partir de las fuentes guardadas en `data-sources/raw/`:

- RSSSF — Argentina All-Time Topscorers in League (fuente principal, Primera, carrera).
- Transfermarkt — goleadores históricos de Primera (AR1N, desde 2012/13) y Primera Nacional (ARG2, desde 2008/09), con posición; clubes y época desde el historial de transferencias.

`goals` = goles de liga argentina en la división indicada, según la fuente registrada en cada jugador. Sin copas, selección, clubes extranjeros ni amistosos. El detalle, las discrepancias y los datos a revisar están en `data-sources/REPORT.md`.

## Estructura

```
src/lib         lógica pura (posiciones, formaciones, reglas, puntaje, solver, búsqueda, compartir)
src/components  UI
src/hooks       estado del juego
src/pages       Home
scripts         generación del dataset
sdd/specs       especificación (idea, requirements, design, plan, review)
```
