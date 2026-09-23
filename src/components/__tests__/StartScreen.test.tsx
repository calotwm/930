import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('StartScreen', () => {
  it('shows the Messi question and starts the game on click', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /igualar a Messi/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /iniciar juego/i }))
    expect(screen.queryByRole('heading', { name: /igualar a Messi/i })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Marcador' })).toBeInTheDocument()
  })
})
