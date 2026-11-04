// Work of each deputy since their current term began, from the Assemblée nationale open data: public votes, presence
// at committee meetings and bills tabled. Licence Ouverte; the three archives are about 50 MB in all.
import AdmZip from 'adm-zip'
import { asArray, downloadResumable } from './util.mjs'

const BASE = 'https://data.assemblee-nationale.fr/static/openData/repository/17'
const VOTES = `${BASE}/loi/scrutins/Scrutins.json.zip`
const BILLS = `${BASE}/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip`
const MEETINGS = `${BASE}/vp/reunions/Agenda.json.zip`

const billUrl = (number) => `https://www.assemblee-nationale.fr/dyn/17/textes/l17b${number}_proposition-loi`

const POSITIONS = {
  pours: 'for',
  contres: 'against',
  abstentions: 'abstain',
  nonVotants: 'nonVoting',
  nonVotantsVolontaires: 'nonVoting',
}

const day = (timestamp) => timestamp?.slice(0, 10) ?? null

async function jsonFiles(url, dir) {
  const zip = new AdmZip(await downloadResumable(url))
  return zip
    .getEntries()
    .filter((e) => !e.isDirectory && e.entryName.includes(dir) && e.entryName.endsWith('.json'))
    .map((e) => JSON.parse(e.getData().toString('utf8')))
}

const push = (map, key, value) => {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

function readVotes(files) {
  const scrutinDates = []
  const votes = new Map()
  for (const { scrutin } of files) {
    const date = scrutin.dateScrutin
    scrutinDates.push(date)
    for (const group of asArray(scrutin.ventilationVotes.organe.groupes.groupe)) {
      const nominal = group.vote.decompteNominatif
      for (const [field, position] of Object.entries(POSITIONS))
        for (const v of asArray(nominal[field]?.votant))
          push(votes, v.acteurRef, { date, position, delegated: v.parDelegation === 'true' })
    }
  }
  return { scrutinDates, votes }
}

// Cancelled meetings and those still to come are left out: the agenda lists upcoming ones with everyone "absent"
function readMeetings(files) {
  const today = day(new Date().toISOString())
  const meetings = new Map()
  for (const { reunion } of files) {
    const date = day(reunion?.timeStampDebut)
    if (reunion?.cycleDeVie?.etat !== 'Confirmé' || !date || date >= today) continue
    for (const p of asArray(reunion.participants?.participantsInternes?.participantInterne))
      push(meetings, p.acteurRef, { date, presence: p.presence })
  }
  return meetings
}

// Bills tabled at the Assemblée only: the archive also holds Sénat bills ("PIONS…") and those it sent over ("INITNAV")
function readBills(files) {
  const authored = new Map()
  const cosigned = new Map()
  for (const { document: d } of files) {
    const { classification: kind, uid } = d ?? {}
    if (kind?.type?.code !== 'PION' || kind.famille?.depot?.code !== 'INITDEP' || !uid.startsWith('PIONANR')) continue
    const number = uid.replace(/^.*B/, '')
    const date = day(d.cycleDeVie?.chrono?.dateDepot ?? d.cycleDeVie?.chrono?.dateCreation)
    const authors = asArray(d.auteurs?.auteur)
      .filter((a) => a.acteur?.qualite === 'auteur')
      .map((a) => a.acteur.acteurRef)
    const bill = { title: d.titres.titrePrincipalCourt ?? d.titres.titrePrincipal, date, url: billUrl(number) }
    for (const id of new Set(authors)) push(authored, id, bill)
    for (const c of asArray(d.coSignataires?.coSignataire))
      if (!c.dateRetraitCosignature && !authors.includes(c.acteur?.acteurRef))
        push(cosigned, c.acteur?.acteurRef, day(c.dateCosignature) ?? date)
  }
  return { authored, cosigned }
}

/** Downloads the three AN archives */
export async function loadAssemblyActivity() {
  console.log('Downloading Assemblée nationale votes, bills and meetings…')
  const [votes, bills, meetings] = await Promise.all([
    jsonFiles(VOTES, 'json/').then(readVotes),
    jsonFiles(BILLS, 'document/').then(readBills),
    jsonFiles(MEETINGS, 'json/').then(readMeetings),
  ])
  return { ...votes, ...bills, meetings }
}

/** A deputy's activity, counted from the start of their current term */
export function activityOf({ scrutinDates, votes, meetings, authored, cosigned }, { id, startDate }) {
  const since = (list = []) => list.filter((x) => (x.date ?? x) >= startDate)
  const cast = since(votes.get(id))
  const count = (position) => cast.filter((v) => v.position === position).length
  const attended = since(meetings.get(id))
  const seen = (presence) => attended.filter((m) => m.presence === presence).length
  return {
    votes: {
      scrutins: since(scrutinDates).length,
      for: count('for'),
      against: count('against'),
      abstain: count('abstain'),
      nonVoting: count('nonVoting'),
      delegated: cast.filter((v) => v.delegated).length,
    },
    committeeMeetings: { present: seen('présent'), excused: seen('excusé'), absent: seen('absent') },
    bills: {
      authored: since(authored.get(id)).sort((a, b) => b.date.localeCompare(a.date)),
      cosigned: since(cosigned.get(id)).length,
    },
  }
}
