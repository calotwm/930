import type { ScoreStatus } from '../lib/scoring'

const FILL: Record<ScoreStatus, string> = {
  under: 'bg-gradient-to-r from-celeste-deep via-celeste to-celeste-soft',
  exact: 'bg-gradient-to-r from-[#c98a06] via-sol to-[#ffe08a]',
  over: 'bg-gradient-to-r from-[#c2382c] to-bust',
}

export function ProgressBar({ value, status }: { value: number; status: ScoreStatus }) {
  const pct = Math.round(value * 1000) / 10
  return (
    <div
      className="relative h-3.5 w-full overflow-hidden rounded-full bg-black/35 shadow-[inset_0_1px_3px_rgb(0_0_0/0.6)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div
        className={`bar-shine relative h-full overflow-hidden rounded-full ${FILL[status]} shadow-[0_0_14px_rgb(117_170_219/0.5)] transition-[width] duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
      {/* quarter ticks and the goal line */}
      {[25, 50, 75].map((t) => (
        <div key={t} className="absolute inset-y-0 w-px bg-white/15" style={{ left: `${t}%` }} />
      ))}
      <div className="absolute inset-y-0 right-0 w-1 bg-white" />
    </div>
  )
}
