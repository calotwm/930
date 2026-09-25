import { useState } from 'react'
import { ClubPicker } from './components/ClubPicker'
import { StartScreen } from './components/StartScreen'
import { PLAYERS } from './data/players'
import type { Club } from './lib/clubs'
import { Home } from './pages/Home'

type Screen = { name: 'start' } | { name: 'clubs' } | { name: 'game'; club: Club | null }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'start' })
  const home = () => setScreen({ name: 'start' })
  if (screen.name === 'clubs') return <ClubPicker onPick={(club) => setScreen({ name: 'game', club })} onBack={home} />
  if (screen.name === 'game') return <Home key={screen.club?.id ?? 'classic'} club={screen.club} onHome={home} />
  return (
    <StartScreen
      playerCount={PLAYERS.length}
      onStart={() => setScreen({ name: 'game', club: null })}
      onClubMode={() => setScreen({ name: 'clubs' })}
    />
  )
}
