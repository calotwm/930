// Downloads archived copies (Internet Archive) of Solo Ascenso's scorer pages for the divisions no other
// source covers (Primera B Metropolitana, Primera C, Primera D / Promocional Amateur, Federal A) and keeps
// only the scorer rows: data-sources/raw/soloascenso/<division>.json = [{ timestamp, rows: [[name, team, goals]] }].
// Resumable: snapshots already stored are skipped.
import fs from 'node:fs'
import path from 'node:path'

export const SA_DIVISIONS = {
  'primera-b': { id: 2, label: 'Primera B Metropolitana' },
  'primera-c': { id: 3, label: 'Primera C' },
  'promocional-amateur': { id: 4, label: 'Primera D / Promocional Amateur' },
  'federal-a': { id: 5, label: 'Torneo Federal A' },
}
export const saUrl = (div) => `https://www.soloascenso.com.ar/goleadores/${div}/${SA_DIVISIONS[div].id}`

const DIR = path.resolve(import.meta.dirname, '..', 'data-sources', 'raw', 'soloascenso')
const UA = '930-dataset-builder/1.0 (https://github.com/calotwm/930)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (res.ok) return await res.text()
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
    const stored = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []
    const have = new Set(stored.map((s) => s.timestamp))
    const cdx = await get(
      `https://web.archive.org/cdx/search/cdx?url=soloascenso.com.ar/goleadores/${div}/${SA_DIVISIONS[div].id}&output=json&fl=timestamp&filter=statuscode:200&collapse=timestamp:8`,
    )
    const stamps = cdx ? JSON.parse(cdx).slice(1).map((r) => r[0]) : []
    console.log(`${div}: ${stamps.length} copias`)
    for (const ts of stamps.filter((t) => !have.has(t))) {
      const html = await get(`https://web.archive.org/web/${ts}id_/${saUrl(div)}`)
      const rows = html ? parseScorers(html) : []
      if (rows.length) stored.push({ timestamp: ts, rows })
      console.log(`  ${ts}: ${rows.length} filas`)
      await sleep(2000)
    }
    stored.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    fs.writeFileSync(file, JSON.stringify(stored) + '\n')
  }
}
