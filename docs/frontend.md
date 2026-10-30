# Front end

A single-page React app with no global state library, routed with react-router. `App.tsx` is the layout:
the navbar, then the page of the current route. Each page fetches its own `public/data/<page>.json` when it mounts, so a visitor only
downloads the data of the pages they open.

## Routing

`src/router.tsx` builds a react-router **hash** router (`createHashRouter`): `#/deputes`, `#/senateurs`,
`#/gouvernement`, `#/candidats`, `#/a-propos`. GitHub Pages cannot rewrite URLs to `index.html`, so a path-based router
would 404 on reload; the hash also keeps every path relative (`base: './'`). The empty path redirects to
`#/deputes`; an unknown path shows `NotFoundPage`.

- `src/lib/pages.ts` lists the pages (`PAGES`: English id, French path, label, `aside` for pages linked beside the theme button rather than in the page list) and `pathTo(page)`.
- Each page route carries its `PageInfo` as `handle`. `useCurrentPage()` (`src/lib/layout.ts`) reads it;
  the layout uses it for `document.title` and the navbar's active link.
- The layout passes `{ onPanelChange }` to pages through the `<Outlet>` context (`useLayout()`).
- `<ScrollRestoration />` scrolls to the top on a new page and restores the position on back / forward.
- Links use react-router's `<Link to={pathTo(page)}>`.

To add a page: add it to `PAGES`, then give it its element in `router.tsx`. Pages not built yet render
`ComingSoonPage`, which describes what the page will show and its planned sources, without any figure.

## Components

