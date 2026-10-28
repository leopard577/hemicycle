# CLAUDE.md

Cost and transparency of French public officials, from official open data. A static React app with one page
per institution (deputies, senators, government, candidates), routed by URL hash, each reading its own
generated JSON file. All four pages are built; the candidates page covers the 2022 presidential election. Read `README.md` for the overview,
`docs/data.md` for the data pipeline, `docs/frontend.md` for the UI and `docs/roadmap.md` for the plan and its status.

## Commands

```bash
npm run data    # regenerate public/data/*.json (one file per page) from AN, Sénat, HATVP and RNE (~170 MB download)
npm run dev     # Vite dev server
npm run build   # tsc -b + vite build: run it to verify any change
npm run lint    # oxlint
```

There is no test suite. Verify a change with `npm run build`, then by loading the app in a browser and
opening a deputy's and a senator's panel.

## Hard rules

- **Never store or display the content of asset declarations** (`dsp`, `dspm`, `dspfm`), for anyone.
  For parliamentarians publishing it is a criminal offence (art. LO 135-2 of the electoral code). The HATVP
  publishes those of ministers and the President, and the XML contains them, but the app applies the same rule
  by choice of the project owner: `isDeclaration()` in each page module only accepts declarations of
  interests. One exception, decided by the project owner on 28 October 2026: the candidates page shows each 2022
  presidential candidate's net worth as reported by franceinfo/AFP (`PRESS_NET_WORTH` in `scripts/candidates.mjs`),
  citing the article, because the declarations were only public until the first-round results. Do not extend it. Only their filing status and dates from `liste.csv` are allowed. The "capital" shown in the app comes from the financial holdings in
  declarations of *interests* (DIA).
- **Respect the HATVP's [legal notice](https://www.hatvp.fr/mentions-legales/).** Reproduce declaration
  content without altering it (keep `[Données non publiées]` markers verbatim, never round declared amounts, label every derived figure as a
  calculation), cite the HATVP as the source, keep the footer notice that reproduction rights are "réservés
  et strictement limités", and never use it for commercial or advertising purposes. Never use photos or
  images from hatvp.fr (`url_photo` in `liste.csv`): they are covered by copyright and image rights.
- **No hand-written CSS.** Use Tailwind classes and shadcn/ui components (`npx shadcn@latest add <name>`).
  `src/index.css` is the generated shadcn theme. Inline `style` is only for colours that come from the data.
- **Do not edit `src/components/ui/*`** unless there is no other way. Override with `className`, repeating
  the component's variant selector when needed (e.g. `data-[side=right]:sm:max-w-[30rem]`).
- **`public/data/*.json` is generated and git-ignored.** Never commit it: change `scripts/`, then
  rerun `npm run data`. The GitHub Pages workflow (`.github/workflows/deploy.yml`) regenerates it on every
  deploy, plus a weekly scheduled run.
- **Keep paths relative.** `vite.config.ts` sets `base: './'` so the site works under
  `/<repo>/` on GitHub Pages. Load static files through `import.meta.env.BASE_URL`, never with a leading `/`.
- **Route with react-router's hash router** (`createHashRouter` in `src/router.tsx`, `#/senateurs`). GitHub
  Pages has no URL rewriting, so `createBrowserRouter` would 404 on reload. Pages are listed in
  `src/lib/pages.ts`; link with `<Link to={pathTo(page)}>`.
- **Keep `src/types.ts` in sync** with what the page modules (`scripts/deputies.mjs`, `scripts/senators.mjs`) and
  `scripts/lib/hatvp.mjs`
  emit. Fields shared by every page (identity, `hatvp`, `localMandates`) live in `Official`; page types extend it.
- **Download shared sources once.** HATVP and RNE are loaded in `build-data.mjs` and passed to every page's
  `build…()` function. A page module never downloads them itself.

## Conventions

- **Code is in English, the UI in French.** Identifiers, types, file names, the generated JSON schema, code
  comments and build logs are in English; docs too. Only user-facing text is French. Raw source values keep
  their original form (`type_mandat` = `depute`, HATVP status `Livrée`, AN fields such as `libelle`), and so
  do the URL paths visitors see (`#/senateurs`).
- Import with the `@/` alias (→ `src/`). TypeScript 7 does not accept `baseUrl`: the alias is declared
  through `paths` alone, in `tsconfig.json`, `tsconfig.app.json` and `vite.config.ts`.
