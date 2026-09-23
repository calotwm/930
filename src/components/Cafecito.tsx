export const CAFECITO_URL = 'https://cafecito.app/urquisoft'

function Cup({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M8 3c0 1.2-1 1.6-1 2.8S8 7.4 8 7.4M12 3c0 1.2-1 1.6-1 2.8s1 1.6 1 1.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 10h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="currentColor" />
      <path d="M17 11.5h1.5a2.5 2.5 0 0 1 0 5H17" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function CafecitoButton({ variant = 'pill' }: { variant?: 'pill' | 'block' }) {
  if (variant === 'block') {
    return (
      <a
        href={CAFECITO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl border border-sol/40 bg-sol/10 py-3.5 font-extrabold tracking-wide text-sol transition active:scale-[0.98]"
      >
        <Cup className="h-5 w-5" />
        Invitame un cafecito
      </a>
    )
  }
  return (
    <a
      href={CAFECITO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Invitame un cafecito"
      className="flex items-center gap-1.5 rounded-full border border-sol/40 bg-sol/10 px-3 py-1.5 text-xs font-bold text-sol transition active:scale-95"
    >
      <Cup className="h-4 w-4" />
      Cafecito
    </a>
  )
}

export function Credits() {
  return (
    <footer className="flex flex-col items-center gap-2 pt-2 pb-1 text-center text-[11px] text-chalk-dim">
      <p>
        hecho por <span className="font-bold text-chalk">urquisoft</span> ·{' '}
        <a href={CAFECITO_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-sol underline-offset-2 hover:underline">
          invitame un cafecito ☕
        </a>
      </p>
      <p className="opacity-70">Datos: RSSSF y Transfermarkt</p>
    </footer>
  )
}
