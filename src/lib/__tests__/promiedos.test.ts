import { describe, expect, it } from 'vitest'
// @ts-expect-error plain JS build script
import { deltas } from '../../../scripts/fetch-promiedos.mjs'

const row = (name: string, goals: number) => ({ key: `lp|${name}|X`, name, team: 'X', goals })

describe('Promiedos weekly deltas', () => {
  it('adds only the goals scored since last week', () => {
    const d = deltas([row('A', 5), row('B', 3)], [row('A', 7), row('B', 3)])
    expect(d.map((r: { name: string; delta: number }) => [r.name, r.delta])).toEqual([['A', 2]])
  })
  it('counts a lower total as a new tournament, from zero', () => {
    expect(deltas([row('A', 9)], [row('A', 1)])[0].delta).toBe(1)
  })
  it('counts a scorer new to the table in full', () => {
    expect(deltas([row('A', 5)], [row('A', 5), row('C', 2)])[0]).toMatchObject({ name: 'C', delta: 2 })
  })
  it('adds nothing on the first snapshot', () => {
    expect(deltas([], [row('A', 5)])).toEqual([])
  })
})
