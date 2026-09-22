import { ROLE_LABEL } from '../lib/positions'
import type { Player, SlotDef } from '../lib/types'

export function PlayerSlot({
  slot,
  player,
  active,
  onSelect,
  compact = false,
}: {
  slot: SlotDef
  player: Player | null
  active: boolean
  onSelect?: (slotId: string) => void
  compact?: boolean
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
          } ${active ? 'border-gold bg-gold/20' : 'animate-slot-pulse border-chalk/50 bg-night/25'}`}
        >
          {!compact && <span className="text-lg leading-none font-light text-chalk/80">+</span>}
        </span>
        {!compact && (
          <span className="rounded-md bg-night/55 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-chalk/85">
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
        className={`animate-pop flex flex-col items-center rounded-xl bg-chalk text-night shadow-[0_6px_16px_-6px_rgb(0_0_0/0.7)] ${
          compact ? 'min-w-11 px-1 py-0.5' : 'w-[4.6rem] px-1.5 py-1.5 sm:w-24 sm:py-2'
        } ${active ? 'ring-2 ring-gold' : ''}`}
      >
        <span
          className={`w-full truncate text-center font-extrabold tracking-tight uppercase ${
            compact ? 'text-[7px]' : 'text-[10px] sm:text-xs'
          }`}
        >
          {player.shortName}
        </span>
        <span className={`font-display tabular leading-none ${compact ? 'text-[10px]' : 'text-lg sm:text-xl'}`}>
          {player.goals}
        </span>
      </span>
    </Tag>
  )
}
