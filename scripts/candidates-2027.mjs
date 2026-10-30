// "Candidats (2027)" page: the 2027 presidential election before the official list. Nobody is a candidate until
// the Conseil constitutionnel publishes that list (after the sponsorship deadline, a few weeks before the vote), so
// the page lists announced candidacies, each with the dated article or statement it rests on, and joins whatever
// the HATVP already publishes about the person (offices held, declarations of interests).
//
// The list is hand-maintained: no official source exists yet. It was compiled from the dataset "Candidatures à
// l'élection présidentielle 2027 — statuts sourcés" (2027etmoi, data.gouv.fr, checked on 28 October 2026), keeping
// only the "declare" status and each entry's own source; it is not downloaded, so that no name reaches the page
// without review. Update it by hand when a candidacy is announced or withdrawn.

const CHECKED_AT = '2026-10-28'

const COMPILED_FROM = {
  label: 'Candidatures à l’élection présidentielle 2027 — statuts sourcés (2027etmoi, data.gouv.fr)',
  url: 'https://www.data.gouv.fr/datasets/candidatures-a-lelection-presidentielle-2027-statuts-sources',
}

// Shared by the candidates franceinfo only lists in its portraits of declared candidates
const FRANCEINFO_PORTRAITS = {
  publisher: 'franceinfo',
  date: '2026-10-22',
  url: 'https://www.franceinfo.fr/elections/presidentielle/portraits-qui-sont-les-candidats-declares-a-l-election-presidentielle-de-2027_8208032.html',
}

// Political families, from left to right: the order of the seats on the page's hemicycle. Inspired by the grid of
// political nuances the ministry of the Interior uses for election results. A family with an AN group takes that
// group's colour from the deputies page (PCF: GDR, LR: Droite Républicaine…); the others use colours no AN group uses.
// A candidate's family follows the party or movement they run for; it is the site's own placement, shown as such.
const FAMILIES = [
  { id: 'EXG', abbrev: 'EXG', label: 'Extrême gauche', color: '#4D0A0A' },
  { id: 'COM', abbrev: 'PCF', label: 'Communistes', color: '#830E21' },
  { id: 'FI', abbrev: 'LFI', label: 'La France insoumise', color: '#C00D0D' },
  { id: 'ECO', abbrev: 'ÉCO', label: 'Écologistes', color: '#77AA79' },
  { id: 'SOC', abbrev: 'SOC', label: 'Socialistes et apparentés', color: '#F5B4CE' },
  { id: 'DVG', abbrev: 'DVG', label: 'Divers gauche', color: '#D9739A' },
  { id: 'ENS', abbrev: 'ENS', label: 'Ensemble (Renaissance, Horizons)', color: '#7B4591' },
  { id: 'LR', abbrev: 'LR', label: 'Les Républicains', color: '#8CB0DC' },
  { id: 'DVD', abbrev: 'DVD', label: 'Divers droite', color: '#4F86C6' },
  { id: 'DSV', abbrev: 'DSV', label: 'Droite souverainiste', color: '#5C6B8A' },
  { id: 'RN', abbrev: 'RN', label: 'Rassemblement national', color: '#313567' },
  { id: 'REC', abbrev: 'REC', label: 'Reconquête', color: '#5B3A29' },
]

