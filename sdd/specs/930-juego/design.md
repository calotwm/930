# 930 — Design

Agency Agent unavailable: UX Architect — orchestrator performed role.
Agency Agent unavailable: UI Designer — orchestrator performed role.
Agency Agent unavailable: Software Architect — orchestrator performed role.
(Los agentes se instalaron en `~/.claude/agents/` durante esta sesión; Claude Code los carga al iniciar sesión.)

## Arquitectura
```
scripts/build-dataset.mjs   genera src/data/players.json desde fuentes crudas descargadas
src/data/players.json       dataset (sólo datos)
src/lib/types.ts            tipos
src/lib/positions.ts        posiciones normalizadas + compatibilidad slot/jugador
src/lib/formations.ts       formaciones (v1: 4-2-1-3), coordenadas en la cancha
src/lib/gameRules.ts        estado del XI: asignar, quitar, reemplazar, validar
src/lib/scoring.ts          total, restantes, exceso, estado (under/exact/over)
src/lib/solver.ts           factibilidad (DP subset-sum con restricción por slot)
src/lib/searchPlayers.ts    índice normalizado + búsqueda
src/lib/share.ts            texto + imagen (canvas) + Web Share / clipboard
src/hooks/useGame.ts        estado React (useReducer) sobre gameRules
src/components/*            UI pura
src/pages/Home.tsx
```
Lógica pura sin React en `lib/` → testeable.

## Dataset
Campos: `id, name, shortName, position, goals, clubs[], club, division, era, source{name,url,note?}, secondarySource?, discrepancies?, review?`.
- RSSSF: nombre "APELLIDO, Nombre" se reordena; clubes y años del desglose; época = décadas de actividad.
- RSSSF no informa posición → `position: "ST"` y `review: ["position-unverified"]`.
- Transfermarkt: posición del listado; clubes argentinos y años del historial de transferencias. Si el historial no tiene clubes argentinos, se usa el club del listado.
- Duplicados RSSSF↔Transfermarkt: se matchea por apellido + nombre + época compatible; gana RSSSF y el número TM va a `discrepancies`.

## Posiciones
Normalizadas: GK, CB, LB, RB, DM, CM, AM, LW, RW, ST.
Slots: ARQ(GK) · DEF(CB, LB, RB) · MC(DM, CM, AM) · MP(AM, CM, LW, RW) · DEL(ST, LW, RW, AM).
Un GK sólo entra en ARQ. La tabla vive en `positions.ts`, fuera del dataset.

## UX
- Header: logo "930" + "DESAFÍO HISTÓRICO".
- Contador: número grande con tick animado (requestAnimationFrame ~450 ms) y delta flotante "+N"/"−N". Barra: verde bajo 930, dorado en 930, rojo si se pasa.
- Estado compacto: `7/11 · 188 restantes` + chip de factibilidad.
- Cancha vertical con franjas; slots circulares vacíos con etiqueta; tarjeta compacta al llenarse (apellido + ⚽ goles).
- Bottom sheet con handle, título "Elegí delantero", input autofocus, chips de filtro de posición, lista virtual simple (primeros 60 resultados ordenados por goles). Si el slot tiene jugador: botón "Quitar".
- Victoria: overlay full-screen con confetti liviano (CSS, 24 partículas), mini cancha y botones.
- Exceso: shake corto del contador + texto "Te pasaste por N".

## Estética
Fondo verde muy oscuro (#07130d), cancha en verdes con franjas, acentos crema retro (#f3ead3) y dorado (#e8b84a); rojo para exceso. Tipografía display condensada (Anton) para números, UI en Inter. Tarjetas redondeadas.

## Alternativas
- Next.js: descartado; SPA sin SSR alcanza y Vite es más liviano.
- Usar goleadores por temporada del ascenso como `goals`: descartado; mezcla métricas distintas.

## Decisión final
Vite + React + TS + Tailwind v4; dataset generado por script reproducible desde HTML/JSON crudo de las fuentes.
