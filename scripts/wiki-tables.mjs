// Parses scorer tables from Wikipedia wikitext snapshots saved in data-sources/raw/wikipedia
// (downloaded by scripts/fetch-wikipedia.mjs). Each table is located by its section heading and
// the header of its goals column; rows keep the player link and that column's number.
import fs from 'node:fs'
import path from 'node:path'

const wikiUrl = (title) => `https://es.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`

// kind 'primera': Primera División career league goals (all clubs).
// kind 'club': official goals for one club (league + cups; see scope).
export const WIKI_TABLES = [
  {
    file: 'goleadores-primera.txt',
    title: 'Anexo:Goleadores de la Primera División de Argentina',
    section: '=== Tabla histórica de goleadores ===',
    kind: 'primera',
    label: 'Wikipedia — Anexo:Goleadores de la Primera División de Argentina (tabla histórica, 100+ goles, hasta 2026)',
  },
  {
    file: 'maximos-goleadores-primera.txt',
    title: 'Anexo:Máximos goleadores de la Primera División de Argentina',
    section: null,
    kind: 'primera',
    label: 'Wikipedia — Anexo:Máximos goleadores de la Primera División de Argentina (actualizado a 08/2023)',
  },
  {
    file: 'river-futbolistas.txt',
    title: 'Anexo:Futbolistas del Club Atlético River Plate',
    section: '==== Tabla histórica de goleadores ====',
    kind: 'club',
    club: 'River Plate',
    scope: 'Goles oficiales en River Plate',
  },
  {
    file: 'san-lorenzo-estadisticas.txt',
    title: 'Anexo:Estadísticas del Club Atlético San Lorenzo de Almagro',
    section: '==== Máximos goleadores históricos ====',
    kind: 'club',
    club: 'San Lorenzo',
    scope: 'Goles oficiales (nacionales e internacionales) en San Lorenzo',
  },
  {
    file: 'huracan.txt',
    title: 'Club Atlético Huracán',
    section: '=== Goleadores históricos ===',
    kind: 'club',
    club: 'Huracán',
    scope: 'Goles oficiales en Huracán',
  },
  {
    file: 'tigre.txt',
    title: 'Club Atlético Tigre',
    section: '===Máximos goleadores históricos===',
    kind: 'club',
    club: 'Tigre',
    scope: 'Goles oficiales en Tigre (Primera y ascenso)',
  },
  {
    file: 'racing.txt',
    title: 'Racing Club',
    section: '=== Máximos goleadores ===',
    kind: 'club',
    club: 'Racing Club',
    scope: 'Goles oficiales en Racing Club',
  },
  {
    file: 'talleres-goleadores.txt',
    title: 'Anexo:Goleadores del Club Atlético Talleres',
    section: '== Goles totales ==',
    kind: 'club',
    club: 'Talleres',
    scope: 'Goles oficiales en Talleres (incluye Liga Cordobesa)',
  },
].map((t) => ({ ...t, url: wikiUrl(t.title), label: t.label ?? `Wikipedia — ${t.title}` }))

const stripTemplates = (s) => {
  let prev
  do {
    prev = s
    s = s.replace(/\{\{[^{}]*\}\}/g, '')
  } while (s !== prev)
  return s
}
const clean = (s) =>
  stripTemplates(s.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, ''))
    .replace(/<[^>]*>/g, '')
    .replace(/'''?/g, '')
    .trim()
// drop a leading cell attribute block such as `align="center" |`
const dropAttrs = (c) => c.replace(/^\s*[^[{|]*=[^[{|]*\|(?!\|)/, '').trim()
const num = (c) => {
  const m = clean(dropAttrs(c)).match(/^\[?\[?(\d+)/)
  return m ? +m[1] : null
}
const firstLink = (c) => {
  const m = c.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/)
  if (!m || /^(Archivo|File|Imagen):/i.test(m[1])) return null
  return { page: m[1].trim(), name: (m[2] || m[1]).replace(/\s*\([^)]*\)\s*$/, '').trim() }
}
const cells = (row) =>
  ('\n' + row)
    .split(/\|\||!!|\n[|!]/)
    .slice(1)
    .map((c) => c.trim())

function tableText(src, section) {
  let s = src
  if (section) {
    const i = src.indexOf(section)
    if (i < 0) throw new Error(`section not found: ${section}`)
    const level = section.match(/^=+/)[0].length
    s = src.slice(i + section.length)
    const next = s.search(new RegExp(`\\n={2,${level}}[^=]`))
    if (next >= 0) s = s.slice(0, next)
  }
  // the table whose header row has a goals column
  const h = s.search(/\n!.*Goles/)
  if (h < 0) throw new Error(`goals header not found in ${section}`)
  const start = s.lastIndexOf('{|', h)
  const end = s.indexOf('\n|}', h)
  return s.slice(start, end < 0 ? undefined : end)
}

// "[[Club Atlético Huracán|Huracán]] (251) - [[Club Atlético Banfield|Banfield]] (2)" -> clubs with goals
function clubsOf(c) {
  const t = clean(c.replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1'))
  return [...t.matchAll(/([^(),\-–]+?)\s*\((\d+)\)/g)]
    .map((m) => ({ club: m[1].trim(), goals: +m[2] }))
    .filter((x) => x.goals > 0)
}

export function parseWikiTables(dir) {
  const rows = []
  const rejected = []
  for (const t of WIKI_TABLES) {
    const tbl = tableText(fs.readFileSync(path.join(dir, t.file), 'utf8'), t.section)
    const parts = tbl.split(/\n\|-[^\n]*/)
    const header = parts.map(cells).find((r) => r.some((c) => /Goles/.test(c)))
    const hp = header.findIndex((c) => /Jugador|Futbolista|Nombre/.test(c))
    const hg = header.findIndex((c) => /Goles/.test(c))
    const hc = header.findIndex((c) => /Equipo/.test(c))
    const hm = header.findIndex((c) => /Partidos|^PJ/.test(clean(dropAttrs(c))))
    for (const part of parts.slice(1)) {
      const r = cells(part)
      const li = r.findIndex((c) => firstLink(c))
      if (li < 0 || r.includes(header[hp])) continue
      const who = firstLink(r[li])
      const goals = num(r[li + hg - hp] ?? '')
      if (!goals) {
        rejected.push({ table: t.title, name: who.name, why: 'sin número de goles legible' })
        continue
      }
      const matches = hm >= 0 ? num(r[li + hm - hp] ?? '') : null
      if (matches && goals > matches * 1.1) {
        rejected.push({ table: t.title, name: who.name, why: `${goals} goles en ${matches} partidos (columnas probablemente invertidas)` })
        continue
      }
      const row = { table: t, ...who, goals }
      if (t.kind === 'primera' && hc >= 0) row.clubs = clubsOf(r[li + hc - hp] ?? '')
      rows.push(row)
    }
  }
  return { rows, rejected }
}
