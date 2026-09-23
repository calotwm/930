import type { ScoreStatus } from '../lib/scoring'

export function GameStatus({
  filled,
  slots,
  remaining,
  overBy,
  status,
  possible,
}: {
  filled: number
  slots: number
  remaining: number
  overBy: number
  status: ScoreStatus
  possible: boolean
}) {
  let message: string
  let tone = 'text-chalk'
  if (status === 'exact') {
    message = filled === slots ? '¡930 exactos!' : `930 con ${filled}. Completá el XI`
    tone = 'text-sol'
  } else if (status === 'over') {
    message = `Te pasaste por ${overBy}`
    tone = 'text-bust'
  } else if (!possible) {
    message = 'Así ya no llegás a 930'
    tone = 'text-bust'
  } else {
    message = `${remaining} goles restantes`
  }

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className={`font-semibold ${tone}`}>{message}</p>
      <span className="tabular shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-xs font-semibold text-chalk-dim">
        {filled}/{slots}
      </span>
    </div>
  )
}
