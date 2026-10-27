import { useEffect, useState } from 'react'
import { coutMensuel, depuisLeDebut, lignesRevenus, revenusAnnexes } from '@/lib/argent'
import { formatDate, formatEuro } from '@/lib/format'
import type { Baremes, Depute } from '@/types'
import { ExternalLink, KeyFigure } from './parts'

const PARTS = [
  { key: 'indemnite', label: 'Indemnité', fill: 'fill-red-600', bg: 'bg-red-600' },
  { key: 'speciales', label: 'Indemnités spéciales', fill: 'fill-red-900', bg: 'bg-red-900' },
  { key: 'frais', label: 'Frais de mandat', fill: 'fill-orange-500', bg: 'bg-orange-500' },
  { key: 'collaborateurs', label: 'Collaborateurs', fill: 'fill-amber-400', bg: 'bg-amber-400' },
] as const

/** Ce que le siège coûte, en tête de fiche : le chiffre qui doit frapper, puis sa décomposition */
export function Addition({
  depute,
  baremes,
  onRenvoi,
}: {
  depute: Depute
  baremes: Baremes
  /** Ouvre « Précisions et sources » sur la note demandée */
  onRenvoi: (n: number) => void
}) {
  const cout = coutMensuel(depute, baremes)
  const annuel = cout.total * 12
  const anneesDeSmic = annuel / (baremes.smic.brut * 12)
  const annexes = revenusAnnexes(lignesRevenus(depute))
  const derniereAnnee = Math.max(0, ...annexes.lignes.map((l) => l.dernier?.annee ?? 0))
  const mandats = depute.mandatsLocaux.filter((m) => m.type !== 'communautaire')
  const participations = depute.hatvp.interets?.participations
  const capital = participations?.reduce((sum, p) => sum + (p.evaluation ?? 0), 0) ?? 0

  return (
    <div className="space-y-3 px-6 pt-5 pb-3">
      <div className="space-y-3 rounded-xl border border-red-600/30 bg-red-600/5 p-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-red-700 uppercase dark:text-red-400">
            Ce siège coûte aux contribuables
          </p>
          <p className="font-heading text-4xl leading-tight font-bold tabular-nums">
            {formatEuro(cout.total, { round: true })}
            <span className="text-base font-medium text-muted-foreground"> / mois</span>
            <Renvoi n={1} onClick={onRenvoi} />
          </p>
          <p className="text-sm text-muted-foreground">
            soit <strong className="text-foreground">{formatEuro(annuel, { round: true })} par an</strong>, l'équivalent
            de{' '}
            <strong className="text-foreground">
              {anneesDeSmic.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} années
            </strong>{' '}
            de SMIC brut
            <Renvoi n={2} onClick={onRenvoi} />
          </p>
        </div>

        <Decomposition cout={cout} />

        <div className="border-t border-red-600/20 pt-3">
          <p className="text-xs text-muted-foreground">Depuis son entrée en fonction, le {formatDate(depute.dateDebut)}</p>
          <div className="flex items-start">
            <Compteur mensuel={cout.total} dateDebut={depute.dateDebut} />
            <Renvoi n={3} onClick={onRenvoi} />
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <KeyFigure
          label="En plus du mandat"
          value={
            !depute.hatvp.interets ? '—' : annexes.total > 0 ? `+${formatEuro(annexes.total, { compact: true })}` : '0 €'
          }
          hint={
            !depute.hatvp.interets
              ? 'Déclaration indisponible'
              : annexes.total > 0
                ? `par an (${derniereAnnee})`
                : 'Aucun autre revenu'
          }
          alerte={annexes.total > 0}
        />
        <KeyFigure
          label="Mandats locaux"
          value={mandats.length}
          hint={mandats.length ? 'en cours' : 'Aucun en cours'}
          alerte={mandats.length > 0}
        />
        <KeyFigure
          label="Capital déclaré"
          value={
            participations === undefined || participations === null
              ? '—'
              : participations.length === 0
                ? 'Aucun'
                : formatEuro(capital, { compact: true })
          }
          hint={
            participations === undefined
              ? 'Déclaration indisponible'
              : participations === null
                ? 'Partie non remplie'
                : participations.length === 0
                  ? 'Aucune part de société'
                  : `parts dans ${participations.length} société${participations.length > 1 ? 's' : ''}`
          }
        />
      </dl>
    </div>
  )
}

