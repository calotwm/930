import { canPlay } from './positions'
import { TARGET, lineupPlayers, totalGoals } from './scoring'
import type { Formation, Lineup, Player } from './types'

export type AssignError = 'unknown-slot' | 'position' | 'duplicate'

export type AssignResult = { ok: true; lineup: Lineup } | { ok: false; error: AssignError }

export function emptyLineup(formation: Formation): Lineup {
  return Object.fromEntries(formation.slots.map((s) => [s.id, null]))
}

export function assignPlayer(
  formation: Formation,
  lineup: Lineup,
  slotId: string,
  player: Player,
): AssignResult {
  const slot = formation.slots.find((s) => s.id === slotId)
  if (!slot) return { ok: false, error: 'unknown-slot' }
  if (!canPlay(player.position, slot.role)) return { ok: false, error: 'position' }
  const takenElsewhere = Object.entries(lineup).some(
    ([id, p]) => id !== slotId && p?.id === player.id,
  )
  if (takenElsewhere) return { ok: false, error: 'duplicate' }
  return { ok: true, lineup: { ...lineup, [slotId]: player } }
}

export function removePlayer(lineup: Lineup, slotId: string): Lineup {
  if (!(slotId in lineup)) return lineup
  return { ...lineup, [slotId]: null }
}

export function filledCount(lineup: Lineup): number {
  return lineupPlayers(lineup).length
}

export function isComplete(formation: Formation, lineup: Lineup): boolean {
  return formation.slots.every((s) => lineup[s.id] != null)
}

export function isWin(formation: Formation, lineup: Lineup, target = TARGET): boolean {
  return isComplete(formation, lineup) && totalGoals(lineup) === target
}

export function usedPlayerIds(lineup: Lineup): Set<string> {
  return new Set(lineupPlayers(lineup).map((p) => p.id))
}

/** Validates a full lineup against formation rules (positions, duplicates, size). */
export function validateLineup(formation: Formation, lineup: Lineup): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const slot of formation.slots) {
    const p = lineup[slot.id]
    if (!p) {
      errors.push(`${slot.id}: vacío`)
      continue
    }
    if (!canPlay(p.position, slot.role)) errors.push(`${slot.id}: posición inválida (${p.position})`)
    if (seen.has(p.id)) errors.push(`${slot.id}: jugador repetido (${p.id})`)
    seen.add(p.id)
  }
  const extra = Object.keys(lineup).filter((id) => !formation.slots.some((s) => s.id === id))
  for (const id of extra) errors.push(`${id}: slot inexistente`)
  return errors
}
