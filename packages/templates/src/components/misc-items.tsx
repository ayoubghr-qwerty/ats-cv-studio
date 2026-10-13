import type {
  AwardItem,
  CourseItem,
  PublicationItem,
  SummaryItem,
  VolunteeringItem,
} from "@ats/core"

import type { TemplateStyles } from "../tokens"
import type { DatePlacement, ItemFormatTokens, Locale } from "../types"
import { formatDateRange, formatMonthYear } from "./date"
import { ItemHead } from "./item-head"
import { resolveItemFormat } from "../item-format"

export interface SummaryItemsProps {
  items: SummaryItem[]
  styles: TemplateStyles
}

export function SummaryItems({ items, styles }: SummaryItemsProps) {
  const texts = items.map((item) => item.text).filter(Boolean)
  if (texts.length === 0) return null
  return (
    <>
      {texts.map((text, index) => (
        <p key={index} style={index === 0 ? { margin: 0 } : styles.paragraph}>
          {text}
        </p>
      ))}
    </>
  )
}

export interface AwardItemProps {
  item: AwardItem
  styles: TemplateStyles
  locale: Locale
}

export function AwardItem({ item, styles, locale }: AwardItemProps) {
  const meta = [item.issuer, formatMonthYear(item.date, locale)].filter(Boolean).join(" · ")
  return (
    <div className="cv-item-block" style={styles.itemBlock}>
      <p className="cv-item-title" style={styles.itemTitle}>
        {item.title}
        {meta ? <span style={{ fontWeight: 400 }}> - {meta}</span> : null}
      </p>
      {item.description ? <p style={styles.itemBody}>{item.description}</p> : null}
    </div>
  )
}

export interface VolunteeringItemProps {
  item: VolunteeringItem
  styles: TemplateStyles
  locale: Locale
  datePlacement?: DatePlacement
  format?: ItemFormatTokens
}

export function VolunteeringItem({
  item,
  styles,
  locale,
  datePlacement = "inline",
  format,
}: VolunteeringItemProps) {
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
        meta={[item.organization, item.location]}
        date={date}
        placement={datePlacement}
        styles={styles}
        format={fmt}
      />
      {item.description ? <p style={styles.itemBody}>{item.description}</p> : null}
    </div>
  )
}

export interface PublicationItemProps {
  item: PublicationItem
  styles: TemplateStyles
  locale: Locale
}

export function PublicationItem({ item, styles, locale }: PublicationItemProps) {
  const meta = [item.publisher, formatMonthYear(item.date, locale)].filter(Boolean).join(" · ")
  const title = [item.title, item.url].filter(Boolean).join(" - ")
  return (
    <div className="cv-item-block" style={styles.itemBlock}>
      <p className="cv-item-title" style={styles.itemTitle}>
        {title}
        {meta ? <span style={{ fontWeight: 400 }}> - {meta}</span> : null}
      </p>
    </div>
  )
}

export interface CourseItemProps {
  item: CourseItem
  styles: TemplateStyles
  locale: Locale
}

export function CourseItem({ item, styles, locale }: CourseItemProps) {
  const meta = [item.provider, formatMonthYear(item.date, locale)].filter(Boolean).join(" · ")
  return (
    <div className="cv-item-block" style={styles.itemBlock}>
      <p className="cv-item-title" style={styles.itemTitle}>
        {item.name}
        {meta ? <span style={{ fontWeight: 400 }}> - {meta}</span> : null}
      </p>
      {item.description ? <p style={styles.itemBody}>{item.description}</p> : null}
    </div>
  )
}