// - source: article or statement reporting the candidacy, with its date (the announcement may be earlier);
// - hatvp: path of the person's file on hatvp.fr (`url_dossier` in liste.csv, without "/pages_nominatives/"), set
//   by hand after checking it is the same person. Without it, the page says the HATVP has no data on them;
// - family: id in FAMILIES, or null for a candidacy without a party or with a movement no family covers (shown
//   apart from the hemicycle, never placed on the left-right axis by guess).
const DECLARED = [
  { id: 'arthaud', family: 'EXG', firstName: 'Nathalie', lastName: 'Arthaud', party: 'Lutte ouvrière', source: { publisher: 'franceinfo', date: '2025-12-08', url: 'https://www.franceinfo.fr/politique/nathalie-arthaud/presidentielle-2027-nathalie-arthaud-porte-parole-de-lutte-ouvriere-annonce-sa-candidature_7665874.html' } },
  { id: 'asselineau', family: 'DSV', firstName: 'François', lastName: 'Asselineau', party: 'Union populaire républicaine', source: { publisher: 'UPR', date: '2026-07-07', url: 'https://upr.fr/actualites/francois-asselineau-en-2027-je-serai-le-seul-candidat-a-la-presidence-de-la-republique-francaise' } },
  { id: 'attal', family: 'ENS', firstName: 'Gabriel', lastName: 'Attal', party: 'Renaissance', source: { publisher: 'LCP', date: '2026-05-22', url: 'https://lcp.fr/actualites/presidentielle-2027-gabriel-attal-officialise-sa-candidature-436721' }, hatvp: 'attal-gabriel' },
  { id: 'batho', family: 'ECO', firstName: 'Delphine', lastName: 'Batho', party: 'Génération écologie', source: { publisher: 'L’info durable', date: '2025-11-25', url: 'https://www.linfodurable.fr/lex-ministre-delphine-batho-candidate-la-presidentielle-pour-conjurer-la-rikikisation-de-lecologie' }, hatvp: 'batho-delphine' },
  { id: 'becht', family: 'ENS', firstName: 'Olivier', lastName: 'Becht', party: 'Renaissance', source: { publisher: 'ICI Alsace', date: '2026-09-24', url: 'https://www.ici.fr/grand-est/alsace-cea/rixheim/il-faut-refonder-notre-modele-le-depute-alsacien-olivier-becht-est-candidat-a-la-presidentielle-1401407' }, hatvp: 'becht-olivier' },
  { id: 'bertrand', family: 'DVD', firstName: 'Xavier', lastName: 'Bertrand', party: 'Nous France', source: { publisher: 'franceinfo', date: '2026-08-27', url: 'https://www.franceinfo.fr/elections/presidentielle/xavier-bertrand-figure-de-la-droite-et-president-de-la-region-hauts-de-france-annonce-sa-candidature-a-l-election-presidentielle_8164871.html' }, hatvp: 'bertrand-xavier' },
  { id: 'billetdoux', family: null, firstName: 'Augustin', lastName: 'Billetdoux', party: 'Sans parti', source: FRANCEINFO_PORTRAITS },
  { id: 'bouamrane', family: 'SOC', firstName: 'Karim', lastName: 'Bouamrane', party: 'Parti socialiste', source: { publisher: 'CNews', date: '2026-08-26', url: 'https://www.cnews.fr/france/2026-08-26/presidentielle-2027-karim-bouamrane-ne-participera-pas-la-primaire-socialiste' }, hatvp: 'bouamrane-karim-18983' },
  { id: 'branco', family: null, firstName: 'Juan', lastName: 'Branco', party: 'Sans étiquette, soutenu par Les Ruches', source: { publisher: 'Sud Radio', date: '2025-12-19', url: 'https://www.sudradio.fr/sud-radio/lavocat-juan-branco-candidat-a-la-presidentielle' } },
  { id: 'cazeneuve', family: 'DVG', firstName: 'Bernard', lastName: 'Cazeneuve', party: 'La Convention', source: { publisher: 'Europe 1', date: '2026-04-29', url: 'https://www.europe1.fr/politique/presidentielle-2027-bernard-cazeneuve-annonce-sa-candidature-le-barrage-a-jean-luc-melenchon-se-precise-929339' } },
  { id: 'collovati', family: null, firstName: 'Christian', lastName: 'Collovati', party: 'Sans parti', source: FRANCEINFO_PORTRAITS },
  { id: 'dupont-aignan', family: 'DSV', firstName: 'Nicolas', lastName: 'Dupont-Aignan', party: 'Debout la France', source: { publisher: 'franceinfo', date: '2026-09-19', url: 'https://www.franceinfo.fr/politique/nicolas-dupont-aignan/je-serai-le-seul-candidat-qui-propose-de-sortir-de-l-union-europeenne-dit-nicolas-dupont-aignan-qui-se-lance-dans-sa-quatrieme-campagne-presidentielle_8201024.html' }, hatvp: 'dupont-aignan-nicolas' },
  { id: 'durif', family: null, firstName: 'Sylvain', lastName: 'Durif', party: 'Sans parti', source: { publisher: '20 Minutes', date: '2026-08-26', url: 'https://www.20minutes.fr/politique/4241053-20260826-presidentielle-2027-sylvain-durif-christ-cosmique-veut-presenter' } },
  { id: 'egger', family: null, firstName: 'Clara', lastName: 'Egger', party: 'Solution démocratique', source: { publisher: 'Solution démocratique', date: '2026-04-19', url: 'https://solutiondemocratique.fr/presidentielle2027-annonce-candidature-clara-egger/' } },
  { id: 'glucksmann', family: 'SOC', firstName: 'Raphaël', lastName: 'Glucksmann', party: 'Place publique', source: { publisher: 'LCP', date: '2026-10-11', url: 'https://lcp.fr/actualites/primaire-socialiste-vainqueur-des-le-1er-tour-raphael-glucksmann-sera-le-candidat-de-la' }, hatvp: 'glucksmann-raphael-16012' },
  { id: 'kazib', family: 'EXG', firstName: 'Anasse', lastName: 'Kazib', party: 'Révolution permanente', source: { publisher: 'Révolution permanente', date: '2026-06-01', url: 'https://www.revolutionpermanente.fr/Anasse-Kazib-2027-500-parrainages-pour-que-la-classe-ouvriere-s-invite-dans-la-presidentielle' } },
  { id: 'labib', family: 'EXG', firstName: 'Selma', lastName: 'Labib', party: 'NPA-Révolutionnaires', source: { publisher: 'NPA-Révolutionnaires', date: '2026-06-17', url: 'https://npa-revolutionnaires.org/sur-rtl-presidentielle-2027-selma-labib-officiellement-candidate-pour-le-npa-revolutionnaires/' } },
  { id: 'lalanne', family: null, firstName: 'Francis', lastName: 'Lalanne', party: 'France Libre', source: { publisher: 'franceinfo', date: '2026-08-19', url: 'https://www.franceinfo.fr/elections/presidentielle/presidentielle-2027-le-chanteur-francis-lalanne-officiellement-candidat-premier-meeting-vendredi-a-paris_8153588.html' } },
  { id: 'legendre', family: null, firstName: 'Jean-François', lastName: 'Legendre', party: 'À nous maintenant', source: FRANCEINFO_PORTRAITS },
  { id: 'le-pen', family: 'RN', firstName: 'Marine', lastName: 'Le Pen', party: 'Rassemblement national', source: { publisher: 'RTS', date: '2026-07-07', url: 'https://www.rts.ch/info/monde/2026/article/marine-le-pen-sera-candidate-a-la-presidentielle-de-2027-29297057.html' }, hatvp: 'le-pen-marine' },
  { id: 'lisnard', family: 'DVD', firstName: 'David', lastName: 'Lisnard', party: 'Nouvelle Énergie', source: { publisher: 'LCP', date: '2026-03-31', url: 'https://lcp.fr/actualites/je-suis-candidat-david-lisnard-quitte-lr-et-relance-le-debat-sur-une-primaire-a-droite' }, hatvp: 'lisnard-david' },
  { id: 'markovic', family: null, firstName: 'Mira', lastName: 'Markovic', party: 'Parti animaliste', source: FRANCEINFO_PORTRAITS },
  { id: 'mathieu', family: null, firstName: 'Benoît', lastName: 'Mathieu', party: 'Sans étiquette', source: { publisher: 'RMC', date: '2026-05-03', url: 'https://rmc.bfmtv.com/actualites/politique/presidentielle-2027-a-27-ans-il-sillonne-la-france-a-velo-en-quete-des-500-parrainages_AV-202605030128.html' } },
  { id: 'melenchon', family: 'FI', firstName: 'Jean-Luc', lastName: 'Mélenchon', party: 'La France insoumise', source: { publisher: 'LCP', date: '2026-05-03', url: 'https://lcp.fr/actualites/presidentielle-jean-luc-melenchon-officialise-sa-candidature-pour-2027-435851' } },
  { id: 'mikolajczak', family: null, firstName: 'Antoine', lastName: 'Mikolajczak', party: 'Équinoxe', source: { publisher: 'JHM', date: '2026-07-12', url: 'https://jhm.fr/sous-la-banniere-dequinoxe-antoine-mikolajczak-brigue-la-presidence-de-la-republique/' } },
  { id: 'mlekuz', family: null, firstName: 'Manolo', lastName: 'Mlekuz', party: 'Trajectoire', source: { publisher: 'RMC', date: '2026-07-03', url: 'https://rmc.bfmtv.com/actualites/politique/si-j-arrive-a-l-elysee-ce-candidat-pour-2027-age-de-20-ans-veut-etre-un-president-sans-pouvoir_AV-202607030571.html' } },
  { id: 'philippe', family: 'ENS', firstName: 'Édouard', lastName: 'Philippe', party: 'Horizons', source: { publisher: 'Public Sénat', date: '2026-09-09', url: 'https://www.publicsenat.fr/actualites/politique/presidentielle-2027-la-main-tendue-dedouard-philippe-rejetee-par-gabriel-attal-et-bruno-retailleau-relance-lidee-dune-primaire' }, hatvp: 'philippe-edouard' },
  { id: 'philippot', family: 'DSV', firstName: 'Florian', lastName: 'Philippot', party: 'Les Patriotes', source: { publisher: 'Front populaire', date: '2026-05-09', url: 'https://frontpopulaire.fr/politique/contents/florian-philippot-troisieme-candidat-souverainiste-a-la-presidentielle_tco_31760632' } },
  { id: 'platret', family: 'DVD', firstName: 'Gilles', lastName: 'Platret', party: 'Divers droite', source: { publisher: 'France 3 Bourgogne-Franche-Comté', date: '2026-10-09', url: 'https://france3-regions.franceinfo.fr/bourgogne-franche-comte/saone-et-loire/chalon-sur-saone/gilles-platret-le-maire-de-chalon-sur-saone-se-declare-candidat-a-l-election-presidentielle-je-m-engage-resolument-vers-2027-3430416.html' }, hatvp: 'platret-gilles' },
  { id: 'polony', family: null, firstName: 'Natacha', lastName: 'Polony', party: 'Nous sommes la France', source: { publisher: 'LCP', date: '2026-10-14', url: 'https://lcp.fr/actualites/natacha-polony-annonce-sa-candidature-a-l-election-presidentielle-443808' } },
  { id: 'retailleau', family: 'LR', firstName: 'Bruno', lastName: 'Retailleau', party: 'Les Républicains', source: { publisher: 'Les Républicains', date: '2026-04-20', url: 'https://republicains.fr/actualites/2026/04/20/bruno-retailleau-largement-designe-comme-candidat-des-republicains-pour-lelection-presidentielle/' }, hatvp: 'retailleau-bruno' },
  { id: 'rohou', family: 'ECO', firstName: 'Erwan', lastName: 'Rohou', party: 'Mouvement écologiste indépendant', source: FRANCEINFO_PORTRAITS },
  { id: 'roussel', family: 'COM', firstName: 'Fabien', lastName: 'Roussel', party: 'Parti communiste français', source: { publisher: 'LCP', date: '2026-09-06', url: 'https://lcp.fr/actualites/fabien-roussel-officiellement-candidat-du-pcf-a-l-election-presidentielle-de-2027-441389' } },
  { id: 'ruffin', family: 'ECO', firstName: 'François', lastName: 'Ruffin', party: 'Debout !', source: { publisher: 'Orange avec AFP', date: '2026-09-16', url: 'https://actu.orange.fr/politique/presidentielle-francois-ruffin-l-ex-insoumis-qui-a-du-mal-a-socialiser-CNT000002rVfmk.html' }, hatvp: 'ruffin-francois' },
  { id: 'tondelier', family: 'ECO', firstName: 'Marine', lastName: 'Tondelier', party: 'Les Écologistes', source: { publisher: 'Journal du Net', date: '2026-09-22', url: 'https://www.journaldunet.com/business/action-publique/1555211-referendum-interne-des-ecologistes-sur-la-candidature-de-marine-tondelier-a-la-presidentielle-de-2027/' } },
  { id: 'zemmour', family: 'REC', firstName: 'Éric', lastName: 'Zemmour', party: 'Reconquête', source: { publisher: 'L’Avenir', date: '2026-09-18', url: 'https://www.lavenir.net/actu/monde/2026/09/18/zemmour-confirme-quil-sera-candidat-a-lelection-presidentielle-en-france-et-durcit-encore-son-discours-sur-limmigration-5OFMOVM6CVCDFHY4B3GI5QID3Q/' } },
]

