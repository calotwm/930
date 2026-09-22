export function Ball({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="9.2" fill="currentColor" />
      <path d="M10 5.6l4.2 3-1.6 4.9H7.4L5.8 8.6z" className="fill-night" />
      <path
        d="M10 .8v4.8M14.2 8.6l4.6-1.5M12.6 13.5l2.8 3.9M7.4 13.5l-2.8 3.9M5.8 8.6L1.2 7.1"
        className="stroke-night"
        strokeWidth="1.2"
      />
    </svg>
  )
}

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const text = size === 'lg' ? 'text-7xl' : 'text-4xl'
  const ball = size === 'lg' ? 'h-[0.72em] w-[0.72em]' : 'h-[0.7em] w-[0.7em]'
  return (
    <span className={`font-display ${text} inline-flex items-center leading-none tracking-tight text-chalk`} aria-label="930">
      93
      <Ball className={`${ball} ml-[0.04em] text-chalk`} />
    </span>
  )
}
