import type { Player } from './types'

/** Players with evidence-based ascenso participation; full career goals count. */
export const ascensoPool = (players: Player[]) => players.filter((p) => p.playedAscenso === true)
