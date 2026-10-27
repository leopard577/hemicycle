// Analyse de ce que coûte un député et de ce qu'il cumule, à partir des seules données publiques.
// Tout est calculé côté client à partir de deputes.json : aucune donnée n'est inventée ou estimée
// au-delà des barèmes officiels.
import { declarationsDe, INTERETS, PATRIMOINE } from '@/lib/declarations'
import { formatDate } from '@/lib/format'
import type { Baremes, Depute, MandatLocal, Revenu } from '@/types'

/* ---------- Coût du siège ---------- */

export interface CoutMensuel {
  indemnite: number
  speciales: number
  frais: number
  collaborateurs: number
  total: number
}

/** Montants mensuels mobilisés par un siège, selon les barèmes de l'Assemblée */
export function coutMensuel(depute: Depute, baremes: Baremes): CoutMensuel {
  const indemnite = baremes.indemnite.brut
  const speciales = depute.indemnitesSpeciales.reduce((sum, s) => sum + s.montant, 0)
  const frais = baremes.dotationFonctionnement
  const collaborateurs = baremes.creditCollaborateurs
  return { indemnite, speciales, frais, collaborateurs, total: indemnite + speciales + frais + collaborateurs }
}

const MS_PAR_MOIS = (365.25 / 12) * 86_400_000

/** Montant cumulé depuis l'entrée en fonction, au prorata du temps écoulé */
export function depuisLeDebut(mensuel: number, dateDebut: string, now = Date.now()) {
  return Math.max(0, ((now - new Date(dateDebut).getTime()) / MS_PAR_MOIS) * mensuel)
}

/* ---------- Revenus déclarés ---------- */

export type Categorie = 'depute' | 'europe' | 'senat' | 'local' | 'prive' | 'conseil' | 'dirigeant'

// Classes écrites en entier pour que Tailwind les détecte
export const CATEGORIES: Record<Categorie, { label: string; fill: string; bg: string }> = {
  depute: { label: 'Mandat de député', fill: 'fill-slate-400', bg: 'bg-slate-400' },
  europe: { label: 'Parlement européen', fill: 'fill-blue-600', bg: 'bg-blue-600' },
  senat: { label: 'Sénat', fill: 'fill-indigo-400', bg: 'bg-indigo-400' },
  local: { label: 'Mandats locaux', fill: 'fill-amber-500', bg: 'bg-amber-500' },
  prive: { label: 'Activités professionnelles', fill: 'fill-emerald-600', bg: 'bg-emerald-600' },
  conseil: { label: 'Activités de conseil', fill: 'fill-fuchsia-600', bg: 'bg-fuchsia-600' },
  dirigeant: { label: 'Fonctions de dirigeant', fill: 'fill-rose-600', bg: 'bg-rose-600' },
}

export const ORDRE_CATEGORIES = Object.keys(CATEGORIES) as Categorie[]

const norm = (s: string | null) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Catégorie d'un mandat électif d'après son intitulé libre */
function categorieMandat(r: Revenu): Categorie | null {
  const t = norm(r.intitule)
  if (/europ/.test(t) && /deput|parlement/.test(t)) return 'europe'
  if (/senat/.test(t)) return 'senat'
  if (/^\s*deput/.test(t)) return 'depute'
  return null
}

export interface LigneRevenu {
  revenu: Revenu
  categorie: Categorie
  /** Activité sans date de fin, ou terminée après l'entrée en fonction */
  enCours: boolean
  /** Dernier montant annuel publié */
  dernier: { annee: number; montant: number } | null
  /** Mêmes montants que dans une autre rubrique : revenu déclaré deux fois, compté une seule */
  doublon: boolean
}

// "07/2024" → "2024-07"
const moisIso = (v: string | null) => {
  const m = /(\d{1,2})\/(\d{4})/.exec(v ?? '')
  return m ? `${m[2]}-${m[1].padStart(2, '0')}` : null
}

