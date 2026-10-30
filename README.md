# Nos élus coûtent

**Ce que coûtent vos élus et votre Gouvernement, ce qu'ils cumulent, et ce que leurs déclarations ne disent pas.**

👉 **[Site web](https://noseluscoutent.fr)**

Nos élus coûtent rassemble des données publiques dispersées sur une dizaine de sites officiels et les rend lisibles
par tous. Cinq pages :

- **Députés** et **Sénateurs** : chaque élu sur son siège ; un clic ouvre sa fiche avec le coût de son siège,
  ses autres revenus, ses mandats cumulés et ses déclarations à la HATVP ;
- **Gouvernement** : rémunération du Président et des ministres, cabinets, budget de l'Élysée et des ministères ;
- **Candidats (2027)** : candidatures annoncées à la présidentielle, chacune sourcée, avec ce que la HATVP publie
  déjà sur la personne (mandats, déclaration d'intérêts) ;
- **Candidats (2022)** : présidentielle 2022, parrainages, comptes de campagne et remboursements de l'État.

La page **À propos** donne les mentions légales, la politique de confidentialité et le contact.

## Les données

Toutes viennent de sources publiques et officielles, mises à jour chaque lundi. Chaque chiffre renvoie à sa
source et chaque calcul est expliqué dans la fiche ; le détail technique est dans [docs/data.md](docs/data.md).

| Source | Ce qu'on y prend |
| --- | --- |
| [Assemblée nationale](https://data.assemblee-nationale.fr) (open data) | Députés, groupes, commissions, fonctions, collaborateurs, place dans l'hémicycle |
| [Sénat](https://data.senat.fr) (open data et liste des sénateurs de senat.fr) | Sénateurs, groupes, commissions, délégations, fonctions au Bureau, dates de mandat, place dans l'hémicycle |
| [HATVP](https://www.hatvp.fr/open-data/), Haute Autorité pour la transparence de la vie publique | Liste et dates des déclarations, contenu des déclarations d'intérêts (revenus, sociétés, mandats), autres fonctions déclarées |
| [Répertoire national des élus](https://www.data.gouv.fr/fr/datasets/repertoire-national-des-elus-1/) (ministère de l'Intérieur) | Mandats locaux en cours : maire, adjoint, conseiller municipal, départemental, régional, intercommunal |
| [Assemblée nationale, fiche n° 7](https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/la-situation-materielle-du-depute) (janvier 2026) | Montant de l'indemnité, des indemnités spéciales, des frais de mandat et du crédit collaborateurs |
| [Sénat, indemnité, frais de mandat et collaborateurs](https://www.senat.fr/connaitre-le-senat/role-et-fonctionnement/lindemnite-parlementaire.html) (mars 2026) | Montant de l'indemnité, des indemnités de fonction, de l'avance de frais de mandat et du crédit collaborateurs |
| [Journal officiel](https://www.legifrance.gouv.fr) (décrets de nomination) et [Conseil constitutionnel](https://www.conseil-constitutionnel.fr/decision/2022/2022197PDR.htm) | Composition du Gouvernement, dates de nomination, début du mandat présidentiel |
| [Décret n° 2012-983](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000026310466) | Rémunération du Président de la République et des membres du Gouvernement |
| [Projet de loi de finances pour 2027](https://www.assemblee-nationale.fr/dyn/17/dossiers/PLF_2027) (texte déposé et annexes) | Budget de chaque ministère, effectifs des cabinets ministériels et indemnités de sujétion, dotation et dépenses de l'Élysée |
| [Conseil constitutionnel](https://www.data.gouv.fr/datasets/parrainages-des-candidats-a-lelection-presidentielle-francaise-de-2022) (parrainages, liste des candidats) et [ministère de l'Intérieur](https://www.data.gouv.fr/datasets/election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-1er-tour) (résultats) | Candidats à l'élection présidentielle de 2022, parrainages, voix aux deux tours |
| [CNCCFP](https://cnccfp.fr/election-presidentielle-des-10-et-24-avril-2022-publication-au-journal-officiel-des-decisions-de-la-commission/), décisions publiées au Journal officiel | Comptes de campagne de 2022 : dépenses, recettes, remboursement dû par l'État, dépenses irrégulières et réductions |
| [franceinfo avec AFP](https://www.franceinfo.fr/politique/emmanuel-macron/presidentielle-2022-consultez-les-declarations-de-patrimoine-et-d-interets-des-12-candidats_4998801.html) (8 mars 2022) et [Insee](https://www.insee.fr/fr/statistiques/8736846) | Patrimoine net des candidats de 2022 tel que rapporté par la presse, comparé à celui des ménages |
| [service-public.gouv.fr](https://www.service-public.gouv.fr/particuliers/vosdroits/F2300) | Montant du SMIC (juin 2026), pour les comparaisons |

- **Le coût d'un siège est un maximum** : il inclut les frais de mandat et le crédit collaborateurs, qui ne
  sont pas versés à l'élu.
- **Les revenus sont ceux que l'élu a déclarés**, reproduits sans modification ni arrondi.
- **Les signalements sont des rapprochements automatiques** entre registres : vérifiez-les avant de les citer.
- **Le contenu des déclarations de patrimoine n'est jamais affiché** (article LO 135-2 du code électoral),
  seulement leur dépôt et leurs dates. Seule exception : le patrimoine des candidats de 2022, tel que la presse
  l'a rapporté.

Données sous [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/). Les informations
de la HATVP respectent ses [mentions légales](https://www.hatvp.fr/mentions-legales/) : reproduction sans
modification, droits réservés et strictement limités, aucun usage commercial.

## Développement

```bash
npm install
npm run data    # télécharge les données publiques (~170 Mo) et génère public/data/*.json
npm run dev     # http://localhost:5173
npm run build   # vérifie les types et construit dans dist/
npm run lint
```

React 19, TypeScript, Vite, Tailwind CSS et shadcn/ui. Site statique, sans backend : chaque page lit un
fichier JSON généré. Il n'y a pas de tests : vérifiez une modification avec `npm run build`, puis dans le
navigateur.

Le site est déployé sur GitHub Pages par `.github/workflows/deploy.yml`, à chaque push sur `main` et chaque
lundi. Certaines données (barèmes, composition du Gouvernement, budgets, comptes de campagne) sont saisies à la
main dans `scripts/` : voir [docs/data.md](docs/data.md). L'interface est décrite dans
[docs/frontend.md](docs/frontend.md), la suite dans [docs/roadmap.md](docs/roadmap.md).

## Contribuer

Une erreur, une donnée qui ne correspond pas à sa source ? [Ouvrez un ticket](https://github.com/leopard577/hemicycle/issues).

## Licence

Code sous licence [MIT](LICENSE). En réutilisant les données, citez leur source et leur date de mise à jour.
