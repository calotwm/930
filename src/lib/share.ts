import { TARGET } from './scoring'
import type { Formation, Lineup, Player } from './types'

export function orderedPlayers(formation: Formation, lineup: Lineup): Player[] {
  // share list goes from goalkeeper to forwards
  return [...formation.slots]
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .map((s) => lineup[s.id])
    .filter((p): p is Player => Boolean(p))
}

export function shareText(players: Player[], total: number, url: string): string {
  const lines = players.map((p) => `${p.shortName} — ${p.goals}`)
  return [`930 ⚽ DESAFÍO HISTÓRICO`, `${total} / ${TARGET}`, '', ...lines, '', `Probalo: ${url}`].join('\n')
}

export async function renderShareImage(players: Player[], total: number): Promise<Blob | null> {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  try {
    await document.fonts?.load('120px Anton')
  } catch {
    // font not available; canvas falls back to Impact/sans-serif
  }

  ctx.fillStyle = '#07130d'
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 ? '#0b1c13' : '#091710'
    ctx.fillRect(0, (H / 10) * i, W, H / 10)
  }

  const display = 'Anton, Impact, sans-serif'
  ctx.fillStyle = '#f3ead3'
  ctx.font = `140px ${display}`
  ctx.fillText('930', 80, 210)
  ctx.font = `bold 34px Inter, sans-serif`
  ctx.fillStyle = '#b9b29f'
  ctx.fillText('DESAFÍO HISTÓRICO', 84, 270)

  ctx.font = `110px ${display}`
  ctx.fillStyle = total === TARGET ? '#e8b84a' : '#f3ead3'
  const score = `${total} / ${TARGET}`
  ctx.fillText(score, W - 80 - ctx.measureText(score).width, 210)

  const top = 360
  const row = (H - top - 120) / Math.max(players.length, 1)
  players.forEach((p, i) => {
    const y = top + row * i + row * 0.7
    ctx.fillStyle = i % 2 ? 'rgba(243,234,211,0.03)' : 'rgba(243,234,211,0.06)'
    ctx.fillRect(60, top + row * i + 6, W - 120, row - 12)
    ctx.fillStyle = '#f3ead3'
    ctx.font = `800 40px Inter, sans-serif`
    ctx.fillText(p.name.toUpperCase(), 90, y)
    ctx.font = `56px ${display}`
    const g = String(p.goals)
    ctx.fillText(g, W - 90 - ctx.measureText(g).width, y + 4)
  })

  ctx.fillStyle = '#b9b29f'
  ctx.font = `600 30px Inter, sans-serif`
  ctx.fillText(`${players.length} jugadores · ${total} goles`, 84, H - 60)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareResult(formation: Formation, lineup: Lineup, total: number): Promise<ShareOutcome> {
  const players = orderedPlayers(formation, lineup)
  const url = window.location.origin + window.location.pathname
  const text = shareText(players, total, url)
  try {
    if (navigator.share) {
      const blob = await renderShareImage(players, total)
      const file = blob ? new File([blob], '930.png', { type: 'image/png' }) : null
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: '930 ⚽' })
      } else {
        await navigator.share({ text, title: '930 ⚽' })
      }
      return 'shared'
    }
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    try {
      await navigator.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
}
