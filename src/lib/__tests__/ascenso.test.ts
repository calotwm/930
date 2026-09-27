import { describe, expect, it } from 'vitest'
import { PLAYERS } from '../../data/players'
import { storageKeyFor } from '../../hooks/useGame'
import { ascensoPool } from '../ascenso'
import { DEFAULT_FORMATION } from '../formations'
import { canPlay } from '../positions'
import { findCompletion } from '../solver'
import type { SlotRole } from '../types'

describe('ascenso mode', () => {
  const pool = ascensoPool(PLAYERS)

  it('pool is non-trivial and pure', () => {
    expect(pool.length).toBeGreaterThan(50)
    expect(pool.every((p) => p.playedAscenso === true)).toBe(true)
  })

  it.each(
    Object.entries(
      DEFAULT_FORMATION.slots.reduce<Record<SlotRole, number>>((acc, s) => {
        acc[s.role] = (acc[s.role] ?? 0) + 1
        return acc
      }, {} as Record<SlotRole, number>),
    ),
  )('has enough eligible players for role %s', (role, slotCount) => {
    const eligible = pool.filter((p) => canPlay(p.position, role as SlotRole)).length
    expect(eligible).toBeGreaterThan(slotCount * 3)
  })

  it('can reach exactly 930', () => {
    expect(findCompletion(DEFAULT_FORMATION, {}, pool, 930, 5_000_000)).not.toBeNull()
  })
})

describe('storageKeyFor ascenso key', () => {
  it('returns a dedicated key for ascenso mode', () => {
    expect(storageKeyFor(null, true)).toBe('930:game:v4:ascenso')
  })

  it('keeps classic and club keys unchanged when ascenso is false or omitted', () => {
    expect(storageKeyFor(null, false)).toBe('930:game:v4')
    expect(storageKeyFor(null)).toBe('930:game:v4')
    expect(storageKeyFor('river')).toBe('930:game:v4:club:river')
  })
})
