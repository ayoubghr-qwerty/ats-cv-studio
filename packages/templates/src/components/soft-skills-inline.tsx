import type { SoftSkillItem } from "@ats/core"

import { inlineSeparatorText } from "../item-format"
import type { TemplateStyles } from "../tokens"
import type { InlineSeparator } from "../types"

/**
 * One dense "Communication, Teamwork, Adaptability" paragraph (comma or bullet
 * separated, same setting as the inline skills). Plain linear text, like
 * SkillsList's "inline" layout and LanguagesInline: no list, no columns, so
 * it is ATS-safe in every mode.
 */
export function SoftSkillsInline({
  items,
  styles,
  separator = "comma",
}: {
  items: SoftSkillItem[]
  styles: TemplateStyles
  separator?: InlineSeparator
}) {
  const names = items.map((item) => item.name).filter(Boolean)
  if (names.length === 0) return null
  return (
    <p className="cv-softskills-inline" style={{ ...styles.bullet, margin: 0 }}>
      {names.join(inlineSeparatorText(separator))}
    </p>
  )
}
