import { TARGET } from '../lib/scoring'
import { CafecitoButton } from './Cafecito'
import { Logo } from './Logo'

export function StartScreen({ playerCount, onStart }: { playerCount: number; onStart: () => void }) {
  return (
    <div className="relative min-h-dvh overflow-hidden" role="main" aria-label="Inicio">
      <div className="flag-stripe h-1.5 w-full" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_at_50%_20%,rgb(117_170_219/0.22),transparent_65%)]"
        aria-hidden="true"
      />
      <div className="animate-fade-in relative mx-auto flex min-h-[calc(100dvh-0.375rem)] max-w-md flex-col items-center justify-center gap-7 px-5 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center">
        <Logo size="lg" />

        <div className="space-y-4">
          <h1 className="font-display text-5xl leading-[1.02] text-chalk uppercase">
            ¿Podés igualar a <span className="text-celeste-soft">Messi</span>?{' '}
            <span aria-hidden="true">⚽</span>
          </h1>
          <p className="text-[16px] leading-snug text-chalk">
            Messi llegó a los <b className="text-sol">{TARGET}</b> goles. Una locura.
          </p>
          <p className="text-[15px] leading-snug text-chalk-dim">
            Acá vas a necesitar <b className="text-chalk">11 jugadores</b> para intentar alcanzar esa cifra. Elegilos bien, porque
            cada gol cuenta.
          </p>
          <p className="font-display text-3xl text-sol">¿Llegás a {TARGET}?</p>
          <p className="text-[15px] font-bold text-chalk">
            <span aria-hidden="true">🏆 </span>El desafío empieza ahora.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onStart}
            className="rounded-2xl bg-sol py-4 font-extrabold tracking-wide text-night uppercase shadow-[0_10px_30px_-10px_rgb(246_180_14/0.7)] transition active:scale-[0.98]"
          >
            Iniciar juego
          </button>
          <p className="text-[12px] text-chalk-dim">
            {playerCount.toLocaleString('es-AR')} jugadores de Primera y ascenso · liga, copas nacionales e internacionales
          </p>
          <CafecitoButton variant="block" />
        </div>
      </div>
    </div>
  )
}
