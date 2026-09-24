import { useEffect, useState, type ReactNode } from 'react'

/**
 * The part of the screen not covered by the on-screen keyboard. iOS Safari keeps the layout
 * viewport full-height when the keyboard opens, so a sheet sized in dvh ends up under it.
 */
function useVisibleViewport(active: boolean) {
  const [box, setBox] = useState<{ top: number; height: number } | null>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!active || !vv) return
    const update = () => setBox({ top: vv.offsetTop, height: vv.height })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [active])
  return box
}

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

  const viewport = useVisibleViewport(open)
  // keyboard open: the visible area is clearly shorter than the window
  const keyboard = viewport !== null && viewport.height < window.innerHeight * 0.85

  if (!open) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-40 flex h-dvh items-end justify-center sm:items-center"
      style={viewport ? { top: viewport.top, height: viewport.height } : undefined}
    >
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
        className={`animate-sheet-up relative flex w-full max-w-lg flex-col rounded-t-3xl bg-night-2 shadow-2xl sm:h-[70vh] sm:rounded-3xl ${
          keyboard ? 'h-full rounded-t-none pb-0' : 'h-[82%] pb-[env(safe-area-inset-bottom)]'
        }`}
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