| File | Role |
| --- | --- |
| `src/main.tsx` | Applies the theme, renders `<RouterProvider>` |
| `src/router.tsx` | Route table (hash router) |
| `src/App.tsx` | Layout: navbar, `<Outlet>`, scroll restoration, and the padding reserved for a side panel when it is open |
| `src/lib/pages.ts` | `PAGES`, `DEFAULT_PAGE`, `pathTo()` |
| `src/lib/layout.ts` | `useLayout()` (outlet context), `useCurrentPage()` |
| `src/components/Navbar.tsx` | One row: page links (shadcn `NavigationMenu`), then pages flagged `aside` in `PAGES` ("À propos", hidden on a phone: the footer links to it) and the theme toggle. On a phone the links are tightened (16px gutters, narrower padding and gap); when they still do not fit they scroll horizontally and the active link is scrolled into view |
| `src/components/SiteFooter.tsx` | Footer: the page's own sources (children), then the HATVP reproduction notice, a link to the "À propos" page and the X account (`X_ACCOUNT`), on every page |
| `src/pages/ChamberPage.tsx` | Generic chamber page, configured by a `ChamberConfig`: data loading, search box and results, hemicycle, readings, legend, panel |
| `src/pages/GovernmentPage.tsx` | Government page: total pay, `ReadingPicker` ("Rangs" then the chamber readings: cumul, autres revenus, capital, déclarations, from `summary()` with the `GOVERNMENT_MEMBER` or `PRESIDENT` office), `CouncilTable`, then either its rank legend (`RANKS` in `src/lib/government.ts`) or the reading's `ReadingDetail`, "Qui travaille avec qui" (the President, then the Prime Minister and each minister with the ministers delegate placed with them, from `reportsTo`; CSS columns rather than a grid, so cards of very different heights pack without gaps, in decree order down each column; titles clamped to two lines, full text on hover), "Les cabinets et l'Élysée" (`GovernmentCosts.tsx`), departures with their decree, `GovernmentPanel` |
| `src/components/GovernmentCosts.tsx` | "Les cabinets et l'Élysée" section of the Government page: `CabinetsCard` (totals, headcount by function, every cabinet ranked by size, clickable to open the member's panel) , `ElyseeCard` (allocation, spending forecast by item as a stacked bar, staff, trips) and, under it, `MinistriesCard` (payment credits of each ministry, largest first, "crédits évaluatifs" in a lighter tone; each row opens on its programmes and a link to the minister's panel). Bars inside a `Button` carry a `size-` class to escape its 16px icon size; large amounts are drawn as fractions because SVG coordinates are 32-bit floats |
| `src/components/CouncilTable.tsx` | The Government's counterpart of the hemicycle: SVG table of the Conseil des ministres, one disc per member (filled for the President, Prime Minister and ministers, hollow for ministers delegate). Takes the same `tint` / `detail` as `Hemicycle` for the readings (initials hidden then). Outside a reading, hovering or selecting a member dims everyone but their "auprès de" links and draws them; the table top shows the hovered member, like the centre of the hemicycle |
| `src/lib/government.ts` | `rankLabel()`, `RANKS` (legend and seat colours), `roleUnder()` (a delegate's title without the "auprès de" part), and `councilTableLayout(count)`: seats spread evenly round a stadium-shaped table, the President in the middle of the top side, the Prime Minister facing him, then the others alternating right and left of each, outwards, in decree order |
| `src/components/GovernmentPanel.tsx` | Side panel of a member of the Government or the President: pay breakdown from decree 2012-983, live counter, for the President a "Un régime à part" block (elected not appointed, declarations filed as a candidate and published unchecked, end-of-term asset declaration window and filing status from `presidentialTerm()` in `src/lib/government.ts`, art. 3 of law no. 62-1292), alerts, then the shared Cumuls / Capital / Déclarations tabs and a "Nomination" tab ("Élection" for the President) with the decrees |
| `src/pages/DeputiesPage.tsx`, `SenatorsPage.tsx` | The configuration of each chamber: data file, `Office`, title, constituency line, search text, profile tab, footer sources |
| `src/pages/CandidatesPage.tsx` | Candidates page (2022 presidential election): total refund owed by the State, timeline of official texts, one collapsible row per candidate (SVG bar of spending vs refund, then the account, refund steps, sponsorship breakdown and CNCCFP decision), sponsorship and refund rules, turnout |
| `src/pages/AboutPage.tsx` | "À propos" page (`#/a-propos`): purpose of the site, sources, legal notice (publisher, host, domain registrar, licences, HATVP terms), privacy (no cookie or analytics; theme in `localStorage`; IP seen by GitHub Pages and by the AN / Sénat photo hosts) and contact (`CONTACTS`: GitHub issues, X account and repository, from `src/lib/site.ts`; add social accounts there). Linked from `SiteFooter` on every page |
| `src/components/PageStatus.tsx` | What a data page shows before its JSON arrives: `PageLoading` (skeleton shaped like a page header, key figures and chart) and `PageError` (plain French message, "Réessayer" button, link to the GitHub issues, technical detail in small print). Never mention build commands there: visitors see it |
| `src/lib/site.ts` | `SITE_NAME` (browser tab, "À propos" page; `index.html` repeats it for the first paint) and `REPOSITORY` / `X_ACCOUNT`, the project's public addresses |
| `src/pages/NotFoundPage.tsx` | 404 page for an unknown path (`*` route): shows the path asked for and links to every page. The bare `#/` still redirects to the default page |
| `src/pages/ComingSoonPage.tsx` | Placeholder for a page whose data is not integrated yet (none today) |
| `src/components/Hemicycle.tsx` | SVG chart, generic over `Parliamentarian`. `members[i]` sits on `layout.seats[i]`, so the order of the dataset decides who sits where. The centre label shows the hovered member. |
| `src/lib/offices.ts` | `Office` descriptors (`DEPUTY`, `SENATOR`, `GOVERNMENT_MEMBER`, `PRESIDENT`): own income categories, whether local executive roles are banned, whether declarations are filed before taking office, and every wording that differs ("député" / "sénateur", "l'Assemblée" / "le Sénat", envelope and expense notes), passed to the panel, alerts and readings |
| `src/lib/hemicycle.ts` | `hemicycleLayout(count)`: seats spread over 12 arcs, proportionally to arc length, then sorted by angle (left to right) |
| `src/components/Legend.tsx` | Group filter, a single-select `ToggleGroup`; clicking the active group clears the filter |
| `src/components/MemberPanel.tsx` | Right-hand `Sheet`, generic over `Parliamentarian`; the "Profil" tab comes from the page config: header tinted with the group colour, key-figure tiles, then `Tabs` |
| `src/components/Readings.tsx` | Chart reading picker (groups, or ranks on the Government page; overlaps, side income, capital, declarations), colour scale, top-10 list with a page-supplied `marker`; generic over `Official`, definitions in `src/lib/readings.ts` |
| `src/components/panel/CostSummary.tsx` | Top of the panel: monthly seat cost, breakdown bar, SMIC comparison, live counter since taking office, three key figures |
| `src/components/panel/Alerts.tsx` | Facts from crossing AN × HATVP × RNE, by severity |
| `src/components/panel/OverlapsTab.tsx` | Default ("Cumuls") tab: income by year (stacked SVG bars, SMIC line), activities in parallel, RNE local mandates vs declaration, local allowance cap, other mandates |
| `src/lib/money.ts` | Cost, income classification, alerts, per-member summary used by the readings; `pendingDeadline()` tells whether the two-month filing deadline is still running |
| `src/components/panel/DeputyProfile.tsx`, `SenatorProfile.tsx` | "Profil" tab of each chamber: constituency, mandate, committees, biography, contact |
| `src/components/panel/PayTab.tsx` | Allowance, special allowances, expense envelopes, staff |
| `src/components/panel/CapitalTab.tsx` | "Capital" tab: holdings table, or why the declaration content is missing (pending deadline, not published…). Also exports `DeclaredActivities`, the four activity sections of the declaration in full, shown at the end of the "Cumuls" tab |
| `src/components/panel/DeclarationsTab.tsx` | HATVP declarations grouped into assets and interests |
| `src/components/panel/parts.tsx` | Shared blocks: `Section` (optional `aside`), `Fields`/`Field`, `ExternalLink`, `MissingData`, `Note`, `KeyFigure` (tiles under the panel header), `NotesAndSources` (the collapsed "Précisions et sources"), `NoteGroup` |
| `src/lib/declarations.ts` | Maps raw HATVP statuses to labels and states (`published`, `pending`, `missing`) |
| `src/lib/format.ts` | `formatDate`, `formatEuro`, `age` (fr-FR) |

## Styling rules

- **No hand-written CSS.** Use Tailwind utility classes and shadcn/ui components. `src/index.css` holds
  only the shadcn theme generated by the CLI.
- **Inline `style` is reserved for colours that come from the data**: group colours, seat fill, the
  panel's top border.
- **Adding a component**: `npx shadcn@latest add <name>`. The files land in `src/components/ui/`. Avoid
  editing them; override through `className` at the call site instead.
- **Overriding a shadcn class that uses a variant selector**: repeat the same selector. For example, the
  sheet width is set with `data-[side=right]:sm:max-w-[30rem]`, because a plain `sm:max-w-md` loses
  against the component's own `data-[side=right]:sm:max-w-sm`.
- **`cn`** comes from the `cn` npm package (published by shadcn) and is re-exported by `src/lib/utils.ts`.
- **Dark mode**: shadcn relies on a `.dark` class. `src/lib/theme.ts` sets it from the choice saved in
  `localStorage` (`theme`: `light` or `dark`; the former `clair`/`sombre` values are still read), or from `prefers-color-scheme` when nothing is saved.
  `ThemeToggle` in the header saves the choice.

## Behaviour worth knowing

- **The panel is a non-modal `Sheet`.** `modal={false}`, with `onInteractOutside` prevented, so clicking
  another seat swaps the deputy instead of closing the panel. Escape and the × button close it.
  `onOpenAutoFocus` is prevented so the search input keeps focus.
- **Only the panel body scrolls.** The header (photo, name, group, the French "Fermer la fiche" button
  that replaces shadcn's English close button) stays fixed, and the tab bar is `sticky` at the top of the
  body. Changing tab while scrolled past the tab bar jumps back to the start of the new tab's content.
  The body has a thin scrollbar in the theme's border colour (darker on hover), set with Tailwind arbitrary
  properties (`[scrollbar-width:thin]`, `[scrollbar-color:…]`) so it does not compete with the page's own.
- **`DeputyDetails` is keyed by deputy id**, and it owns the scroll container, so switching deputies
  resets both the tab (to "Cumuls") and the scroll position.
- **Wide screens**: from `lg` up, the root wrapper in `App` gets `lg:pr-[30rem]` while the panel is open
  (the page reports it through `onPanelChange`, and resets it when it unmounts), so `<main>` (`mx-auto`) stays centred in the free space instead of hiding behind the panel. The page is also centred vertically.
- **Seat picking uses the nearest seat**, not the circle under the pointer. On a phone the dots are 6 to 8 px wide,
  so `Hemicycle` maps the pointer to the closest seat (within 2.5 seat radii) and selects on `pointerup`. On touch,
  sliding a finger previews names in the centre label and releasing opens that deputy; the SVG is `touch-pan-y`, so
  vertical swipes still scroll the page. A hint shown only on coarse pointers explains the gesture.
- **Accessibility**: seats have `role="listitem"`, an `aria-label` and keyboard activation (Enter or
  Space), and the centre label is an `aria-live` region.

## Language

All UI text is in French. Everything else is in English: identifiers, types, file names, the generated
JSON schema and code comments. Raw values copied from the sources keep their original form (`type_mandat`
values such as `depute`, HATVP statuses such as `Livrée`), and so do the URL paths visitors see (`#/senateurs`).
