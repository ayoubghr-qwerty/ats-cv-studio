import type { CvDocument, CvItem, CvSection } from "../schema"

export type WarningKind =
  "missingFullName" | "invalidEmail" | "invalidPhone" | "invalidDateRange" | "emptySection"

export interface CvWarning {
  kind: WarningKind
  sectionId?: string
  itemId?: string
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_RE = /^[+()\-\s\d]{7,20}$/

function isDateRangeItem(
  item: CvItem,
): item is Extract<CvItem, { startDate: string; endDate: string; current: boolean }> {
  return "startDate" in item && "endDate" in item
}

export function validateCv(cv: CvDocument): CvWarning[] {
  const warnings: CvWarning[] = []

  if (!cv.contact.fullName.trim()) {
    warnings.push({ kind: "missingFullName" })
  }
  if (cv.contact.email && !EMAIL_RE.test(cv.contact.email)) {
    warnings.push({ kind: "invalidEmail" })
  }
  if (cv.contact.phone && !PHONE_RE.test(cv.contact.phone)) {
    warnings.push({ kind: "invalidPhone" })
  }

  for (const section of cv.sections) {
    if (!section.enabled) continue
    if (section.items.length === 0) {
      warnings.push({ kind: "emptySection", sectionId: section.id })
    }
    for (const item of section.items) {
      if (!isDateRangeItem(item)) continue
      if (!item.current && item.startDate && item.endDate && item.startDate > item.endDate) {
        warnings.push({ kind: "invalidDateRange", sectionId: section.id, itemId: item.id })
      }
      if (item.current && item.endDate) {
        warnings.push({ kind: "invalidDateRange", sectionId: section.id, itemId: item.id })
      }
    }
  }

  return warnings
}

export function isSectionEditable(section: CvSection): boolean {
  return section.type !== "summary"
}

export function sectionDisplayTitle(section: CvSection): string {
  return section.title.trim() || section.type
}
