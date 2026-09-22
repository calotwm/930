import { useEffect, useRef, useState } from 'react'
import { TARGET, type ScoreStatus } from '../lib/scoring'

function useTweenedNumber(value: number, duration = 450) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || a === value) {
      from.current = value
      setShown(value)
      return
    }
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = Math.round(a + (value - a) * eased)
      from.current = v
      setShown(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return shown
}

const COLOR: Record<ScoreStatus, string> = {
  under: 'text-chalk',
  exact: 'text-gold',
  over: 'text-bust',
}

export function GoalCounter({
  total,
  status,
  delta,
}: {
  total: number
  status: ScoreStatus
  delta: { value: number; key: number } | null
}) {
  const shown = useTweenedNumber(total)
  return (
    <div className="relative flex items-end gap-2">
      <span
        key={status === 'over' ? `over-${delta?.key}` : 'steady'}
        className={`font-display tabular text-[5.5rem] leading-[0.85] ${COLOR[status]} transition-colors duration-300 ${
          status === 'over' ? 'animate-shake' : ''
        }`}
        aria-live="polite"
        aria-label={`${total} de ${TARGET} goles`}
      >
        {shown}
      </span>
      <span className="font-display pb-1.5 text-2xl leading-none text-chalk-dim">/ {TARGET}</span>
      {delta && delta.value !== 0 && (
        <span
          key={delta.key}
          className={`animate-float-up font-display pointer-events-none absolute -top-3 left-1 text-2xl ${
            delta.value > 0 ? 'text-go' : 'text-chalk-dim'
          }`}
          aria-hidden="true"
        >
          {delta.value > 0 ? `+${delta.value}` : `−${Math.abs(delta.value)}`}
        </span>
      )}
    </div>
  )
}
