import { useMemo, type ReactNode } from 'react'
import { TARGET } from '../lib/scoring'
import type { Formation, Lineup } from '../lib/types'
import { CafecitoButton } from './Cafecito'
import { FootballPitch } from './FootballPitch'
import { BallOverBar, EmptyTank, Trophy } from './Illustrations'

const COLORS = ['#75aadb', '#ffffff', '#f6b40e']

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 8) * 80}ms`,
        color: COLORS[i % COLORS.length],
        dx: `${((i * 53) % 80) - 40}px`,
        rot: `${((i * 97) % 720) - 360}deg`,
      })),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: p.left,
              background: p.color,
              animationDelay: p.delay,
              '--dx': p.dx,
              '--rot': p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

function EndShell({ label, tone, children }: { label: string; tone: 'win' | 'lose'; children: ReactNode }) {
  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 overflow-y-auto bg-night/96 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="flag-stripe h-1.5 w-full" aria-hidden="true" />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[60vh] ${
          tone === 'win'
            ? 'bg-[radial-gradient(ellipse_at_50%_20%,rgb(246_180_14/0.22),transparent_65%)]'
            : 'bg-[radial-gradient(ellipse_at_50%_20%,rgb(255_107_94/0.18),transparent_65%)]'
        }`}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-5 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center">
        {children}
      </div>
    </div>
  )
}

export function VictoryScreen({
  formation,
  lineup,
  total,
  onRestart,
  onShare,
  shareLabel,
}: {
  formation: Formation
  lineup: Lineup
  total: number
  onRestart: () => void
  onShare: () => void
  shareLabel: string
}) {
  return (
    <EndShell label="Dale campeón" tone="win">
      <Confetti />
      <Trophy className="drop-in bob h-36 w-32 drop-shadow-[0_12px_30px_rgb(246_180_14/0.45)]" />
      <p className="font-display tabular glow-sol mt-3 text-7xl leading-none text-sol">
        {total} <span className="text-3xl text-chalk-dim [text-shadow:none]">/ {TARGET}</span>
      </p>
      <h2 className="font-display mt-3 text-[2.9rem] leading-[1.08] tracking-wide">¡DALE CAMPEÓÓÓN!</h2>
      <p className="mt-2 text-sm font-semibold text-chalk">Igualaste los {TARGET} goles de Messi</p>
      <p className="mt-1 text-xs font-bold tracking-[0.25em] text-celeste-soft uppercase">Tu XI histórico</p>
      <div className="mt-5 w-[72%] max-w-72">
        <FootballPitch formation={formation} lineup={lineup} compact highlight />
      </div>
      <p className="mt-4 text-sm font-semibold text-chalk-dim">
        11 jugadores · <span className="tabular text-chalk">{total} goles</span>
      </p>
      <div className="mt-6 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onShare}
          className="rounded-2xl bg-sol py-4 font-extrabold tracking-wide text-night uppercase shadow-[0_10px_30px_-10px_rgb(246_180_14/0.7)] transition active:scale-[0.98]"
        >
          {shareLabel}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-2xl border border-celeste/40 bg-celeste/10 py-4 font-extrabold tracking-wide uppercase transition active:scale-[0.98]"
        >
          Jugar de nuevo
        </button>
        <CafecitoButton variant="block" />
      </div>
    </EndShell>
  )
}

/** Shown when the total goes over 930, or when the XI is complete but short of it. */
export function LostScreen({
  total,
  overBy,
  onRestart,
  onClose,
}: {
  total: number
  overBy: number
  onRestart: () => void
  onClose: () => void
}) {
  const over = overBy > 0
  return (
    <EndShell label={over ? 'Te pasaste' : 'No llegaste'} tone="lose">
      {over ? (
        <BallOverBar className="drop-in h-40 w-36 drop-shadow-[0_12px_30px_rgb(255_107_94/0.35)]" />
      ) : (
        <EmptyTank className="drop-in h-40 w-36 drop-shadow-[0_12px_30px_rgb(255_107_94/0.3)]" />
      )}
      <p className="mt-2 text-xs font-extrabold tracking-[0.3em] text-bust uppercase">Uy, casi</p>
      <h2 className="font-display mt-1 text-[2.6rem] leading-none tracking-wide">
        {over ? '¡TE PASASTE DE ROSCA!' : '¡NO TE DIO LA NAFTA!'}
      </h2>
      <p className="font-display tabular glow-bust mt-4 text-6xl leading-none text-bust">
        {total} <span className="text-2xl text-chalk-dim [text-shadow:none]">/ {TARGET}</span>
      </p>
      <p className="mt-3 max-w-xs text-sm text-chalk-dim">
        {over
          ? `La mandaste a la tribuna: ${overBy} goles de más. Sacá o cambiá a alguien.`
          : `Completaste el XI y te faltan ${TARGET - total} goles. Cambiá a alguien.`}
      </p>
      <div className="mt-7 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl bg-celeste py-4 font-extrabold tracking-wide text-night uppercase shadow-[0_10px_30px_-10px_rgb(117_170_219/0.7)] transition active:scale-[0.98]"
        >
          Corregir mi equipo
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 py-4 font-extrabold tracking-wide text-chalk uppercase transition active:scale-[0.98]"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <path d="M15.5 7A6 6 0 1 0 16 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M16 3v4.5h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Reiniciar
        </button>
        <CafecitoButton variant="block" />
      </div>
    </EndShell>
  )
}
