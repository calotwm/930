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
import { useGame } from '../hooks/useGame'
import { DEFAULT_FORMATION } from '../lib/formations'
import { usedPlayerIds } from '../lib/gameRules'
import { ROLE_TITLE } from '../lib/positions'
import { TARGET, progress } from '../lib/scoring'
import { buildIndex } from '../lib/searchPlayers'
import { shareResult } from '../lib/share'
import type { Player } from '../lib/types'

const formation = DEFAULT_FORMATION

export function Home() {
  const game = useGame(formation, PLAYERS)
  const index = useMemo(() => buildIndex(PLAYERS), [])
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
    const outcome = await shareResult(formation, game.lineup, game.total)
    if (outcome === 'copied') setShareLabel('¡Copiado!')
    else if (outcome === 'failed') setShareLabel('No se pudo compartir')
    setTimeout(() => setShareLabel('Compartir resultado'), 2200)
  }

  return (
    <>
      <div className="flag-stripe fixed inset-x-0 top-0 z-30 h-1" aria-hidden="true" />
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-xl lg:max-w-2xl">
        <GameHeader onReset={restart} canReset={game.filled > 0} />

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
          />
        </section>

        {/* on bigger screens the pitch grows but stays within the viewport height (pitch ratio 68:100) */}
        <main className="mx-auto w-full md:max-w-[min(32rem,calc((100dvh-17rem)*0.68))] md:min-w-80">
          <FootballPitch
            formation={formation}
            lineup={game.lineup}
            activeSlot={activeSlot}
            onSelectSlot={setActiveSlot}
          />
          {game.filled === 0 && (
            <p className="mt-3 text-center text-xs text-chalk-dim">
              Tocá un puesto y elegí un jugador histórico. Sus goles se revelan en la cancha. La suma tiene que dar{' '}
              <b className="text-chalk">{TARGET}</b> exacto.
            </p>
          )}
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
              changesLeft={game.changesLeft}
              onPick={pick}
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

        {(game.status === 'over' || game.outcome === 'lost') && dismissedMove !== moveKey && (
          <LostScreen
            total={game.total}
            overBy={game.overBy}
            changesLeft={game.changesLeft}
            onRestart={restart}
            onClose={() => setDismissedMove(moveKey)}
          />
        )}
      </div>
    </>
  )
}
