# 930 — Idea

Estado: IMPLEMENTING

## Idea original
Juego web mobile-first: armar un XI histórico del fútbol argentino cuya suma de goles sea exactamente 930 (goles oficiales de Lionel Messi al 20/09/2026). Debe sentirse como trivia/draft futbolero, no como página de estadísticas.

## Problema interpretado
- El "contenido" del juego es el dataset: sin datos confiables y con fuente, el juego pierde valor y credibilidad.
- La gracia es combinatoria (subset-sum con restricciones de posición): tiene que existir una variedad real de goles bajos, medios y altos.

## Área de producto
Producto nuevo, sin código previo. Proyecto en `D:\proyectos\930`.

## Hallazgos de discovery
- RSSSF "All-Time Topscorers in League" (actualizado 17/08/2023) lista 113 jugadores con 100+ goles en Primera, con desglose por club. Parseado del HTML crudo; en 109/113 la suma por club coincide con el total (los 4 restantes eran de formato de texto y se corrigieron).
- 11 jugadores de 100+ goles suman como mínimo 1100 > 930. Con sólo esa lista **el juego es imposible**. Se necesitan arqueros, defensores y volantes con pocos goles.
- RSSSF Segunda División (`arg2tops.html`) sólo lista goleadores por temporada (no totales de carrera). No sirve como `goals` de carrera; queda como referencia.
- Transfermarkt `ewigetorschuetzen` (AR1N = Primera, ARG2 = Primera Nacional) es server-rendered, filtrable por posición y trae posición real por jugador. Sus fichas de jugador son client-rendered; clubes y época se toman del endpoint JSON de historial de transferencias.
- La cobertura de Transfermarkt en Primera es mayormente moderna: puede subcontar carreras antiguas. Por eso RSSSF manda cuando tiene el dato.

## Supuestos
- "Fútbol argentino" = goles en liga argentina, sin importar nacionalidad (Erico es paraguayo).
- Un jugador aparece una sola vez en el dataset.

## Preguntas abiertas
- ¿Agregar modo "desafío diario" o restricciones (sin repetir club)? Propuesto como follow-up.
- Google Stitch: no hay conector disponible en este entorno.
