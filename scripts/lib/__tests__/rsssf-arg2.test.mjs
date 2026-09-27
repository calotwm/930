// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { aggregateArg2, parseArg2Tops } from '../rsssf-arg2.mjs'

// Inline fixture mirroring the real data-sources/raw/rsssf-arg2tops.html <pre> text (after tag
// stripping), covering: plain year seasons, season carry-forward across blank-season tied rows,
// the '1986    Ape' single-year-plus-marker spacing edge case, slash-year seasons with Ape/Cla
// tournament markers on the same and following line, a repeated name across two tournaments of the
// same season (aggregation), footer/notes prose (ignored, not rejected), and one malformed row
// (parens + trailing digits but no name text) that must land in `rejected` instead of throwing.
const FIXTURE = `

Season      Top scorer/Team                             goals

1937        Ernesto Scandone (Estudiantes de BA)        18
1938        Armando Adán (Sp.Acassuso)                  28
1967        Roberto Parodi (Defensores de Belgrano)     12
            José Solari (Almagro)                       12
            Albino Valentini (Almagro)                  12
1986    Ape Héctor Scotta (Nueva Chicago)               14
2002/03 Ape Daniel Giménez (Godoy Cruz de Mza)          13
            Cristian Torres (Quilmes)                   13
        Cla Matías Gigli (Godoy Cruz de Mza)            12
2006/07 Ape Ismael Blanco (Olimpo)                      18
        Cla Ismael Blanco (Olimpo)                      10
            (Sin Nombre)                                10

Notes:
Ape means Torneo Apertura, and Cla means Torneo Clausura

About this document
Prepared and maintained by Mariano Buren for the Rec.Sport.Soccer Statistics Foundation
`

describe('parseArg2Tops', () => {
  it('parses plain year-season rows into { season, startYear, tournament, name, team, goals }', () => {
    const { rows } = parseArg2Tops(FIXTURE)
    expect(rows[0]).toEqual({ season: '1937', startYear: 1937, tournament: null, name: 'Ernesto Scandone', team: 'Estudiantes de BA', goals: 18 })
  })

  it('carries the season forward across blank-season tied rows (triangulation: three rows share season 1967)', () => {
    const { rows } = parseArg2Tops(FIXTURE)
    const tied = rows.filter((r) => r.season === '1967')
    expect(tied).toHaveLength(3)
    expect(tied.map((r) => r.name)).toEqual(['Roberto Parodi', 'José Solari', 'Albino Valentini'])
    expect(tied.every((r) => r.goals === 12)).toBe(true)
  })

  it('handles the "1986    Ape" spacing edge case: a plain 4-digit year directly followed by a tournament marker', () => {
    const { rows } = parseArg2Tops(FIXTURE)
    const row = rows.find((r) => r.season === '1986')
    expect(row).toEqual({ season: '1986', startYear: 1986, tournament: 'Ape', name: 'Héctor Scotta', team: 'Nueva Chicago', goals: 14 })
  })

  it('captures Ape/Cla tournament markers on slash-year seasons, including a marker-only continuation line', () => {
    const { rows } = parseArg2Tops(FIXTURE)
    const ape = rows.find((r) => r.season === '2002/03' && r.tournament === 'Ape' && r.name === 'Daniel Giménez')
    const cla = rows.find((r) => r.season === '2002/03' && r.tournament === 'Cla')
    expect(ape).toEqual({ season: '2002/03', startYear: 2002, tournament: 'Ape', name: 'Daniel Giménez', team: 'Godoy Cruz de Mza', goals: 13 })
    expect(cla).toEqual({ season: '2002/03', startYear: 2002, tournament: 'Cla', name: 'Matías Gigli', team: 'Godoy Cruz de Mza', goals: 12 })
  })

  it('does not split a name starting with "Cla" (e.g. "Claudio") into a false tournament marker (regression)', () => {
    const text = '1984        Claudio Mir (Colón de Santa Fe)             26'
    const { rows } = parseArg2Tops(text)
    expect(rows).toEqual([{ season: '1984', startYear: 1984, tournament: null, name: 'Claudio Mir', team: 'Colón de Santa Fe', goals: 26 }])
  })

  it('ignores footer/notes prose lines instead of rejecting them', () => {
    const { rows, rejected } = parseArg2Tops(FIXTURE)
    const noteText = rejected.join('\n')
    expect(noteText).not.toContain('Ape means Torneo Apertura')
    expect(noteText).not.toContain('Prepared and maintained')
    expect(rows.some((r) => r.name.includes('Notes'))).toBe(false)
  })

  it('rejects a malformed row (parens + trailing goals, but no name text) instead of throwing', () => {
    expect(() => parseArg2Tops(FIXTURE)).not.toThrow()
    const { rejected } = parseArg2Tops(FIXTURE)
    expect(rejected.some((l) => l.includes('(Sin Nombre)'))).toBe(true)
  })

  it('carries the Ape/Cla tournament marker forward across a tied continuation row with no marker of its own (regression)', () => {
    const { rows } = parseArg2Tops(FIXTURE)
    const torres = rows.find((r) => r.name === 'Cristian Torres')
    expect(torres).toEqual({ season: '2002/03', startYear: 2002, tournament: 'Ape', name: 'Cristian Torres', team: 'Quilmes', goals: 13 })
  })
})