function Decomposition({ cout }: { cout: Record<(typeof PARTS)[number]['key'] | 'total', number> }) {
  const parts = PARTS.filter((p) => cout[p.key] > 0)
  // Positions cumulées des segments de la barre
  const debuts = parts.map((_, i) => parts.slice(0, i).reduce((sum, p) => sum + cout[p.key], 0))
  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${cout.total} 1`}
        preserveAspectRatio="none"
        className="block h-3 w-full overflow-hidden rounded-full"
        aria-hidden
      >
        {parts.map((p, i) => (
          <rect key={p.key} x={debuts[i]} y={0} width={cout[p.key]} height={1} className={p.fill} />
        ))}
      </svg>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span className={`size-2 shrink-0 rounded-full ${p.bg}`} />
            <span className="truncate text-muted-foreground">{p.label}</span>
            <span className="ml-auto font-medium tabular-nums">{formatEuro(cout[p.key], { round: true })}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const etoiles = (n: number) => '*'.repeat(n)

/** Astérisque renvoyant à la note de calcul correspondante */
function Renvoi({ n, onClick }: { n: number; onClick: (n: number) => void }) {
  return (
    <a
      href={`#calcul-${n}`}
      onClick={(e) => {
        e.preventDefault()
        onClick(n)
      }}
      aria-label={`Note ${n} : détail du calcul`}
      className="-mx-1 -my-2 ml-0 px-1.5 py-2 align-super text-sm font-semibold text-red-700 no-underline dark:text-red-400"
    >
      {etoiles(n)}
    </a>
  )
}

/** Notes de calcul, dans « Précisions et sources » : chaque chiffre de l'addition est reconstitué à partir des barèmes */
export function Calcul({ depute, baremes }: { depute: Depute; baremes: Baremes }) {
  const { indemnite, smic } = baremes
  const cout = coutMensuel(depute, baremes)
  const smicAnnuel = smic.brut * 12
  const euro = (n: number) => formatEuro(n)
  const miseAJour = (iso: string) => iso.split('-').reverse().join('/')

  return (
    <ol className="space-y-2 text-xs text-muted-foreground">
      <li id="calcul-1" className="flex gap-1.5">
        <span className="shrink-0 font-semibold text-red-700 dark:text-red-400">{etoiles(1)}</span>
        <div className="space-y-1">
          <p>
            Somme des montants mensuels que l'Assemblée consacre à chaque siège :{' '}
            <strong className="text-foreground">indemnité parlementaire brute</strong> {euro(indemnite.brut)} (base{' '}
            {euro(indemnite.base)} + résidence {euro(indemnite.residence)} + fonction {euro(indemnite.fonction)})
            {depute.indemnitesSpeciales.map((s) => (
              <span key={s.libelle + s.organe}>
                {' '}
                + <strong className="text-foreground">{s.libelle.toLowerCase()}</strong> {euro(s.montant)}
              </span>
            ))}{' '}
            + <strong className="text-foreground">avance de frais de mandat</strong> {euro(baremes.dotationFonctionnement)}{' '}
            + <strong className="text-foreground">crédit collaborateurs</strong> {euro(baremes.creditCollaborateurs)} ={' '}
            <strong className="text-foreground">{euro(cout.total)}</strong>.
          </p>
          <p>
            Ce sont des enveloppes maximales. Le crédit collaborateurs paie les salaires de ses assistants et n'est pas
            versé au député ; la part non utilisée n'est pas dépensée. Les frais de mandat non utilisés sont reversés en fin
            de mandat. L'indemnité est comptée en brut : {depute.civ === 'Mme' ? 'la députée' : 'le député'} touche{' '}
            {euro(indemnite.net)} net par mois, avant impôt.
          </p>
          <p>
            Ne sont pas comptés : les cotisations à la charge de l'Assemblée, les facilités de transport et les autres
            avantages que l'Assemblée ne chiffre pas.
          </p>
          <p>
            Barèmes : <ExternalLink href={baremes.source}>Assemblée nationale, fiche n° 7</ExternalLink>, mise à jour{' '}
            {miseAJour(baremes.miseAJour)}.
          </p>
        </div>
      </li>
      <li id="calcul-2" className="flex gap-1.5">
        <span className="shrink-0 font-semibold text-red-700 dark:text-red-400">{etoiles(2)}</span>
        <p>
          {euro(cout.total)} × 12 mois = {euro(cout.total * 12)} par an. SMIC brut à temps plein : {euro(smic.brut)} par
          mois au {miseAJour(smic.miseAJour)}, soit {euro(smicAnnuel)} par an. {euro(cout.total * 12)} ÷{' '}
          {euro(smicAnnuel)} ={' '}
          {((cout.total * 12) / smicAnnuel).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} années de SMIC (
          <ExternalLink href={smic.source}>service-public.gouv.fr</ExternalLink>).
        </p>
      </li>
      <li id="calcul-3" className="flex gap-1.5">
        <span className="shrink-0 font-semibold text-red-700 dark:text-red-400">{etoiles(3)}</span>
        <p>
          {euro(cout.total)} par mois × nombre de mois écoulés depuis le {formatDate(depute.dateDebut)} (mois moyen de
          30,44 jours), recalculé en direct. Montant théorique : il suppose toutes les enveloppes consommées chaque mois,
          au barème actuel.
        </p>
      </li>
    </ol>
  )
}

/** Compteur qui tourne en direct : l'argent public mobilisé seconde après seconde */
function Compteur({ mensuel, dateDebut }: { mensuel: number; dateDebut: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setInterval(() => setNow(Date.now()), reduit ? 1000 : 100)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p className="font-heading text-2xl font-bold text-red-700 tabular-nums dark:text-red-400">
      {depuisLeDebut(mensuel, dateDebut, now).toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </p>
  )
}
