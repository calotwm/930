// Career statistics tables from Wikipedia player pages ("== Estadísticas ==" → club table with
// Liga / Copas nacionales / Torneos internacionales / Total column groups, one row per season).
// Only the table wikitext is kept (data-sources/raw/wikipedia/player-stats.json).
import { grid, links } from './cup-tables.mjs'

const clean = (s) =>
  (s ?? '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/'''?/g, '')
    .trim()
const num = (c) => {
  const m = clean(c).match(/^\d+$/)
  return m ? +m[0] : 0
}
const ARG = /\{\{\s*(ARG|bandera\|ARG|bandera\|Argentina|band\|ARG)\s*[|}]/i

// the club statistics table under the "Estadísticas" section, or null
export function extractStatsTable(text) {
  const sec = text.search(/\n==\s*Estadísticas\s*==\s*\n/i)
  if (sec < 0) return null
  // the section can open with a per-club summary table; take the first one with a Liga column
  let s = text.slice(sec + 1)
  const next = s.search(/\n==[^=]/)
  if (next > 0) s = s.slice(0, next)
  for (let start = s.indexOf('{|'); start >= 0; start = s.indexOf('{|', start + 2)) {
    const end = s.indexOf('\n|}', start)
    const tbl = s.slice(start, end < 0 ? undefined : end)
    if (/Liga/i.test(tbl) && /Goles/i.test(tbl)) return tbl
    if (end < 0) break
  }
  return null
}

// -> [{ club, page, arg, league, cups, intl, total }] summed over season rows (rows with "Total" skipped)
export function parseStatsTable(tbl, isArgClub) {
  const g = grid(tbl)
  const h1 = g[0]?.map(clean) ?? []
  const h2i = g.findIndex((r, i) => i > 0 && r.some((c) => /Goles/.test(clean(c))))
  if (h2i < 0) return null
  const h2 = g[h2i].map(clean)
  // goalkeeper tables list goals conceded ("GR", "Goles recibidos/en contra"): never counted
  const goalCol = (re) => h1.findIndex((c, i) => re.test(c) && /Goles/.test(h2[i] ?? '') && !/contra|recibid/i.test(h2[i]))
  const cols = {
    league: goalCol(/^Liga/i),
    cups: goalCol(/Copas?\s*nacional/i),
    intl: goalCol(/internacional/i),
    total: goalCol(/^Total/i),
  }
  if (cols.league < 0 || cols.total < 0) return null
  const byClub = new Map()
  // per-club "Total" rows: used when the season rows are incomplete ("?")
  const totals = new Map()
  for (const r of g.slice(h2i + 1)) {
    if (r.some((c) => /Total/i.test(clean(c)))) {
      const page = links(r[0] ?? '')[0]?.page
      // career totals ("Total en su carrera") can land under a club cell spanning into them
      if (page && !/Total/i.test(clean(r[0])) && !r.some((c) => /carrera|general|club/i.test(clean(c)))) {
        const t = {}
        for (const k of Object.keys(cols)) t[k] = cols[k] >= 0 ? num(r[cols[k]]) : 0
        totals.set(page, t)
      }
      continue
    }
    const clubCell = r[0] ?? ''
    // later stints often repeat the club as plain text; join them with the linked entry of that name
    const text = clean(clubCell)
    const linked = links(clubCell)[0]
    const same = [...byClub.values()].find((e) => e.club === text || e.page === text)
    const club = linked ?? (same ? { name: same.club, page: same.page } : text ? { name: text, page: text } : null)
    if (!club) continue
    const e = byClub.get(club.page) ?? { club: club.name, page: club.page, arg: ARG.test(clubCell) || isArgClub(club.page), league: 0, cups: 0, intl: 0, total: 0 }
    for (const k of Object.keys(cols)) if (cols[k] >= 0) e[k] += num(r[cols[k]])
    byClub.set(club.page, e)
  }
  for (const [page, t] of totals) {
    const e = byClub.get(page)
    if (e && t.total >= e.total) for (const k of Object.keys(cols)) e[k] = Math.max(e[k], t[k])
  }
  return [...byClub.values()]
}
