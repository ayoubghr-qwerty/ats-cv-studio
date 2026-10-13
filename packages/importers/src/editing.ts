import type { SectionType } from "@ats/core"

import type { DraftCv } from "./types"

export function assignUnmappedLine(
  draft: DraftCv,
  lineIndex: number,
  sectionType: SectionType,
  entryIndex: number | null = null,
): DraftCv {
  const line = draft.unmapped[lineIndex]
  if (line === undefined) return draft
  const unmapped = draft.unmapped.filter((_, i) => i !== lineIndex)
  const sections = [...draft.sections]
  let section = sections.find((s) => s.type === sectionType)
  if (!section) {
    section = { type: sectionType, entries: [] }
    sections.push(section)
  }
  const entries = [...section.entries]
  if (entryIndex !== null && entries[entryIndex]) {
    entries[entryIndex] = { ...entries[entryIndex], lines: [...entries[entryIndex].lines, line] }
  } else {
    entries.push({ title: line, meta: "", lines: [] })
  }
  sections[sections.indexOf(section)] = { ...section, entries }
  return { ...draft, sections, unmapped }
}
