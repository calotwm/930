import { describe, expect, it } from 'vitest'
import { DEFAULT_FORMATION as F } from '../../lib/formations'
import { emptyLineup, validateLineup } from '../../lib/gameRules'
import { POSITIONS, canPlay } from '../../lib/positions'
import { TARGET, totalGoals } from '../../lib/scoring'
import { findCompletion } from '../../lib/solver'
import { PLAYERS } from '../players'

describe('dataset', () => {
  it('tiene al menos 300 jugadores', () => {
    expect(PLAYERS.length).toBeGreaterThanOrEqual(300)
  })

  it('ids únicos y sin jugadores duplicados por nombre+club', () => {
    const ids = new Set(PLAYERS.map((p) => p.id))
    expect(ids.size).toBe(PLAYERS.length)
    // each person has one source record (a player page, or one row per name in a shared table)
    const keys = new Set(PLAYERS.map((p) => `${p.source.url}|${p.name}`))
    expect(keys.size).toBe(PLAYERS.length)
  })

  it('todos tienen fuente con nombre y URL', () => {
    for (const p of PLAYERS) {
      expect(p.source.name, p.id).toBeTruthy()
      expect(p.source.url, p.id).toMatch(/^https:\/\//)
    }
  })

  it('campos válidos', () => {
    for (const p of PLAYERS) {
      expect(POSITIONS, p.id).toContain(p.position)
      expect(Number.isInteger(p.goals) && p.goals >= 0, p.id).toBe(true)
      expect(['Primera', 'Primera Nacional'], p.id).toContain(p.division)
      expect(p.name.trim().length, p.id).toBeGreaterThan(0)
    }
  })

  it('hay variedad de jugadores para cada puesto de la formación', () => {
    const min = { ARQ: 10, DEF: 40, MC: 40, MP: 40, DEL: 40 } as const
    for (const role of Object.keys(min) as (keyof typeof min)[]) {
      const eligible = PLAYERS.filter((p) => canPlay(p.position, role)).length
      expect(eligible, role).toBeGreaterThanOrEqual(min[role])
    }
  })

  it('existe al menos un XI que suma exactamente 930', () => {
    const sol = findCompletion(F, emptyLineup(F), PLAYERS, TARGET)
    expect(sol).not.toBeNull()
    const lineup = { ...emptyLineup(F), ...sol }
    expect(validateLineup(F, lineup)).toEqual([])
    expect(totalGoals(lineup)).toBe(TARGET)
  })
})
