// Downloads each dataset player's Wikipedia page (by name) and keeps only its club statistics table
// in data-sources/raw/wikipedia/player-stats.json: { [name]: { candidates: [{ title, table, position }] } | null }.
// A disambiguation page is followed to its "(futbolista …)" entries; the build picks the candidate whose
// clubs match. Pages listed in data-sources/wiki-player-pages.json (players no source covers) are
// stored under their title. Resumable: stored names are skipped unless --refresh (all) or --retry-null.
import fs from 'node:fs'
import path from 'node:path'
import { extractStatsTable } from './player-stats.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'data-sources', 'raw', 'wikipedia', 'player-stats.json')
const EXTRA = path.join(ROOT, 'data-sources', 'wiki-player-pages.json')
const UA = '930-dataset-builder/1.0 (https://github.com/calotwm/930)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function raw(title) {
  for (let hop = 0; hop < 3; hop++) {
    const url = `https://es.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replace(/ /g, '_'))}&action=raw`
    let res
    for (let wait = 2000; ; wait *= 2) {
      try {
        res = await fetch(url, { headers: { 'User-Agent': UA } })
      } catch {
        // dropped connection: treat like throttling
        res = { status: 503, ok: false }
      }
      // throttling shows up as 429, 403 or 5xx
      if (!(res.status === 429 || res.status === 403 || res.status >= 500) || wait > 64000) break
      await sleep(wait)
    }
    if (!res.ok) return null
    const text = await res.text()
    const redirect = text.match(/^#REDIREC\S*\s*\[\[([^\]|#]+)/i)
    if (!redirect) return { title, text }
    title = redirect[1].trim()
  }
  return null
}

const isFootballer = (text) => /\{\{\s*Ficha de (futbolista|deportista|entrenador)/i.test(text)
const candidate = (page) => {
  const table = extractStatsTable(page.text)
  const position = page.text.match(/\|\s*posición\s*=\s*([^\n]+)/i)?.[1].trim() ?? null
  return table ? { title: page.title, table, position } : null
}

async function lookup(title) {
  const page = await raw(title)
  if (!page) return null
  if (isFootballer(page.text)) {
    const c = candidate(page)
    return c ? { candidates: [c] } : null
  }
  // disambiguation: follow the links on lines that mention a footballer ("[[X (futbolista)]]" or "[[X]], futbolista argentino")
  const lines = page.text.split('\n').filter((l) => /futbolista/i.test(l))
  const links = [...new Set(lines.flatMap((l) => [...l.matchAll(/\[\[([^\]|#]+)/g)].map((m) => m[1].trim())))].slice(0, 6)
  const candidates = []
  for (const l of links) {
    const p = await raw(l)
    await sleep(250)
    const c = p && isFootballer(p.text) ? candidate(p) : null
    if (c) candidates.push(c)
  }
  return candidates.length ? { candidates } : null
}

const players = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-sources', 'players.full.json'), 'utf8'))
const extra = fs.existsSync(EXTRA) ? JSON.parse(fs.readFileSync(EXTRA, 'utf8')).map((e) => e.page) : []
const out = fs.existsSync(OUT) && !process.argv.includes('--refresh') ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
const retryNull = process.argv.includes('--retry-null')
// extra pages and players whose total may still miss cups go first
const maybeShort = (p) => /desde|Liga \(Primera\)|parcial/.test(p.scope)
// --only "Name A,Name B" refetches just those names
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',')
const todo = only ?? [...new Set([...extra, ...players.filter(maybeShort).map((p) => p.name), ...players.map((p) => p.name)])].filter(
  (n) => !(n in out) || (retryNull && out[n] === null),
)
console.log(`${todo.length} por bajar`)
let done = 0
async function worker() {
  while (todo.length) {
    const name = todo.shift()
    out[name] = await lookup(name)
    if (++done % 200 === 0) {
      fs.writeFileSync(OUT, JSON.stringify(out) + '\n')
      console.log(done)
    }
    await sleep(250)
  }
}
await Promise.all([worker(), worker(), worker()])
fs.writeFileSync(OUT, JSON.stringify(out) + '\n')
console.log('listo', Object.values(out).filter(Boolean).length, 'con tabla')
