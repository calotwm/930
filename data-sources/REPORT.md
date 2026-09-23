# Reporte del dataset

Generado por `scripts/build-dataset.mjs`. Total: **4815** jugadores.

## Definición de goles
Goles de liga argentina en la división indicada. Sin copas, sin selección, sin clubes extranjeros, sin amistosos.
Prioridad: RSSSF (Primera, carrera) > Transfermarkt Primera (Apertura + Clausura + Liga Profesional, desde 1990/91, si hizo goles ahí o es arquero) > Transfermarkt Primera Nacional (ARG2, desde 2008/09). Los goles de Transfermarkt salen de sumar las listas por temporada (completas) y se controlan contra su lista histórica. No incluye Copa de la Liga ni copas.

## Resumen
- RSSSF: 113 jugadores parseados. Suma por club = total en 113.
- Transfermarkt: 4964 jugadores únicos en listas por temporada, 4628 agregados, 14 fusionados con RSSSF, 322 sin goles (no arqueros) descartados, 0 descartados por posición desconocida.
- Copas (Transfermarkt): 0 filas; 0 jugadores con goles en copas con clubes argentinos. Descartadas: 0 filas de clubes extranjeros y 0 ambiguas (club argentino y extranjero en la misma temporada).
- Control cruzado: 392 jugadores figuran también en la lista histórica de la Liga Profesional (AR1N) de Transfermarkt; la suma por temporada coincide en 391. Si difiere, se usa el total histórico y se marca `season-sum-N`.
- Listas por temporada truncadas (150 filas con goles): AR1N 2021 Sturm, ARG2 2020 Sturm, ARG2 2021 Sturm, ARG2 2022 Sturm, ARG2 2023 Sturm, ARG2 2024 Sturm, ARG2 2025 Sturm.
- Tablas de goleadores por club (Independiente, Lanús, Boca): 131 filas válidas, 73 jugadores agregados (faltaban en las fuentes principales), 3 filas descartadas por totales inconsistentes.
- Altas manuales con fuente citada (data-sources/manual-additions.json): 1.
- Primera: 3200 · Primera Nacional: 1615
- Por posición: GK 86 · CB 798 · LB 271 · RB 267 · DM 335 · CM 455 · AM 513 · LW 358 · RW 429 · ST 1303
- Marcados para revisión: 1745

## Discrepancias entre fuentes (se usa RSSSF)
- Martín Palermo: RSSSF 272 vs Transfermarkt 192
- Esteban Fuertes: RSSSF 177 vs Transfermarkt 127
- José Sand: RSSSF 211 vs Transfermarkt 161
- Diego Maradona: RSSSF 151 vs Transfermarkt 3
- Ernesto Farías: RSSSF 156 vs Transfermarkt 131
- José Calderon: RSSSF 163 vs Transfermarkt 71
- Santiago Silva: RSSSF 161 vs Transfermarkt 132
- Alberto Acosta: RSSSF 152 vs Transfermarkt 34
- Guillermo Barros Schelotto: RSSSF 136 vs Transfermarkt 65
- Néstor Silvera: RSSSF 119 vs Transfermarkt 99
- Facundo Sava: RSSSF 108 vs Transfermarkt 92
- Hugo Pavone: RSSSF 122 vs Transfermarkt 111
- Daniel Montenegro: RSSSF 109 vs Transfermarkt 100

## Suma por temporada vs histórico de Transfermarkt
- Santiago Silva (AR1N): suma por temporada 32 vs histórico 33

