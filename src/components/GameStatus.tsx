import type { ScoreStatus } from '../lib/scoring'

export function GameStatus({
  filled,
  slots,
  remaining,
  overBy,
  status,
  possible,
  changesLeft,
  windowsLeft,
  windowOpen,
}: {
  filled: number
  slots: number
  remaining: number
  overBy: number
  status: ScoreStatus
  possible: boolean
  changesLeft: number
  windowsLeft: number
  windowOpen: boolean
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
      <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
        <span className="tabular rounded-full bg-white/8 px-2.5 py-1 text-chalk-dim">
          {filled}/{slots}
        </span>
        <span
          className={`tabular rounded-full px-2.5 py-1 ${
            changesLeft === 0 || (windowsLeft === 0 && !windowOpen) ? 'bg-bust/15 text-bust' : 'bg-celeste/15 text-celeste-soft'
          }`}
          title="Sacar o reemplazar a un jugador ya puesto usa un cambio. Los cambios seguidos van en la misma ventana."
        >
          {changesLeft} {changesLeft === 1 ? 'cambio' : 'cambios'} · {windowOpen ? 'ventana abierta' : `${windowsLeft} ${windowsLeft === 1 ? 'ventana' : 'ventanas'}`}
        </span>
      </div>
    </div>
  )
}
