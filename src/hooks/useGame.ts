import { useCallback, useEffect, useMemo, useReducer } from 'react'
import {
  assignPlayer,
  changesLeft,
  costsChange,
  emptyLineup,
  filledCount,
  isWin,
  outcome,
  removePlayer,
  type AssignError,
} from '../lib/gameRules'
import { TARGET, overBy, remainingGoals, scoreStatus, totalGoals } from '../lib/scoring'
import { isStillPossible } from '../lib/solver'
import type { Formation, Lineup, Player } from '../lib/types'

const STORAGE_KEY = '930:game:v2'

type Action =
  | { type: 'assign'; slotId: string; player: Player }
  | { type: 'remove'; slotId: string }
  | { type: 'reset' }

interface State {
  lineup: Lineup
  changesUsed: number
  /** last change in goals, used for the "+N" feedback */
  delta: { value: number; key: number } | null
  error: AssignError | 'no-changes' | null
}

interface Saved {
  lineup: Record<string, string | null>
  changesUsed: number
}

function load(formation: Formation, pool: Player[]): Pick<State, 'lineup' | 'changesUsed'> {
  const base = { lineup: emptyLineup(formation), changesUsed: 0 }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Saved | null
    if (!saved) return base
    const byId = new Map(pool.map((p) => [p.id, p]))
    let lineup = base.lineup
    for (const [slotId, playerId] of Object.entries(saved.lineup)) {
      const player = playerId ? byId.get(playerId) : undefined
      if (!player) continue
      const res = assignPlayer(formation, lineup, slotId, player)
      if (res.ok) lineup = res.lineup
    }
    return { lineup, changesUsed: Number(saved.changesUsed) || 0 }
  } catch {
    return base
  }
}

export function useGame(formation: Formation, pool: Player[]) {
  const reducer = useCallback(
    (state: State, action: Action): State => {
      switch (action.type) {
        case 'assign': {
          const change = costsChange(state.lineup, action.slotId)
          if (change && state.lineup[action.slotId]?.id === action.player.id) return state
          if (change && changesLeft(state.changesUsed) === 0) return { ...state, error: 'no-changes' }
          const res = assignPlayer(formation, state.lineup, action.slotId, action.player)
          if (!res.ok) return { ...state, error: res.error }
          const value = totalGoals(res.lineup) - totalGoals(state.lineup)
          return {
            lineup: res.lineup,
            changesUsed: state.changesUsed + (change ? 1 : 0),
            delta: { value, key: Date.now() },
            error: null,
          }
        }
        case 'remove': {
          if (!costsChange(state.lineup, action.slotId)) return state
          if (changesLeft(state.changesUsed) === 0) return { ...state, error: 'no-changes' }
          const lineup = removePlayer(state.lineup, action.slotId)
          const value = totalGoals(lineup) - totalGoals(state.lineup)
          return {
            lineup,
            changesUsed: state.changesUsed + 1,
            delta: value ? { value, key: Date.now() } : state.delta,
            error: null,
          }
        }
        case 'reset':
          return { lineup: emptyLineup(formation), changesUsed: 0, delta: null, error: null }
      }
    },
    [formation],
  )

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...load(formation, pool),
    delta: null,
    error: null,
  }))

  useEffect(() => {
    try {
      const saved: Saved = {
        lineup: Object.fromEntries(Object.entries(state.lineup).map(([k, p]) => [k, p?.id ?? null])),
        changesUsed: state.changesUsed,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {
      // storage unavailable (private mode); progress just isn't kept
    }
  }, [state.lineup, state.changesUsed])

  const total = totalGoals(state.lineup)
  const status = scoreStatus(total)
  const won = isWin(formation, state.lineup)
  const possible = useMemo(
    () => status === 'exact' || (status === 'under' && isStillPossible(formation, state.lineup, pool, TARGET)),
    [formation, state.lineup, pool, status],
  )

  return {
    lineup: state.lineup,
    delta: state.delta,
    total,
    filled: filledCount(state.lineup),
    slots: formation.slots.length,
    remaining: remainingGoals(total),
    overBy: overBy(total),
    status,
    won,
    possible,
    changesLeft: changesLeft(state.changesUsed),
    outcome: outcome(won, possible, state.changesUsed),
    assign: (slotId: string, player: Player) => dispatch({ type: 'assign', slotId, player }),
    remove: (slotId: string) => dispatch({ type: 'remove', slotId }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
