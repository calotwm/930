import type { Lineup, Player } from './types'

export const TARGET = 930

export type ScoreStatus = 'under' | 'exact' | 'over'

export function lineupPlayers(lineup: Lineup): Player[] {
  return Object.values(lineup).filter((p): p is Player => p !== null)
}

export function totalGoals(lineup: Lineup): number {
  return lineupPlayers(lineup).reduce((sum, p) => sum + p.goals, 0)
}

export function remainingGoals(total: number, target = TARGET): number {
  return Math.max(0, target - total)
}

export function overBy(total: number, target = TARGET): number {
  return Math.max(0, total - target)
}

export function scoreStatus(total: number, target = TARGET): ScoreStatus {
  if (total === target) return 'exact'
  return total > target ? 'over' : 'under'
}

export function progress(total: number, target = TARGET): number {
  return Math.min(1, total / target)
}
