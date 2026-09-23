// Parses club all-time scorer tables saved in data-sources/raw/club-lists.
// Each row: goals for that club in league + domestic cups + international cups.
import fs from 'node:fs'
import path from 'node:path'

const clean = (s) => (s || '').replace(/\{\{[^}]*\}\}/g, '').replace(/<[^>]*>/g, '').replace(/'''?/g, '').trim()
const link = (s) => {
  const m = s.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/)
  return m ? { page: m[1].trim(), name: (m[2] || m[1]).replace(/\s*\(futbolista[^)]*\)/, '').trim() } : null
}
const num = (s) => {
  const m = clean(s).match(/^\d+/)
  return m ? +m[0] : 0
}
// wiki table rows -> cells (cells start with "|" or "!" on new lines, or are separated by "||" / "!!")
function rowsOf(table) {
  return table
    .split(/\n\|-[^\n]*/)
    .slice(1)
    .map((r) =>
      ('\n' + r)
        .split(/\|\||!!|\n[|!]/)
        .slice(1)
        .map((c) => c.replace(/^\s*(style|align|bgcolor|rowspan|colspan)[^|\n]*\|(?!\|)/, '').trim()),
    )
}

export const CLUB_SOURCES = {
  Independiente: {
    name: 'Wikipedia — Anexo:Goleadores del Club Atlético Independiente (tabla histórica)',
    url: 'https://es.wikipedia.org/wiki/Anexo:Goleadores_del_Club_Atl%C3%A9tico_Independiente',
  },
  Lanús: {
    name: 'Museo Granate (Club Atlético Lanús), vía Wikipedia — Anexo:Goleadores del Club Atlético Lanús',
    url: 'https://es.wikipedia.org/wiki/Anexo:Goleadores_del_Club_Atl%C3%A9tico_Lan%C3%BAs',
  },
  'Boca Juniors': {
    name: 'Historia de Boca Juniors — goleadores en torneos oficiales',
    url: 'https://historiadeboca.com.ar/records-jugadores/50/1/0/1905/2026/6/0/0.html',
  },
}

export function parseClubLists(dir) {
  const rows = []
  const rejected = []
  {
    const s = fs.readFileSync(path.join(dir, 'independiente-wikipedia.txt'), 'utf8')
    const sec = s.slice(s.indexOf('=== Tabla histórica ==='), s.indexOf('== Véase también'))
    const tbl = sec.slice(sec.indexOf('{|'), sec.lastIndexOf('|}'))
    for (const r of rowsOf(tbl)) {
      const li = r.findIndex((c) => /\[\[/.test(c))
      if (li < 0) continue
      const [league, cups, intl, total] = r.slice(li + 1, li + 5).map(num)
      const row = { club: 'Independiente', ...link(r[li]), league, cups, intl, total }
      if (!total || league + cups + intl !== total) rejected.push({ ...row, why: 'liga + copas + internacional no suman el total' })
      else rows.push(row)
    }
  }
  {
    const s = fs.readFileSync(path.join(dir, 'lanus-wikipedia.txt'), 'utf8')
    const sec = s.slice(s.indexOf('== Máximos goleadores de la historia =='), s.indexOf('== Goleadores por competición'))
    const i = sec.indexOf('{| class="sortable"')
    const tbl = sec.slice(i, sec.indexOf('\n|}', i))
    for (const r of rowsOf(tbl)) {
      const li = r.findIndex((c) => /\[\[/.test(c))
      if (li < 0) continue
      const [total, league, intl, cups] = r.slice(li + 1, li + 5).map(num)
      const ref = (r.join(' ').match(/museogranate\.clublanus\.com\/jugadores\/[a-z0-9-]+/) || [])[0]
      const row = { club: 'Lanús', ...link(r[li]), total, league, intl, cups, ref: ref ? `https://${ref}` : null }
      const parts = league + cups + intl
      if (!total || (parts !== 0 && parts !== total)) rejected.push({ ...row, why: 'liga + copas + internacional no suman el total' })
      else rows.push(row)
    }
  }
  {
    const b = fs.readFileSync(path.join(dir, 'boca-historiadeboca-top50.html'), 'utf8')
    for (const m of b.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
      const c = m[0]
        .replace(/<[^>]*>/g, '|')
        .replace(/\s+/g, ' ')
        .replace(/\|[\s|]*/g, '|')
        .split('|')
        .filter(Boolean)
      if (!/^\d+º$/.test(c[0] || '')) continue
      rows.push({ club: 'Boca Juniors', name: c[1].trim(), page: null, total: +c[3] })
    }
  }
  return { rows, rejected }
}

// Wikipedia infobox "posición" text -> normalized position
export function positionFromWiki(raw) {
  if (!raw) return null
  const t = raw
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .toLowerCase()
  if (/arquero|guardameta|portero/.test(t)) return 'GK'
  if (/lateral izquierdo/.test(t)) return 'LB'
  if (/lateral derecho/.test(t)) return 'RB'
  if (/^\s*(defens|zaguero|marcador central|líbero)/.test(t)) return 'CB'
  if (/enganche|playmaker|mediapunta/.test(t)) return 'AM'
  if (/^\s*(centrocampista|mediocampista|volante|medio)/.test(t)) return 'CM'
  if (/extremo izquierdo|puntero izquierdo/.test(t)) return 'LW'
  if (/extremo derecho|puntero derecho|wing/.test(t)) return 'RW'
  if (/delantero|centrodelantero|ariete/.test(t)) return 'ST'
  return null
}
