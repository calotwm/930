import { ROLE_LABEL } from '../lib/positions'
import type { Player, SlotDef } from '../lib/types'

export function PlayerSlot({
  slot,
  player,
  active,
  onSelect,
  compact = false,
  highlight = false,
}: {
  slot: SlotDef
  player: Player | null
  active: boolean
  onSelect?: (slotId: string) => void
  compact?: boolean
  /** gold ring when the XI hits 930 */
  highlight?: boolean
}) {
  const style = { left: `${slot.x}%`, top: `${slot.y}%` }
  const interactive = Boolean(onSelect)
  const Tag = interactive ? 'button' : 'div'

  if (!player) {
    return (
      <Tag
        type={interactive ? 'button' : undefined}
        onClick={() => onSelect?.(slot.id)}
        style={style}
        aria-label={`Elegir ${ROLE_LABEL[slot.role]}`}
        className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition active:scale-90 ${
          active ? 'scale-110' : ''
        }`}
      >
        <span
          className={`flex items-center justify-center rounded-full border-2 border-dashed ${
            compact ? 'h-7 w-7' : 'h-11 w-11 sm:h-14 sm:w-14'
          } ${active ? 'border-sol bg-sol/20' : 'animate-slot-pulse border-celeste/70 bg-night/30'}`}
        >
          {!compact && <span className="text-lg leading-none font-light text-chalk/85">+</span>}
        </span>
        {!compact && (
          <span className="rounded-md bg-night/60 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-chalk/90">
            {ROLE_LABEL[slot.role]}
          </span>
        )}
      </Tag>
    )
  }

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={() => onSelect?.(slot.id)}
      style={style}
      aria-label={`${player.name}, ${player.goals} goles. Cambiar`}
      className={`absolute -translate-x-1/2 -translate-y-1/2 transition active:scale-95 ${active ? 'scale-105' : ''}`}
    >
      <span
        key={player.id}
        className={`animate-pop relative flex flex-col items-center overflow-hidden rounded-xl bg-chalk text-night shadow-[0_6px_16px_-6px_rgb(0_0_0/0.7)] ${
          compact ? 'min-w-11 px-1 pt-1 pb-0.5' : 'w-[4.6rem] px-1.5 pt-2 pb-1.5 sm:w-24 sm:pt-2.5 sm:pb-2'
        } ${active ? 'ring-2 ring-sol' : highlight ? 'ring-1 ring-sol' : ''}`}
      >
        <span className={`flag-collar absolute inset-x-0 top-0 ${compact ? 'h-0.5' : 'h-[3px]'}`} aria-hidden="true" />
        <span
          className={`w-full truncate text-center font-extrabold tracking-tight uppercase ${
            compact ? 'text-[7px]' : player.shortName.length > 9 ? 'text-[8.5px] sm:text-[11px]' : 'text-[10px] sm:text-xs'
          }`}
        >
          {player.shortName}
        </span>
        <span
          className={`reveal-number animate-reveal font-display tabular leading-none ${compact ? 'text-[10px]' : 'text-lg sm:text-xl'}`}
        >
          {player.goals}
        </span>
        {!compact && player.goals >= 50 && (
          <span
            className="animate-shine pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            aria-hidden="true"
          />
        )}
      </span>
    </Tag>
  )
}
