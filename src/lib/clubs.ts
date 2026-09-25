import type { Player } from './types'

export interface Club {
  id: string
  /** name as it appears in Player.clubs */
  name: string
  short: string
  /** crest colors: background, stripe/text */
  colors: [string, string]
}

/** Clubs whose players (career goals) can add up to exactly 930 in the 4-2-1-3; checked in tests. */
export const CLUBS: Club[] = [
  { id: 'river', name: 'River Plate', short: 'River', colors: ['#ffffff', '#e30613'] },
  { id: 'boca', name: 'Boca Juniors', short: 'Boca', colors: ['#0b3d91', '#f6c200'] },
  { id: 'independiente', name: 'Independiente', short: 'Independiente', colors: ['#d71920', '#ffffff'] },
  { id: 'racing', name: 'Racing Club', short: 'Racing', colors: ['#6cace4', '#ffffff'] },
  { id: 'san-lorenzo', name: 'San Lorenzo', short: 'San Lorenzo', colors: ['#1c2f6e', '#d7182a'] },
  { id: 'huracan', name: 'Huracán', short: 'Huracán', colors: ['#ffffff', '#d7182a'] },
  { id: 'estudiantes', name: 'Estudiantes LP', short: 'Estudiantes', colors: ['#d7182a', '#ffffff'] },
  { id: 'gimnasia', name: 'Gimnasia LP', short: 'Gimnasia', colors: ['#ffffff', '#12245b'] },
  { id: 'velez', name: 'Vélez Sarsfield', short: 'Vélez', colors: ['#ffffff', '#1c3f94'] },
  { id: 'newells', name: "Newell's Old Boys", short: "Newell's", colors: ['#d7182a', '#111111'] },
  { id: 'argentinos', name: 'Argentinos Juniors', short: 'Argentinos', colors: ['#d7182a', '#ffffff'] },
  { id: 'ferro', name: 'Ferro Carril Oeste', short: 'Ferro', colors: ['#00843d', '#ffffff'] },
  { id: 'colon', name: 'Colón', short: 'Colón', colors: ['#111111', '#d7182a'] },
  { id: 'tigre', name: 'Tigre', short: 'Tigre', colors: ['#0b3d91', '#d7182a'] },
  { id: 'banfield', name: 'Banfield', short: 'Banfield', colors: ['#ffffff', '#00843d'] },
  { id: 'talleres', name: 'Talleres', short: 'Talleres', colors: ['#12245b', '#ffffff'] },
  { id: 'quilmes', name: 'Quilmes', short: 'Quilmes', colors: ['#ffffff', '#12245b'] },
]

export const clubById = (id: string | null | undefined) => CLUBS.find((c) => c.id === id) ?? null

export const clubPool = (players: Player[], club: Club) => players.filter((p) => (p.clubs ?? [p.club]).includes(club.name))
