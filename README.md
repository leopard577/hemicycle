# Hémicycle

**Ce que coûtent vos députés, ce qu'ils cumulent, et ce que leurs déclarations ne disent pas.**

👉 **[Site web](https://leopard577.github.io/hemicycle/)**

Hémicycle est une carte interactive de l'Assemblée nationale (17ᵉ législature). Chacun des 574 députés en
exercice y occupe un siège. Un clic sur un siège ouvre sa fiche :

- **ce que son siège coûte aux contribuables**, chaque mois et depuis son élection, avec un compteur qui
  tourne en direct ;
- **ce qu'il gagne en plus de son mandat** : activités professionnelles, sociétés dirigées, mandats locaux,
  année par année ;
- **les mandats qu'il cumule**, et ceux qui manquent dans ses déclarations ;
- **ses déclarations auprès de la HATVP** : déposées ou non, à temps ou en retard.

Tous les chiffres viennent de registres publics officiels et chaque calcul est expliqué dans la fiche. Rien
n'est estimé ni inventé : l'application croise des données que chacun peut consulter, mais qui sont
dispersées sur plusieurs sites.

## D'où viennent les données

Toutes les données sont publiques et officielles :

| Source | Ce qu'on y prend |
| --- | --- |
| [Assemblée nationale](https://data.assemblee-nationale.fr) (open data) | Députés, groupes, commissions, fonctions, collaborateurs, place dans l'hémicycle |
| [HATVP](https://www.hatvp.fr/open-data/), Haute Autorité pour la transparence de la vie publique | Liste et dates des déclarations, contenu des déclarations d'intérêts (revenus, sociétés, mandats), autres fonctions déclarées |
| [Répertoire national des élus](https://www.data.gouv.fr/fr/datasets/repertoire-national-des-elus-1/) (ministère de l'Intérieur) | Mandats locaux en cours : maire, adjoint, conseiller municipal, départemental, régional, intercommunal |
| [Assemblée nationale, fiche n° 7](https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/la-situation-materielle-du-depute) (janvier 2026) | Montant de l'indemnité, des indemnités spéciales, des frais de mandat et du crédit collaborateurs |
| [service-public.gouv.fr](https://www.service-public.gouv.fr/particuliers/vosdroits/F2300) | Montant du SMIC (juin 2026), pour les comparaisons |

Les données sont mises à jour automatiquement chaque lundi. La date d'extraction figure en bas de la page.

**Ce qu'il faut savoir pour bien lire les chiffres**

- **Le coût du siège est un maximum.** Il additionne l'indemnité brute, les indemnités spéciales, l'avance de
  frais de mandat et le crédit collaborateurs. Le crédit collaborateurs paie les assistants et n'est pas
  versé au député ; ce qui n'est pas dépensé ne l'est pas.
- **Les revenus sont ceux que le député a lui-même déclarés.** Ils sont bruts ou nets selon les
  déclarations, et la HATVP ne publie pas tous les montants.
- **Le Répertoire national des élus est mis à jour tous les quelques mois.** Un mandat abandonné récemment
  peut encore y figurer. C'est pourquoi chaque signalement cite ses dates.
- **Les déclarations de patrimoine ne sont jamais affichées.** On ne peut les consulter qu'en préfecture, et
  publier leur contenu est un délit (article LO 135-2 du code électoral). L'application indique seulement si
  elles ont été déposées et quand. Le « capital » affiché vient des parts de sociétés listées dans la
  **déclaration d'intérêts**, que la HATVP publie.

Les données sont réutilisées sous [Licence Ouverte 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
Les photos des députés ne sont pas copiées : elles sont chargées depuis assemblee-nationale.fr.

Les informations issues de la HATVP respectent en plus ses [mentions légales](https://www.hatvp.fr/mentions-legales/) :
elles sont reproduites sans modification (un passage masqué par la HATVP reste affiché « [Données non publiées] »),
leur source est citée, les droits de reproduction sont réservés et strictement limités, et toute utilisation
commerciale ou publicitaire est interdite. Les photos du site de la HATVP, protégées par le droit d'auteur et le
droit à l'image, ne sont pas utilisées.

## Fonctionnalités

### L'hémicycle

- **577 sièges**, regroupés de gauche à droite par groupe politique. Le survol affiche le nom, le groupe et
  la circonscription.
- **Cinq façons de colorer les sièges** :
  - **Groupes** : la couleur du groupe politique ;
  - **Cumul de mandats** : nombre de mandats locaux et d'activités rémunérées exercés en même temps ;
  - **Autres revenus** : revenus déclarés en plus de l'indemnité de député ;
  - **Capital déclaré** : valeur des parts de sociétés listées dans la déclaration d'intérêts ;
  - **Déclarations** : fonction interdite avec le mandat, déclaration en retard ou incomplète.
- Pour chaque coloration, un **résumé chiffré** et le **classement des dix premiers**, cliquable.
- **Recherche** par nom ou par département, et **filtre** par groupe politique.

### La fiche d'un député

- **L'addition** : ce que le siège coûte par mois et par an, l'équivalent en années de SMIC, et un compteur
  de l'argent public mobilisé depuis son entrée en fonction.
- **Ce que révèlent les registres publics** : des signalements datés et sourcés, par exemple
  - une fonction de maire ou de président d'intercommunalité occupée en même temps que le mandat de député,
    alors que la loi l'interdit ;
  - un mandat local absent de sa déclaration d'intérêts ;
  - un nouveau mandat non signalé à la HATVP dans les deux mois ;
  - une déclaration déposée après le délai légal.
- **Cinq onglets** :
  - **Cumuls** : revenus déclarés année par année comparés au SMIC, activités exercées en parallèle du
    mandat, mandats locaux en cours, plafond des indemnités locales, anciens mandats (Parlement européen,
    Sénat…) ;
  - **Salaire** : indemnité parlementaire, indemnités spéciales, frais de mandat, collaborateurs ;
  - **Intérêts** : parts détenues dans des sociétés et revenus déclarés, rubrique par rubrique ;
  - **Déclarations** : toutes les déclarations HATVP, avec leurs dates et leur statut ;
  - **Profil** : circonscription, commissions, biographie, contact.
- **Précisions et sources** en bas de la fiche : le détail de chaque calcul. Les astérisques du coût y
  renvoient directement.
- **Les données manquantes restent visibles** : la fiche distingue une déclaration non déposée, déposée mais
  pas encore publiée, une partie laissée vide, et « aucun » déclaré.
- La fiche reste ouverte quand on clique sur un autre siège, pour comparer facilement.
- Thème clair ou sombre au choix, avec le bouton à côté de la recherche (par défaut, celui de l'appareil),
  et affichage adapté au téléphone.

## Développement

### Démarrage rapide

```bash
npm install
npm run data   # télécharge les données publiques et génère public/data/deputies.json
npm run dev    # http://localhost:5173
```

`public/data/deputies.json` est généré et n'est pas versionné : lancez `npm run data` après un clone, puis à
nouveau pour obtenir des données plus récentes. Le script télécharge environ 170 Mo (HATVP et Répertoire
national des élus).

| Commande          | Rôle                                                                        |
| ----------------- | --------------------------------------------------------------------------- |
| `npm run data`    | Télécharge les données de l'AN, de la HATVP et du RNE, et régénère `public/data/deputies.json` |
| `npm run dev`     | Lance le serveur de développement Vite                                      |
| `npm run build`   | Vérifie les types (`tsc -b`) et construit dans `dist/`                      |
| `npm run preview` | Sert la version de production                                               |
| `npm run lint`    | Lance Oxlint                                                                |

Il n'y a pas de tests automatisés : vérifiez une modification avec `npm run build`, puis en ouvrant la fiche
d'un député dans le navigateur.

### Stack

React 19, TypeScript 7, Vite 8, Tailwind CSS v4 et [shadcn/ui](https://ui.shadcn.com) (Radix, preset
« Nova », icônes Lucide). Les scripts de données sont en Node ESM, avec `adm-zip` et `fast-xml-parser`.
L'application est un front statique : son seul « backend » est le fichier JSON généré.

### Mettre à jour les barèmes

Les montants de rémunération (`deputyPayScales`, `DEPUTY_SPECIAL_ALLOWANCES`) et le SMIC (`minimumWage`) sont
saisis à la main dans `scripts/pay-scales.mjs`. Mettez-les à jour quand l'Assemblée publie une nouvelle fiche n° 7 ou quand
le SMIC est revalorisé, puis relancez `npm run data`.

### Déploiement

Le workflow `.github/workflows/deploy.yml` publie le site sur GitHub Pages. Il télécharge les données,
construit le site et le déploie :

- à chaque push sur `main` ;
- chaque lundi à 5 h UTC, pour rafraîchir les données ;
- à la demande, depuis l'onglet **Actions** (« Run workflow »).

Pour l'activer, choisir **GitHub Actions** dans **Settings → Pages → Build and deployment → Source**. Si une
source de données est indisponible, le build échoue et la version déjà en ligne reste en place.

Le site utilise des chemins relatifs (`base: './'` dans `vite.config.ts`) : il fonctionne aussi bien à la
racine d'un domaine que dans un sous-dossier comme `/hemicycle/`.

### Limites connues

- La disposition des sièges est un schéma d'hémicycle générique, pas le plan de placement réel. Le numéro
  de place réel figure dans la fiche.
- Les mandats déclarés à la HATVP sont saisis en texte libre : leur rapprochement avec le Répertoire national
  des élus est approximatif. Vérifiez un signalement à la main avant de le citer.
- Les autres réserves sur les données sont détaillées dans [docs/data.md](docs/data.md#limitations).

### Licence

Le code est publié sous licence [MIT](LICENSE). Les données restent sous Licence Ouverte 2.0 : en les
réutilisant, citez leur source (Assemblée nationale, HATVP, ministère de l'Intérieur) et la date de leur
dernière mise à jour.
