# Hémicycle

Une carte interactive de l'Assemblée nationale (17ᵉ législature). Chaque député en exercice occupe un siège
d'un hémicycle coloré par groupe politique. Un clic sur un siège ouvre une fiche latérale avec son profil,
sa rémunération et ses frais de mandat, ses intérêts et participations financières déclarés, ainsi que
l'état de ses déclarations auprès de la HATVP.

L'application est un front React statique. Son seul « backend » est un fichier JSON généré à partir des
données publiques.

## Démarrage rapide

```bash
npm install
npm run data   # télécharge l'open data et génère public/data/deputes.json (~2 Mo)
npm run dev    # http://localhost:5173
```

`public/data/deputes.json` est un fichier généré et n'est pas versionné : lancez `npm run data` après un
clone, puis à nouveau pour obtenir des données plus récentes.

| Commande          | Rôle                                                                        |
| ----------------- | --------------------------------------------------------------------------- |
| `npm run data`    | Télécharge l'open data de l'AN et de la HATVP et régénère `public/data/deputes.json` |
| `npm run dev`     | Lance le serveur de développement Vite                                      |
| `npm run build`   | Vérifie les types (`tsc -b`) et construit dans `dist/`                      |
| `npm run preview` | Sert la version de production                                               |
| `npm run lint`    | Lance Oxlint                                                                |

## Fonctionnalités

- **Hémicycle** : 574 sièges répartis sur 12 rangs concentriques, regroupés de gauche à droite par groupe
  politique. Le survol affiche le nom, le groupe et la circonscription. Les sièges sont accessibles au
  clavier.
- **Lectures de l'hémicycle** : colorer les sièges par groupe, par cumul de mandats, par revenus déclarés en
  plus de l'indemnité ou par signalements sur les déclarations, avec un classement des dix premiers.
- **L'addition** en tête de chaque fiche : coût mensuel du siège (indemnités, frais de mandat, crédit
  collaborateurs), équivalent en années de SMIC et compteur de l'argent public mobilisé depuis l'entrée en
  fonction.
- **Cumuls** : revenus déclarés année par année, activités et mandats exercés en parallèle, mandats locaux
  du Répertoire national des élus confrontés à la déclaration d'intérêts, et signalements datés (fonction
  exécutive locale, mandat non retrouvé, déclaration en retard).
- **Filtres** : recherche par nom ou par département, et clic sur un groupe de la légende pour le mettre en
  évidence.
- **Fiche député**, non modale pour pouvoir passer d'un siège à l'autre, avec quatre onglets :
  - **Profil** : circonscription, mandat, commission, biographie, contact.
  - **Rémunération** : indemnité parlementaire, indemnités spéciales liées aux fonctions du député,
    enveloppes de frais de mandat, collaborateurs listés.
  - **Intérêts** : participations financières (« capital ») et revenus déclarés, année par année, issus de
    la déclaration d'intérêts du député.
  - **Déclarations** : statut et dates de toutes les déclarations HATVP, y compris celles de patrimoine.
- **Les données manquantes sont signalées clairement** : la fiche distingue « rien de déposé », « déposé
  mais pas encore publié », « néant déclaré » et « rubrique non renseignée ».
- Les thèmes clair et sombre suivent le réglage du système.

## Stack

React 19, TypeScript 7, Vite 8, Tailwind CSS v4 et [shadcn/ui](https://ui.shadcn.com) (Radix, preset
« Nova », icônes Lucide). Les scripts de données sont en Node ESM, avec `adm-zip` et `fast-xml-parser`.

## Arborescence

```
scripts/
  build-data.mjs        point d'entrée de `npm run data` (données de l'Assemblée nationale)
  hatvp.mjs             déclarations HATVP, barèmes de rémunération, rapprochement des fiches
public/data/
  deputes.json          jeu de données généré (non versionné), chargé par l'app au démarrage
.github/workflows/
  deploy.yml            construction et déploiement sur GitHub Pages
src/
  App.tsx               chargement des données, recherche, filtres, mise en page
  types.ts              types du jeu de données généré
  lib/hemicycle.ts      géométrie des sièges
  lib/declarations.ts   libellés des statuts HATVP
  lib/format.ts         formatage des dates et montants (fr-FR)
  components/
    Hemicycle.tsx       graphique SVG
    Legend.tsx          filtre par groupe (ToggleGroup)
    DeputyPanel.tsx     fiche latérale à onglets
    deputy/             un composant par onglet, plus les briques communes
    ui/                 composants shadcn/ui (générés)
docs/
  data.md               sources, pipeline, schéma, règles de rapprochement, limites (en anglais)
  frontend.md           structure de l'interface et conventions (en anglais)
CLAUDE.md               notes de travail pour les agents de code (en anglais)
```

