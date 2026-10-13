import type { ContactInfo, SectionType } from "@ats/core"

export interface PdfTextItem {
  str: string
  x: number
  y: number
}

export interface DocxParagraph {
  text: string
  style?: string
  bullet: boolean
  level?: number
}

export interface SourceLine {
  text: string
  bullet?: boolean
}

export interface DraftContact {
  fullName: string
  jobTitle: string
  email: string
  phone: string
  location: string
  // Links found in the contact line. Optional: older callers and the review
  // step only know the five fields above.
  website?: string
  linkedin?: string
  github?: string
}

export interface DraftEntry {
  title: string
  meta: string
  lines: string[]
}

export interface DraftSection {
  type: SectionType
  entries: DraftEntry[]
}

export interface DraftCv {
  contact: DraftContact
  sections: DraftSection[]
  unmapped: string[]
  warnings: string[]
}

export type SourceFormat = "pdf" | "docx"

export interface ImportResult {
  draft: DraftCv
  fileName: string
  format: SourceFormat
}

export function emptyDraftContact(): DraftContact {
  return { fullName: "", jobTitle: "", email: "", phone: "", location: "" }
}

export function emptyDraft(): DraftCv {
  return { contact: emptyDraftContact(), sections: [], unmapped: [], warnings: [] }
}

export function isContactField(field: keyof ContactInfo): boolean {
  return ["fullName", "jobTitle", "email", "phone", "location"].includes(field)
}
