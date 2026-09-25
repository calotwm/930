// Downloads archived copies (Internet Archive) of Solo Ascenso's scorer pages for the divisions no other
// source covers (Primera B Metropolitana, Primera C, Primera D / Promocional Amateur, Federal A) and keeps
// only the scorer rows: data-sources/raw/soloascenso/<division>.json = [{ timestamp, rows: [[name, team, goals]] }].
// Resumable: snapshots already stored are skipped.
import fs from 'node:fs'
import path from 'node:path'

// slugs: every path the page has lived under (the site renamed some divisions)
// coveredByTm: Transfermarkt totals already include this division, so it only adds missing players
export const SA_DIVISIONS = {
  'primera-nacional': { id: 1, label: 'Primera Nacional / B Nacional', slugs: ['primera-nacional', 'primera-b-nacional'], coveredByTm: true },
  'primera-b': { id: 2, label: 'Primera B Metropolitana', slugs: ['primera-b', 'primera-b-metropolitana'] },
  'primera-c': { id: 3, label: 'Primera C' },
  'promocional-amateur': { id: 4, label: 'Primera D / Promocional Amateur' },
  'federal-a': { id: 5, label: 'Torneo Federal A' },
  'federal-b': { id: 6, label: 'Torneo Federal B / Regional Amateur', slugs: ['federal-b', 'regional-amateur'] },
  'federal-c': { id: 7, label: 'Torneo Federal C' },
}
const slugsOf = (div) => SA_DIVISIONS[div].slugs ?? [div]
export const saUrl = (div) => `https://www.soloascenso.com.ar/goleadores/${(SA_DIVISIONS[div].slugs ?? [div])[0]}/${SA_DIVISIONS[div].id}`

const DIR = path.resolve(import.meta.dirname, '..', 'data-sources', 'raw', 'soloascenso')
const UA = '930-dataset-builder/1.0 (https://github.com/calotwm/930)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (res.ok) {
        // older pages are Windows-1252, newer ones UTF-8
        const bytes = new Uint8Array(await res.arrayBuffer())
        try {
          return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
        } catch {
          return new TextDecoder('windows-1252').decode(bytes)
        }
      }
      if (res.status === 404) return null
    } catch {
      // archive.org drops connections now and then
    }
    await sleep(3000 * 2 ** i)
  }
  return null
}

// "#|Jugador|Equipo|Goles|1|Name|Team|14|2|…" -> [[name, team, goals]]
export function parseScorers(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, '|')
    .replace(/\s+/g, ' ')
    .replace(/(\|\s*)+/g, '|')
  const i = text.indexOf('|#|Jugador|Equipo|Goles|')
  if (i < 0) return []
  const cells = text.slice(i + '|#|Jugador|Equipo|Goles|'.length).split('|')
  const rows = []
  for (let k = 0; k + 3 < cells.length && /^\d+$/.test(cells[k].trim()); k += 4) {
    const goals = Number(cells[k + 3].trim())
    if (!Number.isFinite(goals)) break
    rows.push([cells[k + 1].trim(), cells[k + 2].trim(), goals])
  }
  return rows
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(DIR, { recursive: true })
  for (const div of Object.keys(SA_DIVISIONS)) {
    const file = path.join(DIR, `${div}.json`)
    // copies saved with broken accents (decoded with the wrong charset) are downloaded again
    const stored = (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []).filter((s) => !JSON.stringify(s.rows).includes('�'))
    const have = new Set(stored.map((s) => s.timestamp))
    const stamps = []
    for (const sl of slugsOf(div)) {
      const url = `soloascenso.com.ar/goleadores/${sl}/${SA_DIVISIONS[div].id}`
      const cdx = await get(`https://web.archive.org/cdx/search/cdx?url=${url}&output=json&fl=timestamp&filter=statuscode:200&collapse=timestamp:8`)
      for (const [ts] of cdx ? JSON.parse(cdx).slice(1) : []) if (!stamps.some((x) => x.ts.slice(0, 8) === ts.slice(0, 8))) stamps.push({ ts, url })
    }
    console.log(`${div}: ${stamps.length} copias`)
    for (const { ts, url } of stamps.filter((x) => !have.has(x.ts))) {
      const html = await get(`https://web.archive.org/web/${ts}id_/https://www.${url}`)
      const rows = html ? parseScorers(html) : []
      if (rows.length) stored.push({ timestamp: ts, rows })
      console.log(`  ${ts}: ${rows.length} filas`)
      await sleep(2000)
    }
    stored.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    fs.writeFileSync(file, JSON.stringify(stored) + '\n')
  }
}
