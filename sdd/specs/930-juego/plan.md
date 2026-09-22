# 930 — Plan

1. Proyecto: Vite react-ts + Tailwind v4 + Vitest. Validar: `npm run build`.
2. Dataset: descargar RSSSF + Transfermarkt crudo a `data-sources/raw/`, script `scripts/build-dataset.mjs` → `src/data/players.json` + `data-sources/REPORT.md`. Validar: ids únicos, fuente en todos, test de solución 930.
3. `lib/positions.ts`, `lib/formations.ts`, `lib/scoring.ts`, `lib/gameRules.ts`, `lib/searchPlayers.ts`, `lib/solver.ts`. Validar: tests unitarios.
4. Componentes: FootballPitch, PlayerSlot, BottomSheet, PlayerSearch, PlayerCard, GoalCounter, ProgressBar, GameHeader, GameStatus, VictoryScreen. Validar: navegador 375 px.
5. Contador + barra + estados under/exact/over.
6. Victoria + compartir (Web Share + fallback clipboard, imagen canvas).
7. Responsive tablet/desktop.
8. Animaciones + reduced motion.
9. Tests completos. Validar: `npm test`, `tsc -b`, build.
10. Revisión final → `review.md`.
