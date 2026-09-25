import { useCallback, useEffect, useMemo, useState } from 'react'
import { BottomSheet } from '../components/BottomSheet'
import { Credits } from '../components/Cafecito'
import { FootballPitch } from '../components/FootballPitch'
import { GameHeader } from '../components/GameHeader'
import { GameStatus } from '../components/GameStatus'
import { GoalCounter } from '../components/GoalCounter'
import { PlayerSearch } from '../components/PlayerSearch'
import { ProgressBar } from '../components/ProgressBar'
import { LostScreen, VictoryScreen } from '../components/VictoryScreen'
import { PLAYERS } from '../data/players'
import { storageKeyFor, useGame } from '../hooks/useGame'
import { clubPool, type Club } from '../lib/clubs'
import { DEFAULT_FORMATION } from '../lib/formations'
import { usedPlayerIds } from '../lib/gameRules'
import { ROLE_TITLE } from '../lib/positions'
import { TARGET, progress } from '../lib/scoring'
import { buildIndex } from '../lib/searchPlayers'
import { shareResult } from '../lib/share'
import type { Player } from '../lib/types'

const formation = DEFAULT_FORMATION

export function Home({ club = null, onHome }: { club?: Club | null; onHome?: () => void }) {
  // club mode: only players who played for that club (career goals count)
  const pool = useMemo(() => (club ? clubPool(PLAYERS, club) : PLAYERS), [club])
  const game = useGame(formation, pool, storageKeyFor(club?.id ?? null))
  const index = useMemo(() => buildIndex(pool), [pool])
  const [activeSlot, setActiveSlot] = useState<string | null>(null)
  const [shareLabel, setShareLabel] = useState('Compartir resultado')
  // the over/lost screen is dismissed per move: a new pick that goes over shows it again
  const [dismissedMove, setDismissedMove] = useState<number | null>(null)
  const moveKey = game.delta?.key ?? -1

  const deltaKey = game.delta?.key
  useEffect(() => {
    if (deltaKey === undefined) return
    const pattern = game.won ? [20, 40, 20] : game.status === 'over' ? 40 : 12
    navigator.vibrate?.(pattern)
    // only on a new goal change; won/status are read at that moment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deltaKey])

  const restart = () => {
    game.reset()
    setDismissedMove(null)
  }

  const slot = formation.slots.find((s) => s.id === activeSlot) ?? null
  const close = useCallback(() => setActiveSlot(null), [])

  const pick = (player: Player) => {
    if (!activeSlot) return
    game.assign(activeSlot, player)
    setActiveSlot(null)
  }

  const onShare = async () => {
    const outcome = await shareResult(formation, game.lineup, game.total, club?.name)
    if (outcome === 'copied') setShareLabel('¡Copiado!')
    else if (outcome === 'failed') setShareLabel('No se pudo compartir')
    setTimeout(() => setShareLabel('Compartir resultado'), 2200)
  }

  return (
    <>
      <div className="flag-stripe fixed inset-x-0 top-0 z-30 h-1" aria-hidden="true" />
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-xl lg:max-w-2xl">
        <GameHeader onReset={restart} canReset={game.filled > 0} club={club} onHome={onHome} />

        <section aria-label="Marcador" className="scoreboard space-y-3 rounded-3xl px-4 pt-4 pb-3.5">
          <GoalCounter total={game.total} status={game.status} delta={game.delta} />
          <ProgressBar value={progress(game.total)} status={game.status} />
          <GameStatus
            filled={game.filled}
            slots={game.slots}
            remaining={game.remaining}
            overBy={game.overBy}
            status={game.status}
            possible={game.possible}
            changesLeft={game.changesLeft}
            windowsLeft={game.windowsLeft}
            windowOpen={game.windowOpen}
          />
        </section>

        {game.filled === 0 && (
          <p className="-mt-1 text-center text-[13px] leading-snug text-chalk-dim">
            <b className="text-chalk">{TARGET}</b> son los goles oficiales de <b className="text-celeste-soft">Messi</b> (al
            20/09/2026).{' '}
            {club ? (
              <>
                ¿Los igualás solo con jugadores que pasaron por <b className="text-chalk">{club.name}</b>? Cuentan los goles de
                toda su carrera.
              </>
            ) : (
              '¿Los igualás con un XI histórico argentino?'
            )}{' '}
            Tocá un puesto: los goles se revelan en la cancha.
          </p>
        )}

        {/* on bigger screens the pitch grows but stays within the viewport height (pitch ratio 68:100) */}
        <main className="mx-auto w-full md:max-w-[min(32rem,calc((100dvh-17rem)*0.68))] md:min-w-80">
          <FootballPitch
            formation={formation}
            lineup={game.lineup}
            activeSlot={activeSlot}
            onSelectSlot={setActiveSlot}
          />
        </main>

        <Credits />

        <BottomSheet open={slot !== null} title={slot ? `Elegí ${ROLE_TITLE[slot.role]}` : ''} onClose={close}>
          {slot && (
            <PlayerSearch
              key={slot.id}
              index={index}
              role={slot.role}
              current={game.lineup[slot.id] ?? null}
              usedIds={usedPlayerIds(game.lineup)}
              onPick={pick}
              changeHint={
                game.canChange
                  ? `cambiarlo usa 1 de ${game.changesLeft}${game.windowOpen ? '' : ` y abre ventana (${game.windowsLeft} de 3)`}`
                  : null
              }
              onRemove={() => {
                game.remove(slot.id)
                close()
              }}
            />
          )}
        </BottomSheet>

        {game.won && (
          <VictoryScreen
            formation={formation}
            lineup={game.lineup}
            total={game.total}
            onRestart={restart}
            onShare={onShare}
            shareLabel={shareLabel}
          />
        )}

        {(game.status === 'over' || game.fellShort || game.lost) && dismissedMove !== moveKey && (
          <LostScreen
            total={game.total}
            overBy={game.overBy}
            onRestart={restart}
            onClose={() => setDismissedMove(moveKey)}
            canFix={game.canChange}
          />
        )}
      </div>
    </>
  )
}
