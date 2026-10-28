import type { ReactNode } from 'react'
import { ExternalLink } from '@/components/panel/parts'
import { SiteFooter } from '@/components/SiteFooter'

const REPOSITORY = 'https://github.com/leopard577/hemicycle'

// Where to reach the project. Add an account here (e.g. X / Twitter) and it shows in the contact section.
const CONTACTS: { label: string; href: string; text: string }[] = [
  { label: 'Signaler une erreur ou un bug', href: `${REPOSITORY}/issues`, text: 'ouvrir un ticket sur GitHub' },
  { label: 'Code source', href: REPOSITORY, text: 'github.com/leopard577/hemicycle' },
]

const SOURCES: { label: string; href: string }[] = [
  { label: 'Assemblée nationale (open data)', href: 'https://data.assemblee-nationale.fr' },
  { label: 'Sénat (open data)', href: 'https://data.senat.fr' },
  { label: 'HATVP (open data)', href: 'https://www.hatvp.fr/open-data/' },
  {
    label: 'Répertoire national des élus (ministère de l’Intérieur)',
    href: 'https://www.data.gouv.fr/fr/datasets/repertoire-national-des-elus-1/',
  },
  { label: 'Journal officiel (Légifrance)', href: 'https://www.legifrance.gouv.fr' },
  { label: 'Conseil constitutionnel', href: 'https://www.conseil-constitutionnel.fr' },
  { label: 'CNCCFP', href: 'https://cnccfp.fr' },
]

/** "À propos" page: why the site exists, legal notice, privacy and contact */
export function AboutPage() {
  return (
    <>
      <div>
        <div className="mx-auto w-full max-w-5xl px-6 py-3 sm:py-5">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Hémicycle</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">À propos</h1>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-12 px-6 py-8">
        <p className="text-lg text-balance">
          Ce que coûtent les élus et les membres du Gouvernement, ce qu'ils cumulent et ce qu'ils déclarent : ces
          informations sont publiques, mais dispersées sur une dizaine de sites, dans des fichiers que peu de gens
          savent lire. Hémicycle les rassemble et les rend lisibles par tous.
        </p>

        <Section title="Pourquoi ce site">
          <p>
            <strong>Rendre des comptes aux citoyens.</strong> L'argent public qui rémunère les députés, les sénateurs
            et les ministres est celui des contribuables. Chacun doit pouvoir savoir ce qu'un siège coûte, quels
            mandats un élu cumule et s'il a déposé ses déclarations à temps, sans avoir à le demander.
          </p>
          <p>
            <strong>Simplifier sans déformer.</strong> Les registres officiels sont exhaustifs mais austères : des
            fichiers XML, des tableurs, des décrets. Le site les croise et les présente en quelques chiffres, un
            hémicycle cliquable et une fiche par personne. Chaque calcul est expliqué, chaque chiffre renvoie à sa
            source, et une donnée manquante est signalée comme telle plutôt que devinée.
          </p>
          <p>
            <strong>Des faits, pas des opinions.</strong> Le site ne note pas les élus et ne prête d'intention à
            personne. Les signalements qu'il affiche ne relèvent que des faits datés et sourcés : une fonction
            exercée en même temps qu'une autre, une déclaration déposée après le délai légal. Il n'est rattaché à
            aucun parti, aucune institution ni aucune entreprise.
          </p>
        </Section>

        <Section title="D'où viennent les données">
          <p>
            Uniquement de sources publiques et officielles, mises à jour automatiquement chaque lundi :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s.href}>
                <ExternalLink href={s.href}>{s.label}</ExternalLink>
              </li>
            ))}
          </ul>
          <p>
            Le contenu des déclarations de patrimoine n'est jamais affiché : le publier est un délit pour les
            parlementaires (article LO 135-2 du code électoral), et le site applique la même règle à tous. Seuls
            leur dépôt et leurs dates sont indiqués. Le détail des sources et des calculs figure en bas de chaque
            fiche.
          </p>
        </Section>

        <Section title="Mentions légales">
          <dl className="space-y-3">
            <Term label="Éditeur">
              Site personnel et non commercial, publié par{' '}
              <ExternalLink href="https://github.com/leopard577">leopard577</ExternalLink>. Conformément à l'article 6,
              III, 2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, l'éditeur,
              non professionnel, a communiqué ses coordonnées à l'hébergeur.
            </Term>
            <Term label="Hébergeur">
              GitHub, Inc. (GitHub Pages), 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis ·{' '}
              <ExternalLink href="https://github.com">github.com</ExternalLink>
            </Term>
            <Term label="Données">
              Réutilisées sous{' '}
              <ExternalLink href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/">
                Licence Ouverte 2.0 (Etalab)
              </ExternalLink>
              , avec leur source et leur date d'extraction. Les informations issues de la HATVP respectent en plus
              ses <ExternalLink href="https://www.hatvp.fr/mentions-legales/">mentions légales</ExternalLink> :
              reproduites sans modification, droits de reproduction réservés et strictement limités, toute
              utilisation commerciale ou publicitaire interdite.
            </Term>
            <Term label="Photos">
              Les portraits officiels sont chargés directement depuis assemblee-nationale.fr et senat.fr ; ils ne sont
              pas copiés. Aucune photo du site de la HATVP n'est utilisée.
            </Term>
            <Term label="Code">
              Publié sous licence <ExternalLink href={`${REPOSITORY}/blob/main/LICENSE`}>MIT</ExternalLink>.
            </Term>
            <Term label="Responsabilité">
              Les chiffres reproduisent les registres officiels à la date de leur extraction, avec leurs éventuelles
              erreurs et leurs délais de mise à jour. Vérifiez une information auprès de sa source avant de la citer.
              Si vous êtes concerné par une donnée affichée et la pensez inexacte, signalez-le (voir « Contact ») :
              elle sera vérifiée et, si la source a changé, corrigée.
            </Term>
          </dl>
        </Section>

        <Section title="Vie privée">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Aucun compte, aucun cookie, aucune mesure d'audience, aucune publicité.</strong> Le site ne
              collecte aucune donnée personnelle sur ses visiteurs.
            </li>
            <li>
              Le choix du thème clair ou sombre est enregistré dans votre navigateur (stockage local). Il n'est envoyé
              nulle part ; effacer les données du site le supprime.
            </li>
            <li>
              Comme tout site web, l'hébergeur (GitHub) reçoit votre adresse IP pour servir les pages ; il en est
              responsable selon sa{' '}
              <ExternalLink href="https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement">
                déclaration de confidentialité
              </ExternalLink>
              . Les portraits étant chargés depuis assemblee-nationale.fr et senat.fr, ces sites la reçoivent aussi
              quand une photo s'affiche.
            </li>
            <li>
              Les informations sur les élus et les membres du Gouvernement proviennent de publications officielles
              rendues publiques en vertu de la loi, au titre de leurs fonctions.
            </li>
          </ul>
        </Section>

        <Section title="Contact">
          <p>
            Une erreur, un bug, une donnée qui ne correspond pas à sa source, une idée ? Le plus simple est d'ouvrir
            un ticket : il reste public, ce qui permet à chacun de suivre la correction.
          </p>
          <dl className="space-y-2">
            {CONTACTS.map((c) => (
              <Term key={c.href} label={c.label}>
                <ExternalLink href={c.href}>{c.text}</ExternalLink>
              </Term>
            ))}
          </dl>
        </Section>
      </main>

      <SiteFooter />
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 text-sm leading-relaxed">
      <h2 className="font-heading text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Term({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[10rem_1fr]">
      <dt className="font-medium">{label}</dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  )
}
