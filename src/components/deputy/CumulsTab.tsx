import { Badge } from '@/components/ui/badge'
import {
  type AnneeRevenus,
  CATEGORIES,
  type LigneRevenu,
  estExecutif,
  fonctionAffichee,
  lignesRevenus,
  mandatDeclare,
  ORDRE_CATEGORIES,
  revenusAnnexes,
  revenusParAnnee,
} from '@/lib/argent'
import { formatDate, formatEuro } from '@/lib/format'
import type { Baremes, Depute, MandatLocal } from '@/types'
import { MissingData, Note, Section } from './parts'

export function CumulsTab({ depute, baremes }: { depute: Depute; baremes: Baremes }) {
  const lignes = lignesRevenus(depute)
  const annees = revenusParAnnee(lignes)
  const annexes = revenusAnnexes(lignes)
  const parcours = lignes.filter((l) => (l.categorie === 'europe' || l.categorie === 'senat') && !l.enCours)
  const { interets, autresMandats } = depute.hatvp

  return (
    <div className="divide-y">
      <Section title="Revenus déclarés, année par année">
        {!interets ? (
          <MissingData title="Déclaration d'intérêts non disponible">
            Sans contenu publié, impossible de reconstituer ses revenus déclarés.
          </MissingData>
        ) : annees.length ? (
          <Graphique annees={annees} smicAnnuel={baremes.smic.brut * 12} />
        ) : (
          <Note>Aucun montant déclaré.</Note>
        )}
      </Section>

      <Section
        title="En parallèle du mandat"
        aside={
          annexes.total > 0 && (
            <Badge className="bg-orange-600 text-white tabular-nums">+{formatEuro(annexes.total, { round: true })} / an</Badge>
          )
        }
      >
        {!interets ? (
          <Note>Déclaration d'intérêts non disponible.</Note>
        ) : annexes.lignes.length ? (
          <ul className="divide-y rounded-lg border">
            {annexes.lignes.map((l, i) => (
              <LigneAnnexe key={i} ligne={l} />
            ))}
          </ul>
        ) : (
          <Note>Aucune activité ni aucun mandat déclarés en parallèle du mandat de député.</Note>
        )}
      </Section>

      <Section title="Mandats locaux en cours" aside={<Badge variant="outline">Répertoire national des élus</Badge>}>
        {depute.mandatsLocaux.length ? (
          <>
            <ul className="divide-y rounded-lg border">
              {depute.mandatsLocaux.map((m, i) => (
                <MandatRne key={i} mandat={m} declares={interets?.mandats ?? null} />
              ))}
            </ul>
            <Plafond declare={annexes.locaux} plafondMensuel={baremes.plafondCumul} />
          </>
        ) : (
          <Note>Aucun mandat local en cours au Répertoire national des élus.</Note>
        )}
      </Section>

      {(parcours.length > 0 || autresMandats.length > 0) && (
        <Section title="Autres mandats et fonctions">
          <ul className="space-y-3">
            {parcours.map((l, i) => {
              const total = l.revenu.montants.reduce((sum, m) => sum + (m.montant ?? 0), 0)
              return (
                <li key={i} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className={`size-2 shrink-0 rounded-full ${CATEGORIES[l.categorie].bg}`} />
                      {l.revenu.intitule}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[l.revenu.debut, l.revenu.fin].filter(Boolean).join(' – ')}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums">{formatEuro(total, { round: true })}</div>
                    <div className="text-xs text-muted-foreground">déclarés au total</div>
                  </div>
                </li>
              )
            })}
            {autresMandats.map((a) => (
              <li key={`${a.type}${a.qualite}`} className="space-y-0.5">
                <div className="font-medium">{a.qualite ?? a.institution}</div>
                <div className="text-xs text-muted-foreground">
                  {a.dernierDepot
                    ? `Déclaration déposée à la HATVP pour cette fonction, la dernière le ${formatDate(a.dernierDepot)}`
                    : 'Déclaration déposée à la HATVP pour cette fonction, en cours de traitement'}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

    </div>
  )
}

/** Précisions de l'onglet, affichées dans « Précisions et sources » en bas de la fiche */
export function NotesCumuls({ depute, baremes }: { depute: Depute; baremes: Baremes }) {
  const rneMiseAJour = depute.mandatsLocaux[0]?.miseAJour
  return (
    <>
      <Note>
        Revenus : montants que le député a lui-même déclarés à la HATVP, bruts ou nets selon les déclarations, pour les
        cinq années précédant sa déclaration. Ils ne sont pas vérifiés par l'application.
      </Note>
      <Note>
        « En parallèle du mandat » : activités sans date de fin, ou terminées après son entrée en fonction, avec le
        dernier montant annuel déclaré. « Déclaré à 0 € » signifie que la fonction est déclarée sans rémunération.
      </Note>
      <Note>
        Mandats locaux : Répertoire national des élus du ministère de l'Intérieur
        {rneMiseAJour && `, mis à jour le ${formatDate(rneMiseAJour)}`}. Les élus y sont retrouvés grâce à leur date de
        naissance et à leur nom. Un mandat terminé depuis peut encore y figurer.
      </Note>
      <Note>
        Les indemnités de mandats locaux s'ajoutent à l'indemnité parlementaire dans la limite de{' '}
        {formatEuro(baremes.plafondCumul)} par mois ; au-delà, elles sont écrêtées. Les fonctions exécutives locales
        (maire, adjoint, président ou vice-président d'une collectivité ou d'une intercommunalité) sont incompatibles
        avec le mandat de député depuis 2017.
      </Note>
    </>
  )
}

const LARGEUR = 320
const HAUTEUR = 170
const MARGE = { haut: 18, bas: 22, gauche: 4, droite: 4 }

/** Barres empilées par catégorie, avec le SMIC annuel en repère */
function Graphique({ annees, smicAnnuel }: { annees: AnneeRevenus[]; smicAnnuel: number }) {
  const max = Math.max(smicAnnuel, ...annees.map((a) => a.total)) * 1.08
  const zone = HAUTEUR - MARGE.haut - MARGE.bas
  const y = (v: number) => MARGE.haut + zone - (v / max) * zone
  const pas = (LARGEUR - MARGE.gauche - MARGE.droite) / annees.length
  const barre = Math.min(34, pas * 0.68)
  const presentes = ORDRE_CATEGORIES.filter((c) => annees.some((a) => a.parts[c]))
  const pic = annees.reduce((a, b) => (b.total > a.total ? b : a))

  return (
    <figure className="space-y-2">
      <p className="text-sm">
        Jusqu'à <strong className="tabular-nums">{formatEuro(pic.total, { round: true })}</strong> déclarés en{' '}
        {pic.annee}, soit <strong>{(pic.total / smicAnnuel).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} fois</strong>{' '}
        le SMIC brut annuel.
      </p>
      <svg
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`Revenus déclarés par année : ${annees.map((a) => `${a.annee}, ${formatEuro(a.total, { round: true })}`).join(' ; ')}`}
      >
        {annees.map((a, i) => {
          const x = MARGE.gauche + i * pas + (pas - barre) / 2
          let cumul = 0
          return (
            <g key={a.annee}>
              {presentes.map((c) => {
                const v = a.parts[c]
                if (!v) return null
                const haut = y(cumul + v)
                const h = y(cumul) - haut
                cumul += v
                return (
                  <rect key={c} x={x} y={haut} width={barre} height={h} className={CATEGORIES[c].fill}>
                    <title>{`${a.annee} · ${CATEGORIES[c].label} : ${formatEuro(v, { round: true })}`}</title>
                  </rect>
                )
              })}
              <text
                x={x + barre / 2}
                y={y(a.total) - 4}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold tabular-nums"
              >
                {formatEuro(a.total, { compact: true })}
              </text>
              <text
                x={x + barre / 2}
                y={HAUTEUR - 5}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {a.annee}
              </text>
            </g>
          )
        })}
        <line
          x1={0}
          x2={LARGEUR}
          y1={y(smicAnnuel)}
          y2={y(smicAnnuel)}
          strokeDasharray="3 2"
          className="stroke-foreground/60"
          strokeWidth={0.8}
        />
      </svg>
      <figcaption>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {presentes.map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${CATEGORIES[c].bg}`} />
              {CATEGORIES[c].label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="w-3 border-t border-dashed border-foreground/60" />
            SMIC brut annuel
          </li>
        </ul>
      </figcaption>
    </figure>
  )
}

function LigneAnnexe({ ligne }: { ligne: LigneRevenu }) {
  const { revenu, categorie, dernier, doublon } = ligne
  const masque = revenu.montants.some((m) => m.montant === null)
  return (
    <li className="flex items-start justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span className={`size-2 shrink-0 rounded-full ${CATEGORIES[categorie].bg}`} />
          <span className="truncate">{revenu.intitule ?? 'Intitulé non publié'}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {[CATEGORIES[categorie].label, revenu.organisme, revenu.debut && `depuis ${revenu.debut}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {doublon ? (
          <span className="text-xs text-muted-foreground">Même revenu que plus haut, compté une fois</span>
        ) : dernier && dernier.montant > 0 ? (
          <>
            <div className="font-semibold text-orange-700 tabular-nums dark:text-orange-400">
              +{formatEuro(dernier.montant, { round: true })}
            </div>
            <div className="text-xs text-muted-foreground">
              en {dernier.annee}
              {revenu.brutNet && `, ${revenu.brutNet.toLowerCase()}`}
            </div>
          </>
        ) : masque ? (
          <Badge variant="destructive">Montant non publié</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Déclaré à 0 €</span>
        )}
      </div>
    </li>
  )
}

function MandatRne({ mandat, declares }: { mandat: MandatLocal; declares: Parameters<typeof mandatDeclare>[1] | null }) {
  const executif = estExecutif(mandat)
  const declare = declares ? mandatDeclare(mandat, declares) : null
  return (
    <li className="flex items-start justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <div className="text-sm font-medium">{fonctionAffichee(mandat) ?? mandat.libelle}</div>
        <div className="text-xs text-muted-foreground">
          {[fonctionAffichee(mandat) && mandat.libelle, mandat.lieu, mandat.debut && `depuis le ${formatDate(mandat.debut)}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {executif && <Badge variant="destructive">Interdit avec le mandat de député</Badge>}
        {declare === true && <Badge variant="secondary">Déclaré à la HATVP</Badge>}
        {declare === false && (
          <Badge variant="outline" className="border-orange-500/60 text-orange-700 dark:text-orange-400">
            Absent de sa déclaration
          </Badge>
        )}
      </div>
    </li>
  )
}

/** Indemnités locales déclarées face au plafond d'écrêtement */
function Plafond({ declare, plafondMensuel }: { declare: number; plafondMensuel: number }) {
  const plafond = plafondMensuel * 12
  const part = Math.min(1, declare / plafond)
  return (
    <div className="space-y-1.5 rounded-lg bg-muted/60 p-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>Indemnités locales déclarées</span>
        <span className="font-semibold tabular-nums">
          {formatEuro(declare, { round: true })}
          <span className="font-normal text-muted-foreground"> / {formatEuro(plafond, { round: true })} max.</span>
        </span>
      </div>
      <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="block h-2 w-full overflow-hidden rounded-full" aria-hidden>
        <rect width={1} height={1} className="fill-muted-foreground/20" />
        <rect width={part} height={1} className="fill-amber-500" />
      </svg>
      <Note>
        Un député peut toucher jusqu'à {formatEuro(plafond, { round: true })} par an d'indemnités locales en plus de son
        indemnité parlementaire.
      </Note>
    </div>
  )
}
