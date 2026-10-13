import type { CertificationItem as CertificationItemData } from "@ats/core"

import type { TemplateStyles } from "../tokens"
import type { Locale } from "../types"
import { formatMonthYear } from "./date"

export interface CertificationItemProps {
  item: CertificationItemData
  styles: TemplateStyles
  locale: Locale
}

export function CertificationItem({ item, styles, locale }: CertificationItemProps) {
  const meta = [item.issuer, formatMonthYear(item.date, locale)].filter(Boolean).join(" · ")
  const title = [item.name, item.link].filter(Boolean).join(" - ")
  return (
    <div className="cv-item-block" style={styles.itemBlock}>
      <p className="cv-item-title" style={styles.itemTitle}>
        {title}
        {meta ? <span style={{ fontWeight: 400 }}> - {meta}</span> : null}
      </p>
    </div>
  )
}
