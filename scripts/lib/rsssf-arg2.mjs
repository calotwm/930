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
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, ' ')
    if (!line.trim()) continue
    const m = line.match(ROW)
    // a degenerate match with a blank name happens when the regex backtracks whitespace into the
    // name group for a line with no name at all (e.g. "(Sin Nombre)  10") — treat as malformed, not
    // a real row.
    const trimmedName = m?.[3].trim()
    if (m && trimmedName) {
      const [, s, tournament, , team, goals] = m
      if (s) season = s
      if (!season) {
        rejected.push(rawLine)
        continue
      }
      rows.push({ season, startYear: startYearFromSeason(season), tournament: tournament ?? null, name: trimmedName, team: team.trim(), goals: Number(goals) })
      continue
    }
    if (CANDIDATE_ROW.test(line)) rejected.push(rawLine)
    // else: header/footer/notes prose — silently ignored, not a row and not malformed
  }
  return { rows, rejected }
}

export function aggregateArg2(rows) {
  const byName = new Map()
  for (const r of rows) {
    const key = norm(r.name)
    const e = byName.get(key) ?? { name: r.name, teams: [], goals: 0, minYear: r.startYear, maxYear: r.startYear }
    e.goals += r.goals
    e.teams.push(r.team)
    e.minYear = Math.min(e.minYear, r.startYear)
    e.maxYear = Math.max(e.maxYear, r.startYear)
    byName.set(key, e)
  }
  return [...byName.values()].map((e) => ({ name: e.name, teams: e.teams, years: [e.minYear, e.maxYear], extraGoals: e.goals }))
}
