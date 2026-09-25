import { useCallback, useEffect, useMemo, useReducer } from 'react'
import {
  NO_CHANGES,
  assignPlayer,
  canChange,
  changesLeft,
  costsChange,
  emptyLineup,
  fillSlot,
  filledCount,
  isWin,
  removePlayer,
  spendChange,
  windowsLeft,
  type AssignError,
  type Changes,
} from '../lib/gameRules'
import { TARGET, overBy, remainingGoals, scoreStatus, totalGoals } from '../lib/scoring'
import { isStillPossible } from '../lib/solver'
import type { Formation, Lineup, Player } from '../lib/types'

const STORAGE_KEY = '930:game:v4'

/** each mode (classic, one per club) keeps its own saved game */
export const storageKeyFor = (clubId: string | null) => (clubId ? `${STORAGE_KEY}:club:${clubId}` : STORAGE_KEY)

type Action =
  | { type: 'assign'; slotId: string; player: Player }
  | { type: 'remove'; slotId: string }
  | { type: 'reset' }

interface State {
  lineup: Lineup
  changes: Changes
  /** last change in goals, used for the "+N" feedback */
  delta: { value: number; key: number } | null
  error: AssignError | 'no-changes' | null
}

interface Saved {
  lineup: Record<string, string | null>
  changes: Changes
}

function load(formation: Formation, pool: Player[], key: string): Pick<State, 'lineup' | 'changes'> {
  const base = { lineup: emptyLineup(formation), changes: NO_CHANGES }
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Saved | null
    if (!saved) return base
    const byId = new Map(pool.map((p) => [p.id, p]))
    let lineup = base.lineup
    for (const [slotId, playerId] of Object.entries(saved.lineup)) {
      const player = playerId ? byId.get(playerId) : undefined
      if (!player) continue
      const res = assignPlayer(formation, lineup, slotId, player)
      if (res.ok) lineup = res.lineup
    }
    const c = saved.changes
    const changes = c && Number.isFinite(c.used) && Number.isFinite(c.windows) ? { used: c.used, windows: c.windows, open: c.open ?? null } : NO_CHANGES
    return { lineup, changes }
  } catch {
    return base
  }
}

export function useGame(formation: Formation, pool: Player[], key = STORAGE_KEY) {
  const reducer = useCallback(
    (state: State, action: Action): State => {
      switch (action.type) {
        case 'assign': {
          if (state.lineup[action.slotId]?.id === action.player.id) return state
          const change = costsChange(state.lineup, action.slotId)
          if (change && !canChange(state.changes)) return { ...state, error: 'no-changes' }
          const res = assignPlayer(formation, state.lineup, action.slotId, action.player)
          if (!res.ok) return { ...state, error: res.error }
          const changes = change ? spendChange(state.changes, action.slotId, false) : fillSlot(state.changes, action.slotId)
          const value = totalGoals(res.lineup) - totalGoals(state.lineup)
          return { lineup: res.lineup, changes, delta: { value, key: Date.now() }, error: null }
        }
        case 'remove': {
          if (!costsChange(state.lineup, action.slotId)) return state
          if (!canChange(state.changes)) return { ...state, error: 'no-changes' }
          const lineup = removePlayer(state.lineup, action.slotId)
          const value = totalGoals(lineup) - totalGoals(state.lineup)
          return {
            lineup,
            changes: spendChange(state.changes, action.slotId, true),
            delta: value ? { value, key: Date.now() } : state.delta,
            error: null,
          }
        }
        case 'reset':
          return { lineup: emptyLineup(formation), changes: NO_CHANGES, delta: null, error: null }
      }
    },
    [formation],
  )

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...load(formation, pool, key),
    delta: null,
    error: null,
  }))

  useEffect(() => {
    try {
      const saved: Saved = {
        lineup: Object.fromEntries(Object.entries(state.lineup).map(([k, p]) => [k, p?.id ?? null])),
        changes: state.changes,
      }
      localStorage.setItem(key, JSON.stringify(saved))
    } catch {
      // storage unavailable (private mode); progress just isn't kept
    }
  }, [state.lineup, state.changes, key])

  const total = totalGoals(state.lineup)
  const status = scoreStatus(total)
  const won = isWin(formation, state.lineup)
  const filled = filledCount(state.lineup)
  const possible = useMemo(
    () => status === 'exact' || (status === 'under' && isStillPossible(formation, state.lineup, pool, TARGET)),
    [formation, state.lineup, pool, status],
  )
  const fellShort = filled === formation.slots.length && status === 'under'
  const canFix = canChange(state.changes)

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
    fellShort,
    changesLeft: changesLeft(state.changes),
    windowsLeft: windowsLeft(state.changes),
    windowOpen: state.changes.open !== null,
    canChange: canFix,
    /** over 930 or short with a full XI, and no change left to fix it */
    lost: !won && (status === 'over' || fellShort || !possible) && !canFix,
    assign: (slotId: string, player: Player) => dispatch({ type: 'assign', slotId, player }),
    remove: (slotId: string) => dispatch({ type: 'remove', slotId }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
