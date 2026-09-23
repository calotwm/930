import { describe, expect, it } from 'vitest'
import { DEFAULT_FORMATION as F } from '../formations'
import {
  MAX_CHANGES,
  MAX_WINDOWS,
  NO_CHANGES,
  assignPlayer,
  canChange,
  changesLeft,
  costsChange,
  emptyLineup,
  fillSlot,
  filledCount,
  isComplete,
  isWin,
  removePlayer,
  spendChange,
  validateLineup,
  windowsLeft,
} from '../gameRules'
import { canPlay } from '../positions'
import { TARGET, overBy, remainingGoals, scoreStatus, totalGoals } from '../scoring'
import { findCompletion, findCompletionBounded } from '../solver'
import type { Lineup, Player, Position } from '../types'

let n = 0
const mk = (position: Position, goals: number): Player => ({
  id: `p${++n}`,
  name: `Jugador ${n}`,
  shortName: `J${n}`,
  position,
  goals,
  club: 'Club',
  clubs: ['Club'],
  division: 'Primera',
  scope: 'Primera, carrera',
  era: '2000s',
  source: { name: 'test', url: 'https://example.test' },
})

function place(lineup: Lineup, slotId: string, p: Player): Lineup {
  const r = assignPlayer(F, lineup, slotId, p)
  if (!r.ok) throw new Error(r.error)
  return r.lineup
}

/** GK 0 + 4 DEF x10 + 2 MC x20 + MP 10 + DEL 300/290/250 = 930 */
function winningLineup() {
  const players: Record<string, Player> = {
    arq: mk('GK', 0),
    'def-li': mk('LB', 10),
    'def-cl': mk('CB', 10),
    'def-cr': mk('CB', 10),
    'def-ld': mk('RB', 10),
    'mc-l': mk('CM', 20),
    'mc-r': mk('DM', 20),
    mp: mk('AM', 10),
    'del-l': mk('LW', 300),
    'del-c': mk('ST', 290),
    'del-r': mk('RW', 250),
  }
  let lineup = emptyLineup(F)
  for (const [slot, p] of Object.entries(players)) lineup = place(lineup, slot, p)
  return { lineup, players }
}

describe('scoring', () => {
  it('suma goles al agregar jugadores', () => {
    let l = emptyLineup(F)
    l = place(l, 'del-c', mk('ST', 295))
    l = place(l, 'del-l', mk('ST', 147))
    expect(totalGoals(l)).toBe(442)
    expect(filledCount(l)).toBe(2)
  })

  it('resta goles al eliminar un jugador', () => {
    let l = place(emptyLineup(F), 'del-c', mk('ST', 295))
    l = place(l, 'mp', mk('AM', 50))
    l = removePlayer(l, 'del-c')
    expect(totalGoals(l)).toBe(50)
    expect(l['del-c']).toBeNull()
  })

  it('reemplaza un jugador en el mismo slot', () => {
    let l = place(emptyLineup(F), 'del-c', mk('ST', 295))
    l = place(l, 'del-c', mk('ST', 100))
    expect(totalGoals(l)).toBe(100)
    expect(filledCount(l)).toBe(1)
  })

  it('calcula restantes y exceso', () => {
    expect(remainingGoals(742)).toBe(188)
    expect(remainingGoals(943)).toBe(0)
    expect(overBy(943)).toBe(13)
    expect(overBy(900)).toBe(0)
  })

  it('detecta estados under / exact / over', () => {
    expect(scoreStatus(929)).toBe('under')
    expect(scoreStatus(TARGET)).toBe('exact')
    expect(scoreStatus(931)).toBe('over')
  })
})

describe('victoria', () => {
  it('detecta exactamente 930 con 11 jugadores', () => {
    const { lineup } = winningLineup()
    expect(totalGoals(lineup)).toBe(930)
    expect(isComplete(F, lineup)).toBe(true)
    expect(isWin(F, lineup)).toBe(true)
    expect(validateLineup(F, lineup)).toEqual([])
  })

  it('no gana si supera 930', () => {
    const { lineup } = winningLineup()
    const l = place(lineup, 'mp', mk('AM', 23))
    expect(totalGoals(l)).toBe(943)
    expect(isWin(F, l)).toBe(false)
    expect(overBy(totalGoals(l))).toBe(13)
  })

  it('no gana con 930 si faltan jugadores', () => {
    let l = emptyLineup(F)
    l = place(l, 'del-c', mk('ST', 930))
    expect(totalGoals(l)).toBe(930)
    expect(isWin(F, l)).toBe(false)
  })

  it('valida que haya 11 jugadores', () => {
    const { lineup } = winningLineup()
    const l = removePlayer(lineup, 'arq')
    expect(isComplete(F, l)).toBe(false)
    expect(validateLineup(F, l)).toContain('arq: vacío')
    expect(F.slots).toHaveLength(11)
  })
})

