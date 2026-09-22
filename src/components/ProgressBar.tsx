import type { ScoreStatus } from '../lib/scoring'

const FILL: Record<ScoreStatus, string> = {
  under: 'bg-go',
  exact: 'bg-gold',
  over: 'bg-bust',
}

export function ProgressBar({ value, status }: { value: number; status: ScoreStatus }) {
  const pct = Math.round(value * 1000) / 10
  return (
    <div
      className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/8"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div
        className={`h-full origin-left rounded-full ${FILL[status]} transition-[width,background-color] duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
      {/* goal line marker */}
      <div className="absolute inset-y-0 right-0 w-0.5 bg-chalk/40" />
    </div>
  )
}
