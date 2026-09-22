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
    message = filled === slots ? '¡930 exactos!' : `930 con ${filled}. Faltan ${slots - filled} jugadores sin goles`
    tone = 'text-gold'
  } else if (status === 'over') {
    message = `Te pasaste por ${overBy}`
    tone = 'text-bust'
  } else {
    message = `${remaining} goles restantes`
  }

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className={`font-semibold ${tone}`}>{message}</p>
      <div className="flex shrink-0 items-center gap-2 text-xs font-semibold">
        <span className="tabular rounded-full bg-white/8 px-2.5 py-1 text-chalk-dim">
          {filled}/{slots}
        </span>
        {status === 'under' && (
          <span
            className={`rounded-full px-2.5 py-1 ${possible ? 'bg-go/15 text-go' : 'bg-bust/15 text-bust'}`}
            title={possible ? 'Existe al menos una combinación para llegar a 930' : 'Con estos jugadores ya no se llega a 930'}
          >
            {possible ? 'Se puede' : 'Imposible'}
          </span>
        )}
      </div>
    </div>
  )
}
