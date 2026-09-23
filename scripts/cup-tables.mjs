// Cup and second-division scorer tables from Wikipedia snapshots in data-sources/raw/wikipedia.
// - per-edition pages (Libertadores, Sudamericana, Supercopa, Copa Argentina, Copa de la Liga,
//   Primera B Nacional / Primera Nacional): each edition's scorer table, summed per player.
//   Those tables only list the top scorers of each edition, so sums are lower bounds.
// - all-time Libertadores / Sudamericana tables: exact totals with a per-club breakdown.
import fs from 'node:fs'
import path from 'node:path'

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const season = (y) => `${y}-${String(y + 1).slice(2)}`

// comp: key used in the dataset; intl: CONMEBOL cup (only goals with Argentine clubs count)
export const COMPS = {
  libertadores: { label: 'Copa Libertadores', intl: true },
  sudamericana: { label: 'Copa Sudamericana', intl: true },
  supercopa: { label: 'Supercopa Sudamericana', intl: true },
  copaArgentina: { label: 'Copa Argentina', intl: false },
  copaLiga: { label: 'Copa de la Liga Profesional', intl: false },
  ascenso: { label: 'Primera B Nacional / Primera Nacional', intl: false },
}

export const EDITIONS = [
  ...range(1960, 2026).map((y) => ({ comp: 'libertadores', year: y, title: `Copa Libertadores ${y}` })),
  ...range(2002, 2025).map((y) => ({ comp: 'sudamericana', year: y, title: `Copa Sudamericana ${y}` })),
  ...range(1988, 1997).map((y) => ({ comp: 'supercopa', year: y, title: `Supercopa Sudamericana ${y}` })),
  ...range(2011, 2018).map((y) => ({ comp: 'copaArgentina', year: y + 1, title: `Copa Argentina ${season(y)}` })),
  ...range(2022, 2026).map((y) => ({ comp: 'copaArgentina', year: y, title: `Copa Argentina ${y}` })),
  ...range(2020, 2024).map((y) => ({ comp: 'copaLiga', year: y, title: `Copa de la Liga Profesional ${y}` })),
  ...range(1986, 1995).map((y) => ({ comp: 'ascenso', year: y + 1, title: `Campeonato Nacional B ${season(y)}` })),
  ...range(1996, 2013).map((y) => ({ comp: 'ascenso', year: y + 1, title: `Campeonato de Primera B Nacional ${season(y)}` })),
  // 2014-2016 were calendar-year seasons
  ...[2014, 2015, 2016].map((y) => ({ comp: 'ascenso', year: y, title: `Campeonato de Primera B Nacional ${y}` })),
  ...range(2016, 2018).map((y) => ({ comp: 'ascenso', year: y + 1, title: `Campeonato de Primera B Nacional ${season(y)}` })),
  { comp: 'ascenso', year: 2020, title: 'Campeonato de Primera Nacional 2019-20' },
  ...range(2020, 2026).map((y) => ({ comp: 'ascenso', year: y, title: `Campeonato de Primera Nacional ${y}` })),
].map((e) => ({ ...e, file: `editions/${e.comp}-${e.title.match(/\d{4}(-\d{2})?$/)[0]}.txt` }))

export const ALLTIME = [
  { comp: 'libertadores', file: 'libertadores-estadisticas.txt', title: 'Anexo:Estadísticas de la Copa Libertadores', section: '=== Máximos goleadores históricos ===' },
  { comp: 'sudamericana', file: 'sudamericana-estadisticas.txt', title: 'Anexo:Estadísticas de la Copa Sudamericana', section: '=== Tabla histórica de goleadores ===' },
]

