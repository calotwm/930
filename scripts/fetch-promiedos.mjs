// Weekly goal update from Promiedos scorer tables (top 100 of each Argentine tournament).
// Saves a dated snapshot in data-sources/promiedos/snapshots/ and adds the goals scored since the
// previous snapshot to data-sources/promiedos/goals.json (cumulative per player), which the build
// adds to each player's total. The first run only stores the baseline.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIR = path.join(ROOT, 'data-sources', 'promiedos')
const SNAP = path.join(DIR, 'snapshots')
const GOALS = path.join(DIR, 'goals.json')
const UA = '930-dataset-builder/1.0 (https://github.com/calotwm/930)'

// tournament → league page; `argOnly` keeps only Argentine teams (international cups)
export const LEAGUES = {
  'liga-profesional': { url: 'https://www.promiedos.com.ar/league/liga-profesional/hc' },
  'primera-nacional': { url: 'https://www.promiedos.com.ar/league/primera-nacional/ebj' },
  'copa-argentina': { url: 'https://www.promiedos.com.ar/league/copa-argentina/gea' },
  'primera-b-metro': { url: 'https://www.promiedos.com.ar/league/primera-b-metropolitana/fahh' },
  'federal-a': { url: 'https://www.promiedos.com.ar/league/federal-a/fahi' },
  'primera-c': { url: 'https://www.promiedos.com.ar/league/primera-c/ffjb' },
  'promocional-amateur': { url: 'https://www.promiedos.com.ar/league/promocional-amateur/iage' },
  libertadores: { url: 'https://www.promiedos.com.ar/league/libertadores/bac', argOnly: true },
  sudamericana: { url: 'https://www.promiedos.com.ar/league/conmebol-sudamericana/dij', argOnly: true },
}

// every {id, name, country_id} object in the page data is a team
function teamsIn(o, out = new Map()) {
  if (Array.isArray(o)) for (const v of o) teamsIn(v, out)
  else if (o && typeof o === 'object') {
    if (typeof o.id === 'string' && typeof o.name === 'string' && 'country_id' in o) out.set(o.id, { name: o.name, country: o.country_id })
    for (const v of Object.values(o)) teamsIn(v, out)
  }
  return out
}

// -> [{ name, team, goals }]
export function parseScorers(html, argOnly = false) {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!m) return null
  const data = JSON.parse(m[1]).props?.pageProps?.data
  const table = data?.players_statistics?.tables?.find((t) => /^Goles$/i.test(t.name))
  if (!table) return []
  const teams = teamsIn(data)
  return table.rows
    .map((r) => {
      const o = r.entity?.object ?? {}
      const t = teams.get(o.team_id)
      return { name: o.name, team: t?.name ?? o.team_id, country: t?.country ?? null, goals: Number(r.values?.[0]?.value) || 0 }
    })
    .filter((r) => r.name && r.goals > 0 && (!argOnly || r.country === 'ba'))
    .map(({ country: _c, ...r }) => r)
}

async function get(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (res.ok) return await res.text()
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 3000 * 2 ** i))
  }
  return null
}

const key = (league, r) => `${league}|${r.name}|${r.team}`

// goals scored since `prev`; a lower count means a new tournament started: count it from zero
export function deltas(prev, cur) {
  const before = new Map(prev.map((r) => [r.key, r.goals]))
  return cur.map((r) => ({ ...r, delta: before.has(r.key) && r.goals >= before.get(r.key) ? r.goals - before.get(r.key) : before.has(r.key) ? r.goals : prev.length ? r.goals : 0 })).filter((r) => r.delta > 0)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(SNAP, { recursive: true })
  const today = new Date().toISOString().slice(0, 10)
  const cur = []
  for (const [league, { url, argOnly }] of Object.entries(LEAGUES)) {
    const html = await get(url)
    const rows = html ? parseScorers(html, argOnly) : null
    if (!rows) {
      console.log(`${league}: sin datos (se mantiene la foto anterior de este torneo)`)
      continue
    }
    for (const r of rows) cur.push({ key: key(league, r), league, ...r })
    console.log(`${league}: ${rows.length} goleadores`)
  }
  const snaps = fs.readdirSync(SNAP).filter((f) => f.endsWith('.json')).sort()
  const prevAll = snaps.length ? JSON.parse(fs.readFileSync(path.join(SNAP, snaps.at(-1)), 'utf8')) : []
  // tournaments that failed today keep last week's rows, so they are not read as "new tournament" next week
  const fetched = new Set(cur.map((r) => r.league))
  const snapshot = [...cur, ...prevAll.filter((r) => !fetched.has(r.league))]
  const prev = prevAll.filter((r) => fetched.has(r.league))
  const goals = fs.existsSync(GOALS) ? JSON.parse(fs.readFileSync(GOALS, 'utf8')) : {}
  const added = snaps.length ? deltas(prev, cur) : []
  for (const d of added) {
    const k = `${d.name}|${d.team}`
    goals[k] = { name: d.name, team: d.team, goals: (goals[k]?.goals ?? 0) + d.delta }
  }
  fs.writeFileSync(path.join(SNAP, `${today}.json`), JSON.stringify(snapshot) + '\n')
  fs.writeFileSync(GOALS, JSON.stringify(goals, null, 1) + '\n')
  const total = added.reduce((a, d) => a + d.delta, 0)
  const summary = snaps.length
    ? `Promiedos ${today}: +${total} goles de ${added.length} jugadores desde ${snaps.at(-1).slice(0, 10)}.\n` + added.map((d) => `- ${d.name} (${d.team}, ${d.league}): +${d.delta}`).join('\n')
    : `Promiedos ${today}: foto inicial guardada (${snapshot.length} goleadores); los goles se suman desde la próxima.`
  fs.writeFileSync(path.join(DIR, 'last-summary.md'), summary + '\n')
  console.log(summary)
}
