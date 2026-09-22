import type { Formation, Lineup } from '../lib/types'
import { PlayerSlot } from './PlayerSlot'

function PitchLines() {
  return (
    <svg viewBox="0 0 68 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <g fill="none" stroke="rgb(247 244 236 / 0.42)" strokeWidth="0.35" vectorEffect="non-scaling-stroke">
        <rect x="2" y="2" width="64" height="96" rx="0.5" />
        <line x1="2" y1="50" x2="66" y2="50" />
        <ellipse cx="34" cy="50" rx="9.15" ry="9.15" />
        <rect x="13.85" y="2" width="40.3" height="16.5" />
        <rect x="24.85" y="2" width="18.3" height="5.5" />
        <rect x="13.85" y="81.5" width="40.3" height="16.5" />
        <rect x="24.85" y="92.5" width="18.3" height="5.5" />
        <path d="M26.7 18.5 A9.15 9.15 0 0 0 41.3 18.5" />
        <path d="M26.7 81.5 A9.15 9.15 0 0 1 41.3 81.5" />
      </g>
      <g fill="rgb(243 234 211 / 0.45)">
        <circle cx="34" cy="50" r="0.6" />
        <circle cx="34" cy="13" r="0.45" />
        <circle cx="34" cy="87" r="0.45" />
      </g>
    </svg>
  )
}

export function FootballPitch({
  formation,
  lineup,
  activeSlot = null,
  onSelectSlot,
  compact = false,
  highlight = false,
}: {
  formation: Formation
  lineup: Lineup
  activeSlot?: string | null
  onSelectSlot?: (slotId: string) => void
  compact?: boolean
  highlight?: boolean
}) {
  return (
    <div className="pitch relative aspect-[68/100] w-full overflow-hidden rounded-3xl">
      <PitchLines />
      {formation.slots.map((slot) => (
        <PlayerSlot
          key={slot.id}
          slot={slot}
          player={lineup[slot.id] ?? null}
          active={activeSlot === slot.id}
          onSelect={onSelectSlot}
          compact={compact}
          highlight={highlight}
        />
      ))}
    </div>
  )
}