export function lignesRevenus(depute: Depute): LigneRevenu[] {
  const interets = depute.hatvp.interets
  if (!interets) return []
  const debutMandat = depute.dateDebut.slice(0, 7)
  const sources: [Revenu[] | null, Categorie][] = [
    [interets.mandats, 'local'],
    [interets.activites, 'prive'],
    [interets.consultant, 'conseil'],
    [interets.dirigeant, 'dirigeant'],
  ]
  // Une société dirigée apparaît souvent aussi en activité professionnelle, avec le même dernier montant :
  // la seconde occurrence est marquée comme doublon
  const vus = new Map<string, Categorie>()
  return sources.flatMap(([items, defaut]) =>
    (items ?? []).map((revenu) => {
      const fin = moisIso(revenu.fin)
      const publies = revenu.montants.filter((m): m is { annee: number; montant: number } => m.montant !== null)
      const dernier = publies.sort((a, b) => b.annee - a.annee)[0] ?? null
      const empreinte = dernier && dernier.montant > 0 && defaut !== 'local' ? `${dernier.annee}:${dernier.montant}` : null
      const deja = empreinte ? vus.get(empreinte) : undefined
      if (empreinte && !deja) vus.set(empreinte, defaut)
      return {
        revenu,
        categorie: categorieMandat(revenu) ?? defaut,
        enCours: fin === null || fin > debutMandat,
        dernier,
        doublon: deja !== undefined && deja !== defaut,
      }
    }),
  )
}

export interface AnneeRevenus {
  annee: number
  parts: Partial<Record<Categorie, number>>
  total: number
}

/** Revenus déclarés, additionnés par année et par catégorie */
export function revenusParAnnee(lignes: LigneRevenu[]): AnneeRevenus[] {
  const annees = new Map<number, AnneeRevenus>()
  // Même montant la même année dans une autre rubrique privée : revenu déclaré deux fois
  const prives = new Map<string, Categorie>()
  for (const { revenu, categorie } of lignes) {
    for (const { annee, montant } of revenu.montants) {
      if (!montant) continue
      if (categorie === 'prive' || categorie === 'conseil' || categorie === 'dirigeant') {
        const deja = prives.get(`${annee}:${montant}`)
        if (deja && deja !== categorie) continue
        prives.set(`${annee}:${montant}`, categorie)
      }
      const a = annees.get(annee) ?? { annee, parts: {}, total: 0 }
      a.parts[categorie] = (a.parts[categorie] ?? 0) + montant
      a.total += montant
      annees.set(annee, a)
    }
  }
  return [...annees.values()].sort((a, b) => a.annee - b.annee)
}

/** Ce que le député déclare percevoir en plus de son indemnité, sur la dernière année publiée */
export function revenusAnnexes(lignes: LigneRevenu[]) {
  const annexes = lignes.filter((l) => l.enCours && l.categorie !== 'depute')
  const somme = (ls: LigneRevenu[]) => ls.reduce((sum, l) => sum + (l.doublon ? 0 : (l.dernier?.montant ?? 0)), 0)
  return { lignes: annexes, total: somme(annexes), locaux: somme(annexes.filter((l) => l.categorie === 'local')) }
}

/* ---------- Mandats locaux (RNE) et déclarations ---------- */

const MOTS_CLES: Record<MandatLocal['type'], RegExp> = {
  municipal: /municip|maire|adjoint|conseil(ler|lere)? de paris/,
  arrondissement: /arrondissement|municip/,
  communautaire: /communaut|metropol|agglo|epci|intercommun|territoire|\bcc\b|\bca\b/,
  departemental: /departem|general|\bcd\b|alsace|conseil(ler|lere)? d.alsace/,
  regional: /region|\bcr\b/,
  collectivite: /metropol|congres|assemblee|territori|corse|polynesie|guyane|martinique|collectivite/,
  europeen: /europ/,
}

const MOTS_VIDES = new Set(['saint', 'sainte', 'sous', 'pays', 'metropole', 'communaute', 'communes'])

const motsDuLieu = (lieu: string | null) =>
  norm(lieu)
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 4 && !MOTS_VIDES.has(t))

/** Le mandat RNE figure-t-il parmi les mandats électifs déclarés (en cours au début du mandat RNE) ? */
export function mandatDeclare(m: MandatLocal, declares: Revenu[]) {
  const debut = m.debut?.slice(0, 7) ?? ''
  const lieu = motsDuLieu(m.lieu)
  return declares.some((r) => {
    const fin = moisIso(r.fin)
    if (fin !== null && fin < debut) return false
    const t = norm(`${r.intitule} ${r.organisme}`)
    return MOTS_CLES[m.type].test(t) || lieu.some((mot) => t.includes(mot))
  })
}

