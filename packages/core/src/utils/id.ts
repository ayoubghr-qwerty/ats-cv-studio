export function newId(prefix: string): string {
  const random = crypto.randomUUID()
  return `${prefix}-${random}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function formatRelativeDate(iso: string, locale: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const intlLocale = locale === "ar" ? "ar-u-nu-latn" : locale
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
