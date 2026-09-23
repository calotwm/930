import { useDeferredValue, useMemo, useState } from 'react'
import { POSITION_LABEL, canPlay, positionsForRole } from '../lib/positions'
import { searchPlayers, type IndexedPlayer } from '../lib/searchPlayers'
import type { Player, Position, SlotRole } from '../lib/types'
import { PlayerCard } from './PlayerCard'

const PAGE = 60

export function PlayerSearch({
  index,
  role,
  current,
  usedIds,
  onPick,
  onRemove,
  changeHint,
}: {
  index: IndexedPlayer[]
  role: SlotRole
  current: Player | null
  usedIds: Set<string>
  onPick: (player: Player) => void
  onRemove: () => void
  /** when this slot is filled: text about the change it would cost, or null if no change is possible */
  changeHint: string | null
}) {
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<Position | null>(null)
  const [shown, setShown] = useState(PAGE)
  const deferred = useDeferredValue(query)
  const allowed = positionsForRole(role)
  // replacing or removing a placed player spends a change
  const locked = current !== null && changeHint === null

  const results = useMemo(() => {
    const found = searchPlayers(index, deferred, { role })
    return pos ? found.filter((p) => p.position === pos) : found
  }, [index, deferred, role, pos])

  // when searching by name, show matches that play elsewhere so they don't look missing
  const elsewhere = useMemo(() => {
    if (!deferred.trim()) return []
    return searchPlayers(index, deferred)
      .filter((p) => !canPlay(p.position, role))
      .slice(0, 8)
  }, [index, deferred, role])

  const selectPos = (p: Position | null) => {
    setPos(p)
    setShown(PAGE)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-5 pb-3">
        {current && (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-widest text-chalk-dim uppercase">
                En este puesto ·{' '}
                {locked ? <span className="text-bust">sin cambios</span> : <span className="text-celeste-soft">{changeHint}</span>}
              </p>
              <p className="truncate font-extrabold uppercase">
                {current.name} · <span className="font-display tabular">{current.goals}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              disabled={locked}
              className="shrink-0 rounded-full bg-bust/15 px-3 py-1.5 text-xs font-bold text-bust active:scale-95 disabled:opacity-40"
            >
              Quitar
            </button>
          </div>
        )}
        <label className="flex items-center gap-2 rounded-2xl bg-white/8 px-4 py-3 focus-within:ring-2 focus-within:ring-sol/60">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-chalk-dim" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M13 13l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShown(PAGE)
            }}
            placeholder="Buscar jugador o club…"
            aria-label="Buscar jugador"
            enterKeyHint="search"
            autoComplete="off"
            className="w-full bg-transparent text-base text-chalk outline-none placeholder:text-chalk-dim/70"
          />
        </label>
        {allowed.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Filtrar por posición">
            <FilterChip active={pos === null} onClick={() => selectPos(null)}>
              Todos
            </FilterChip>
            {allowed.map((p) => (
              <FilterChip key={p} active={pos === p} onClick={() => selectPos(pos === p ? null : p)}>
                {POSITION_LABEL[p]}
              </FilterChip>
            ))}
          </div>
        )}
        <p className="text-[11px] font-semibold text-chalk-dim" aria-live="polite">
          {results.length} {results.length === 1 ? 'jugador' : 'jugadores'} · los goles se revelan al elegir
        </p>
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-5 pb-6">
        {results.length === 0 && elsewhere.length === 0 && (
          <li className="py-10 text-center text-sm text-chalk-dim">Sin resultados</li>
        )}
        {results.slice(0, shown).map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            onPick={onPick}
            disabledReason={
              p.id === current?.id
                ? 'ya está acá'
                : usedIds.has(p.id)
                  ? 'ya en tu equipo'
                  : locked
                    ? 'sin cambios'
                    : undefined
            }
          />
        ))}
        {results.length > shown && (
          <li>
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="w-full rounded-2xl border border-white/10 py-3 text-sm font-bold text-chalk-dim active:scale-[0.98]"
            >
              Ver más ({results.length - shown})
            </button>
          </li>
        )}
        {elsewhere.length > 0 && results.length <= shown && (
          <>
            <li className="pt-3 text-[11px] font-bold tracking-widest text-chalk-dim uppercase">En otros puestos</li>
            {elsewhere.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                onPick={onPick}
                disabledReason={`juega de ${POSITION_LABEL[p.position]}`}
              />
            ))}
          </>
        )}
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
        active ? 'bg-celeste text-night' : 'bg-white/8 text-chalk-dim'
      }`}
    >
      {children}
    </button>
  )
}
