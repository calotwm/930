/** Trophy with the Sol de Mayo on the cup. */
export function Trophy({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 180" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cup" x1="0" x2="1">
          <stop offset="0" stopColor="#c98a06" />
          <stop offset="0.45" stopColor="#f6b40e" />
          <stop offset="0.6" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#c98a06" />
        </linearGradient>
      </defs>
      <path d="M40 30c-26 0-30 40 6 52M120 30c26 0 30 40-6 52" fill="none" stroke="#f6b40e" strokeWidth="9" strokeLinecap="round" />
      <path d="M36 16h88v38c0 32-20 54-44 54S36 86 36 54z" fill="url(#cup)" />
      <path d="M68 104h24l6 26H62z" fill="#e0a20a" />
      <rect x="48" y="128" width="64" height="16" rx="4" fill="#f6b40e" />
      <rect x="40" y="144" width="80" height="22" rx="6" fill="#11233a" stroke="#75aadb" strokeWidth="3" />
      <rect x="40" y="152" width="80" height="6" fill="#ffffff" opacity="0.9" />
      <g transform="translate(80 56)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
          <rect key={d} x="-2" y="-24" width="4" height="9" rx="1.5" fill="#fff5d6" transform={`rotate(${d})`} />
        ))}
        <circle r="12" fill="#fff5d6" />
        <circle r="8" fill="#f6b40e" />
      </g>
      <path d="M46 22c2 20 6 36 16 48" stroke="#fff" strokeOpacity="0.45" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** Linesman flag raised: you went over 930. */
export function OffsideFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 180" className={className} aria-hidden="true">
      <rect x="44" y="20" width="7" height="150" rx="3.5" fill="#f7f4ec" />
      <rect x="40" y="150" width="15" height="24" rx="6" fill="#a9bcd3" />
      <g className="flag-wave">
        <path d="M51 24h86v62H51z" fill="#ff6b5e" />
        <path d="M51 24h43v31H51zM94 55h43v31H94z" fill="#f6b40e" />
        <path d="M51 24h86v62H51z" fill="none" stroke="#0a1626" strokeOpacity="0.25" strokeWidth="2" />
      </g>
    </svg>
  )
}

/** Red card held up, with a whistle: out of changes. */
export function RedCard({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 180" className={className} aria-hidden="true">
      <g transform="rotate(-10 80 80)">
        <rect x="42" y="14" width="76" height="108" rx="10" fill="#ff4d3d" />
        <rect x="42" y="14" width="76" height="108" rx="10" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" />
        <path d="M52 24h24" stroke="#fff" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />
      </g>
      <g transform="translate(58 128)">
        <path d="M0 18a20 20 0 1 0 40 0 20 20 0 0 0-40 0z" fill="#a9bcd3" />
        <rect x="30" y="4" width="40" height="16" rx="6" fill="#a9bcd3" />
        <circle cx="20" cy="18" r="7" fill="#0a1626" />
        <path d="M70 12h14" stroke="#75aadb" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  )
}
