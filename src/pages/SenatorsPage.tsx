import { SenatorProfile } from '@/components/panel/SenatorProfile'
import { SENATOR } from '@/lib/offices'
import type { Senator } from '@/types'
import { type ChamberConfig, ChamberPage } from './ChamberPage'

const CONFIG: ChamberConfig<Senator> = {
  file: 'senators.json',
  office: SENATOR,
  eyebrow: 'Sénat · 348 sièges',
  title: "« La Chambre des Sages »",
  place: (s) => s.constituency && `${s.constituency}${s.constituencyCode ? ` (${s.constituencyCode})` : ''}`,
  placeLabel: (s) => s.constituency,
  searchText: (s) => `${s.constituency ?? ''} ${s.constituencyCode ?? ''}`,
  profile: (s) => <SenatorProfile senator={s} />,
  sources: "Données publiques : Sénat, HATVP et Répertoire national des élus (ministère de l'Intérieur)",
}

/** "Sénateurs" page: the Sénat hemicycle and each senator's panel */
export function SenatorsPage() {
  return <ChamberPage config={CONFIG} />
}
