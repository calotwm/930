// Downloads each dataset player's Wikipedia page (by name) and keeps only its club statistics table
// in data-sources/raw/wikipedia/player-stats.json: { [name]: { title, table } | null }.
// Resumable: names already in the file are skipped unless --refresh is passed.
import fs from 'node:fs'
import path from 'node:path'
import { extractStatsTable } from './player-stats.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'data-sources', 'raw', 'wikipedia', 'player-stats.json')
const UA = '930-dataset-builder/1.0 (https://github.com/calotwm/930)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function raw(title) {
  for (let hop = 0; hop < 3; hop++) {
    const url = `https://es.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replace(/ /g, '_'))}&action=raw`
    let res
    for (let wait = 2000; ; wait *= 2) {
      res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (res.status !== 429 || wait > 64000) break
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

const players = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-sources', 'players.full.json'), 'utf8'))
const out = fs.existsSync(OUT) && !process.argv.includes('--refresh') ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
// players whose total may still miss cups go first
const maybeShort = (p) => /desde|Liga \(Primera\)|parcial/.test(p.scope)
const todo = [...new Set([...players.filter(maybeShort), ...players].map((p) => p.name))].filter((n) => !(n in out))
console.log(`${todo.length} por bajar`)
let done = 0
async function worker() {
  while (todo.length) {
    const name = todo.shift()
    const page = await raw(name)
    // only footballer pages count; a disambiguation or unrelated page is stored as null
    const ok = page && /\{\{\s*Ficha de (futbolista|deportista)/i.test(page.text)
    const table = ok ? extractStatsTable(page.text) : null
    out[name] = table ? { title: page.title, table } : null
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