describe('aggregateArg2', () => {
  it('sums goals per normalized name across seasons/tournaments and tracks the team and year range', () => {
    const { rows } = parseArg2Tops(FIXTURE)
    const entries = aggregateArg2(rows)
    const blanco = entries.find((e) => e.name === 'Ismael Blanco')
    expect(blanco).toEqual({ name: 'Ismael Blanco', teams: ['Olimpo', 'Olimpo'], years: [2006, 2006], extraGoals: 28 })
  })

  it('keeps distinct players separate and derives a [minYear, maxYear] range from multiple seasons (triangulation)', () => {
    const rows = [
      { season: '1937', startYear: 1937, tournament: null, name: 'Ernesto Scandone', team: 'Estudiantes de BA', goals: 18 },
      { season: '1940', startYear: 1940, tournament: null, name: 'Ernesto Scandone', team: 'Boca Juniors', goals: 5 },
      { season: '1938', startYear: 1938, tournament: null, name: 'Armando Adán', team: 'Sp.Acassuso', goals: 28 },
    ]
    const entries = aggregateArg2(rows)
    expect(entries).toHaveLength(2)
    const scandone = entries.find((e) => e.name === 'Ernesto Scandone')
    expect(scandone).toEqual({ name: 'Ernesto Scandone', teams: ['Estudiantes de BA', 'Boca Juniors'], years: [1937, 1940], extraGoals: 23 })
  })

  it('splits a namesake group into separate entries when consecutive seasons are more than 15 years apart (avoids merging far-apart namesakes)', () => {
    const rows = [
      { season: '1937', startYear: 1937, tournament: null, name: 'Juan Pérez', team: 'Club A', goals: 10 },
      { season: '1938', startYear: 1938, tournament: null, name: 'Juan Pérez', team: 'Club A', goals: 5 },
      { season: '1960', startYear: 1960, tournament: null, name: 'Juan Pérez', team: 'Club B', goals: 8 },
    ]
    const entries = aggregateArg2(rows)
    const perez = entries.filter((e) => e.name === 'Juan Pérez')
    expect(perez).toHaveLength(2)
    expect(perez[0]).toEqual({ name: 'Juan Pérez', teams: ['Club A', 'Club A'], years: [1937, 1938], extraGoals: 15 })
    expect(perez[1]).toEqual({ name: 'Juan Pérez', teams: ['Club B'], years: [1960, 1960], extraGoals: 8 })
  })
})
