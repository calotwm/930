import { canPlay } from './positions'
import { TARGET, lineupPlayers, totalGoals } from './scoring'
import type { Formation, Lineup, Player } from './types'

export type AssignError = 'unknown-slot' | 'position' | 'duplicate'

export type AssignResult = { ok: true; lineup: Lineup } | { ok: false; error: AssignError }

/**
 * Today's substitution rule: 5 changes in 3 windows. Removing or replacing a player already on the pitch
 * spends a change. Changes made in a row share a window (refilling a slot emptied in it keeps it open);
 * filling a slot that was already empty closes it, and the next change opens a new one.
 */
export const MAX_CHANGES = 5
export const MAX_WINDOWS = 3

export interface Changes {
  used: number
  windows: number
  /** slots emptied in the open window; null when no window is open */
  open: string[] | null
}

export const NO_CHANGES: Changes = { used: 0, windows: 0, open: null }

export function costsChange(lineup: Lineup, slotId: string): boolean {
  return lineup[slotId] != null
}

export function changesLeft(c: Changes): number {
  return Math.max(0, MAX_CHANGES - c.used)
}

export function windowsLeft(c: Changes): number {
  return Math.max(0, MAX_WINDOWS - c.windows)
}

/** Whether one more change is allowed right now. */
export function canChange(c: Changes): boolean {
  return changesLeft(c) > 0 && (c.open !== null || windowsLeft(c) > 0)
}

/** Records a change (remove or replace) on slotId; `emptied` when the slot is left empty. */
export function spendChange(c: Changes, slotId: string, emptied: boolean): Changes {
  const open = c.open ?? []
  return {
    used: c.used + 1,
    windows: c.open === null ? c.windows + 1 : c.windows,
    open: emptied ? [...open, slotId] : open,
  }
}

/** Filling an empty slot: part of the window if it was emptied in it, otherwise the window closes. */
export function fillSlot(c: Changes, slotId: string): Changes {
  if (c.open === null) return c
  if (c.open.includes(slotId)) return { ...c, open: c.open.filter((s) => s !== slotId) }
  return { ...c, open: null }
}

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
