// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { EVIDENCE, addAscensoEvidence, derivePlayedAscenso, partialTagsFor } from '../ascenso-flag.mjs'

describe('derivePlayedAscenso', () => {
  it('is true when division is Primera Nacional', () => {
    expect(derivePlayedAscenso({ division: 'Primera Nacional' })).toBe(true)
  })

  it('is true when division is Ascenso (triangulation: different qualifying division)', () => {
    expect(derivePlayedAscenso({ division: 'Ascenso' })).toBe(true)
  })

  it('is true for a Primera player with an ascensoEvidence tag', () => {
    expect(derivePlayedAscenso({ division: 'Primera', ascensoEvidence: [EVIDENCE.SOLOASCENSO] })).toBe(true)
  })

  it('is false for a Primera player with no evidence and no qualifying division', () => {
    expect(derivePlayedAscenso({ division: 'Primera' })).toBe(false)
  })

  it('is false for a Primera player with an empty evidence array (triangulation: present but empty)', () => {
    expect(derivePlayedAscenso({ division: 'Primera', ascensoEvidence: [] })).toBe(false)
  })
})

describe('addAscensoEvidence', () => {
  it('adds a tag to a player with no existing evidence', () => {
    const p = { division: 'Primera' }
    addAscensoEvidence(p, EVIDENCE.TM_ARG2)
    expect(p.ascensoEvidence).toEqual([EVIDENCE.TM_ARG2])
  })

  it('deduplicates a repeated tag', () => {
    const p = { division: 'Primera', ascensoEvidence: [EVIDENCE.SOLOASCENSO] }
    addAscensoEvidence(p, EVIDENCE.SOLOASCENSO)
    expect(p.ascensoEvidence).toEqual([EVIDENCE.SOLOASCENSO])
  })

  it('appends a distinct second tag (triangulation)', () => {
    const p = { division: 'Primera', ascensoEvidence: [EVIDENCE.SOLOASCENSO] }
    addAscensoEvidence(p, EVIDENCE.WIKI_EDITIONS)
    expect(p.ascensoEvidence).toEqual([EVIDENCE.SOLOASCENSO, EVIDENCE.WIKI_EDITIONS])
  })
})

describe('partialTagsFor', () => {
  it('tags a merge outcome with the source partial tag (goals were actually raised, so the total is a lower bound)', () => {
    expect(partialTagsFor({ action: 'merge' }, 'soloascenso-partial')).toEqual(['soloascenso-partial'])
  })

  it('does NOT tag a flag outcome with the partial tag (goals untouched — total already fully covered elsewhere)', () => {
    expect(partialTagsFor({ action: 'flag' }, 'soloascenso-partial')).toEqual([])
  })

  it('adds ascenso-era-match on top of the partial tag for an eraOnly merge (triangulation: two tags)', () => {
    expect(partialTagsFor({ action: 'merge', eraOnly: true }, 'soloascenso-partial')).toEqual([
      'soloascenso-partial',
      'ascenso-era-match',
    ])
  })

  it('adds only ascenso-era-match for an eraOnly flag (no partial tag, since flag never touches goals)', () => {
    expect(partialTagsFor({ action: 'flag', eraOnly: true }, 'soloascenso-partial')).toEqual(['ascenso-era-match'])
  })

  it('uses the given source-specific base tag (triangulation: different source, e.g. RSSSF ARG2)', () => {
    expect(partialTagsFor({ action: 'merge' }, 'rsssf-arg2-partial')).toEqual(['rsssf-arg2-partial'])
  })
})
