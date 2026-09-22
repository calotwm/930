# 930 — Requirements

## Goal
Que alguien abra 930 en el celular y en segundos esté armando un XI para llegar exactamente a 930.

## Scope (v1)
- SPA React + TypeScript + Vite + Tailwind, sin backend.
- Una formación: 4-2-1-3 (ARQ, 4 DEF, 2 MC, 1 MP, 3 DEL).
- Dataset local `src/data/players.json` con fuente por jugador.
- Buscar, agregar, reemplazar, eliminar jugadores; reiniciar; compartir.
- Indicador de factibilidad: "todavía se puede llegar a 930" con los slots libres.

## Out of scope (v1)
- Otras formaciones (la estructura las soporta).
- Backend, cuentas, rankings, desafío diario.
- Fotos de jugadores.

## Definición de `goals`
`goals` = goles en **liga argentina** (sin copas nacionales, sin copas internacionales, sin selección, sin clubes extranjeros, sin amistosos) en la división indicada en `division`, según la fuente primaria registrada en `source`.

Regla de prioridad (consistente, no arbitraria):
1. RSSSF All-Time Topscorers in League (Primera) si el jugador figura allí.
2. Si no, Transfermarkt Primera (AR1N) — goles registrados por Transfermarkt.
3. Si no tiene registro en Primera, Transfermarkt Primera Nacional (ARG2).
4. Si dos fuentes difieren, se usa la de mayor prioridad y la otra se guarda en `discrepancies`.

## Functional requirements
- FR1 Pantalla principal: logo 930, "DESAFÍO HISTÓRICO", contador grande, barra de progreso, estado compacto (jugadores, goles, restantes), cancha.
- FR2 Tocar slot abre bottom sheet con buscador filtrado por posición del slot.
- FR3 Búsqueda por nombre, apellido, club, posición; insensible a acentos y mayúsculas.
- FR4 Resultado muestra nombre, club relevante, posición, época y alcance del dato. Los goles quedan ocultos ("?") y se revelan al colocar al jugador en la cancha (cambio pedido por el usuario el 22/09/2026). Resultados ordenados por apellido (ordenar por goles delataría el número), con contador y "Ver más".
- FR5 Asignar jugador actualiza el contador con animación corta y delta "+N".
- FR6 Tocar slot lleno permite cambiar o quitar al jugador.
- FR7 Un jugador no puede estar en dos slots.
- FR8 Posiciones: un jugador sólo entra en slots compatibles; un arquero nunca entra fuera del arco.
- FR9 Exactamente 930 con 11 jugadores: pantalla de victoria con XI, "JUGAR DE NUEVO" y "COMPARTIR RESULTADO".
- FR10 Más de 930: estado "Te pasaste por N".
- FR11 Compartir: Web Share API (imagen si se puede, si no texto); fallback copiar texto.
- FR12 Reiniciar equipo.
- FR13 Cambios limitados (propuesta Game Designer, 22/09/2026): quitar o reemplazar a un jugador ya colocado usa 1 de 5 cambios. Llenar un puesto vacío no cuesta nada.
- FR14 Derrota: sin cambios y sin forma de llegar a 930 (te pasaste o ya es imposible) muestra "SIN CAMBIOS" con "Jugar de nuevo".
- FR15 Identidad con colores de la bandera argentina (propuesta UI Designer): azul noche de base, celeste y blanco en franjas y acentos, dorado Sol de Mayo en victoria, cancha verde.
- FR16 Dataset ampliado a todos los jugadores con goles registrados por Transfermarkt en Primera (2012/13–2026) y ascenso (2008/09–2026), más los arqueros.

## Non-functional
- Mobile-first real (375–430 px). Desktop: misma experiencia, cancha más grande.
- Búsqueda < 16 ms por tecla sobre ~500 jugadores (índice pre-normalizado).
- Animaciones con transform/opacity; respetar `prefers-reduced-motion`.

## Acceptance criteria
- AC1 Sumar, quitar y reemplazar recalculan total y restantes correctamente (tests).
- AC2 `isWin` sólo es true con 11 jugadores y total exacto 930 (tests).
- AC3 `overBy` informa el exceso (tests).
- AC4 Validación de posiciones y bloqueo de duplicados (tests).
- AC5 Todos los jugadores del dataset tienen `source.name` y `source.url`; ids únicos (test).
- AC6 El dataset admite al menos una solución de 930 con la formación v1 (test con el solver).
- AC7 Build y typecheck sin errores.
- AC8 Flujo real verificado en navegador a 375 px: buscar, asignar, reemplazar, quitar, exceso, 930.
