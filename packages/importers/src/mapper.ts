import {
  createCvDocument,
  newId,
  type CvDocument,
  type CvItem,
  type CvLocale,
  type SectionType,
} from "@ats/core"

import { DATE_RANGE_RE } from "./detect"
import type { DraftCv, DraftEntry } from "./types"
import { languageLevelFromText } from "./structured-lines"

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
  janv: 1,
  févr: 2,
  fevr: 2,
  mars: 3,
  avr: 4,
  mai: 5,
  juin: 6,
  juil: 7,
  août: 8,
  sept: 9,
  déc: 12,
}

const CURRENT_WORDS = /present|current|now|aujourd'hui|à\s+ce\s+jour|actuel|الآن|حتى/i

function parseDatePart(part: string): { year: string; month: number | null } | null {
  const text = part.trim()
  if (!text) return null
  const slash = /^(\d{1,2})\/(\d{4})$/.exec(text)
  if (slash) return { year: slash[2], month: Number(slash[1]) }
  const year = /^(\d{4})$/.exec(text)
  if (year) return { year: year[1], month: null }
  const monthWord = /^([a-zéû]+)\.?\s*(\d{2,4})$/i.exec(text)
  if (monthWord) {
    const index = MONTH_INDEX[monthWord[1].toLowerCase().replace(/\.$/, "")]
    if (index) return { year: monthWord[2], month: index }
  }
  return null
}

function formatPart(part: { year: string; month: number | null } | null, isStart: boolean): string {
  if (!part) return ""
  const month = part.month ?? (isStart ? 1 : 12)
  return `${part.year}-${String(month).padStart(2, "0")}`
}

export function parseDateRange(meta: string): {
  startDate: string
  endDate: string
  current: boolean
} {
  const match = DATE_RANGE_RE.exec(meta)
  if (!match) return { startDate: "", endDate: "", current: false }
  const range = meta.slice(match.index, match.index + match[0].length)
  const pieces = range.split(/\s*(?:[-–—]|to|à|إلى)\s*/).filter(Boolean)
  if (pieces.length === 0) return { startDate: "", endDate: "", current: false }
  const first = pieces[0]
  if (CURRENT_WORDS.test(first)) return { startDate: "", endDate: "", current: true }
  const startPart = parseDatePart(first)
  const second = pieces[1] ?? ""
  const current = CURRENT_WORDS.test(second)
  const endPart = current || !second ? null : parseDatePart(second)
  return {
    startDate: formatPart(startPart, true),
    endDate: formatPart(endPart, false),
    current,
  }
}

function splitTitle(title: string): string[] {
  return title
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
}

function entryToItem(type: SectionType, entry: DraftEntry): CvItem | null {
  const parts = splitTitle(entry.title)
  const dates = parseDateRange(entry.meta)
  switch (type) {
    case "experience":
      return {
        id: newId("item"),
        role: parts[0] ?? "",
        company: parts[1] ?? "",
        location: parts[2] ?? "",
        startDate: dates.startDate,
        endDate: dates.endDate,
        current: dates.current,
        bullets: entry.lines,
      }
    case "education":
      return {
        id: newId("item"),
        degree: parts[0] ?? "",
        institution: parts[1] ?? "",
        location: parts[2] ?? "",
        startDate: dates.startDate,
        endDate: dates.endDate,
        current: dates.current,
        details: entry.lines.join("\n"),
      }
    case "projects":
      return {
        id: newId("item"),
        name: entry.title,
        description: entry.lines.join("\n"),
        link: "",
        startDate: dates.startDate,
        endDate: dates.endDate,
        current: dates.current,
        bullets: [],
      }
    case "volunteering":
      return {
        id: newId("item"),
        role: parts[0] ?? "",
        organization: parts[1] ?? "",
        location: parts[2] ?? "",
        startDate: dates.startDate,
        endDate: dates.endDate,
        current: dates.current,
        description: entry.lines.join("\n"),
      }
    case "skills": {
      const category = entry.meta.trim()
      return { id: newId("item"), name: entry.title, ...(category ? { category } : {}) }
    }
    case "softSkills":
      return { id: newId("item"), name: entry.title }
    case "summary":
      return { id: newId("item"), text: entry.lines.join("\n") }
    case "certifications":
      return { id: newId("item"), name: entry.title, issuer: "", date: "", link: "" }
    case "awards":
      return {
        id: newId("item"),
        title: entry.title,
        issuer: "",
        date: "",
        description: entry.lines.join("\n"),
      }
    case "languages":
      return {
        id: newId("item"),
        name: entry.title,
        // Unrecognised or missing level text keeps the long-standing default.
        level: languageLevelFromText(entry.meta) ?? ("intermediate" as const),
      }
    case "publications":
      return { id: newId("item"), title: entry.title, publisher: "", date: "", url: "" }
    case "courses":
      return {
        id: newId("item"),
        name: entry.title,
        provider: "",
        date: "",
        description: entry.lines.join("\n"),
      }
    default:
      return null
  }
}

export function draftToCv(draft: DraftCv, locale: CvLocale, name?: string): CvDocument {
  const fallbackName = draft.contact.fullName ? `${draft.contact.fullName}'s CV` : "Imported CV"
  const doc = createCvDocument({ locale, name: name ?? fallbackName })
  doc.contact = {
    ...doc.contact,
    fullName: draft.contact.fullName,
    jobTitle: draft.contact.jobTitle,
    email: draft.contact.email,
    phone: draft.contact.phone,
    location: draft.contact.location,
    website: draft.contact.website ?? doc.contact.website ?? "",
    linkedin: draft.contact.linkedin ?? doc.contact.linkedin ?? "",
    github: draft.contact.github ?? doc.contact.github ?? "",
  }
  doc.sections = draft.sections.map((section, index) => ({
    id: newId("section"),
    type: section.type,
    title: "",
    enabled: true,
    order: index,
    items: section.entries
      .map((entry) => entryToItem(section.type, entry))
      .filter((item): item is CvItem => item !== null),
  }))
  return doc
}
