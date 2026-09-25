import { describe, expect, it } from 'vitest'
import { PLAYERS } from '../../data/players'
import { CLUBS, clubPool } from '../clubs'
import { DEFAULT_FORMATION } from '../formations'
import { findCompletion } from '../solver'

describe('club mode', () => {
  it.each(CLUBS.map((c) => [c.name, c] as const))('%s can reach exactly 930', (_, club) => {
    const pool = clubPool(PLAYERS, club)
    expect(pool.length).toBeGreaterThan(50)
    expect(pool.every((p) => p.clubs.includes(club.name))).toBe(true)
    expect(findCompletion(DEFAULT_FORMATION, {}, pool, 930, 5_000_000)).not.toBeNull()
  })
})
