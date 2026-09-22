import { describe, expect, it } from 'vitest'
import { buildIndex, normalize, searchPlayers } from '../searchPlayers'
import type { Player } from '../types'

const P = (id: string, name: string, position: Player['position'], goals: number, clubs: string[]): Player => ({
  id,
  name,
  shortName: name.split(' ').slice(1).join(' '),
  position,
  goals,
  club: clubs[0],
  clubs,
  division: 'Primera',
  scope: 'Primera, carrera',
  era: '1930s',
  source: { name: 't', url: 'https://example.test' },
})

const index = buildIndex([
  P('erico', 'Arsenio Erico', 'ST', 295, ['Independiente', 'Huracán']),
  P('labruna', 'Ángel Labruna', 'ST', 294, ['River Plate']),
  P('gk', 'Luis Ardente', 'GK', 9, ['Colón']),
  P('lema', 'Cristian Lema', 'CB', 23, ['Newell’s', 'Boca Juniors']),
])

describe('searchPlayers', () => {
  it('normaliza acentos y mayúsculas', () => {
    expect(normalize('ÁNGEL Labruña')).toBe('angel labruna')
  })

  it('busca por nombre, apellido y club', () => {
    expect(searchPlayers(index, 'angel').map((p) => p.id)).toEqual(['labruna'])
    expect(searchPlayers(index, 'erico').map((p) => p.id)).toEqual(['erico'])
    expect(searchPlayers(index, 'huracan').map((p) => p.id)).toEqual(['erico'])
    expect(searchPlayers(index, 'boca').map((p) => p.id)).toEqual(['lema'])
  })

  it('coincide sólo al inicio de palabra', () => {
    expect(searchPlayers(index, 'rico').map((p) => p.id)).toEqual([])
    expect(searchPlayers(index, 'lab').map((p) => p.id)).toEqual(['labruna'])
  })

  it('busca por posición', () => {
    expect(searchPlayers(index, 'arq').map((p) => p.id)).toEqual(['gk'])
  })

  it('filtra por rol del slot', () => {
    expect(searchPlayers(index, '', { role: 'ARQ' }).map((p) => p.id)).toEqual(['gk'])
    expect(searchPlayers(index, '', { role: 'DEL' }).map((p) => p.id)).toEqual(['erico', 'labruna'])
  })

  it('ordena por apellido, no por goles (los goles están ocultos)', () => {
    expect(searchPlayers(index, '').map((p) => p.id)).toEqual(['gk', 'erico', 'labruna', 'lema'])
  })

  it('devuelve todos los resultados, sin tope', () => {
    expect(searchPlayers(index, '')).toHaveLength(4)
  })
})