describe('posiciones', () => {
  it('arquero sólo en el arco', () => {
    expect(canPlay('GK', 'ARQ')).toBe(true)
    expect(canPlay('GK', 'DEL')).toBe(false)
    expect(canPlay('GK', 'DEF')).toBe(false)
    expect(canPlay('ST', 'ARQ')).toBe(false)
  })

  it('extremos pueden jugar de delantero o enganche', () => {
    expect(canPlay('LW', 'DEL')).toBe(true)
    expect(canPlay('RW', 'MP')).toBe(true)
    expect(canPlay('LW', 'DEF')).toBe(false)
  })

  it('rechaza asignar a un slot incompatible', () => {
    const r = assignPlayer(F, emptyLineup(F), 'del-c', mk('GK', 0))
    expect(r).toEqual({ ok: false, error: 'position' })
  })

  it('rechaza slot inexistente', () => {
    const r = assignPlayer(F, emptyLineup(F), 'lateral-volador', mk('ST', 1))
    expect(r).toEqual({ ok: false, error: 'unknown-slot' })
  })

  it('formación: 1 ARQ, 4 DEF, 3 MED, 3 DEL', () => {
    const count = (role: string) => F.slots.filter((s) => s.role === role).length
    expect(count('ARQ')).toBe(1)
    expect(count('DEF')).toBe(4)
    expect(count('MC') + count('MP')).toBe(3)
    expect(count('DEL')).toBe(3)
  })
})

describe('duplicados', () => {
  it('evita el mismo jugador en dos slots', () => {
    const p = mk('ST', 200)
    const l = place(emptyLineup(F), 'del-c', p)
    expect(assignPlayer(F, l, 'del-l', p)).toEqual({ ok: false, error: 'duplicate' })
  })

  it('permite reasignar al mismo jugador en su propio slot', () => {
    const p = mk('ST', 200)
    const l = place(emptyLineup(F), 'del-c', p)
    expect(assignPlayer(F, l, 'del-c', p).ok).toBe(true)
  })

  it('validateLineup detecta repetidos inyectados', () => {
    const { lineup, players } = winningLineup()
    const bad = { ...lineup, 'del-r': players['del-l'] }
    expect(validateLineup(F, bad).some((e) => e.includes('repetido'))).toBe(true)
  })
})

describe('solver (restricciones futuras / factibilidad)', () => {
  it('encuentra una completación exacta respetando posiciones y sin repetir', () => {
    const { players } = winningLineup()
    const pool = [...Object.values(players), mk('ST', 5), mk('GK', 3)]
    const sol = findCompletion(F, emptyLineup(F), pool, TARGET)
    expect(sol).not.toBeNull()
    const lineup = { ...emptyLineup(F), ...sol }
    expect(validateLineup(F, lineup)).toEqual([])
    expect(totalGoals(lineup)).toBe(930)
  })

  it('devuelve null cuando es imposible', () => {
    const { players } = winningLineup()
    const pool = Object.values(players).map((p) => ({ ...p, goals: p.goals + 1 }))
    expect(findCompletion(F, emptyLineup(F), pool, TARGET)).toBeNull()
  })

  it('con tope de pasos agotado responde "unknown" en vez de colgarse', () => {
    const { players } = winningLineup()
    const pool = [...Object.values(players), mk('ST', 5), mk('GK', 3)]
    expect(findCompletionBounded(F, emptyLineup(F), pool, TARGET, 1)).toBe('unknown')
    expect(findCompletionBounded(F, emptyLineup(F), pool, TARGET)).not.toBe('unknown')
  })

  it('devuelve null si ya se pasó', () => {
    const l = place(emptyLineup(F), 'del-c', mk('ST', 931))
    expect(findCompletion(F, l, [], TARGET)).toBeNull()
  })

  it('no usa dos veces al mismo jugador aunque encaje en dos slots', () => {
    // 30 goals missing, but the only AM (15) cannot fill both MP and MC
    const base = winningLineup()
    let l = removePlayer(base.lineup, 'mp')
    l = removePlayer(l, 'mc-l')
    const am = mk('AM', 15)
    const sol = findCompletion(F, l, [am], TARGET)
    expect(sol).toBeNull()
  })
})

describe('cambios: 5 en 3 ventanas', () => {
  it('sólo quitar/reemplazar un jugador colocado cuesta un cambio', () => {
    const l = place(emptyLineup(F), 'del-c', mk('ST', 10))
    expect(costsChange(l, 'del-c')).toBe(true)
    expect(costsChange(l, 'del-l')).toBe(false)
  })

  it('cambios seguidos y rellenar lo que se vació comparten ventana', () => {
    let c = spendChange(NO_CHANGES, 'a', true)
    c = fillSlot(c, 'a')
    c = spendChange(c, 'b', false)
    expect(c.used).toBe(2)
    expect(c.windows).toBe(1)
    expect(c.open).not.toBeNull()
  })

  it('completar un puesto que ya estaba vacío cierra la ventana', () => {
    let c = spendChange(NO_CHANGES, 'a', false)
    c = fillSlot(c, 'z')
    expect(c.open).toBeNull()
    c = spendChange(c, 'b', false)
    expect(c.windows).toBe(2)
  })

  it('se acaban los cambios o las ventanas', () => {
    let c = NO_CHANGES
    for (let i = 0; i < MAX_CHANGES; i++) c = spendChange(c, `s${i}`, false)
    expect(changesLeft(c)).toBe(0)
    expect(canChange(c)).toBe(false)

    let w = NO_CHANGES
    for (let i = 0; i < MAX_WINDOWS; i++) w = fillSlot(spendChange(w, `s${i}`, false), 'otro')
    expect(windowsLeft(w)).toBe(0)
    expect(changesLeft(w)).toBe(MAX_CHANGES - MAX_WINDOWS)
    expect(canChange(w)).toBe(false)
  })
})
