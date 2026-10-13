import type { LanguageItem as LanguageItemData } from "@ats/core"

import { LANGUAGES_SEPARATOR } from "../item-format"
import { LEVEL_LABELS } from "../localization"
import type { TemplateStyles } from "../tokens"
import type { Locale } from "../types"

export interface LanguageItemProps {
  item: LanguageItemData
  styles: TemplateStyles
  locale: Locale
}

export function LanguageItem({ item, styles, locale }: LanguageItemProps) {
  const level = LEVEL_LABELS[locale][item.level] ?? item.level
  return (
    <div className="cv-item-block" style={styles.itemBlock}>
      <p className="cv-item-title" style={styles.itemTitle}>
        {item.name}
        {level ? <span style={{ fontWeight: 400 }}> - {level}</span> : null}
      </p>
    </div>
  )
}

/**
 * One dense "Name: Level" paragraph per language, several per line
 * (wrapping naturally) instead of one block per language. Plain linear
 * text, like SkillsList's "inline" layout: ATS-safe in every mode.
 */
export function LanguagesInline({
  items,
  styles,
  locale,
}: {
  items: LanguageItemData[]
  styles: TemplateStyles
  locale: Locale
}) {
  if (items.length === 0) return null
  return (
    <p className="cv-language-inline" style={{ ...styles.bullet, margin: 0 }}>
      {items.map((item, index) => {
        const level = LEVEL_LABELS[locale][item.level] ?? item.level
        return (
          <span key={item.id}>
            {index > 0 ? LANGUAGES_SEPARATOR : ""}
            <span style={{ fontWeight: 700 }}>{level ? `${item.name}:` : item.name}</span>
            {level ? ` ${level}` : ""}
          </span>
        )
      })}
    </p>
  )
}
