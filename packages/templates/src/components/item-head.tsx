import type { ReactNode } from "react"

import type { TemplateStyles } from "../tokens"
import type { DatePlacement, ItemFormatTokens } from "../types"
import { DEFAULT_ITEM_FORMAT } from "../item-format"

export interface ItemHeadProps {
  /** Bold lead text: role, degree, project name... */
  title: ReactNode
  /** Secondary parts after the title (company, city...). Empty ones are dropped. */
  meta: string[]
  /** Pre-formatted date range; empty when the item has none. */
  date: string
  placement: DatePlacement
  styles: TemplateStyles
  format?: ItemFormatTokens
}

/**
 * The title line of a dated item.
 *  - inline: "Title - meta · date" in one paragraph (default everywhere).
 *  - right:  title + meta on the left, date on the right of the same line.
 * DOM order is always title, meta, date, so a text-stream ATS reads it the
 * same way in both layouts (the right alignment is flex layout, not columns).
 */
export function ItemHead({
  title,
  meta,
  date,
  placement,
  styles,
  format = DEFAULT_ITEM_FORMAT,
}: ItemHeadProps) {
  const parts = meta.filter(Boolean)
  if (placement === "right" && date) {
    const text = parts.join(format.metaSeparator)
    return (
      <div
        className="cv-item-head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "8pt",
          alignItems: "baseline",
        }}
      >
        <p className="cv-item-title" style={styles.itemTitle}>
          {title}
          {text ? (
            <span style={{ fontWeight: 400 }}>{`${format.titleSeparator}${text}`}</span>
          ) : null}
        </p>
        <span
          className="cv-item-date"
          style={{ ...styles.itemMeta, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {date}
        </span>
      </div>
    )
  }
  const text = [...parts, date].filter(Boolean).join(format.metaSeparator)
  return (
    <p className="cv-item-title" style={styles.itemTitle}>
      {title}
      {text ? <span style={{ fontWeight: 400 }}>{`${format.titleSeparator}${text}`}</span> : null}
    </p>
  )
}
