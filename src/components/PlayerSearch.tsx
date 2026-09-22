import { useDeferredValue, useMemo, useState } from 'react'
import { POSITION_LABEL, positionsForRole } from '../lib/positions'
import { searchPlayers, type IndexedPlayer } from '../lib/searchPlayers'
import type { Player, Position, SlotRole } from '../lib/types'
import { PlayerCard } from './PlayerCard'

export function PlayerSearch({
  index,
  role,
  current,
  usedIds,
  total,
  target,
  onPick,
  onRemove,
}: {
  index: IndexedPlayer[]
  role: SlotRole
  current: Player | null
  usedIds: Set<string>
  total: number
  target: number
  onPick: (player: Player) => void
  onRemove: () => void
}) {
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<Position | null>(null)
  const deferred = useDeferredValue(query)
  const allowed = positionsForRole(role)

  const results = useMemo(() => {
    const found = searchPlayers(index, deferred, { role, limit: pos ? 400 : 80 })
    return (pos ? found.filter((p) => p.position === pos) : found).slice(0, 80)
  }, [index, deferred, role, pos])

  const base = total - (current?.goals ?? 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-5 pb-3">
        {current && (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-widest text-chalk-dim uppercase">En este puesto</p>
              <p className="truncate font-extrabold uppercase">
                {current.name} · <span className="font-display tabular">{current.goals}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-full bg-bust/15 px-3 py-1.5 text-xs font-bold text-bust active:scale-95"
            >
              Quitar
            </button>
          </div>
        )}
        <label className="flex items-center gap-2 rounded-2xl bg-white/8 px-4 py-3 focus-within:ring-2 focus-within:ring-gold/60">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-chalk-dim" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M13 13l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador o club…"
            aria-label="Buscar jugador"
            enterKeyHint="search"
            autoComplete="off"
            className="w-full bg-transparent text-base text-chalk outline-none placeholder:text-chalk-dim/70"
          />
        </label>
        {allowed.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Filtrar por posición">
            <FilterChip active={pos === null} onClick={() => setPos(null)}>
              Todos
            </FilterChip>
            {allowed.map((p) => (
              <FilterChip key={p} active={pos === p} onClick={() => setPos(pos === p ? null : p)}>
                {POSITION_LABEL[p]}
              </FilterChip>
            ))}
          </div>
        )}
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-5 pb-6">
        {results.length === 0 && <li className="py-10 text-center text-sm text-chalk-dim">Sin resultados</li>}
        {results.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            onPick={onPick}
            target={target}
            resultingTotal={base + p.goals}
            disabledReason={p.id === current?.id ? 'ya está acá' : usedIds.has(p.id) ? 'ya en tu equipo' : undefined}
          />
        ))}
      </ul>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition active:scale-95 ${
        active ? 'bg-chalk text-night' : 'bg-white/8 text-chalk-dim'
      }`}
    >
      {children}
    </button>
  )
}
