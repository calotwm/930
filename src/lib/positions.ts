import type { Position, SlotRole } from './types'

export const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST']

export const POSITION_LABEL: Record<Position, string> = {
  GK: 'ARQ',
  CB: 'DFC',
  LB: 'LI',
  RB: 'LD',
  DM: 'MCD',
  CM: 'MC',
  AM: 'MP',
  LW: 'EI',
  RW: 'ED',
  ST: 'DEL',
}

export const ROLE_LABEL: Record<SlotRole, string> = {
  ARQ: 'ARQ',
  DEF: 'DEF',
  MC: 'MC',
  MP: 'MP',
  DEL: 'DEL',
}

export const ROLE_TITLE: Record<SlotRole, string> = {
  ARQ: 'arquero',
  DEF: 'defensor',
  MC: 'mediocampista',
  MP: 'enganche',
  DEL: 'delantero',
}

const ROLE_POSITIONS: Record<SlotRole, readonly Position[]> = {
  ARQ: ['GK'],
  DEF: ['CB', 'LB', 'RB'],
  MC: ['DM', 'CM', 'AM'],
  MP: ['AM', 'CM', 'LW', 'RW'],
  DEL: ['ST', 'LW', 'RW', 'AM'],
}

export function positionsForRole(role: SlotRole): readonly Position[] {
  return ROLE_POSITIONS[role]
}

export function canPlay(position: Position, role: SlotRole): boolean {
  return ROLE_POSITIONS[role].includes(position)
}
