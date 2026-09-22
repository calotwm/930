import { canPlay } from './positions'
import type { Formation, Lineup, Player, SlotRole } from './types'

interface SlotOptions {
  slotId: string
  /** goal value -> eligible players with exactly that many goals */
  byGoals: Map<number, Player[]>
}

function optionsFor(role: SlotRole, pool: Player[], used: Set<string>, max: number) {
  const byGoals = new Map<number, Player[]>()
  for (const p of pool) {
    if (used.has(p.id) || p.goals > max || !canPlay(p.position, role)) continue
    const list = byGoals.get(p.goals)
    if (list) list.push(p)
    else byGoals.set(p.goals, [p])
  }
  return byGoals
}

/**
 * Finds one way to fill the empty slots so the lineup totals exactly `target`.
 * Exact (respects positions and no repeated players). Returns null if impossible.
 */
export function findCompletion(
  formation: Formation,
  lineup: Lineup,
  pool: Player[],
  target: number,
): Record<string, Player> | null {
  const used = new Set<string>()
  let current = 0
  for (const p of Object.values(lineup)) {
    if (p) {
      used.add(p.id)
      current += p.goals
    }
  }
  const need = target - current
  if (need < 0) return null

  const open: SlotOptions[] = formation.slots
    .filter((s) => !lineup[s.id])
    .map((s) => ({ slotId: s.id, byGoals: optionsFor(s.role, pool, used, need) }))
    // most constrained slots first keeps the search small
    .sort((a, b) => a.byGoals.size - b.byGoals.size)

  if (open.length === 0) return need === 0 ? {} : null

  // reach[i][s] = sums s reachable using slots i..end (ignoring repeats; used only for pruning)
  const reach: Uint8Array[] = new Array(open.length + 1)
  reach[open.length] = new Uint8Array(need + 1)
  reach[open.length][0] = 1
  for (let i = open.length - 1; i >= 0; i--) {
    const next = reach[i + 1]
    const cur = new Uint8Array(need + 1)
    for (const v of open[i].byGoals.keys()) {
      for (let s = v; s <= need; s++) if (next[s - v]) cur[s] = 1
    }
    reach[i] = cur
  }
  if (!reach[0][need]) return null

  const picked: Record<string, Player> = {}
  const dfs = (i: number, remaining: number): boolean => {
    if (i === open.length) return remaining === 0
    for (const [v, players] of open[i].byGoals) {
      if (v > remaining || !reach[i + 1][remaining - v]) continue
      for (const p of players) {
        if (used.has(p.id)) continue
        used.add(p.id)
        picked[open[i].slotId] = p
        if (dfs(i + 1, remaining - v)) return true
        used.delete(p.id)
      }
    }
    delete picked[open[i].slotId]
    return false
  }
  return dfs(0, need) ? picked : null
}

export function isStillPossible(
  formation: Formation,
  lineup: Lineup,
  pool: Player[],
  target: number,
): boolean {
  return findCompletion(formation, lineup, pool, target) !== null
}
