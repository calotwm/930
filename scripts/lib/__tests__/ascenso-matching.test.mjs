// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  GENERIC,
  createNameIndex,
  eraOverlap,
  nameWithin,
  norm,
  parseEra,
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
})
