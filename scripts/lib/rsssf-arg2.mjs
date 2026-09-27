// Pure parser for data-sources/raw/rsssf-arg2tops.html (RSSSF's Argentina Second Level
// Topscorers list, read as `latin1` text with tags stripped by the caller). One scorer row per
// line: an optional season (carried forward across blank-season tied rows), an optional Ape/Cla
// tournament marker, then "Name (Team)" and a trailing goal count. Never throws — a line that
// looks like a row (parens + trailing digits) but does not fully parse is returned in `rejected`;
// prose (headers, footer, notes) is silently ignored.
import { norm } from './ascenso-matching.mjs'

// season: 4-digit year, optionally "/YY" (e.g. '1986' or '2002/03'); tournament marker requires a
// word boundary so it never swallows the start of a name like "Claudio" (Cla + udio).
const ROW = /^\s*(\d{4}(?:\/\d{2})?)?\s*(?:(Ape|Cla)\b)?\s*([^(]+?)\s*\(([^)]*)\)\s*(\d+)\s*$/
const CANDIDATE_ROW = /\([^)]*\)\s*\d+\s*$/

function startYearFromSeason(season) {
  return Number(season.slice(0, 4))
}

export function parseArg2Tops(text) {
  const rows = []
  const rejected = []
  let season = null
  // like `season`, the tournament marker carries forward across tied continuation rows (blank
  // season, blank marker); an explicit season with no marker resets it (a season without a marker
  // has no Apertura/Clausura split), and an explicit marker on a carried-forward season updates it.
  let tournament = null
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, ' ')
    if (!line.trim()) continue
    const m = line.match(ROW)
    // a degenerate match with a blank name happens when the regex backtracks whitespace into the
    // name group for a line with no name at all (e.g. "(Sin Nombre)  10") — treat as malformed, not
    // a real row.
    const trimmedName = m?.[3].trim()
    if (m && trimmedName) {
      const [, s, marker, , team, goals] = m
      if (s) {
        season = s
        tournament = marker ?? null
      } else if (marker) {
        tournament = marker
      }
      if (!season) {
        rejected.push(rawLine)
        continue
      }
      rows.push({ season, startYear: startYearFromSeason(season), tournament, name: trimmedName, team: team.trim(), goals: Number(goals) })
      continue
    }
    if (CANDIDATE_ROW.test(line)) rejected.push(rawLine)
    // else: header/footer/notes prose — silently ignored, not a row and not malformed
  }
  return { rows, rejected }
}

// A namesake gap this wide almost certainly spans two different people sharing a name rather than
// one career (RSSSF ARG2 covers 1937-2007/08, a 70+ year range); split the group instead of
// merging their goals/teams/years into one entry.
const MAX_NAMESAKE_GAP_YEARS = 15

function buildArg2Entry(groupRows) {
  const years = groupRows.map((r) => r.startYear)
  return {
    name: groupRows[0].name,
    teams: groupRows.map((r) => r.team),
    years: [Math.min(...years), Math.max(...years)],
    extraGoals: groupRows.reduce((sum, r) => sum + r.goals, 0),
  }
}

export function aggregateArg2(rows) {
  const byName = new Map()
  for (const r of rows) {
    const key = norm(r.name)
    if (!byName.has(key)) byName.set(key, [])
    byName.get(key).push(r)
  }
  const entries = []
  for (const groupRows of byName.values()) {
    const sorted = [...groupRows].sort((a, b) => a.startYear - b.startYear)
    let current = []
    for (const r of sorted) {
      if (current.length && r.startYear - current[current.length - 1].startYear > MAX_NAMESAKE_GAP_YEARS) {
        entries.push(buildArg2Entry(current))
        current = []
      }
      current.push(r)
    }
    if (current.length) entries.push(buildArg2Entry(current))
  }
  return entries
}