export const wikiUrl = (title) => `https://es.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`

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
    .replace(/<[^>]*>/g, ' ')
    .replace(/'''?/g, '')
    .trim()
export const links = (c) =>
  [...c.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)]
    .filter((m) => !/^(Archivo|File|Imagen|Anexo):/i.test(m[1]))
    .map((m) => ({ page: m[1].trim(), name: clean(m[2] || m[1]).replace(/\s*\([^)]*\)\s*$/, '').trim() }))

// wikitable -> grid of cell strings, expanding rowspan/colspan
export function grid(tbl) {
  // the first chunk is the "{|" line, sometimes followed by the header cells
  const rows = tbl.split(/\n\|-[^\n]*/)
  rows[0] = rows[0].replace(/^\{\|[^\n]*/, '')
  if (!rows[0].trim()) rows.shift()
  const out = []
  const carry = [] // carry[col] = { text, left }
  for (const row of rows) {
    const raw = ('\n' + row).split(/\|\||!!|\n[|!]/).slice(1)
    const cells = []
    let col = 0
    const takeCarry = () => {
      while (carry[col]?.left > 0) {
        cells[col] = carry[col].text
        carry[col].left--
        col++
      }
    }
    for (let c of raw) {
      takeCarry()
      let rs = 1
      let cs = 1
      const attr = c.match(/^\s*([^[{|]*=[^[{|]*)\|(?!\|)/)
      if (attr) {
        rs = +(attr[1].match(/rowspan\s*=\s*"?(\d+)/i)?.[1] ?? 1)
        cs = +(attr[1].match(/colspan\s*=\s*"?(\d+)/i)?.[1] ?? 1)
        c = c.slice(attr[0].length)
      }
      c = c.trim()
      for (let k = 0; k < cs; k++) {
        cells[col] = c
        if (rs > 1) carry[col] = { text: c, left: rs - 1 }
        col++
      }
    }
    takeCarry()
    out.push(cells)
  }
  return out
}

function sectionText(src, re) {
  const m = src.match(re)
  if (!m) return null
  const level = m[1].length
  let s = src.slice(m.index + m[0].length)
  const next = s.search(new RegExp(`\\n={2,${level}}[^=]`))
  if (next >= 0) s = s.slice(0, next)
  return s
}

function tablesIn(s) {
  const out = []
  let i = 0
  while ((i = s.indexOf('{|', i)) >= 0) {
    const end = s.indexOf('\n|}', i)
    out.push(s.slice(i, end < 0 ? undefined : end))
    i = end < 0 ? s.length : end + 3
  }
  return out
}

// first table under a "Goleadores" heading with player + goals columns
function scorerTable(src) {
  const sec = sectionText(src, /\n(={2,4})\s*(?:Tabla de )?(?:M[áa]ximos )?[Gg]oleadores(?: del torneo| generales)?\s*\1\s*\n/)
  if (!sec) return null
  for (const t of tablesIn(sec)) {
    const g = grid(t)
    const isGoals = (c) => /^\s*Goles|\{\{\s*gol\s*\}\}/i.test(c)
    const hi = g.findIndex((r) => r.some(isGoals) && r.some((c) => /Jugador|Futbolista|Nombre/.test(c)))
    if (hi < 0) continue
    const h = g[hi].map((c) => c.replace(/^[^|]*\|(?!\|)/, (m) => (/=/.test(m) ? '' : m)))
    return {
      rows: g.slice(hi + 1),
      player: h.findIndex((c) => /Jugador|Futbolista|Nombre/.test(c)),
      team: h.findIndex((c) => /Equipo|Club/.test(c)),
      goals: h.findIndex(isGoals),
    }
  }
  return null
}

// infobox "| goleador = [[Player]] ([[Club]]) (21 goles)" (several separated by <br>) -> same shape as a table
function infoboxScorers(src) {
  const m = src.match(/\n\s*\|\s*goleador\s*=\s*([^\n]+)/i)
  if (!m) return null
  const goals = m[1].match(/(\d+)\s*goles/)
  if (!goals) return null
  const ls = links(m[1].replace(/\{\{[^{}]*\}\}/g, ''))
  if (!ls.length) return null
  // players and clubs alternate when clubs are given in parentheses
  const rows = []
  const parts = m[1].split(/<br\s*\/?>/i)
  for (let i = 0; i < parts.length; i++) {
    const who = links(parts[i].replace(/\{\{[^{}]*\}\}/g, ''))[0]
    if (!who || /^\s*\(/.test(parts[i].replace(/\{\{[^{}]*\}\}/g, '').trim())) continue
    const clubPart = parts.slice(i + 1).find((x) => /^\s*(<small>)?\s*\(\s*\[\[/.test(x)) ?? ''
    rows.push([parts[i], clubPart, goals[1]])
  }
  return rows.length ? { rows, player: 0, team: 1, goals: 2, infobox: true } : null
}

const num = (c) => {
  const m = clean(c ?? '').match(/^(\d+)/)
  return m ? +m[1] : null
}
const ARG_FLAG = /\{\{\s*(bandera|band|flagicon)\s*\|\s*(ARG|Argentina)\b|\{\{ARG\}\}/i

// Argentine club pages: every team in a domestic edition table, plus teams flagged Argentina anywhere
export function argentineClubs(dir) {
  const set = new Set()
  for (const e of EDITIONS) {
    const f = path.join(dir, e.file)
    if (!fs.existsSync(f)) continue
    const t = scorerTable(fs.readFileSync(f, 'utf8'))
    if (!t || t.team < 0) continue
    for (const r of t.rows) {
      const cell = r[t.team] ?? ''
      const team = links(cell)[0]
      if (team && (!COMPS[e.comp].intl || ARG_FLAG.test(cell))) set.add(team.page)
    }
  }
  return set
}

export function parseEditions(dir, isArgClub) {
  const perPlayer = new Map() // page -> { name, page, comp -> goals, editions: [] }
  const missing = []
  const empty = []
  const fromInfobox = []
  const unknownTeams = new Set()
  for (const e of EDITIONS) {
    const f = path.join(dir, e.file)
    if (!fs.existsSync(f)) {
      missing.push(e.title)
      continue
    }
    const src = fs.readFileSync(f, 'utf8')
    let t = scorerTable(src)
    if (!t || t.player < 0 || t.goals < 0) t = infoboxScorers(src)
    if (!t) {
      empty.push(e.title)
      continue
    }
    if (t.infobox) fromInfobox.push(e.title)
    for (const r of t.rows) {
      const who = links(r[t.player] ?? '')[0]
      const goals = num(r[t.goals])
      if (!who || !goals) continue
      let arg = !COMPS[e.comp].intl
      if (!arg) {
        const teamCell = r[t.team] ?? ''
        const team = links(teamCell)[0]
        arg = ARG_FLAG.test(teamCell) || (team && isArgClub(team.page))
        if (!arg && team && !/\{\{\s*(bandera|band)/i.test(teamCell)) unknownTeams.add(team.page)
      }
      if (!arg) continue
      const p = perPlayer.get(who.page) ?? { ...who, goals: {}, editions: [], teams: [], allTeams: [] }
      // team as link or, in some tables, plain text
      const plain = clean(r[t.team] ?? '')
      const team = links(r[t.team] ?? '')[0] ?? (plain && !/^\d+$/.test(plain) ? { name: plain, page: plain } : null)
      if (team && !COMPS[e.comp].intl) p.teams.push(team.name)
      if (team) p.allTeams.push(team.name, team.page)
      p.goals[e.comp] = (p.goals[e.comp] ?? 0) + goals
      p.editions.push(`${COMPS[e.comp].label} ${e.year}: ${goals}`)
      perPlayer.set(who.page, p)
    }
  }
  return { perPlayer, missing, empty, fromInfobox, unknownTeams: [...unknownTeams] }
}

// all-time tables: "[[Club A|A]] (12)<br>[[Club B|B]] (3)" or a single club (all goals)
export function parseAllTime(dir, isArgClub) {
  const out = new Map()
  for (const a of ALLTIME) {
    const src = fs.readFileSync(path.join(dir, a.file), 'utf8')
    const sec = src.slice(src.indexOf(a.section) + a.section.length)
    const t = tablesIn(sec)[0]
    const g = grid(t)
    const hi = g.findIndex((r) => r.some((c) => /Goles/.test(c)))
    const h = g[hi].map((c) => clean(c))
    const pc = h.findIndex((c) => /Jugador|Nombre/.test(c))
    const gc = h.findIndex((c) => /^Goles/.test(c))
    const cc = h.findIndex((c) => /Equipo|Clubes/.test(c))
    for (const r of g.slice(hi + 1)) {
      const who = links(r[pc] ?? '')[0]
      const total = num(r[gc])
      if (!who || !total) continue
      const parts = (r[cc] ?? '').split(/<br\s*\/?>|,\s*(?=\{\{|\[\[)/i).filter((x) => /\[\[/.test(x))
      let arg = 0
      let known = true
      for (const part of parts) {
        const club = links(part)[0]
        const g2 = part.match(/\((\d+)\)/)
        const goals = g2 ? +g2[1] : parts.length === 1 ? total : null
        if (goals == null) known = false
        else if (ARG_FLAG.test(part) || isArgClub(club.page)) arg += goals
      }
      if (!known) continue
      const p = out.get(who.page) ?? { ...who, goals: {} }
      p.goals[a.comp] = arg
      out.set(who.page, p)
    }
  }
  return out
}
