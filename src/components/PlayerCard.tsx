import { POSITION_LABEL } from '../lib/positions'
import type { Player } from '../lib/types'

/** Search result. Goals stay hidden until the player is placed on the pitch. */
export function PlayerCard({
  player,
  onPick,
  disabledReason,
}: {
  player: Player
  onPick: (player: Player) => void
  disabledReason?: string
}) {
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
            {player.club}
            {player.era !== '—' && ` · ${player.era}`}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-chalk-dim">
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-chalk">{POSITION_LABEL[player.position]}</span>
            <span className={player.division === 'Primera Nacional' ? 'text-sol' : ''}>{player.scope}</span>
            {disabledReason && <span className="text-bust">· {disabledReason}</span>}
          </div>
        </div>
        <span
          className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-celeste/50 text-lg text-celeste-soft"
          aria-hidden="true"
        >
          ?
        </span>
      </button>
    </li>
  )
}
