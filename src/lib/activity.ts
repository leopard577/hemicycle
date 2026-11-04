// Work of a deputy since the start of their term, from the counts in the page dataset. These figures describe what the
// Assemblée records, not how hard someone works: the wording must stay on what was counted.
import type { ParliamentaryActivity } from '@/types'

/** Below this, a percentage of committee meetings says nothing */
const MIN_MEETINGS = 10

export const votesCast = ({ votes }: ParliamentaryActivity) => votes.for + votes.against + votes.abstain

export const meetingsHeld = ({ committeeMeetings: m }: ParliamentaryActivity) => m.present + m.excused + m.absent

/** Share of committee meetings attended, 0 to 1; null with too few meetings to compare */
export function committeeAttendance(activity: ParliamentaryActivity) {
  const held = meetingsHeld(activity)
  return held < MIN_MEETINGS ? null : activity.committeeMeetings.present / held
}

export const percent = (share: number) => `${Math.round(share * 100)} %`
