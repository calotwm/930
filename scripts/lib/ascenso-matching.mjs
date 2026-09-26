// Pure, side-effect-free name/club/era matching helpers shared by every ascenso source layer
// (Solo Ascenso recovery, RSSSF ARG2, BDFA). Moved verbatim (behavior-preserving) from
// scripts/build-dataset.mjs; no logic changes versus the original inline closures.

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
