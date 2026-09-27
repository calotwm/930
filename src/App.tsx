import { useState } from 'react'
import { ClubPicker } from './components/ClubPicker'
import { StartScreen } from './components/StartScreen'
import { PLAYERS } from './data/players'
import type { Club } from './lib/clubs'
import { Home } from './pages/Home'

type Screen = { name: 'start' } | { name: 'clubs' } | { name: 'game'; club: Club | null; ascenso: boolean }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'start' })
  const home = () => setScreen({ name: 'start' })
  if (screen.name === 'clubs')
    return <ClubPicker onPick={(club) => setScreen({ name: 'game', club, ascenso: false })} onBack={home} />
  if (screen.name === 'game')
    return (
      <Home
        key={screen.ascenso ? 'ascenso' : (screen.club?.id ?? 'classic')}
        club={screen.club}
        ascenso={screen.ascenso}
        onHome={home}
      />
    )
  return (
    <StartScreen
      playerCount={PLAYERS.length}
      onStart={() => setScreen({ name: 'game', club: null, ascenso: false })}
      onClubMode={() => setScreen({ name: 'clubs' })}
      onAscensoMode={() => setScreen({ name: 'game', club: null, ascenso: true })}
    />
  )
}
