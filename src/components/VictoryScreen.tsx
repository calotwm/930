import { useMemo } from 'react'
import { TARGET } from '../lib/scoring'
import type { Formation, Lineup } from '../lib/types'
import { FootballPitch } from './FootballPitch'
import { Ball } from './Logo'

const COLORS = ['#e8b84a', '#f3ead3', '#4ade80', '#75aadb', '#ffffff']

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
    <div className="animate-fade-in fixed inset-0 z-50 overflow-y-auto bg-night/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Lo lograste">
      <Confetti />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col items-center px-5 pt-10 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center">
        <Ball className="animate-pop h-12 w-12 text-chalk" />
        <p className="font-display tabular animate-pop mt-4 text-7xl leading-none text-gold">
          {total} <span className="text-3xl text-chalk-dim">/ {TARGET}</span>
        </p>
        <h2 className="font-display mt-3 text-4xl tracking-wide">LO LOGRASTE</h2>
        <p className="mt-1 text-xs font-bold tracking-[0.25em] text-chalk-dim uppercase">Tu XI histórico</p>
        <div className="mt-5 w-[74%] max-w-72">
          <FootballPitch formation={formation} lineup={lineup} compact />
        </div>
        <p className="mt-4 text-sm font-semibold text-chalk-dim">
          11 jugadores · <span className="tabular text-chalk">{total} goles</span>
        </p>
        <div className="mt-6 flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onShare}
            className="rounded-2xl bg-gold py-4 font-extrabold tracking-wide text-night uppercase transition active:scale-[0.98]"
          >
            {shareLabel}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl border border-white/15 py-4 font-extrabold tracking-wide uppercase transition active:scale-[0.98]"
          >
            Jugar de nuevo
          </button>
        </div>
      </div>
    </div>
  )
}
