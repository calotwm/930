// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { EVIDENCE, addAscensoEvidence, derivePlayedAscenso } from '../ascenso-flag.mjs'

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
