import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../../App'

afterEach(cleanup)

describe('StartScreen', () => {
  it('shows the Messi question and starts the game on click', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /igualar a Messi/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /iniciar juego/i }))
    expect(screen.queryByRole('heading', { name: /igualar a Messi/i })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Marcador' })).toBeInTheDocument()
  })
})

describe('club mode', () => {
  it('picks a club and starts a game limited to it', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /modo por club/i }))
    fireEvent.click(screen.getByRole('button', { name: /River Plate/ }))
    expect(screen.getByRole('region', { name: 'Marcador' })).toBeInTheDocument()
    expect(screen.getByText(/Modo River/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /volver al inicio/i }))
    expect(screen.getByRole('heading', { name: /igualar a Messi/i })).toBeInTheDocument()
  })
})