export function buildCandidates2027({ hatvpFor }) {
  if (new Set(DECLARED.map((c) => c.id)).size !== DECLARED.length) throw new Error('Candidates 2027: duplicate id')

  const familyRank = new Map(FAMILIES.map((f, i) => [f.id, i]))
  for (const c of DECLARED)
    if (c.family !== null && !familyRank.has(c.family)) throw new Error(`Candidates 2027: unknown family ${c.family}`)

  const files = hatvpFor.byFile(DECLARED)
  // Seat order is data order: by family from left to right, then alphabetical; unclassified candidates last
  const candidates = DECLARED.map(({ hatvp: _file, family, ...c }) => ({
    ...c,
    familyId: family,
    hatvp: files.get(c.id) ?? null,
  })).sort(
    (a, b) =>
      (familyRank.get(a.familyId) ?? FAMILIES.length) - (familyRank.get(b.familyId) ?? FAMILIES.length) ||
      a.lastName.localeCompare(b.lastName, 'fr'),
  )

  const withFile = candidates.filter((c) => c.hatvp)
  const withInterests = withFile.filter((c) => c.hatvp.interests)
  console.log(`Candidates 2027: ${candidates.length} announced candidacies`)
  console.log(`  HATVP: ${withFile.length} with a file, ${withInterests.length} with a published declaration of interests`)

  return {
    election: {
      id: 'presidential-2027',
      label: 'Élection présidentielle 2027',
      checkedAt: CHECKED_AT,
      compiledFrom: COMPILED_FROM,
    },
    families: FAMILIES,
    candidates,
  }
}
