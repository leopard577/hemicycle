# CLAUDE.md

Cost and transparency of French public officials, from official open data. A static React app with one page
per institution (deputies, senators, government, candidates), routed by URL hash, each reading its own
generated JSON file. Only the deputies page is built so far. Read `README.md` for the overview, `docs/data.md` for the data pipeline and
`docs/frontend.md` for the UI.

## Commands

```bash
npm run data    # regenerate public/data/*.json (one file per page) from AN, HATVP and RNE (~170 MB download)
npm run dev     # Vite dev server
npm run build   # tsc -b + vite build: run it to verify any change
npm run lint    # oxlint
```

There is no test suite. Verify a change with `npm run build`, then by loading the app in a browser and
opening a deputy's panel.

## Hard rules

- **Never fetch, store or display the content of deputies' asset declarations** (`dsp`, `dspm`, `dspfm`).
  Publishing it is a criminal offence (art. LO 135-2 of the electoral code). Only their filing status and
  dates from `liste.csv` are allowed. The "capital" shown in the app comes from the financial holdings in
  declarations of *interests* (DIA).
- **Respect the HATVP's [legal notice](https://www.hatvp.fr/mentions-legales/).** Reproduce declaration
  content without altering it (keep partial `[Données non publiées]` markers, label every derived figure as a
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
- **Route with the hash only** (`src/lib/router.ts`, `#/senateurs`). GitHub Pages has no URL rewriting, so a
  path-based router would 404 on reload. Do not add a router library for this.
- **Keep `src/types.ts` in sync** with what the page modules (`scripts/deputies.mjs`) and `scripts/lib/hatvp.mjs`
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
- Shared panel building blocks live in `src/components/deputy/parts.tsx`; formatters in `src/lib/format.ts`.
- **Missing data must stay explicit.** In `Interests`, `[]` means "néant" was declared and `null` means the
  section is missing. Never collapse the two, and use `MissingData` to explain an absence.

## Gotchas

- **Seat order is data order.** `Hemicycle` puts `deputes[i]` on seat `i`. The script sorts deputies by
  `GROUP_ORDER`, then by real seat number. A new group abbreviation must be added to `GROUP_ORDER` in
  `scripts/deputies.mjs`.
- **The HATVP XML has no AN id.** Deputies are matched in three passes: birth date plus names, then birth
  date plus surname, then names alone. Each declaration is assigned at most once. Check the coverage line
  printed by `npm run data` (currently 538 of 574) after touching `scripts/lib/hatvp.mjs`.
- **The HATVP CSV joins on `id_origine`**, the AN id without `PA`. It falls back to surname plus first
  name when that column is empty.
- **Alerts name real people.** `alerts()` in `src/lib/money.ts` must only state dated, sourced facts, never
  intent ("fraude", "planque"…). Keep the tolerances (30 days for incompatibilities, two months plus a week
  for filings) unless the law says otherwise.
- **The RNE has no stable URL.** `scripts/lib/rne.mjs` finds each file by title through the data.gouv API; if a
  title changes the build fails on purpose.
- **Pay scales are hard-coded** in `scripts/pay-scales.mjs` (`deputyPayScales`, `DEPUTY_SPECIAL_ALLOWANCES`) from AN fiche
  n° 7, January 2026, and `minimumWage` from the June 2026 SMIC. Update them by hand when the Assemblée publishes new amounts.
- **The deputy panel is a non-modal Radix `Sheet`.** Outside clicks are ignored on purpose, so seats stay
  clickable while it is open.
- **AN JSON quirks.** Single values may or may not be arrays (use `asArray` from `scripts/lib/util.mjs`). Empty values can be
  `{ "@xsi:nil": "true" }` objects (use `text()`). `organeRef` can be an array.
