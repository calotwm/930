// Downloads the Wikipedia wikitext snapshots used by scripts/wiki-tables.mjs into
// data-sources/raw/wikipedia, plus each listed player's infobox position (positions.json).
// Run by hand (`node scripts/fetch-wikipedia.mjs`); the dataset build only reads the snapshots.
import fs from 'node:fs'
import path from 'node:path'
import { WIKI_TABLES, parseWikiTables } from './wiki-tables.mjs'

const DIR = path.resolve(import.meta.dirname, '..', 'data-sources', 'raw', 'wikipedia')
const UA = '930-dataset-builder/1.0 (https://github.com/calotwm/930)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function raw(title) {
  for (let hop = 0; hop < 3; hop++) {
    const url = `https://es.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replace(/ /g, '_'))}&action=raw`
    let res
    // back off when rate limited
    for (let wait = 2000; ; wait *= 2) {
      res = await fetch(url, { headers: { 'User-Agent': UA } })
      await sleep(700)
      if (res.status !== 429 || wait > 64000) break
      await sleep(wait)
    }
    if (!res.ok) return null
    const text = await res.text()
    const redirect = text.match(/^#REDIREC\w*\s*\[\[([^\]|#]+)/i)
    if (!redirect) return { title, text }
    title = redirect[1].trim()
  }
  return null
}

fs.mkdirSync(DIR, { recursive: true })
for (const t of WIKI_TABLES) {
  const page = await raw(t.title)
  if (!page) throw new Error(`could not download ${t.title}`)
  fs.writeFileSync(path.join(DIR, t.file), page.text)
  console.log(`${t.file}: ${page.text.length} bytes`)
}

const out = path.join(DIR, 'positions.json')
const positions = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {}
const pages = [...new Set(parseWikiTables(DIR).rows.map((r) => r.page))].filter((p) => !(p in positions))
for (const p of pages) {
  const page = await raw(p)
  const m = page?.text.match(/\|\s*posición\s*=\s*([^\n]+)/i)
  positions[p] = page ? { title: page.title, raw: m ? m[1].trim() : null } : null
  console.log(p, '→', positions[p]?.raw ?? '—')
}
fs.writeFileSync(out, JSON.stringify(positions, null, 1) + '\n')
