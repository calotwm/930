import { POSITION_LABEL } from '../lib/positions'
import type { Player } from '../lib/types'

export function PlayerCard({
  player,
  onPick,
  disabledReason,
  resultingTotal,
  target,
}: {
  player: Player
  onPick: (player: Player) => void
  disabledReason?: string
  resultingTotal: number
  target: number
}) {
  const busts = resultingTotal > target
  const hits = resultingTotal === target
  return (
    <li>
      <button
        type="button"
        disabled={Boolean(disabledReason)}
        onClick={() => onPick(player)}
        className="flex w-full items-center gap-3 rounded-2xl bg-night-3/60 px-4 py-3 text-left transition active:scale-[0.98] active:bg-night-3 disabled:opacity-40"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold tracking-tight uppercase">{player.name}</p>
          <p className="mt-0.5 truncate text-xs text-chalk-dim">
            {player.club} · {player.era}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-chalk-dim">
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-chalk">{POSITION_LABEL[player.position]}</span>
            <span className={player.division === 'Primera Nacional' ? 'text-gold' : ''}>{player.scope}</span>
            {disabledReason && <span className="text-bust">· {disabledReason}</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="font-display tabular text-3xl leading-none">{player.goals}</span>
          <span
            className={`tabular mt-1 text-[10px] font-semibold ${hits ? 'text-gold' : busts ? 'text-bust' : 'text-chalk-dim'}`}
          >
            {hits ? '¡930!' : `→ ${resultingTotal}`}
          </span>
        </div>
      </button>
    </li>
  )
}
