import type { ExperienceItem as ExperienceItemData } from "@ats/core"

import type { TemplateStyles } from "../tokens"
import type { BulletStyle, DatePlacement, ItemFormatTokens, Locale } from "../types"
import { formatDateRange } from "./date"
import { ItemHead } from "./item-head"
import { resolveItemFormat } from "../item-format"

export interface ExperienceItemProps {
  item: ExperienceItemData
  styles: TemplateStyles
  locale: Locale
  bulletStyle?: BulletStyle
  datePlacement?: DatePlacement
  format?: ItemFormatTokens
}

export function ExperienceItem({
  item,
  styles,
  locale,
  bulletStyle = "disc",
  datePlacement = "inline",
  format,
}: ExperienceItemProps) {
  const fmt = resolveItemFormat(format)
  const date = formatDateRange(
    item.startDate,
    item.endDate,
    item.current,
    locale,
    fmt.rangeSeparator,
  )
  return (
    <div className="cv-item-block" style={styles.itemBlock}>
      <ItemHead
        title={item.role}
        meta={[item.company, item.location]}
        date={date}
        placement={datePlacement}
        styles={styles}
        format={fmt}
      />
      {item.bullets.length > 0 ? (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: bulletStyle === "hyphen" ? '"-"' : "disc",
            paddingInlineStart: "10pt",
          }}
        >
          {item.bullets.filter(Boolean).map((bullet, index) => (
            <li key={index} style={styles.bullet}>
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