const FONCTION_EXECUTIVE = /maire|adjoint|president|organe executif/

export const estExecutif = (m: MandatLocal) => FONCTION_EXECUTIVE.test(norm(m.fonction))

/** Fonction à afficher : le RNE note « Autre membre » ou « Membre » pour un simple conseiller */
export const fonctionAffichee = (m: MandatLocal) =>
  m.fonction && !/^(autre )?membre$/.test(norm(m.fonction).trim()) ? m.fonction : null

/* ---------- Alertes ---------- */

export type Niveau = 'grave' | 'attention' | 'info'

export interface Alerte {
  niveau: Niveau
  titre: string
  detail: string
}

const JOUR = 86_400_000
const jours = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / JOUR)

/** Échéance légale de deux mois, plus une semaine de tolérance (dépôt le lundi après un week-end…) */
function echeance(iso: string) {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + 2)
  return d.getTime() + 7 * JOUR
}

const dateFr = (iso: string | null) => formatDate(iso) ?? 'date inconnue'

const intituleMandat = (m: MandatLocal) => `${fonctionAffichee(m) ?? m.libelle}${m.lieu ? ` (${m.lieu})` : ''}`

const fonctionMinuscule = (m: MandatLocal) => {
  const f = fonctionAffichee(m) ?? m.libelle
  return f.charAt(0).toLowerCase() + f.slice(1)
}

/**
 * Faits vérifiables tirés du croisement AN × HATVP × RNE. Chaque alerte cite ses dates :
 * elle décrit une situation, sans présumer de sa justification.
 */
