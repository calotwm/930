import { POSITION_LABEL, canPlay } from './positions'
import type { Player, SlotRole } from './types'

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface IndexedPlayer {
  player: Player
  haystack: string
}

export function buildIndex(players: Player[]): IndexedPlayer[] {
  return players.map((player) => ({
    player,
    // leading space lets a token match only at the start of a word
    haystack: ' ' + normalize(
      [
        player.name,
        player.clubs.join(' '),
        player.position,
        POSITION_LABEL[player.position],
        player.division,
        player.era,
      ].join(' '),
    ),
  }))
}

export interface SearchOptions {
  role?: SlotRole
  limit?: number
}

/** Every query token must start a word in the player's name, clubs or position. Sorted by goals desc. */
export function searchPlayers(
  index: IndexedPlayer[],
  query: string,
  { role, limit = 60 }: SearchOptions = {},
): Player[] {
  const tokens = normalize(query)
    .split(' ')
    .filter(Boolean)
    .map((t) => ' ' + t)
  const out: Player[] = []
  for (const { player, haystack } of index) {
    if (role && !canPlay(player.position, role)) continue
    if (tokens.every((t) => haystack.includes(t))) out.push(player)
  }
  out.sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
  return out.slice(0, limit)
}
