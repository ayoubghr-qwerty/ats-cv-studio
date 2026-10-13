import type { Locale } from "../types"
import { PRESENT_LABELS } from "../localization"

const MONTHS: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }),
  fr: new Intl.DateTimeFormat("fr", { month: "short", year: "numeric", timeZone: "UTC" }),
  ar: new Intl.DateTimeFormat("ar-u-nu-latn", { month: "short", year: "numeric", timeZone: "UTC" }),
}

export function formatMonthYear(value: string, locale: Locale): string {
  if (!value) return ""
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value)
  if (!match) return value
  const [, year, month] = match
  return MONTHS[locale].format(new Date(Date.UTC(Number(year), Number(month) - 1, 1)))
}

export function formatDateRange(
  start: string,
  end: string,
  current: boolean,
  locale: Locale,
  rangeSeparator = " - ",
): string {
  const startLabel = formatMonthYear(start, locale)
  if (current) {
    return startLabel
      ? `${startLabel}${rangeSeparator}${PRESENT_LABELS[locale]}`
      : PRESENT_LABELS[locale]
  }
  const endLabel = formatMonthYear(end, locale)
  if (startLabel && endLabel) return `${startLabel}${rangeSeparator}${endLabel}`
  return startLabel || endLabel || ""
}
