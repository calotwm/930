import { CLUBS, type Club } from '../lib/clubs'
import { TARGET } from '../lib/scoring'
import { ClubCrest } from './ClubCrest'

export function ClubPicker({ onPick, onBack }: { onPick: (club: Club) => void; onBack: () => void }) {
  return (
    <div className="relative min-h-dvh" role="main" aria-label="Elegí un club">
      <div className="flag-stripe h-1.5 w-full" aria-hidden="true" />
      <div className="animate-fade-in mx-auto flex max-w-md flex-col gap-5 px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:max-w-xl">
        <button
          type="button"
          onClick={onBack}
          className="self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] font-bold text-chalk-dim active:scale-95"
        >
          ← Volver
        </button>
        <div className="space-y-2 text-center">
          <h1 className="font-display text-4xl leading-none text-chalk uppercase">Modo por club</h1>
          <p className="text-[14px] leading-snug text-chalk-dim">
            Llegá a <b className="text-sol">{TARGET}</b> solo con jugadores que pasaron por el club. Cuentan los goles de toda su
            carrera.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {CLUBS.map((club) => (
            <li key={club.id}>
              <button
                type="button"
                onClick={() => onPick(club)}
                className="flex w-full items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-3 text-left transition active:scale-[0.97] hover:border-celeste/50"
              >
                <ClubCrest club={club} size="sm" />
                <span className="min-w-0 text-[12.5px] leading-tight font-extrabold tracking-tight text-chalk sm:text-[14px] sm:tracking-normal" lang="es">{club.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
