// Pure, side-effect-free name/club/era matching helpers shared by every ascenso source layer
// (Solo Ascenso recovery, RSSSF ARG2, BDFA). `norm`, `GENERIC`, `words`, `sameClub`,
// `nameWithin`, and `createNameIndex` are moved verbatim (behavior-preserving) from
// scripts/build-dataset.mjs, with no logic changes versus the original inline closures.
// `parseEra`, `eraOverlap`, and `ADDABLE_SCOPES` are new additions introduced by this change,
// needed by the Phase 3 `resolveAscensoEntry` corroboration rule.

export const norm = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

export const GENERIC = new Set([
  'club',
  'atletico',
  'deportivo',
  'sportivo',
  'social',
  'de',
  'la',
  'y',
  'del',
  'cultural',
  'asociacion',
  'ca',
  'cd',
  'fc',
  'lp',
])

export const words = (s) => norm(s).split(' ').filter((w) => w.length > 2 && !GENERIC.has(w))

export const sameClub = (teams, clubs) => teams.some((t) => clubs.some((c) => words(c).some((w) => words(t).includes(w))))

export const nameWithin = (a, b) => {
  const [s, l] = [norm(a).split(' '), norm(b).split(' ')].sort((x, y) => x.length - y.length)
  return s.at(-1) === l.at(-1) && s.every((w) => l.includes(w))
}

// Same-last-token + at-least-one-other-shared-token rule used to spot namesakes in the dataset.
export function createNameIndex(names = []) {
  const known = names.map((n) => norm(n).split(' '))
  return {
    add(name) {
      known.push(norm(name).split(' '))
    },
    isKnown(name) {
      const t = norm(name).split(' ')
      const sur = t.at(-1)
      return known.some((k) => k.at(-1) === sur && k.some((w) => w !== sur && t.includes(w)))
    },
  }
}

// era strings are produced by eraFromYears: '{decade}s' or '{startDecade}s–{endDecade}s', or '—' when unknown.
export function parseEra(era) {
  if (!era || era === '—') return null
  const decades = [...era.matchAll(/(\d{4})s/g)].map((m) => Number(m[1]))
  if (!decades.length) return null
  return [Math.min(...decades), Math.max(...decades) + 9]
}

export function eraOverlap(years, era, slack = 1) {
  if (!years) return false
  const parsed = parseEra(era)
  if (!parsed) return false
  const [aMin, aMax] = years
  const [eMin, eMax] = parsed
  return aMin <= eMax + slack && aMax >= eMin - slack
}

// Scopes whose totals are known not to already include a given ascenso-source layer's goals,
// so that layer is safe to add on top of them.
export const ADDABLE_SCOPES = new Set([
  'Liga desde 1990/91',
  'Ascenso desde 2008/09',
  'Liga y copas desde 1990/91',
  'Ascenso y copas desde 2008/09',
  'Liga (Primera), carrera',
])

// Players matching the same-last-token + at-least-one-other-shared-token namesake rule (the
// `createNameIndex`/`isKnown` rule), excluding an exact full-name match — used by
// `resolveAscensoEntry` to distinguish a genuine namesake from the same person.
export function namesakesOf(name, players) {
  const t = norm(name).split(' ')
  const sur = t.at(-1)
  return players.filter((p) => {
    if (norm(p.name) === norm(name)) return false
    const k = norm(p.name).split(' ')
    return k.at(-1) === sur && k.some((w) => w !== sur && t.includes(w))
  })
}

const clubsOf = (p) => p.clubs ?? [p.club]
const corroboratesClub = (entry, p) => sameClub(entry.teams, clubsOf(p))
const corroboratesEra = (entry, p) => eraOverlap(entry.years, p.era)
const corroborates = (entry, p) => corroboratesClub(entry, p) || corroboratesEra(entry, p)
// era known and provably non-overlapping (no slack) on both sides — used to prove two namesakes
// are distinct people, not to corroborate a merge (which allows slack).
const erasKnownDisjoint = (entry, p) => entry.years !== null && parseEra(p.era) !== null && !eraOverlap(entry.years, p.era, 0)

// Single decision function shared by every ascenso source layer (Solo Ascenso recovery, RSSSF
// ARG2, BDFA). Never merges on a name match alone: a merge into an existing player requires an
// exact normalized full-name match AND corroboration by club-token overlap or era/season overlap.
// entry = { name, teams: string[], years: [minYear, maxYear] | null, extraGoals }
export function resolveAscensoEntry(entry, players, { canAddGoals }) {
  const exact = players.filter((p) => norm(p.name) === norm(entry.name))
  if (exact.length > 0) {
    const corroborated = exact.filter((p) => corroborates(entry, p))
    if (corroborated.length === 0) return { action: 'discard', reason: 'club-mismatch' }
    if (corroborated.length > 1) return { action: 'discard', reason: 'ambiguous-name' }
    const target = corroborated[0]
    const eraOnly = !corroboratesClub(entry, target) && corroboratesEra(entry, target)
    const action = canAddGoals(target) ? 'merge' : 'flag'
    const reason = action === 'merge' ? (eraOnly ? 'era-overlap' : 'club-overlap') : 'already-covered'
    return { action, target, reason, ...(eraOnly ? { eraOnly: true } : {}) }
  }
  const namesakes = namesakesOf(entry.name, players)
  if (namesakes.length === 0) return { action: 'add', reason: 'unique-name' }
  if (namesakes.some((p) => corroborates(entry, p))) return { action: 'discard', reason: 'possible-duplicate' }
  const allProvablyDistinct = namesakes.every((p) => !corroboratesClub(entry, p) && erasKnownDisjoint(entry, p))
  if (allProvablyDistinct) return { action: 'add', reason: 'namesake-proven-distinct' }
  return { action: 'discard', reason: 'namesake-unproven' }
}