- `cn` comes from the `cn` npm package (shadcn's replacement for clsx + tailwind-merge), re-exported from
  `@/lib/utils`.
- Shared panel building blocks live in `src/components/panel/parts.tsx`; formatters in `src/lib/format.ts`.
- **Chamber wording lives in `src/lib/offices.ts`.** Shared components never hard-code "député": they take an
  `Office`. Each chamber page is a `ChamberConfig` (`src/pages/DeputiesPage.tsx`, `SenatorsPage.tsx`) on top of
  `ChamberPage`.
- **Missing data must stay explicit.** In `Interests`, `[]` means "néant" was declared and `null` means the
  section is missing. Never collapse the two, and use `MissingData` to explain an absence.

## Gotchas

- **Seat order is data order.** `Hemicycle` puts `members[i]` on seat `i`. Each chamber script sorts its members
  by `GROUP_ORDER`, then by real seat number. A new group must be added to `GROUP_ORDER` in `scripts/deputies.mjs`
  (abbreviation) or `scripts/senators.mjs` (group code, plus a colour in `GROUP_COLORS`: the Sénat publishes none).
- **The HATVP XML has no AN id.** Deputies are matched in three passes: birth date plus names, then birth
  date plus surname, then names alone. Each declaration is assigned at most once. Check the coverage line
  printed by `npm run data` (currently 538 of 574 deputies; 167 of 348 senators, low because of the 1 October 2026
  renewal) after touching `scripts/lib/hatvp.mjs`.
- **The Government list is hand-maintained** from the Journal officiel decrees in `scripts/government.mjs`. Update
  it at every reshuffle; the build fails when the HATVP lists a current minister missing from it. Ministers
  declare their ministerial pay as a job or a mandate: `GOVERNMENT_ROLE` in `money.ts` classifies those lines as
  `government` so they are not counted as side income.
- **The HATVP CSV joins on `id_origine`**: the AN id without `PA`, or the Sénat matricule; ministers have none. It falls back to surname plus first
  name when that column is empty.
- **Alerts name real people.** `alerts()` in `src/lib/money.ts` must only state dated, sourced facts, never
  intent ("fraude", "planque"…). Keep the tolerances (30 days for incompatibilities, two months plus a week
  for filings) unless the law says otherwise.
- **The RNE has no stable URL.** `scripts/lib/rne.mjs` finds each file by title through the data.gouv API; if a
  title changes the build fails on purpose.
- **Cabinets and the Élysée budget are hand-copied** from the PLF annexes into `scripts/government-costs.mjs`.
  Update them every October with the new PLF; keep `cabinets.byMinister` keyed by the surnames used in
  `government.mjs`, or the build fails. The cabinet annex is a 1 July snapshot, so it lags any later reshuffle.
  Ministry budgets are read from the PLF bill itself (`PLF_2027_BILL`, table 6); after a reshuffle or a new PLF,
  update `MINISTRY_HEADS` and the bill URL.
- **Campaign accounts are hand-copied** from the CNCCFP decisions in `ACCOUNTS` (`scripts/candidates.mjs`).
  The build checks each refund against the legal cap (`presidentialFunding2022` in `pay-scales.mjs`) and the
  decision's own arithmetic (entitlement − irregular − penalty = refund), and fails on a mismatch. Never name
  sponsors, nor people who received sponsorships without being on the official list.
- **Pay scales are hard-coded** in `scripts/pay-scales.mjs`: `deputyPayScales` and `DEPUTY_SPECIAL_ALLOWANCES` from AN
  fiche n° 7 (January 2026), `senatorPayScales` and `SENATOR_SPECIAL_ALLOWANCES` from the Sénat pages listed in
  `senatorPayScales.sources`, `minimumWage` from the June 2026 SMIC. `governmentPayScales` is computed from
  decree no. 2012-983 and the deputies' base allowance. Update them by hand when new amounts are published.
- **Filing deadlines.** Right after a renewal many members have no declaration yet. `pendingDeadline()` in
  `src/lib/money.ts` tells the panel to say "Déclaration attendue d'ici le …" instead of flagging it missing.
- **The member panel is a non-modal Radix `Sheet`.** Outside clicks are ignored on purpose, so seats stay
  clickable while it is open.
- **AN JSON quirks.** Single values may or may not be arrays (use `asArray` from `scripts/lib/util.mjs`). Empty values can be
  `{ "@xsi:nil": "true" }` objects (use `text()`). `organeRef` can be an array.
- **Sénat quirks.** The `data.senat.fr` CSV exports are comma-separated, quoted, cp1252 and start with `%` comment
  lines: use `parseQuotedCsv`. A senator without a seat has `siege: 0`. See `docs/data.md`.
