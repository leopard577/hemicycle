# Roadmap

The app grows from one page (deputies) to four: **Députés**, **Sénateurs**, **Gouvernement** and
**Candidats**. Each page follows the deputies' model: an official source says who holds the office, the
HATVP and the RNE are joined to it, and a hand-entered pay scale, with its source, gives the cost.

## Steps

| # | Step | Status |
| --- | --- | --- |
| 1 | Split the data pipeline into shared sources (`scripts/lib/`) and one module per page; one JSON per page; shared `Official` type | Done |
| 2 | Navbar and routing (react-router, hash router) | Done |
| 3 | Senators page | Done |
| 4 | Government page, with ministerial cabinets and the Élysée budget | Done |
| 5 | Candidates page, starting with the 2022 presidential election | Done for 2022 (legislative elections and 2027 still to add) |

Also done along the way: the HATVP legal notice is applied (partial redactions kept verbatim, reproduction
notice in the footer), and the whole code base is in English (the UI stays in French).

## 3. Senators

| Need | Source |
| --- | --- |
| Who sits, group, committees, photo, **real seat number** | `www.senat.fr/api-senat/senateurs.json` (field `siege`) |
| Birth date, Bureau roles | `data.senat.fr/data/senateurs/ODSEN_GENERAL.csv` (cp1252, `%` comment header) |
| HATVP declarations | `liste.csv`, `type_mandat=senateur`; `id_origine` is the Sénat matricule (`21077M`), so the join is exact |
| Declarations of interests | `declarations.xml`, same three-pass matching, mandate label to check in the XML |
| Local mandates | RNE, same matching |
| Pay | Sénat page on senators' allowance and means, hand-entered in `scripts/pay-scales.mjs` |

LO 135-2 applies to senators too: only the filing status of asset declarations is shown. The hemicycle
component is reused (348 seats); the deputy panel becomes a generic official panel, and the alert wording
must stop assuming a deputy.

## 4. Government

Done: composition from the Journal officiel decrees (hand-maintained, checked against the HATVP list), pay
computed from decree no. 2012-983, HATVP declarations of interests and RNE. The owner decided to keep the asset
declaration rule (status and dates only) for ministers and the President.

Also done: ministerial cabinets and the Élysée budget, from two annexes to the PLF for 2027
(`scripts/government-costs.mjs`): headcount of each cabinet on 1 July 2026 and the yearly envelope of the
special-duty allowance (ISP), then the presidency's allocation and its 2026 spending forecast by item.

Still to do:
- **Cabinet pay**: the 2027 annex no longer publishes the total pay of the cabinets, only the ISP envelope.
  Earlier editions did (CSV on data.gouv.fr up to 2017, PDF since); add it back if a later edition does.
- **Cour des comptes**: its yearly report on the presidency's accounts would give executed spending rather than
  a forecast.
- **Photos** for the 15 members who never sat in Parliament (or only before 2024): no official source yet.
  Wikimedia Commons would cover most of them, with a licence and an author to credit on each photo.

## 5. Candidates

Done for the 2022 presidential election: the twelve candidates on the official list (decision 2022-187 PDR),
their sponsorships (counts by type of elected official and number of departments, sponsors never named),
their votes in both rounds (ministère de l'Intérieur, final national results) and their campaign accounts as
settled by the CNCCFP on 14 December 2022 (published in the JO of 27 January 2023, 24 February for Marine Le
Pen), with the refund owed by the State, irregular spending and reductions. The accounts are copied by hand
from the decisions; the build checks them against the legal formula.

Still to do:
- **Official campaign** (posters, election addresses, ballots) paid directly by the State: no per-candidate
  source found yet.
- **Links to the other pages** when a candidate holds an office today (deputy, minister…).
- **Legislative elections** and **2027**, as below. The page already says that 2027 will get its own page once the
  official data is public (sponsorships and list from the Conseil constitutionnel, then results and campaign
  accounts); until then it names no 2027 candidate.

Initial plan:

- Presidential election: the Conseil constitutionnel publishes sponsorships (open data for 2017 and 2022)
  and the official list of candidates. Legislative elections: the ministère de l'Intérieur publishes the
  candidate lists on data.gouv.fr.
- **Cost to the State**: flat-rate refund of campaign expenses (CNCCFP campaign accounts on data.gouv.fr,
  published months after the vote), official campaign material, public funding of parties (yearly decree).
- Only official, dated statuses are shown: before the official list, calling someone a "candidate" is a
  claim, not a fact.
- Start with 2022, for which every source exists, then move to 2027 once sponsorships are published.

## Shared key between pages

Every row of `liste.csv` for the same person shares `url_dossier`. It links a minister to their former
deputy or senator record, and a candidate to their current office.
