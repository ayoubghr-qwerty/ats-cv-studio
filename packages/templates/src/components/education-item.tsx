import type { EducationItem as EducationItemData } from "@ats/core"

import type { TemplateStyles } from "../tokens"
import type { DatePlacement, ItemFormatTokens, Locale } from "../types"
import { formatDateRange } from "./date"
import { ItemHead } from "./item-head"
import { resolveItemFormat } from "../item-format"

export interface EducationItemProps {
  item: EducationItemData
  styles: TemplateStyles
  locale: Locale
  datePlacement?: DatePlacement
  format?: ItemFormatTokens
}

export function EducationItem({
  item,
  styles,
  locale,
  datePlacement = "inline",
  format,
}: EducationItemProps) {
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
        title={item.degree}
        meta={[item.institution, item.location]}
        date={date}
        placement={datePlacement}
        styles={styles}
        format={fmt}
      />
      {item.details ? <p style={styles.itemBody}>{item.details}</p> : null}
    </div>
  )
}
