import { DeputyProfile } from '@/components/panel/DeputyProfile'
import { DEPUTY } from '@/lib/offices'
import type { Deputy } from '@/types'
import { type ChamberConfig, ChamberPage } from './ChamberPage'

const CONFIG: ChamberConfig<Deputy> = {
  file: 'deputies.json',
  office: DEPUTY,
  eyebrow: '17ᵉ législature · 577 sièges',
  title: "L'Assemblée nationale",
  place: (d) =>
    d.department && (
      <>
        {d.department} ({d.departmentCode}) · {d.constituency}
        <sup>{d.constituency === '1' ? 're' : 'e'}</sup> circ.
      </>
    ),
  placeLabel: (d) => d.department,
  searchText: (d) => `${d.department ?? ''} ${d.departmentCode ?? ''}`,
  profile: (d) => <DeputyProfile deputy={d} />,
  sources: "Données publiques : Assemblée nationale, HATVP et Répertoire national des élus (ministère de l'Intérieur)",
}

/** "Députés" page: the Assemblée nationale hemicycle and each deputy's panel */
export function DeputiesPage() {
  return <ChamberPage config={CONFIG} />
}
