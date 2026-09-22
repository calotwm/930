/** Sol de Mayo with a football pentagon in the middle. */
export function SunBall({ className = '', spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g className={spin ? 'animate-sun-spin origin-center [transform-box:fill-box]' : ''} fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect key={deg} x="29.5" y="2" width="5" height="11" rx="1.5" transform={`rotate(${deg} 32 32)`} />
        ))}
      </g>
      <circle cx="32" cy="32" r="16" fill="currentColor" />
      <path d="M32 23.5l8 5.8-3.1 9.4h-9.8l-3.1-9.4z" className="fill-night" />
    </svg>
  )
}

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const text = size === 'lg' ? 'text-7xl' : 'text-4xl'
  return (
    <span className={`font-display ${text} relative inline-flex items-center leading-none tracking-tight text-chalk`} aria-label="930">
      93
      <SunBall className="ml-[0.02em] h-[0.86em] w-[0.86em] text-sol" />
      <span className="absolute inset-x-0 -bottom-[0.14em] h-[0.08em] rounded-full bg-celeste" aria-hidden="true" />
    </span>
  )
}