export function alertes(depute: Depute, now = Date.now()): Alerte[] {
  const result: Alerte[] = []
  const { interets, declarations } = depute.hatvp

  // 1. Fonctions exécutives locales, incompatibles avec le mandat de député depuis 2017
  for (const m of depute.mandatsLocaux.filter(estExecutif)) {
    const debutFonction = m.debutFonction ?? m.debut
    const debutCumul = [depute.dateDebut, debutFonction ?? ''].sort().at(-1)!
    const constate = m.miseAJour ? jours(debutCumul, m.miseAJour) : -1
    result.push(
      constate > 30
        ? {
            niveau: 'grave',
            titre: `Également ${fonctionMinuscule(m)}${m.lieu ? ` (${m.lieu})` : ''}`,
            detail: `D'après le Répertoire national des élus, mis à jour le ${dateFr(m.miseAJour)}, cette fonction est occupée depuis le ${dateFr(debutFonction)}, soit depuis ${constate} jours en même temps que le mandat de député. La loi interdit à un député d'être aussi maire, adjoint au maire, ou président ou vice-président d'une collectivité ou d'une intercommunalité. Un élu dans ce cas a 30 jours pour abandonner l'une des deux fonctions.`,
          }
        : {
            niveau: 'info',
            titre: `Également ${fonctionMinuscule(m)}${m.lieu ? ` (${m.lieu})` : ''}`,
            detail: `D'après le Répertoire national des élus, cette fonction est occupée depuis le ${dateFr(debutFonction)}. La loi interdit de la cumuler avec le mandat de député, mais le délai de 30 jours pour choisir n'était pas encore écoulé à la date du fichier (${dateFr(m.miseAJour)}).`,
          },
    )
  }

  // 2. Mandats locaux en cours absents de la déclaration d'intérêts
  if (interets?.mandats && interets.dateDepot) {
    const { mandats, dateDepot } = interets
    const absents = depute.mandatsLocaux.filter(
      (m) => m.type !== 'communautaire' && m.debut && m.debut < dateDepot && !mandatDeclare(m, mandats),
    )
    if (absents.length)
      result.push({
        niveau: 'attention',
        titre:
          absents.length > 1
            ? `${absents.length} mandats locaux non retrouvés dans sa déclaration d'intérêts`
            : "Mandat local non retrouvé dans sa déclaration d'intérêts",
        detail: `${absents.map((m) => `${intituleMandat(m)}, depuis le ${dateFr(m.debut)}`).join(' ; ')}. ${
          absents.length > 1
            ? 'Ces mandats figurent au Répertoire national des élus, mais pas'
            : 'Ce mandat figure au Répertoire national des élus, mais pas'
        } dans la liste des mandats de sa déclaration d'intérêts du ${dateFr(dateDepot)}.`,
      })
  }

  // 3. Nouveau mandat local sans déclaration modificative dans les deux mois
  const derniereDia = declarationsDe(declarations, INTERETS)
    .map((d) => d.dateDepot)
    .filter((d): d is string => d !== null)
    .sort()
    .at(-1)
  if (interets?.mandats && derniereDia) {
    const { mandats } = interets
    const sansModif = depute.mandatsLocaux.filter(
      (m) =>
        m.debut &&
        m.debut > derniereDia &&
        echeance(m.debut) < now &&
        // Une réélection à un mandat déjà déclaré n'est pas un changement
        !mandatDeclare(m, mandats),
    )
    if (sansModif.length)
      result.push({
        niveau: 'attention',
        titre: sansModif.length > 1 ? 'Nouveaux mandats non déclarés' : 'Nouveau mandat non déclaré',
        detail: `${sansModif.map((m) => `${intituleMandat(m)}, depuis le ${dateFr(m.debut)}`).join(' ; ')}. Sa dernière déclaration d'intérêts date du ${dateFr(derniereDia)}, ${sansModif.length > 1 ? 'avant ces mandats' : 'avant ce mandat'}. La loi impose de signaler tout changement important à la HATVP dans les deux mois.`,
      })
  }

  // 4. Déclarations d'entrée en fonction en retard ou absentes
  for (const [types, nom] of [
    [INTERETS, "d'intérêts"],
    [PATRIMOINE, 'de patrimoine'],
  ] as const) {
    const depuis = declarationsDe(declarations, types)
      .map((d) => d.dateDepot)
      .filter((d): d is string => d !== null && d >= depute.dateDebut)
      .sort()
    const limite = echeance(depute.dateDebut)
    if (!depuis.length) {
      // Un député réélu peut être dispensé d'une nouvelle déclaration de patrimoine : seule l'absence
      // de déclaration d'intérêts est signalée
      if (limite < now && types === INTERETS)
        result.push({
          niveau: 'grave',
          titre: `Aucune déclaration ${nom} depuis son entrée en fonction`,
          detail: `En fonction depuis le ${dateFr(depute.dateDebut)}, aucune déclaration n'est enregistrée par la HATVP, alors que la loi laisse deux mois pour la déposer.`,
        })
      continue
    }
    if (new Date(depuis[0]).getTime() > limite)
      result.push({
        niveau: 'attention',
        titre: `Déclaration ${nom} déposée en retard`,
        detail: `Déposée le ${dateFr(depuis[0])}, soit ${jours(depute.dateDebut, depuis[0])} jours après son entrée en fonction le ${dateFr(depute.dateDebut)}, alors que la loi laisse deux mois.`,
      })
  }

  // 5. Montants non publiés pour des activités en cours
  const sansMontant = lignesRevenus(depute).filter(
    (l) => l.enCours && l.categorie !== 'depute' && l.revenu.montants.some((m) => m.montant === null),
  )
  if (sansMontant.length)
    result.push({
      niveau: 'info',
      titre: 'Montants non publiés',
      detail: `${sansMontant.map((l) => l.revenu.intitule ?? 'Activité').join(', ')} : au moins un montant annuel n'est pas rendu public dans sa déclaration.`,
    })

  const ordre: Record<Niveau, number> = { grave: 0, attention: 1, info: 2 }
  return result.sort((a, b) => ordre[a.niveau] - ordre[b.niveau])
}

/* ---------- Synthèse pour la coloration de l'hémicycle ---------- */

export interface Synthese {
  annexes: number
  /** Mandats locaux en cours (RNE) et activités rémunérées déclarées en cours */
  cumuls: number
  graves: number
  attention: number
}

export function synthese(depute: Depute, now = Date.now()): Synthese {
  const annexes = revenusAnnexes(lignesRevenus(depute))
  const privees = annexes.lignes.filter((l) => l.categorie !== 'local' && (l.dernier?.montant ?? 0) > 0).length
  const al = alertes(depute, now)
  return {
    annexes: annexes.total,
    cumuls: depute.mandatsLocaux.filter((m) => m.type !== 'communautaire').length + privees,
    graves: al.filter((a) => a.niveau === 'grave').length,
    attention: al.filter((a) => a.niveau === 'attention').length,
  }
}
