export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'DM' | 'CM' | 'AM' | 'LW' | 'RW' | 'ST'

export type Division = 'Primera' | 'Primera Nacional' | 'Ascenso'

export interface SourceRef {
  name: string
  url: string
  note?: string
}

export interface Player {
  id: string
  name: string
  shortName: string
  position: Position
  goals: number
  club: string
  clubs: string[]
  division: Division
  /** what the goal count covers, e.g. "Primera, carrera" or "Primera desde 2012/13" */
  scope: string
  era: string
  source: SourceRef
  secondarySource?: SourceRef
  discrepancies?: { source: string; goals: number; note?: string }[]
  review?: string[]
}

export type SlotRole = 'ARQ' | 'DEF' | 'MC' | 'MP' | 'DEL'

export interface SlotDef {
  id: string
  role: SlotRole
  /** percentage coordinates on a vertical pitch, attack at the top */
  x: number
  y: number
}

export interface Formation {
  id: string
  name: string
  slots: SlotDef[]
}

export type Lineup = Record<string, Player | null>
