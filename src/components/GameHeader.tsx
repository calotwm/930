import type { Club } from '../lib/clubs'
import { CafecitoButton } from './Cafecito'
import { ClubCrest } from './ClubCrest'
import { Logo } from './Logo'

export function GameHeader({
  onReset,
  canReset,
  club = null,
  onHome,
}: {
  onReset: () => void
  canReset: boolean
  club?: Club | null
  onHome?: () => void
}) {
  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        {onHome && (
          <button
            type="button"
            onClick={onHome}
            aria-label="Volver al inicio"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-chalk-dim transition active:scale-90"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="flex flex-col gap-1.5">
          <Logo />
          {club ? (
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] whitespace-nowrap text-celeste-soft uppercase">
              <ClubCrest club={club} size="xs" />
              Modo {club.short}
            </span>
          ) : (
            <span className="text-[10px] font-extrabold tracking-[0.28em] text-celeste-soft uppercase">Desafío histórico</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CafecitoButton />
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          aria-label="Reiniciar equipo"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-chalk-dim transition active:scale-90 disabled:opacity-30"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path d="M15.5 7A6 6 0 1 0 16 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 3v4.5h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}
