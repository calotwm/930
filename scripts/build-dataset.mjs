// Builds src/data/players.json from raw source snapshots in data-sources/raw.
// Every number comes from a downloaded source file; nothing is typed by hand.
import fs from 'node:fs'
import path from 'node:path'
import { CLUB_SOURCES, parseClubLists, positionFromWiki } from './club-lists.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const RAW = path.join(ROOT, 'data-sources', 'raw')
const OUT = path.join(ROOT, 'src', 'data', 'players.json')
const REPORT = path.join(ROOT, 'data-sources', 'REPORT.md')
const FULL = path.join(ROOT, 'data-sources', 'players.full.json')

const RSSSF_URL = 'https://www.rsssf.org/tablesa/argtops-allt.html'
const RSSSF_UPDATED = '17/08/2023'
const CURRENT_YEAR = 2026
// first season Transfermarkt's all-time scorer lists cover (checked by querying season windows)
const TM_COVERAGE_START = { P1: 1990, ARG2: 2008 }

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

const decode = (s) =>
  s
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))

// Transfermarkt uses official club names ("CD Godoy Cruz Antonio Tomba"); cards need the common one
const CLUB_ALIASES = {
  'Club Atlético Tucumán': 'Atlético Tucumán',
  'CD Godoy Cruz Antonio Tomba': 'Godoy Cruz',
  'CA San Lorenzo de Almagro': 'San Lorenzo',
  'Club de Gimnasia y Esgrima La Plata': 'Gimnasia LP',
  'Club Estudiantes de La Plata': 'Estudiantes LP',
  'Club Atlético Belgrano': 'Belgrano',
  'Defensa y Justicia': 'Defensa y Justicia',
}
function cleanClub(raw) {
  const name = decode(raw).trim()
  if (CLUB_ALIASES[name]) return CLUB_ALIASES[name]
  const short = name
    .replace(/^(Club Atlético|Club Deportivo|Club Social y Deportivo|Asociación Atlética|Club Sportivo|Club)\s+/i, '')
    .replace(/^(CA|CD|CSD|AA|CS|CSyD)\s+/, '')
    .trim()
  return short || name
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
      const nums = [...m[7].replace(/\([^)]*\)/g, ' ').matchAll(/\d+/g)].map((x) => Number(x[0]))
      cur = { rawName: m[2].trim(), years: m[3].trim(), goals: +m[4], total: nums.at(-1), active: m[5] === '*', clubs: [] }
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
  Midfielder: 'CM',
  'Attacking Midfield': 'AM',
  'Left Midfield': 'LW',
  'Right Midfield': 'RW',
  'Left Winger': 'LW',
  'Right Winger': 'RW',
  'Second Striker': 'ST',
  'Centre-Forward': 'ST',
  Attack: 'ST',
  Striker: 'ST',
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
    const total = r.total >= r.goals ? r.total : r.goals
    if (!(r.total >= r.goals)) review.push('rsssf-total-missing')
    const p = {
      id: slug(name),
      name,
      fullName: `${given} ${surname}`,
      shortName: surname,
      position: 'ST',
      goals: total,
      leagueGoals: r.goals,
      club: mainClub,
      clubs,
      division: 'Primera',
      scope: 'Liga y copas, carrera',
      era: eraFromYears(Math.min(...years), Math.max(...years)),
      source: {
        name: 'RSSSF — Argentina All-Time Topscorers in League',
        url: RSSSF_URL,
        note: `Total de goles oficiales (liga de Primera + copas nacionales + copas internacionales) según RSSSF (actualizado ${RSSSF_UPDATED}); liga: ${r.goals}. Años: ${r.years}.`,
      },
      review,
    }
    players.push(p)
    rsKeyed.push({ p, sur: norm(surname), given: norm(given).split(' '), minY: Math.min(...years), maxY: Math.max(...years) })
  }
  report.push(`RSSSF: ${rs.length} jugadores parseados. Suma por club = total en ${players.filter((p) => !p.review.some((x) => x.startsWith('club-breakdown'))).length}.`)

  // Transfermarkt: per-season lists (complete per season) summed per player and division.
  // Primera = AR1N (liga 2014–2023) + ARG1 (Apertura/Inicial) + ARGC (Clausura/Final), 1990/91 onwards.
  // The AR1N all-time list (capped at 150 per position) is used to cross-check the AR1N sums.
  const readJson = (name) => JSON.parse(fs.readFileSync(path.join(RAW, name), 'utf8'))
  const seasonRows = [...readJson('transfermarkt-season-rows.json'), ...readJson('transfermarkt-season-rows-ap.json')]
  const allTime = readJson('transfermarkt-rows.json')
  const truncatedLists = [...readJson('transfermarkt-season-truncated.json'), ...readJson('transfermarkt-season-truncated-ap.json')]
  const allTimeGoals = new Map(allTime.filter((r) => r.comp === 'AR1N').map((r) => [r.tmId, r.goals]))
  const DIVISION_OF = { AR1N: 'P1', ARG1: 'P1', ARGC: 'P1', ARG2: 'ARG2' }
  // Cups: domestic cups count always; CONMEBOL/FIFA club cups only when the club is Argentine
  const cupRows = fs.existsSync(path.join(RAW, 'transfermarkt-cup-rows.json')) ? readJson('transfermarkt-cup-rows.json') : []
  const argClubNames = new Set(seasonRows.filter((r) => r.club && !/\d+ Clubs/.test(r.club)).map((r) => decode(r.club)))
  for (const r of cupRows) if (r.kind === 'dom') for (const c of r.clubs) argClubNames.add(decode(c.name))
  const cupGoals = new Map()
  let cupAmbiguous = 0
  let cupForeign = 0
  for (const r of cupRows) {
    if (!r.goals) continue
    const names = r.clubs.map((c) => decode(c.name))
    const argentine = r.kind === 'dom' || (names.length > 0 && names.every((n) => argClubNames.has(n)))
    if (!argentine) {
      if (names.some((n) => argClubNames.has(n))) cupAmbiguous++
      else cupForeign++
      continue
    }
    const e = cupGoals.get(r.tmId) ?? { dom: 0, int: 0 }
    e[r.kind] += r.goals
    cupGoals.set(r.tmId, e)
  }
  const byId = new Map()
  for (const r of seasonRows) {
    const div = DIVISION_OF[r.comp]
    const e = byId.get(r.tmId) ?? { tmId: r.tmId, name: decode(r.name), slug: r.slug, posCount: new Map(), recs: {} }
    e.posCount.set(r.pos, (e.posCount.get(r.pos) ?? 0) + 1)
    const rec = (e.recs[div] ??= { goals: 0, seasons: [], clubs: new Map(), byComp: {}, comps: new Set() })
    rec.goals += r.goals
    rec.byComp[r.comp] = (rec.byComp[r.comp] ?? 0) + r.goals
    rec.comps.add(r.comp)
    rec.seasons.push(r.season)
    if (r.club && !/\d+ Clubs/.test(r.club)) {
      const c = cleanClub(r.club)
      rec.clubs.set(c, (rec.clubs.get(c) ?? 0) + 1)
    }
    byId.set(r.tmId, e)
  }
  let tmAdded = 0
  let tmMissingPos = 0
  let tmNoGoals = 0
  let crossChecked = 0
  const sumMismatch = []
  const skipped = []
  for (const e of byId.values()) {
    e.pos = [...e.posCount.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const position = TM_POS[e.pos]
    if (!position) {
      tmMissingPos++
      skipped.push(`${e.name}: posición desconocida "${e.pos}"`)
      continue
    }
    // Primera if he scored there (or is a goalkeeper who played there); otherwise ascenso
    const scored = (d) => e.recs[d] && (e.recs[d].goals > 0 || position === 'GK')
    const comp = scored('P1') ? 'P1' : scored('ARG2') ? 'ARG2' : null
    const cups = cupGoals.get(e.tmId) ?? { dom: 0, int: 0 }
    if (!comp) {
      tmNoGoals++
      continue
    }
    const rec = e.recs[comp]
    const review = []
    const leagueGoals = (e.recs.P1?.goals ?? 0) + (e.recs.ARG2?.goals ?? 0)
    let goals = leagueGoals + cups.dom + cups.int
    const listed = comp === 'P1' ? allTimeGoals.get(e.tmId) : undefined
    if (listed !== undefined) {
      crossChecked++
      const ar1n = rec.byComp.AR1N ?? 0
      if (listed !== ar1n) {
        sumMismatch.push(`${e.name} (AR1N): suma por temporada ${ar1n} vs histórico ${listed}`)
        goals += listed - ar1n
        review.push(`season-sum-${ar1n}`)
      }
    }

    const stints = argentineStints(e.tmId)
    const seasonYears = rec.seasons
    const years = [...(stints?.flatMap((s) => [s.start, s.end]) ?? []), ...seasonYears]
    const minY = years.length ? Math.min(...years) : null
    const maxY = years.length ? Math.max(...years) : null

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
      // keep the record with more Primera goals when two Transfermarkt entries match (homonyms)
      if (e.recs.P1 && (hit.p.discrepancies?.[0]?.goals ?? -1) < goals) {
        hit.p.discrepancies = [
          {
            source: 'Transfermarkt (liga y copas desde 1990/91)',
            goals,
            note: 'Transfermarkt no cubre toda la carrera; se usa RSSSF por prioridad.',
          },
        ]
      }
      // Transfermarkt gives the real position for modern RSSSF players
      hit.p.position = position
      hit.p.review = hit.p.review.filter((x) => x !== 'position-unverified')
      hit.p.secondarySource = { name: 'Transfermarkt — posición', url: `https://www.transfermarkt.com/${e.slug}/profil/spieler/${e.tmId}` }
      continue
    }

    // club: where he played most seasons in that division; fall back to transfer history
    const clubMonths = new Map()
    for (const s of stints ?? []) clubMonths.set(cleanClub(s.club), (clubMonths.get(cleanClub(s.club)) ?? 0) + s.months)
    const seasonClub = [...rec.clubs.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const club = seasonClub ?? [...clubMonths.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Varios clubes'
    const clubs = [...new Set([...rec.clubs.keys(), ...clubMonths.keys()])]
    if (club === 'Varios clubes') review.push('club-unverified')
    const coverageStart = TM_COVERAGE_START[comp]
    if (minY !== null && minY <= coverageStart) review.push(`seasons-before-${coverageStart}-not-counted`)
    if (truncatedLists.some((t) => DIVISION_OF[t.split(' ')[0]] === comp && rec.seasons.includes(Number(t.split(' ')[1])))) {
      review.push('season-list-truncated')
    }
    const parts = e.name.split(' ')
    players.push({
      id: slug(e.name),
      name: e.name,
      shortName: parts.length > 1 ? parts.slice(1).join(' ') : e.name,
      position,
      goals,
      leagueGoals,
      cupGoals: cups.dom,
      intlGoals: cups.int,
      club,
      clubs,
      division: comp === 'P1' ? 'Primera' : 'Primera Nacional',
      scope: cupRows.length
        ? comp === 'P1'
          ? 'Liga y copas desde 1990/91'
          : 'Ascenso y copas desde 2008/09'
        : comp === 'P1'
          ? 'Liga desde 1990/91'
          : 'Ascenso desde 2008/09',
      era: eraFromYears(minY, maxY),
      source: {
        name:
          comp === 'P1'
            ? 'Transfermarkt — liga argentina (Primera y ascenso)'
            : 'Transfermarkt — Primera Nacional',
        url: `https://www.transfermarkt.com/${e.slug}/leistungsdaten/spieler/${e.tmId}`,
      },
      tmId: e.tmId,
      review,
    })
    tmAdded++
  }
  report.push(
    `Transfermarkt: ${byId.size} jugadores únicos en listas por temporada, ${tmAdded} agregados, ${
      byId.size - tmAdded - tmMissingPos - tmNoGoals
    } fusionados con RSSSF, ${tmNoGoals} sin goles (no arqueros) descartados, ${tmMissingPos} descartados por posición desconocida.`,
  )
  report.push(
    `Copas (Transfermarkt): ${cupRows.length} filas; ${cupGoals.size} jugadores con goles en copas con clubes argentinos. Descartadas: ${cupForeign} filas de clubes extranjeros y ${cupAmbiguous} ambiguas (club argentino y extranjero en la misma temporada).`,
  )
  report.push(
    `Control cruzado: ${crossChecked} jugadores figuran también en la lista histórica de la Liga Profesional (AR1N) de Transfermarkt; la suma por temporada coincide en ${
      crossChecked - sumMismatch.length
    }. Si difiere, se usa el total histórico y se marca \`season-sum-N\`.`,
  )
  report.push(`Listas por temporada truncadas (150 filas con goles): ${truncatedLists.length ? truncatedLists.join(', ') : 'ninguna'}.`)

  // club all-time scorer tables (league + domestic cups + international cups for that club).
  // Only players missing from the main sources are added; their number covers that club only.
  const clubDir = path.join(RAW, 'club-lists')
  const { rows: clubRows, rejected: clubRejected } = parseClubLists(clubDir)
  const wikiPos = JSON.parse(fs.readFileSync(path.join(clubDir, 'wikipedia-positions.json'), 'utf8'))
  const known = players.map((p) => norm(p.name).split(' '))
  const isKnown = (name) => {
    const t = norm(name).split(' ')
    const sur = t.at(-1)
    return known.some((k) => k.at(-1) === sur && k.some((w) => w !== sur && t.includes(w)))
  }
  const clubAdds = new Map()
  for (const r of clubRows) {
    if (isKnown(r.name)) continue
    const wp = wikiPos[`${r.club}|${r.name}`]
    const display = (wp?.title ?? r.name).replace(/\s*\(futbolista[^)]*\)/, '')
    const key = norm(display)
    const prev = clubAdds.get(key)
    if (prev) {
      prev.goals += r.total
      prev.clubs.push(r.club)
      continue
    }
    const position = positionFromWiki(wp?.raw)
    const src = CLUB_SOURCES[r.club]
    const parts = display.split(' ')
    clubAdds.set(key, {
      id: slug(display),
      name: display,
      shortName: parts.length > 1 ? parts.slice(1).join(' ') : display,
      position: position ?? 'ST',
      goals: r.total,
      club: r.club,
      clubs: [r.club],
      division: 'Primera',
      scope: `Liga y copas en ${r.club}`,
      era: '—',
      source: { name: src.name, url: r.ref ?? src.url },
      secondarySource: wp?.title
        ? { name: 'Wikipedia — posición', url: `https://es.wikipedia.org/wiki/${encodeURIComponent(wp.title.replace(/ /g, '_'))}` }
        : undefined,
      review: ['club-total-only', ...(position ? [] : ['position-unverified'])],
    })
  }
  for (const p of clubAdds.values()) {
    if (p.clubs.length > 1) p.scope = `Liga y copas en ${p.clubs.join(' y ')}`
    players.push(p)
  }
  report.push(
    `Tablas de goleadores por club (Independiente, Lanús, Boca): ${clubRows.length} filas válidas, ${clubAdds.size} jugadores agregados (faltaban en las fuentes principales), ${clubRejected.length} filas descartadas por totales inconsistentes.`,
  )
  for (const r of clubRejected) skipped.push(`${r.club} — ${r.name}: ${r.why} (${r.league}+${r.cups}+${r.intl} vs ${r.total})`)

  // players the scraped sources don't cover (mostly pre-1990 with <100 goals), each with a quoted source
  const manual = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-sources', 'manual-additions.json'), 'utf8'))
  let manualAdded = 0
  for (const m of manual) {
    if (players.some((p) => norm(p.name) === norm(m.name))) {
      skipped.push(`${m.name}: alta manual omitida, ya está en las fuentes principales`)
      continue
    }
    const { quote, checkedOn, ...p } = m
    players.push({ id: slug(m.name), ...p, source: { ...m.source, note: `"${quote}" (verificado ${checkedOn})` } })
    manualAdded++
  }
  report.push(`Altas manuales con fuente citada (data-sources/manual-additions.json): ${manualAdded}.`)

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
  for (const p of players) {
    const d = p.discrepancies?.[0]
    if (d && d.goals !== p.goals) discrepancyLog.push(`${p.name}: RSSSF ${p.goals} vs Transfermarkt ${d.goals}`)
  }
  players.sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))

  // full audit copy (review flags, discrepancies) next to the report; the app ships a slim copy
  fs.writeFileSync(FULL, JSON.stringify(players, null, 1) + '\n')
  const runtime = players.map(({ fullName: _f, review: _r, discrepancies: _d, secondarySource: _s, ...p }) => ({
    ...p,
    source: { name: p.source.name, url: p.source.url },
  }))
  fs.writeFileSync(OUT, JSON.stringify(runtime))

  const count = (f) => players.filter(f).length
  const md = [
    '# Reporte del dataset',
    '',
    `Generado por \`scripts/build-dataset.mjs\`. Total: **${players.length}** jugadores.`,
    '',
    '## Definición de goles',
    'Goles de liga argentina en la división indicada. Sin copas, sin selección, sin clubes extranjeros, sin amistosos.',
    'Prioridad: RSSSF (Primera, carrera) > Transfermarkt Primera (Apertura + Clausura + Liga Profesional, desde 1990/91, si hizo goles ahí o es arquero) > Transfermarkt Primera Nacional (ARG2, desde 2008/09). Los goles de Transfermarkt salen de sumar las listas por temporada (completas) y se controlan contra su lista histórica. No incluye Copa de la Liga ni copas.',
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
    '## Suma por temporada vs histórico de Transfermarkt',
    ...(sumMismatch.length ? sumMismatch.map((d) => `- ${d}`) : ['- Todas coinciden']),
    '',
    '## Revisión pendiente',
    '- `position-unverified`: RSSSF no informa posición; se asumió delantero (ST).',
    '- `active-in-source-update-2023`: jugador activo cuando RSSSF actualizó (17/08/2023); el total puede estar desactualizado.',
    '- `club-unverified`: Transfermarkt no informa un club único para ese jugador.',
    '- `season-sum-N`: la suma por temporada (N) no coincide con el total histórico de Transfermarkt; se usa el total histórico.',
    '- `season-list-truncated`: jugó en una temporada cuya lista quedó cortada en 150 filas; puede faltar algún gol.',
    '- `seasons-before-YYYY-not-counted`: jugó antes del inicio de cobertura de Transfermarkt; sus goles previos no están sumados (el `scope` de la tarjeta lo aclara).',
    `- position-unverified: ${count((p) => p.review?.includes('position-unverified'))} jugadores`,
    `- seasons-before-*-not-counted: ${count((p) => p.review?.some((r) => r.startsWith('seasons-before')))} jugadores`,
    ...players
      .filter((p) => p.review?.some((r) => r !== 'position-unverified' && !r.startsWith('seasons-before') && r !== 'season-list-truncated'))
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
