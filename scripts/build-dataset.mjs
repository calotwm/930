// Builds src/data/players.json from raw source snapshots in data-sources/raw.
// Every number comes from a downloaded source file; nothing is typed by hand.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const RAW = path.join(ROOT, 'data-sources', 'raw')
const OUT = path.join(ROOT, 'src', 'data', 'players.json')
const REPORT = path.join(ROOT, 'data-sources', 'REPORT.md')

const RSSSF_URL = 'https://www.rsssf.org/tablesa/argtops-allt.html'
const RSSSF_UPDATED = '17/08/2023'
const CURRENT_YEAR = 2026
// first season Transfermarkt's all-time scorer lists cover (checked by querying season windows)
const TM_COVERAGE_START = { AR1N: 2012, ARG2: 2008 }

const norm = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const slug = (s) => norm(s).replace(/ /g, '-')

const LOWER_PARTICLES = new Set(['de', 'la', 'del', 'y'])
function titleCase(upper) {
  return upper
    .toLowerCase()
    .split(' ')
    .map((w, i) => {
      if (i > 0 && LOWER_PARTICLES.has(w)) return w
      return w
        .split(/([-'])/)
        .map((part) => (part.length > 1 || /[a-záéíóúñü]/i.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join('')
    })
    .join(' ')
}

function eraFromYears(minY, maxY) {
  if (!minY) return '—'
  const a = Math.floor(minY / 10) * 10
  const b = Math.floor(maxY / 10) * 10
  return a === b ? `${a}s` : `${a}s–${b}s`
}

// ---------- RSSSF ----------
function parseRsssf() {
  const html = fs.readFileSync(path.join(RAW, 'rsssf-argtops-allt.html'), 'latin1')
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\t/g, '    '))
  const head = /^\s*(?:(\d+)\.)?\s*([A-ZÁÉÍÓÚÑÜ'][A-ZÁÉÍÓÚÑÜ' \-]+,\s*[^()\t]+?)\s*\(([^)]*)\)\s+(\d+)(\*?)\s*(?:\[#\])?\s*(\d+)\s+(.*)$/
  const clubLine = /^\s*(.+?)\s+(\d+)\s+(\d+)/
  const players = []
  let cur = null
  const pushClub = (raw) => {
    const m = raw.match(clubLine)
    if (!m) return
    let [, name, goals] = m
    // "Estudiantes LP (1992-95/2005-07) 57" style rows where only one space precedes the goals
    const tight = name.match(/^(.*?\))\s*(\d+)$/)
    if (tight) {
      name = tight[1]
      goals = tight[2]
    }
    const years = (name.match(/\(([\d\s/\-]+)\)\s*$/) || [])[1] || null
    name = name.replace(/\s*\([\d\s/\-]+\)\s*$/, '').replace(/\s*\([\d\s/\-]+\)/, '').trim()
    cur.clubs.push({ club: name, years, goals: Number(goals) })
  }
  for (const l of lines) {
    if (/^\s*-{10,}/.test(l)) continue
    const m = l.match(head)
    if (m) {
      cur = { rawName: m[2].trim(), years: m[3].trim(), goals: +m[4], active: m[5] === '*', clubs: [] }
      players.push(cur)
      pushClub(m[7])
      continue
    }
    if (cur && /^\s{20,}\S/.test(l) && !/Note|About/.test(l)) pushClub(l)
  }
  return players
}

// ---------- Transfermarkt ----------
const TM_POS = {
  Goalkeeper: 'GK',
  'Centre-Back': 'CB',
  Sweeper: 'CB',
  Defender: 'CB',
  'Left-Back': 'LB',
  'Right-Back': 'RB',
  'Defensive Midfield': 'DM',
  'Central Midfield': 'CM',
  Midfield: 'CM',
  'Attacking Midfield': 'AM',
  'Left Midfield': 'LW',
  'Right Midfield': 'RW',
  'Left Winger': 'LW',
  'Right Winger': 'RW',
  'Second Striker': 'ST',
  'Centre-Forward': 'ST',
  Attack: 'ST',
}

const YOUTH = /\bU\d{2}\b|reserve|res\.|youth|juv|\bII\b|\bB\b$/i
const AR_FLAG = /flagge\/verysmall\/9\.png/

function argentineStints(tmId) {
  const f = path.join(RAW, 'transfermarkt-transfer-history', `${tmId}.json`)
  if (!fs.existsSync(f)) return null
  const { transfers } = JSON.parse(fs.readFileSync(f, 'utf8'))
  const sorted = [...transfers].sort((a, b) => a.dateUnformatted.localeCompare(b.dateUnformatted))
  const stints = []
  sorted.forEach((t, i) => {
    const next = sorted[i + 1]
    const start = Number(t.dateUnformatted.slice(0, 4))
    const endsOpen = !next && !t.to.isSpecial
    const end = next ? Number(next.dateUnformatted.slice(0, 4)) : endsOpen ? CURRENT_YEAR : start
    if (!t.to.isSpecial && AR_FLAG.test(t.to.countryFlag || '') && !YOUTH.test(t.to.clubName)) {
      stints.push({ club: t.to.clubName, start, end, months: next ? Date.parse(next.dateUnformatted) - Date.parse(t.dateUnformatted) : (end - start + 1) * 3e10 })
    }
  })
  // first club of career appears only as "from" of the first transfer
  const first = sorted[0]
  if (first && !first.from.isSpecial && AR_FLAG.test(first.from.countryFlag || '') && !YOUTH.test(first.from.clubName)) {
    const y = Number(first.dateUnformatted.slice(0, 4))
    stints.unshift({ club: first.from.clubName, start: y - 1, end: y, months: 0 })
  }
  return stints
}

function main() {
  const report = []
  const discrepancyLog = []
  const players = []

  // RSSSF primary
  const rs = parseRsssf()
  const rsKeyed = []
  for (const r of rs) {
    const [surU, given] = r.rawName.split(',').map((s) => s.trim())
    const surname = titleCase(surU)
    const name = `${given.split(' ')[0]} ${surname}`
    const clubGoalSum = r.clubs.reduce((s, c) => s + c.goals, 0)
    const years = [...r.years.matchAll(/\d{4}|now/g)].map((m) => (m[0] === 'now' ? 2023 : Number(m[0])))
    const clubs = [...new Set(r.clubs.map((c) => c.club))]
    const mainClub = [...r.clubs].sort((a, b) => b.goals - a.goals)[0]?.club ?? clubs[0]
    const review = ['position-unverified']
    if (clubGoalSum !== r.goals) review.push(`club-breakdown-sum-${clubGoalSum}`)
    if (r.active) review.push('active-in-source-update-2023')
    const p = {
      id: slug(name),
      name,
      fullName: `${given} ${surname}`,
      shortName: surname,
      position: 'ST',
      goals: r.goals,
      club: mainClub,
      clubs,
      division: 'Primera',
      scope: 'Primera, carrera',
      era: eraFromYears(Math.min(...years), Math.max(...years)),
      source: {
        name: 'RSSSF — Argentina All-Time Topscorers in League',
        url: RSSSF_URL,
        note: `Goles de liga en Primera División según RSSSF (actualizado ${RSSSF_UPDATED}). Años: ${r.years}.`,
      },
      review,
    }
    players.push(p)
    rsKeyed.push({ p, sur: norm(surname), given: norm(given).split(' '), minY: Math.min(...years), maxY: Math.max(...years) })
  }
  report.push(`RSSSF: ${rs.length} jugadores parseados. Suma por club = total en ${players.filter((p) => !p.review.some((x) => x.startsWith('club-breakdown'))).length}.`)

  // Transfermarkt
  const rows = JSON.parse(fs.readFileSync(path.join(RAW, 'transfermarkt-rows.json'), 'utf8'))
  const byId = new Map()
  for (const r of rows) {
    const e = byId.get(r.tmId) ?? { ...r, recs: {} }
    e.recs[r.comp] = r
    byId.set(r.tmId, e)
  }
  let tmAdded = 0
  let tmMissingPos = 0
  const skipped = []
  for (const e of byId.values()) {
    const position = TM_POS[e.pos]
    if (!position) {
      tmMissingPos++
      skipped.push(`${e.name}: posición desconocida "${e.pos}"`)
      continue
    }
    const stints = argentineStints(e.tmId)
    const years = stints?.flatMap((s) => [s.start, s.end]) ?? []
    const minY = years.length ? Math.min(...years) : null
    const maxY = years.length ? Math.max(...years) : null

    const rec = e.recs.AR1N ?? e.recs.ARG2
    const comp = e.recs.AR1N ? 'AR1N' : 'ARG2'

    // duplicate with RSSSF? same surname + a given name + overlapping years
    const n = norm(e.name).split(' ')
    const hit = rsKeyed.find(
      (k) =>
        n.join(' ').includes(k.sur) &&
        k.given.some((g) => n.includes(g)) &&
        minY !== null &&
        minY <= k.maxY + 1 &&
        maxY >= k.minY - 1,
    )
    if (hit) {
      if (e.recs.AR1N) {
        hit.p.discrepancies = [
          {
            source: 'Transfermarkt (Primera, AR1N)',
            goals: e.recs.AR1N.goals,
            note: 'Cobertura histórica parcial de Transfermarkt; se usa RSSSF por prioridad.',
          },
        ]
        if (e.recs.AR1N.goals !== hit.p.goals) discrepancyLog.push(`${hit.p.name}: RSSSF ${hit.p.goals} vs Transfermarkt ${e.recs.AR1N.goals}`)
      }
      // Transfermarkt gives the real position for modern RSSSF players
      hit.p.position = position
      hit.p.review = hit.p.review.filter((x) => x !== 'position-unverified')
      hit.p.secondarySource = { name: 'Transfermarkt — posición', url: `https://www.transfermarkt.com/${e.slug}/profil/spieler/${e.tmId}` }
      continue
    }

    const argClubs = stints ? [...new Set(stints.map((s) => s.club))] : []
    const clubMonths = new Map()
    for (const s of stints ?? []) clubMonths.set(s.club, (clubMonths.get(s.club) ?? 0) + s.months)
    let club = [...clubMonths.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const review = []
    if (!club) {
      club = /\d+ Clubs/.test(rec.club || '') ? 'Varios clubes' : rec.club
      if (rec.club && !/\d+ Clubs/.test(rec.club)) argClubs.push(rec.club)
      review.push('club-era-unverified')
    }
    const parts = e.name.split(' ')
    const compName = comp === 'AR1N' ? 'Primera División (AR1N)' : 'Primera Nacional (ARG2)'
    const coverageStart = TM_COVERAGE_START[comp]
    if (minY !== null && minY < coverageStart) review.push(`seasons-before-${coverageStart}-not-counted`)
    players.push({
      id: slug(e.name),
      name: e.name,
      shortName: parts.length > 1 ? parts.slice(1).join(' ') : e.name,
      position,
      goals: rec.goals,
      club,
      clubs: argClubs,
      division: comp === 'AR1N' ? 'Primera' : 'Primera Nacional',
      scope: comp === 'AR1N' ? 'Primera desde 2012/13' : 'Ascenso desde 2008/09',
      era: eraFromYears(minY, maxY),
      source: {
        name: `Transfermarkt — ${compName}, goleadores históricos`,
        url: `https://www.transfermarkt.com/${e.slug}/leistungsdaten/spieler/${e.tmId}/wettbewerb/${comp}`,
        note: `Goles de liga registrados por Transfermarkt en ${compName}, que cubre desde la temporada ${coverageStart}/${String(coverageStart + 1).slice(2)}. No incluye Copa de la Liga ni copas.${
          comp === 'AR1N' && e.recs.ARG2 ? ` En ascenso (ARG2) registra ${e.recs.ARG2.goals}, no sumados.` : ''
        }`,
      },
      secondarySource: {
        name: 'Transfermarkt — historial de transferencias (clubes y época)',
        url: `https://www.transfermarkt.com/${e.slug}/transfers/spieler/${e.tmId}`,
      },
      tmId: e.tmId,
      review,
    })
    tmAdded++
  }
  report.push(`Transfermarkt: ${byId.size} jugadores únicos, ${tmAdded} agregados, ${byId.size - tmAdded - tmMissingPos} fusionados con RSSSF, ${tmMissingPos} descartados por posición desconocida.`)

  // unique ids
  const seen = new Map()
  for (const p of players) {
    const n = (seen.get(p.id) ?? 0) + 1
    seen.set(p.id, n)
    if (n > 1) p.id = `${p.id}-${p.tmId ?? n}`
  }
  for (const p of players) {
    delete p.tmId
    if (p.review && p.review.length === 0) delete p.review
  }
  players.sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))

  fs.writeFileSync(OUT, JSON.stringify(players, null, 2) + '\n')

  const count = (f) => players.filter(f).length
  const md = [
    '# Reporte del dataset',
    '',
    `Generado por \`scripts/build-dataset.mjs\`. Total: **${players.length}** jugadores.`,
    '',
    '## Definición de goles',
    'Goles de liga argentina en la división indicada. Sin copas, sin selección, sin clubes extranjeros, sin amistosos.',
    'Prioridad: RSSSF (Primera, carrera) > Transfermarkt Primera (AR1N) > Transfermarkt Primera Nacional (ARG2).',
    '',
    '## Resumen',
    ...report.map((r) => `- ${r}`),
    `- Primera: ${count((p) => p.division === 'Primera')} · Primera Nacional: ${count((p) => p.division === 'Primera Nacional')}`,
    `- Por posición: ${['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'].map((x) => `${x} ${count((p) => p.position === x)}`).join(' · ')}`,
    `- Marcados para revisión: ${count((p) => p.review?.length)}`,
    '',
    '## Discrepancias entre fuentes (se usa RSSSF)',
    ...(discrepancyLog.length ? discrepancyLog.map((d) => `- ${d}`) : ['- Ninguna']),
    '',
    '## Revisión pendiente',
    '- `position-unverified`: RSSSF no informa posición; se asumió delantero (ST).',
    '- `active-in-source-update-2023`: jugador activo cuando RSSSF actualizó (17/08/2023); el total puede estar desactualizado.',
    '- `club-era-unverified`: Transfermarkt no devolvió clubes argentinos en el historial.',
    '- `seasons-before-YYYY-not-counted`: jugó antes del inicio de cobertura de Transfermarkt; sus goles previos no están sumados (el `scope` de la tarjeta lo aclara).',
    `- position-unverified: ${count((p) => p.review?.includes('position-unverified'))} jugadores`,
    `- seasons-before-*-not-counted: ${count((p) => p.review?.some((r) => r.startsWith('seasons-before')))} jugadores`,
    ...players
      .filter((p) => p.review?.some((r) => r !== 'position-unverified' && !r.startsWith('seasons-before')))
      .map((p) => `- ${p.name}: ${p.review.join(', ')}`),
    '',
    '## Descartados',
    ...(skipped.length ? skipped.map((s) => `- ${s}`) : ['- Ninguno']),
    '',
  ].join('\n')
  fs.writeFileSync(REPORT, md)
  console.log(report.join('\n'))
  console.log('players', players.length)
}

main()
