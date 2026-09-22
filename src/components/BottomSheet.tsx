import { useEffect, type ReactNode } from 'react'

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-up relative flex h-[82dvh] w-full max-w-lg flex-col rounded-t-3xl bg-night-2 pb-[env(safe-area-inset-bottom)] shadow-2xl sm:h-[70vh] sm:rounded-3xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="font-display text-2xl tracking-wide uppercase">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-xl text-chalk-dim active:scale-90"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
