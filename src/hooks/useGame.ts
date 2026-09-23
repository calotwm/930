import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { assignPlayer, emptyLineup, filledCount, isWin, removePlayer, type AssignError } from '../lib/gameRules'
import { TARGET, overBy, remainingGoals, scoreStatus, totalGoals } from '../lib/scoring'
import { isStillPossible } from '../lib/solver'
import type { Formation, Lineup, Player } from '../lib/types'

const STORAGE_KEY = '930:game:v3'

type Action =
  | { type: 'assign'; slotId: string; player: Player }
  | { type: 'remove'; slotId: string }
  | { type: 'reset' }

interface State {
  lineup: Lineup
  /** last change in goals, used for the "+N" feedback */
  delta: { value: number; key: number } | null
  error: AssignError | null
}

function loadLineup(formation: Formation, pool: Player[]): Lineup {
  const base = emptyLineup(formation)
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Record<string, string | null> | null
    if (!saved) return base
    const byId = new Map(pool.map((p) => [p.id, p]))
    let lineup = base
    for (const [slotId, playerId] of Object.entries(saved)) {
      const player = playerId ? byId.get(playerId) : undefined
      if (!player) continue
      const res = assignPlayer(formation, lineup, slotId, player)
      if (res.ok) lineup = res.lineup
    }
    return lineup
  } catch {
    return base
  }
}

export function useGame(formation: Formation, pool: Player[]) {
  const reducer = useCallback(
    (state: State, action: Action): State => {
      switch (action.type) {
        case 'assign': {
          if (state.lineup[action.slotId]?.id === action.player.id) return state
          const res = assignPlayer(formation, state.lineup, action.slotId, action.player)
          if (!res.ok) return { ...state, error: res.error }
          const value = totalGoals(res.lineup) - totalGoals(state.lineup)
          return { lineup: res.lineup, delta: { value, key: Date.now() }, error: null }
        }
        case 'remove': {
          if (!state.lineup[action.slotId]) return state
          const lineup = removePlayer(state.lineup, action.slotId)
          const value = totalGoals(lineup) - totalGoals(state.lineup)
          return { lineup, delta: value ? { value, key: Date.now() } : state.delta, error: null }
        }
        case 'reset':
          return { lineup: emptyLineup(formation), delta: null, error: null }
      }
    },
    [formation],
  )

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    lineup: loadLineup(formation, pool),
    delta: null,
    error: null,
  }))

  useEffect(() => {
    try {
      const ids = Object.fromEntries(Object.entries(state.lineup).map(([k, p]) => [k, p?.id ?? null]))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // storage unavailable (private mode); progress just isn't kept
    }
  }, [state.lineup])

  const total = totalGoals(state.lineup)
  const status = scoreStatus(total)
  const won = isWin(formation, state.lineup)
  const filled = filledCount(state.lineup)
  const possible = useMemo(
    () => status === 'exact' || (status === 'under' && isStillPossible(formation, state.lineup, pool, TARGET)),
    [formation, state.lineup, pool, status],
  )

  return {
    lineup: state.lineup,
    delta: state.delta,
    total,
    filled,
    slots: formation.slots.length,
    remaining: remainingGoals(total),
    overBy: overBy(total),
    status,
    won,
    possible,
    /** XI complete but short of 930 */
    fellShort: filled === formation.slots.length && status === 'under',
    assign: (slotId: string, player: Player) => dispatch({ type: 'assign', slotId, player }),
    remove: (slotId: string) => dispatch({ type: 'remove', slotId }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
