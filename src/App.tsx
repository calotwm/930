import { useState } from 'react'
import { StartScreen } from './components/StartScreen'
import { PLAYERS } from './data/players'
import { Home } from './pages/Home'

export default function App() {
  const [started, setStarted] = useState(false)
  if (!started) return <StartScreen playerCount={PLAYERS.length} onStart={() => setStarted(true)} />
  return <Home />
}
