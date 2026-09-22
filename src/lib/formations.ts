import type { Formation } from './types'

export const F_4_2_1_3: Formation = {
  id: '4-2-1-3',
  name: '4-2-1-3',
  slots: [
    { id: 'del-c', role: 'DEL', x: 50, y: 11 },
    { id: 'del-l', role: 'DEL', x: 17, y: 26 },
    { id: 'mp', role: 'MP', x: 50, y: 32 },
    { id: 'del-r', role: 'DEL', x: 83, y: 26 },
    { id: 'mc-l', role: 'MC', x: 30, y: 51 },
    { id: 'mc-r', role: 'MC', x: 70, y: 51 },
    { id: 'def-li', role: 'DEF', x: 12, y: 71 },
    { id: 'def-cl', role: 'DEF', x: 37, y: 74 },
    { id: 'def-cr', role: 'DEF', x: 63, y: 74 },
    { id: 'def-ld', role: 'DEF', x: 88, y: 71 },
    { id: 'arq', role: 'ARQ', x: 50, y: 90 },
  ],
}

export const FORMATIONS: Record<string, Formation> = {
  [F_4_2_1_3.id]: F_4_2_1_3,
}

export const DEFAULT_FORMATION = F_4_2_1_3