## Sources des données

Toutes les données sont publiques :

- **Open data de l'Assemblée nationale** : députés, mandats, organes et groupes
  ([data.assemblee-nationale.fr](https://data.assemblee-nationale.fr)).
- **Open data de la HATVP** : liste des déclarations et contenu des déclarations d'intérêts
  ([hatvp.fr/open-data](https://www.hatvp.fr/open-data/)).
- **Répertoire national des élus** (ministère de l'Intérieur) : mandats locaux en cours
  ([data.gouv.fr](https://www.data.gouv.fr/fr/datasets/repertoire-national-des-elus-1/)).
- **Barèmes de rémunération** : la
  [fiche de synthèse n° 7](https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/la-situation-materielle-du-depute)
  de l'Assemblée (janvier 2026). Ces montants sont saisis en dur dans `scripts/hatvp.mjs`.

Le détail est dans [docs/data.md](docs/data.md).

### Licence et attribution des données

Les données de l'Assemblée nationale et de la HATVP sont réutilisées sous
[Licence Ouverte / Open Licence 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence/),
qui impose de mentionner leur source et la date de leur dernière mise à jour :

- **Assemblée nationale**, « Députés actifs, mandats actifs et organes » (AMO10, 17ᵉ législature),
  [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr).
- **Haute Autorité pour la transparence de la vie publique**, liste des déclarations et déclarations
  consolidées, [hatvp.fr/open-data](https://www.hatvp.fr/open-data/).

La date d'extraction figure dans le jeu de données (`generatedAt`) et en bas de la page de l'application.
Les photos des députés ne sont pas redistribuées : elles sont chargées depuis assemblee-nationale.fr.

### Le contenu des déclarations de patrimoine n'est pas affiché, volontairement

Les déclarations de situation patrimoniale des députés ne sont pas publiées en ligne. Les électeurs peuvent
seulement les consulter en préfecture, et en publier le contenu est un délit (article LO 135-2 du code
électoral). L'application indique donc uniquement si chaque déclaration a été déposée, avec ses dates et
son statut, jamais son contenu. Le « capital » affiché dans la fiche provient des participations
financières que les députés listent dans leur **déclaration d'intérêts**, que la HATVP publie.

## Déploiement

Le workflow `.github/workflows/deploy.yml` publie le site sur GitHub Pages. Il télécharge l'open data, construit
le site et le déploie :

- à chaque push sur `main` ;
- chaque lundi à 5 h UTC, pour rafraîchir les données ;
- à la demande, depuis l'onglet **Actions** (« Run workflow »).

Pour l'activer, choisir **GitHub Actions** dans **Settings → Pages → Build and deployment → Source**. Si une
source de données est indisponible, le build échoue et la version déjà en ligne reste en place.

Le site utilise des chemins relatifs (`base: './'` dans `vite.config.ts`), il fonctionne donc aussi bien à la
racine d'un domaine que dans un sous-dossier comme `https://<compte>.github.io/hemicycle/`.

## Licence

Le code est publié sous licence [MIT](LICENSE). Les données restent sous Licence Ouverte 2.0 (voir
[Licence et attribution des données](#licence-et-attribution-des-données)).

## Limites connues

- La disposition des sièges est un schéma d'hémicycle générique, pas le plan de placement réel. Le numéro
  de place réel figure dans la fiche.
- Les photos des députés sont chargées directement depuis assemblee-nationale.fr.
- Les revenus et participations sont déclaratifs, et la HATVP masque certains champs.
- Les autres réserves sur les données sont détaillées dans [docs/data.md](docs/data.md#limitations).
