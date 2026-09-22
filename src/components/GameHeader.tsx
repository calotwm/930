import { Logo } from './Logo'

export function GameHeader({ onReset, canReset }: { onReset: () => void; canReset: boolean }) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-end gap-3">
        <Logo />
        <span className="pb-1 text-[11px] font-bold tracking-[0.22em] text-chalk-dim uppercase">
          Desafío histórico
        </span>
      </div>
      <button
        type="button"
        onClick={onReset}
        disabled={!canReset}
        className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-chalk-dim transition active:scale-95 disabled:opacity-30"
      >
        Reiniciar
      </button>
    </header>
  )
}
