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

/** Ball flying over the crossbar: you went over 930. */
export function BallOverBar({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 180" className={className} aria-hidden="true">
      {/* goal */}
      <path d="M22 170V96h116v74" fill="none" stroke="#f7f4ec" strokeWidth="7" strokeLinejoin="round" />
      <path d="M30 104h100M30 122h100M30 140h100M30 158h100M48 100v70M66 100v70M84 100v70M102 100v70M120 100v70" stroke="#f7f4ec" strokeOpacity="0.18" strokeWidth="2" />
      {/* trajectory */}
      <path d="M40 150C60 90 86 60 116 34" fill="none" stroke="#ff6b5e" strokeWidth="3" strokeDasharray="4 7" strokeLinecap="round" />
      <g className="bob" transform="translate(124 28)">
        <circle r="17" fill="#f7f4ec" />
        <path d="M0-7l6.7 4.9-2.6 7.9h-8.2l-2.6-7.9z" fill="#0a1626" />
        <path d="M0-17v10M16 -5l-9 2M10 14l-6-9M-10 14l6-9M-16-5l9 2" stroke="#0a1626" strokeWidth="1.6" />
      </g>
    </svg>
  )
}

/** Fuel gauge on empty: 930 can no longer be reached. */
export function EmptyTank({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 180" className={className} aria-hidden="true">
      <path d="M20 118a60 60 0 0 1 120 0" fill="none" stroke="#1a3252" strokeWidth="16" strokeLinecap="round" />
      <path d="M20 118a60 60 0 0 1 22-46" fill="none" stroke="#ff6b5e" strokeWidth="16" strokeLinecap="round" />
      <path d="M118 72a60 60 0 0 1 22 46" fill="none" stroke="#75aadb" strokeWidth="16" strokeLinecap="round" />
      <text x="22" y="148" fontFamily="Anton, Impact, sans-serif" fontSize="20" fill="#ff6b5e">E</text>
      <text x="128" y="148" fontFamily="Anton, Impact, sans-serif" fontSize="20" fill="#75aadb">F</text>
      {/* needle resting on empty */}
      <g transform="rotate(-62 80 118)">
        <path d="M78 118L80 60l2 58z" fill="#f7f4ec" />
      </g>
      <circle cx="80" cy="118" r="9" fill="#f7f4ec" />
      {/* pump icon */}
      <g transform="translate(66 132)" fill="#a9bcd3">
        <rect width="18" height="26" rx="3" />
        <rect x="3" y="4" width="12" height="7" rx="1.5" fill="#0a1626" />
        <path d="M18 8h5v14a3 3 0 0 1-6 0v-4" fill="none" stroke="#a9bcd3" strokeWidth="2.5" />
      </g>
    </svg>
  )
}