## Revisión pendiente
- `position-unverified`: RSSSF no informa posición; se asumió delantero (ST).
- `active-in-source-update-2023`: jugador activo cuando RSSSF actualizó (17/08/2023); el total puede estar desactualizado.
- `club-unverified`: Transfermarkt no informa un club único para ese jugador.
- `season-sum-N`: la suma por temporada (N) no coincide con el total histórico de Transfermarkt; se usa el total histórico.
- `season-list-truncated`: jugó en una temporada cuya lista quedó cortada en 150 filas; puede faltar algún gol.
- `seasons-before-YYYY-not-counted`: jugó antes del inicio de cobertura de Transfermarkt; sus goles previos no están sumados (el `scope` de la tarjeta lo aclara).
- position-unverified: 120 jugadores
- seasons-before-*-not-counted: 226 jugadores
- José Sand: active-in-source-update-2023
- Santiago Silva: active-in-source-update-2023
- Hugo Pavone: active-in-source-update-2023
- Gilmar Villagrán: club-total-only
- Ricardo Bochini: club-total-only
- Daniel Passarella: secondary-source-club-statistics
- Pedro Calomino: club-total-only
- Norberto Outes: club-total-only
- Ángel Silva: club-total-only
- Camilo Cervino: club-total-only
- Daniel Bertoni: club-total-only
- Bernardo Acosta: club-total-only
- Claudio Nigretti: club-total-only
- Alfredo Graciani: club-total-only
- Aníbal Tarabini: club-total-only
- Osvaldo Rubén Potente: club-total-only, position-unverified
- Jorge Burruchaga: club-total-only
- Ángel Clemente Rojas: club-total-only
- Paulo Valentim: club-total-only
- Hugo Curioni: club-total-only
- José Zorrilla: club-total-only
- Ricardo Pavoni: club-total-only
- Osvaldo Rubén Gil: club-total-only
- Ángel Alfonso: club-total-only, position-unverified
- Carlos Lacasia: club-total-only
- Eduardo Maglioni: club-total-only
- Daniel Picaro: club-total-only, position-unverified
- Enzo Trossero: club-total-only
- Raúl Armando Savoy: club-total-only
- Ricardo Bonelli: club-total-only
- Rodolfo Micheli: club-total-only
- Carlos Cecconato: club-total-only
- José Borello: club-total-only
- Juan Crespín: club-total-only, position-unverified
- Benito Cejas: club-total-only
- José Percudani: club-total-only
- Juan José De Mario: club-total-only
- Raúl Bernao: club-total-only
- Alejandro Barberón: club-total-only
- Agustín Balbuena: club-total-only
- Alfredo Garasini: club-total-only, position-unverified
- Juan Romay: club-total-only
- Mario Fernández: club-total-only
- Severino Varela: club-total-only
- Andrés Silvera: club-total-only
- Osvaldo Héctor Cruz: club-total-only, position-unverified
- Osvaldo Nardiello: club-total-only, position-unverified
- Ramón Enrique: club-total-only, position-unverified
- Urbano Reynoso: club-total-only
- José Pastoriza: club-total-only
- Carlos Fuentes: club-total-only, position-unverified
- Juan Nani: club-total-only, position-unverified
- Ramón Héctor Ponce: club-total-only
- Ezequiel Reynoso: club-total-only, position-unverified
- Fernando Walter: club-total-only
- Francisco Taggino: club-total-only
- Oscar Pianetti: club-total-only
- Pablo Bozzo: club-total-only, position-unverified
- Alberto Lorenzo: club-total-only, position-unverified
- Donato Penella: club-total-only, position-unverified
- José Florio: club-total-only
- Oscar Contreras: club-total-only, position-unverified
- Enzo Ferrero: club-total-only
- Norberto Madurga: club-total-only
- Pierino González: club-total-only
- Horacio Attadía: club-total-only
- Raúl Martínez: club-total-only
- Darío Felman: club-total-only
- Miguel Ángel Gambier: club-total-only
- Nicolás Daponte: club-total-only
- Norberto Pairoux: club-total-only, position-unverified
- Rubén Suñé: club-total-only
- Antonio Cerrotti: club-total-only, position-unverified
- Humberto Epifanio: club-total-only, position-unverified
- Clotardo Dendi: club-total-only
- Alfredo Veira: club-total-only, position-unverified
- Fernando Di Carlo: club-total-only, position-unverified
- Ezequiel Bulacio: club-unverified, season-list-truncated
- Juan Cruz Vega: club-unverified, season-list-truncated
- Maximiliano Rogoski: club-unverified, season-list-truncated
- Genaro Rossi: club-unverified, season-list-truncated
- Franco Olego: club-unverified
- Sebastián Riquelme: club-unverified, season-list-truncated

## Descartados
- Independiente — Zoilo Canavery: liga + copas + internacional no suman el total (40+8+0 vs 65)
- Independiente — Guillermo Ronzoni: liga + copas + internacional no suman el total (35+5+0 vs 56)
- Independiente — Alberto Lalín: liga + copas + internacional no suman el total (39+8+0 vs 54)
