import type { Club } from '../lib/clubs'

const SIZE = { xs: 'h-4 w-3.5', md: 'h-12 w-10' } as const

/** Generic shield in the club's colors (no official crests). */
export function ClubCrest({ club, size = 'md' }: { club: Club; size?: keyof typeof SIZE }) {
  const [bg, fg] = club.colors
  return (
    <svg viewBox="0 0 40 48" className={`${SIZE[size]} shrink-0`} aria-hidden="true">
      <path d="M20 2 37 8v14c0 12-7.5 20-17 24C10.5 42 3 34 3 22V8z" fill={bg} stroke="rgb(255 255 255 / 0.35)" strokeWidth="1.5" />
      <path d="M17 6h6v37.5c-1 .6-2 1.1-3 1.5-1-.4-2-.9-3-1.5z" fill={fg} />
    </svg>
  )
}
