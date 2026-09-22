# Reporte del dataset

Generado por `scripts/build-dataset.mjs`. Total: **746** jugadores.

## Definición de goles
Goles de liga argentina en la división indicada. Sin copas, sin selección, sin clubes extranjeros, sin amistosos.
Prioridad: RSSSF (Primera, carrera) > Transfermarkt Primera (AR1N) > Transfermarkt Primera Nacional (ARG2).

## Resumen
- RSSSF: 113 jugadores parseados. Suma por club = total en 113.
- Transfermarkt: 637 jugadores únicos, 633 agregados, 4 fusionados con RSSSF, 0 descartados por posición desconocida.
- Primera: 501 · Primera Nacional: 245
- Por posición: GK 49 · CB 122 · LB 51 · RB 52 · DM 24 · CM 57 · AM 106 · LW 25 · RW 26 · ST 234
- Marcados para revisión: 357

## Discrepancias entre fuentes (se usa RSSSF)
- Daniel Montenegro: RSSSF 102 vs Transfermarkt 5
- José Sand: RSSSF 162 vs Transfermarkt 82
- Hugo Pavone: RSSSF 103 vs Transfermarkt 33
- Santiago Silva: RSSSF 132 vs Transfermarkt 33

## Revisión pendiente
- `position-unverified`: RSSSF no informa posición; se asumió delantero (ST).
- `active-in-source-update-2023`: jugador activo cuando RSSSF actualizó (17/08/2023); el total puede estar desactualizado.
- `club-era-unverified`: Transfermarkt no devolvió clubes argentinos en el historial.
- `seasons-before-YYYY-not-counted`: jugó antes del inicio de cobertura de Transfermarkt; sus goles previos no están sumados (el `scope` de la tarjeta lo aclara).
- position-unverified: 109 jugadores
- seasons-before-*-not-counted: 245 jugadores
- José Sand: active-in-source-update-2023
- Santiago Silva: active-in-source-update-2023
- Hugo Pavone: active-in-source-update-2023

## Descartados
- Ninguno
