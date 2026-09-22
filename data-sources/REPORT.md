# Reporte del dataset

Generado por `scripts/build-dataset.mjs`. Total: **4741** jugadores.

## Definición de goles
Goles de liga argentina en la división indicada. Sin copas, sin selección, sin clubes extranjeros, sin amistosos.
Prioridad: RSSSF (Primera, carrera) > Transfermarkt Primera (Apertura + Clausura + Liga Profesional, desde 1990/91, si hizo goles ahí o es arquero) > Transfermarkt Primera Nacional (ARG2, desde 2008/09). Los goles de Transfermarkt salen de sumar las listas por temporada (completas) y se controlan contra su lista histórica. No incluye Copa de la Liga ni copas.

## Resumen
- RSSSF: 113 jugadores parseados. Suma por club = total en 113.
- Transfermarkt: 4964 jugadores únicos en listas por temporada, 4628 agregados, 14 fusionados con RSSSF, 322 sin goles (no arqueros) descartados, 0 descartados por posición desconocida.
- Control cruzado: 392 jugadores figuran también en la lista histórica de la Liga Profesional (AR1N) de Transfermarkt; la suma por temporada coincide en 391. Si difiere, se usa el total histórico y se marca `season-sum-N`.
- Listas por temporada truncadas (150 filas con goles): AR1N 2021 Sturm, ARG2 2020 Sturm, ARG2 2021 Sturm, ARG2 2022 Sturm, ARG2 2023 Sturm, ARG2 2024 Sturm, ARG2 2025 Sturm.
- Primera: 3126 · Primera Nacional: 1615
- Por posición: GK 86 · CB 795 · LB 270 · RB 267 · DM 335 · CM 448 · AM 512 · LW 358 · RW 429 · ST 1241
- Marcados para revisión: 1671

## Discrepancias entre fuentes (se usa RSSSF)
- Martín Palermo: RSSSF 227 vs Transfermarkt 192
- Esteban Fuertes: RSSSF 165 vs Transfermarkt 127
- José Sand: RSSSF 162 vs Transfermarkt 161
- Diego Maradona: RSSSF 151 vs Transfermarkt 3
- Ernesto Farías: RSSSF 141 vs Transfermarkt 131
- José Calderon: RSSSF 141 vs Transfermarkt 71
- Santiago Silva: RSSSF 132 vs Transfermarkt 131
- Alberto Acosta: RSSSF 128 vs Transfermarkt 34
- Guillermo Barros Schelotto: RSSSF 110 vs Transfermarkt 65
- Néstor Silvera: RSSSF 107 vs Transfermarkt 99
- Facundo Sava: RSSSF 107 vs Transfermarkt 82
- Hugo Pavone: RSSSF 103 vs Transfermarkt 102
- Daniel Montenegro: RSSSF 102 vs Transfermarkt 90

## Suma por temporada vs histórico de Transfermarkt
- Santiago Silva (AR1N): suma por temporada 32 vs histórico 33

## Revisión pendiente
- `position-unverified`: RSSSF no informa posición; se asumió delantero (ST).
- `active-in-source-update-2023`: jugador activo cuando RSSSF actualizó (17/08/2023); el total puede estar desactualizado.
- `club-unverified`: Transfermarkt no informa un club único para ese jugador.
- `season-sum-N`: la suma por temporada (N) no coincide con el total histórico de Transfermarkt; se usa el total histórico.
- `season-list-truncated`: jugó en una temporada cuya lista quedó cortada en 150 filas; puede faltar algún gol.
- `seasons-before-YYYY-not-counted`: jugó antes del inicio de cobertura de Transfermarkt; sus goles previos no están sumados (el `scope` de la tarjeta lo aclara).
- position-unverified: 100 jugadores
- seasons-before-*-not-counted: 226 jugadores
- José Sand: active-in-source-update-2023
- Santiago Silva: active-in-source-update-2023
- Hugo Pavone: active-in-source-update-2023
- Ezequiel Bulacio: club-unverified, season-list-truncated
- Juan Cruz Vega: club-unverified, season-list-truncated
- Maximiliano Rogoski: club-unverified, season-list-truncated
- Genaro Rossi: club-unverified, season-list-truncated
- Franco Olego: club-unverified
- Sebastián Riquelme: club-unverified, season-list-truncated

## Descartados
- Ninguno
