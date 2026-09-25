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

// "Di María" is also found as "dimaria": consecutive name words joined
const joinedPairs = (name: string) => {
  const w = normalize(name).split(' ')
  return w.slice(1).map((x, i) => w[i] + x).join(' ')
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
        joinedPairs(player.name),
      ].join(' '),
    ),
  }))
}

export interface SearchOptions {
  role?: SlotRole
}

const collator = new Intl.Collator('es', { sensitivity: 'base' })

/**
 * Every query token must start a word in the player's name, clubs or position.
 * Sorted by surname: sorting by goals would leak the hidden number.
 */
export function searchPlayers(index: IndexedPlayer[], query: string, { role }: SearchOptions = {}): Player[] {
  const tokens = normalize(query)
    .split(' ')
    .filter(Boolean)
    .map((t) => ' ' + t)
  const out: Player[] = []
  for (const { player, haystack } of index) {
    if (role && !canPlay(player.position, role)) continue
    if (tokens.every((t) => haystack.includes(t))) out.push(player)
  }
  out.sort((a, b) => collator.compare(a.shortName, b.shortName) || collator.compare(a.name, b.name))
  return out
}
