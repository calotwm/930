// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  ADDABLE_SCOPES,
  GENERIC,
  createNameIndex,
  eraOverlap,
  namesakesOf,
  nameWithin,
  norm,
  parseEra,
  resolveAscensoEntry,
  sameClub,
  words,
} from '../ascenso-matching.mjs'

describe('norm', () => {
  it.each([
    ['José Pérez', 'jose perez'],
    ['  Multiple   Spaces  ', 'multiple spaces'],
    ["O'Brien-Smith", 'o brien smith'],
    ['ÑOÑO ÁÉÍÓÚ', 'nono aeiou'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(norm(input)).toBe(expected)
  })
})

describe('words / GENERIC', () => {
  it('filters generic club tokens and short words', () => {
    expect(words('Club Atlético River Plate')).toEqual(['river', 'plate'])
  })

  it('filters a different set of generic tokens (triangulation)', () => {
    expect(words('CA Boca Juniors')).toEqual(['boca', 'juniors'])
  })

  it('keeps GENERIC as a Set usable for membership checks', () => {
    expect(GENERIC.has('club')).toBe(true)
    expect(GENERIC.has('river')).toBe(false)
  })
})

describe('sameClub', () => {
  it('matches when a significant token overlaps', () => {
    expect(sameClub(['River Plate'], ['Club Atlético River Plate'])).toBe(true)
  })

  it('does not match when clubs share no significant token', () => {
    expect(sameClub(['Boca Juniors'], ['River Plate'])).toBe(false)
  })
})

describe('nameWithin', () => {
  it('is true when the shorter name is contained in the longer one with the same surname', () => {
    expect(nameWithin('Juan Pizzuti', 'Juan José Pizzuti')).toBe(true)
  })

  it('is false for different people entirely (triangulation)', () => {
    expect(nameWithin('Diego Maradona', 'Diego Simeone')).toBe(false)
  })
})

describe('createNameIndex', () => {
  it('reports a seeded name as known (full-name self-match)', () => {
    const idx = createNameIndex(['Juan Pérez'])
    expect(idx.isKnown('Juan Pérez')).toBe(true)
  })

  it('reports a same-surname-only name as NOT known (surname alone is not enough)', () => {
    const idx = createNameIndex(['Juan Pérez'])
    expect(idx.isKnown('Diego Pérez')).toBe(false)
  })

  it('reports a name added later as known once add() is called', () => {
    const idx = createNameIndex(['Juan Pérez'])
    expect(idx.isKnown('Carlos Gómez')).toBe(false)
    idx.add('Carlos Gómez')
    expect(idx.isKnown('Carlos Gómez')).toBe(true)
  })
})

describe('parseEra', () => {
  it.each([
    ['1990s–2000s', [1990, 2009]],
    ['1990s', [1990, 1999]],
    ['—', null],
  ])('parses %s to %s', (input, expected) => {
    expect(parseEra(input)).toEqual(expected)
  })
})

describe('eraOverlap', () => {
  it('is true when years fall within the era plus slack', () => {
    expect(eraOverlap([1988, 1992], '1990s', 1)).toBe(true)
  })

  it('is false when years fall well outside the era (triangulation)', () => {
    expect(eraOverlap([1970, 1975], '1990s', 1)).toBe(false)
  })

  it('is false when era is unknown ("—")', () => {
    expect(eraOverlap([1990, 1995], '—')).toBe(false)
  })

  it('is false when years is null', () => {
    expect(eraOverlap(null, '1990s')).toBe(false)
  })

  it('is true when years end right before the era starts and slack covers the gap', () => {
    // years [1985,1989] end 1989, era '1990s' parses to [1990,1999]; slack=1 bridges the 1-year gap.
    expect(eraOverlap([1985, 1989], '1990s', 1)).toBe(true)
  })

  it('is false when years end right before the era starts and slack is 0 (boundary, no bridge)', () => {
    expect(eraOverlap([1985, 1989], '1990s', 0)).toBe(false)
  })

  it('is true when years start right after the era ends and slack covers the gap', () => {
    // years [2000,2005] start 2000, era '1990s' parses to [1990,1999]; slack=1 bridges the 1-year gap.
    expect(eraOverlap([2000, 2005], '1990s', 1)).toBe(true)
  })

  it('is false when years start right after the era ends and slack is 0 (boundary, no bridge)', () => {
    expect(eraOverlap([2000, 2005], '1990s', 0)).toBe(false)
  })
})

describe('namesakesOf', () => {
  it('finds a player sharing the surname and one other name token (namesake)', () => {
    const players = [{ name: 'Juan Carlos Pérez', clubs: ['River Plate'], era: '1990s' }]
    expect(namesakesOf('Carlos Pérez', players)).toEqual([players[0]])
  })

  it('excludes an exact-name match from the namesake list', () => {
    const players = [{ name: 'Juan Pérez', clubs: ['River Plate'], era: '1990s' }]
    expect(namesakesOf('Juan Pérez', players)).toEqual([])
  })
})

describe('resolveAscensoEntry', () => {
  it('merges on exact name + club overlap (no era overlap): non-eraOnly merge', () => {
    // era '1970s' vs entry.years [2010,2012] does not overlap, isolating the club-overlap path
    const players = [{ name: 'Juan Pérez', clubs: ['River Plate'], era: '1970s', scope: 'Liga desde 1990/91' }]
    const entry = { name: 'Juan Pérez', teams: ['River Plate'], years: [2010, 2012], extraGoals: 5 }
    const result = resolveAscensoEntry(entry, players, { canAddGoals: () => true })
    expect(result.action).toBe('merge')
    expect(result.target).toBe(players[0])
    expect(result.eraOnly).toBeFalsy()
  })

  it('merges on exact name + era overlap only (no club overlap): eraOnly merge', () => {
    const players = [{ name: 'Juan Pérez', clubs: ['Boca Juniors'], era: '1990s', scope: 'Liga desde 1990/91' }]
    const entry = { name: 'Juan Pérez', teams: ['River Plate'], years: [1992, 1994], extraGoals: 5 }
    const result = resolveAscensoEntry(entry, players, { canAddGoals: () => true })
    expect(result.action).toBe('merge')
    expect(result.target).toBe(players[0])
    expect(result.eraOnly).toBe(true)
  })

  it('discards with reason club-mismatch: same full name, no shared club, non-overlapping known eras', () => {
    const players = [{ name: 'Juan Pérez', clubs: ['Boca Juniors'], era: '1970s', scope: 'Liga desde 1990/91' }]
    const entry = { name: 'Juan Pérez', teams: ['River Plate'], years: [2010, 2012], extraGoals: 5 }
    const result = resolveAscensoEntry(entry, players, { canAddGoals: () => true })
    expect(result.action).toBe('discard')
    expect(result.reason).toBe('club-mismatch')
  })

  it('discards with reason ambiguous-name when two exact-name candidates both corroborate', () => {
    const players = [
      { name: 'Juan Pérez', clubs: ['River Plate'], era: '1990s', scope: 'Liga desde 1990/91' },
      { name: 'Juan Pérez', clubs: ['Boca Juniors'], era: '1990s', scope: 'Liga desde 1990/91' },
    ]
    const entry = { name: 'Juan Pérez', teams: ['River Plate', 'Boca Juniors'], years: [1992, 1994], extraGoals: 5 }
    const result = resolveAscensoEntry(entry, players, { canAddGoals: () => true })
    expect(result.action).toBe('discard')
    expect(result.reason).toBe('ambiguous-name')
  })

  it('flags with reason already-covered when corroborated but canAddGoals is false', () => {
    const players = [{ name: 'Juan Pérez', clubs: ['River Plate'], era: '1990s', scope: 'Liga desde 1990/91' }]
    const entry = { name: 'Juan Pérez', teams: ['River Plate'], years: [1992, 1994], extraGoals: 5 }
    const result = resolveAscensoEntry(entry, players, { canAddGoals: () => false })
    expect(result.action).toBe('flag')
    expect(result.target).toBe(players[0])
    expect(result.reason).toBe('already-covered')
  })

  it('adds a new player when there is no exact candidate and no namesake', () => {
    const players = [{ name: 'Carlos Gómez', clubs: ['Boca Juniors'], era: '1990s' }]
    const entry = { name: 'Diego Fernández', teams: ['River Plate'], years: [1992, 1994], extraGoals: 3 }
    const result = resolveAscensoEntry(entry, players, { canAddGoals: () => true })
    expect(result.action).toBe('add')
  })

  it('discards with reason possible-duplicate: no exact candidate, but a corroborated namesake', () => {
    // "Carlos Pérez" shares surname + one given-name token with "Juan Carlos Pérez" (namesake, not exact)
    const players = [{ name: 'Juan Carlos Pérez', clubs: ['River Plate'], era: '1990s' }]
    const entry = { name: 'Carlos Pérez', teams: ['River Plate'], years: [1992, 1994], extraGoals: 3 }
    const result = resolveAscensoEntry(entry, players, { canAddGoals: () => true })
    expect(result.action).toBe('discard')
    expect(result.reason).toBe('possible-duplicate')
  })

  it('adds when the only namesake is provably distinct (club-disjoint AND era known-and-disjoint on both sides)', () => {
    const players = [{ name: 'Juan Carlos Pérez', clubs: ['River Plate'], era: '1960s' }]
    const entry = { name: 'Carlos Pérez', teams: ['Boca Juniors'], years: [2010, 2012], extraGoals: 3 }
    const result = resolveAscensoEntry(entry, players, { canAddGoals: () => true })
    expect(result.action).toBe('add')
  })

  it('discards with reason namesake-unproven when the namesake has unknown era on either side', () => {
    const players = [{ name: 'Juan Carlos Pérez', clubs: ['River Plate'], era: '—' }]
    const entry = { name: 'Carlos Pérez', teams: ['Boca Juniors'], years: [2010, 2012], extraGoals: 3 }
    const result = resolveAscensoEntry(entry, players, { canAddGoals: () => true })
    expect(result.action).toBe('discard')
    expect(result.reason).toBe('namesake-unproven')
  })
})

describe('ADDABLE_SCOPES', () => {
  it('pins the exact set of scope strings considered safe to add ascenso-source goals on top of', () => {
    expect(ADDABLE_SCOPES).toBeInstanceOf(Set)
    expect([...ADDABLE_SCOPES].sort()).toEqual(
      [
        'Liga desde 1990/91',
        'Ascenso desde 2008/09',
        'Liga y copas desde 1990/91',
        'Ascenso y copas desde 2008/09',
        'Liga (Primera), carrera',
      ].sort(),
    )
  })
})
