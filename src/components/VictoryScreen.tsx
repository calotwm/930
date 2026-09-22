import { useMemo } from 'react'
import { TARGET } from '../lib/scoring'
import type { Formation, Lineup } from '../lib/types'
import { FootballPitch } from './FootballPitch'
import { SunBall } from './Logo'

const COLORS = ['#75aadb', '#ffffff', '#f6b40e']

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 7) * 70}ms`,
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
    <div
      className="animate-fade-in fixed inset-0 z-50 overflow-y-auto bg-night/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Lo lograste"
    >
      <div className="flag-stripe h-1.5 w-full" aria-hidden="true" />
      <Confetti />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col items-center px-5 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center">
        <div className="relative flex flex-col items-center">
          <div className="sun-halo pointer-events-none absolute top-1/2 left-1/2 h-[60vw] max-h-80 w-[60vw] max-w-80 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <SunBall spin className="animate-pop relative h-14 w-14 text-sol" />
          <p className="font-display tabular animate-pop relative mt-4 text-7xl leading-none text-sol">
            {total} <span className="text-3xl text-chalk-dim">/ {TARGET}</span>
          </p>
        </div>
        <h2 className="font-display mt-3 text-4xl tracking-wide">LO LOGRASTE</h2>
        <p className="mt-1 text-xs font-bold tracking-[0.25em] text-celeste-soft uppercase">Tu XI histórico</p>
        <div className="mt-5 w-[74%] max-w-72">
          <FootballPitch formation={formation} lineup={lineup} compact highlight />
        </div>
        <p className="mt-4 text-sm font-semibold text-chalk-dim">
          11 jugadores · <span className="tabular text-chalk">{total} goles</span>
        </p>
        <div className="mt-6 flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onShare}
            className="rounded-2xl bg-sol py-4 font-extrabold tracking-wide text-night uppercase transition active:scale-[0.98]"
          >
            {shareLabel}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl border border-celeste/40 py-4 font-extrabold tracking-wide uppercase transition active:scale-[0.98]"
          >
            Jugar de nuevo
          </button>
        </div>
      </div>
    </div>
  )
}

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
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" role="dialog" aria-modal="true" aria-label="Sin cambios">
      <div className="animate-sheet-up w-full max-w-md rounded-t-3xl bg-night-2 px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center sm:rounded-3xl">
        <p className="font-display tabular text-6xl leading-none text-bust">
          {total} <span className="text-2xl text-chalk-dim">/ {TARGET}</span>
        </p>
        <h2 className="font-display mt-3 text-3xl tracking-wide">SIN CAMBIOS</h2>
        <p className="mt-2 text-sm text-chalk-dim">
          {overBy > 0 ? `Te pasaste por ${overBy} y ya no podés sacar a nadie.` : 'Con este equipo ya no se llega a 930.'}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl bg-sol py-4 font-extrabold tracking-wide text-night uppercase active:scale-[0.98]"
          >
            Jugar de nuevo
          </button>
          <button type="button" onClick={onClose} className="py-2 text-sm font-semibold text-chalk-dim">
            Ver mi equipo
          </button>
        </div>
      </div>
    </div>
  )
}
