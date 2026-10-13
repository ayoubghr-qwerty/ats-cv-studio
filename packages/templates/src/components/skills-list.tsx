import type { SkillItem } from "@ats/core"

import { inlineSeparatorText } from "../item-format"
import type { TemplateStyles } from "../tokens"
import type { BulletStyle, InlineSeparator, ListColumns, SkillsLayout } from "../types"

export interface SkillsListProps {
  items: SkillItem[]
  styles: TemplateStyles
  bulletStyle?: BulletStyle
  columns?: ListColumns
  // "list" (default): one bullet per skill under its category heading.
  // "inline": one dense "Category: a, b, c" paragraph per category — plain
  // linear text (no list, no columns), so it is ATS-safe in every mode and
  // ignores `columns`/`bulletStyle`.
  layout?: SkillsLayout
  // Between items of an "inline" line: comma (default) or bullet.
  separator?: InlineSeparator
}

interface SkillGroup {
  label?: string
  names: string[]
}

export function groupSkillsByCategory(items: SkillItem[]): SkillGroup[] {
  const groups = new Map<string, string[]>()
  const ungrouped: string[] = []
  for (const item of items) {
    const name = item.name.trim()
    if (!name) continue
    const category = item.category?.trim()
    if (category) {
      const bucket = groups.get(category)
      if (bucket) bucket.push(name)
      else groups.set(category, [name])
    } else {
      ungrouped.push(name)
    }
  }
  const result: SkillGroup[] = []
  if (ungrouped.length > 0) result.push({ names: ungrouped })
  for (const [label, names] of groups) result.push({ label, names })
  return result
}

export function SkillsList({
  items,
  styles,
  bulletStyle = "disc",
  columns = "single",
  layout = "list",
  separator = "comma",
}: SkillsListProps) {
  const groups = groupSkillsByCategory(items)
  if (groups.length === 0) return null
  if (layout === "inline") {
    return (
      <>
        {groups.map((group) => (
          <p
            key={group.label ?? "__ungrouped"}
            className="cv-skill-inline"
            style={{ ...styles.bullet, margin: "0 0 3pt 0" }}
          >
            {group.label ? (
              <>
                <span className="cv-skill-category" style={{ fontWeight: 700 }}>
                  {group.label}:
                </span>{" "}
              </>
            ) : null}
            {group.names.join(inlineSeparatorText(separator))}
          </p>
        ))}
      </>
    )
  }
  const applyColumns = columns === "two"
  return (
    <>
      {groups.map((group, groupIndex) => (
        <div
          key={group.label ?? "__ungrouped"}
          style={groupIndex > 0 ? { marginTop: "6pt" } : undefined}
        >
          {group.label ? (
            <p className="cv-skill-category" style={styles.categoryLabel}>
              {group.label}
            </p>
          ) : null}
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: bulletStyle === "hyphen" ? '"-"' : "disc",
              paddingInlineStart: "10pt",
              ...(applyColumns ? { columns: "2", columnGap: "18pt" } : {}),
            }}
          >
            {group.names.map((name, index) => (
              <li key={index} style={{ ...styles.bullet, breakInside: "avoid" }}>
                {name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}
