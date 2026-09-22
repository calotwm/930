# 930 — Review

Estado: COMPLETE (v1), con follow-ups de datos listados abajo.

## Resumen de implementación
- SPA Vite + React 19 + TypeScript (strict) + Tailwind v4. Sin backend.
- Lógica pura en `src/lib` (posiciones, formaciones, reglas, puntaje, solver, búsqueda, compartir), UI en `src/components`, estado en `src/hooks/useGame.ts`.
- Dataset reproducible: `npm run build:data` regenera `src/data/players.json` y `data-sources/REPORT.md` desde las fuentes crudas guardadas en `data-sources/raw/`.
- Extra (propuesto por el orquestador): chip "Se puede / Imposible" calculado con un solver exacto (subset-sum con posiciones y sin repetir, ~5 ms), y total resultante ("→ 742" / "¡930!") en cada resultado de búsqueda. El progreso se guarda en `localStorage`.

## Dataset
- 746 jugadores: 501 Primera, 245 Primera Nacional. Todos con `source.name` + `source.url`.
- 113 de RSSSF (Primera, carrera; la suma por club coincide con el total en 113/113).
- 633 de Transfermarkt con posición real (arqueros, defensores, volantes, delanteros).
- 4 jugadores en ambas fuentes: se usa RSSSF y el número de Transfermarkt queda en `discrepancies`.

## Criterios de aceptación
| AC | Estado | Evidencia |
|---|---|---|
| AC1 sumar / quitar / reemplazar | OK | tests + navegador (871, 1061, 767, 871) |
| AC2 victoria sólo con 11 y 930 | OK | tests + navegador (pantalla "LO LOGRASTE") |
| AC3 exceso | OK | tests + navegador ("Te pasaste por 131", barra roja) |
| AC4 posiciones y duplicados | OK | tests + navegador ("ya en tu equipo" deshabilitado) |
| AC5 fuentes e ids únicos | OK | test del dataset |
| AC6 existe un XI de 930 | OK | test del dataset con el solver |
| AC7 build + typecheck | OK | `tsc -b`, `npm run build` |
| AC8 flujo real a 375 px | OK | navegador 375×812, 768×1024 y 1280×800 sin scroll horizontal |

## Checks ejecutados
- `npx tsc -b`: sin errores.
- `npm test`: 33/33.
- `npm run build`: OK (warning de chunk > 500 kB por el JSON del dataset; 129 kB gzip).
- Navegador: búsqueda, selección, reemplazo, quitar, exceso, 930 exactos, jugar de nuevo, compartir (fallback a portapapeles verificado; Web Share simulado genera PNG 1080×1350), persistencia tras recargar, responsive.

## No verificado
- Web Share real en un celular (el navegador de prueba no expone `navigator.share`; se simuló).
- Animaciones evaluadas por código y capturas estáticas, no en un dispositivo físico.

## Riesgos y datos a revisar
- Transfermarkt cubre la Primera sólo desde 2012/13 y el ascenso desde 2008/09. Por eso cada tarjeta muestra el alcance (`scope`: "Primera desde 2012/13"). 245 jugadores jugaron antes de esa cobertura (`seasons-before-*-not-counted`).
- RSSSF no informa posición: 109 goleadores históricos quedaron como delanteros (`position-unverified`). Algunos eran volantes/enganches (p. ej. Maradona, Alonso, Brindisi).
- RSSSF está actualizado al 17/08/2023; Sand, Silva y Pavone figuraban activos.
- La lista RSSSF de ascenso (`arg2tops.html`) sólo da goleadores por temporada; no se usó como `goals`.

## Agency Agents
Ninguno ejecutado: `Agency Agent unavailable` (Product Manager, UX Architect, UI Designer, Software Architect, Frontend Developer, Code Reviewer, Minimal Change Engineer). Se instalaron en `~/.claude/agents/` durante esta misma sesión y Claude Code los carga al iniciar sesión. El orquestador cumplió esos roles.

## Follow-ups
- Validar posiciones de los 109 goleadores RSSSF con una fuente (fichas RSSSF por jugador o Transfermarkt).
- Sumar goles de ascenso previos a 2008 con fuentes históricas.
- Separar el dataset en un chunk propio (dynamic import) para bajar el JS inicial.
- Modo desafío diario / restricciones (sin repetir club, sólo ascenso, por década).
