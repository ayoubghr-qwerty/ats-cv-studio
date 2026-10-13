import { EMAIL_RE, type SectionType } from "@ats/core"

import type { DraftCv, DraftEntry, DraftSection, SourceLine } from "./types"
import { emptyDraftContact } from "./types"
import { parseLanguageLine, splitSkillCategory } from "./structured-lines"

function stripNullChars(value: string): string {
  return [...value].filter((ch) => ch.charCodeAt(0) !== 0).join("")
}

const CONTACT_SEPARATOR_RE = /\s*[·•|]\s*/
const EMAIL_EXTRACT_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/

const HEADING_PATTERNS: Array<{ type: SectionType; re: RegExp }> = [
  { type: "courses", re: /formations?\s+complémentaires|courses?|الدورات/i },
  { type: "summary", re: /(professional\s+)?summary|profil\s+professionnel|الملخص/i },
  { type: "experience", re: /(work\s+|professional\s+)?experience|expérience|الخبرة/i },
  { type: "education", re: /education|formation|التعليم|الدراسات/i },
  {
    type: "softSkills",
    re: /soft\s+skills?|interpersonal\s+skills?|transferable\s+skills?|compétences\s+(?:transversales|relationnelles|comportementales)|savoir[-\s]être|المهارات\s+(?:الشخصية|الناعمة)/i,
  },
  { type: "skills", re: /skills?|compétences|المهارات/i },
  { type: "projects", re: /projects?|projets|المشاريع/i },
  { type: "certifications", re: /certifications?|certificats|الشهادات/i },
  { type: "languages", re: /languages?|langues|اللغات/i },
  { type: "awards", re: /awards?|distinctions|récompenses|الجوائز/i },
  { type: "volunteering", re: /volunteering|volunteer|bénévolat|volontariat|التطوع/i },
  { type: "publications", re: /publications|المنشورات/i },
]

const MONTH_WORDS =
  "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janv|févr|fevr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc"

const DATE_PART = `(?:(${MONTH_WORDS})[a-zéû]*\\.?\\s*\\d{2,4}|\\d{1,2}/\\d{4}|\\d{4})`
const PRESENT_WORD = `(?:present|current|now|aujourd'hui|à\\s+ce\\s+jour|actuel|الآن|حتى)`

export const DATE_RANGE_RE = new RegExp(
  `\\b${DATE_PART}\\b(?:\\s*(?:[-–—]|to|à|إلى)\\s*(?:${DATE_PART}|${PRESENT_WORD}))?|\\b${PRESENT_WORD}\\b`,
  "i",
)

const BULLET_RE = /^\s*(?:[•●▪◦*\-–—]|\d+[.)])\s+/
const SKILL_SEPARATOR_RE = /[,;·•|]+/
const MAX_HEADING_SUFFIX = 16
const MAX_HEADING_LENGTH = 48

export function extractDateRange(text: string): { rest: string; date: string } {
  const match = DATE_RANGE_RE.exec(text)
  if (!match) return { rest: text, date: "" }
  const date = match[0]
  const rest = text.slice(0, match.index) + text.slice(match.index + date.length)
  return { rest: rest.replace(/^\s*[|•·–,:-]+\s*|\s*[|•·–,:-]+\s*$/g, "").trim(), date }
}

export function matchHeading(line: string): SectionType | null {
  const trimmed = line.trim()
  if (trimmed.length > MAX_HEADING_LENGTH) return null
  // "Languages: Java, SQL" or "Skills: Java" is a category line with its list,
  // not a heading: a heading has nothing after its colon ("Skills :" is fine).
  if (/:\s*\S/u.test(trimmed)) return null
  let best: SectionType | null = null
  let bestLen = -1
  for (const { type, re } of HEADING_PATTERNS) {
    const match = re.exec(trimmed)
    if (!match) continue
    const suffix = trimmed.length - match[0].length
    if (suffix > MAX_HEADING_SUFFIX) continue
    if (match[0].length > bestLen) {
      best = type
      bestLen = match[0].length
    }
  }
  return best
}

function stripBullet(line: string): string {
  return line.replace(BULLET_RE, "").trim()
}

function isBullet(line: string): boolean {
  return BULLET_RE.test(line)
}

function splitSkillLine(line: string): string[] {
  return line
    .split(SKILL_SEPARATOR_RE)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const LINK_RE = /^(?:https?:\/\/)?(?:www\.)?[\p{L}\d-]+(?:\.[\p{L}\d-]+)+(?:[/?#]\S*)?$/iu

/** A contact piece that is a web address: LinkedIn, GitHub or any other site. */
function classifyLink(piece: string): "linkedin" | "github" | "website" | null {
  if (/\s/.test(piece) || piece.includes("@") || !LINK_RE.test(piece)) return null
  if (/linkedin\./i.test(piece)) return "linkedin"
  if (/github\./i.test(piece)) return "github"
  // Needs a letter-only top-level domain, so "3.5" or "v1.2.3" are not websites.
  return /\.[a-z]{2,}(?:[/?#]|$)/i.test(piece) ? "website" : null
}

function extractContact(lines: string[]): {
  contact: DraftCv["contact"]
  rest: string[]
} {
  const contact = emptyDraftContact()
  const rest: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const pieces = line
      .split(CONTACT_SEPARATOR_RE)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
    for (const piece of pieces) {
      if (!contact.email) {
        const emailMatch = piece.match(EMAIL_EXTRACT_RE)
        if (emailMatch && EMAIL_RE.test(emailMatch[0])) {
          contact.email = emailMatch[0]
          continue
        }
      }
      if (!contact.phone) {
        const phoneMatch = piece.match(/\+?[\d\s().-]{7,20}/)
        if (
          phoneMatch &&
          (phoneMatch[0].match(/\d/g)?.length ?? 0) >= 3 &&
          phoneMatch[0].length > 6
        ) {
          contact.phone = phoneMatch[0].trim()
          continue
        }
      }
      const link = classifyLink(piece)
      if (link) {
        // Links never become a name or title; keep the first of each kind.
        if (!contact[link]) contact[link] = piece
        continue
      }
      if (!contact.fullName) {
        contact.fullName = piece
        continue
      }
      // A title is a short phrase on a line of its own (a line of several
      // separated items is contact details, e.g. the city), not a sentence: 80 characters (60 cut off
      // a real 62-character French title) and no closing full stop.
      if (
        !contact.jobTitle &&
        pieces.length === 1 &&
        piece.length <= 80 &&
        !/\d/.test(piece) &&
        !/[.!?]$/.test(piece)
      ) {
        contact.jobTitle = piece
        continue
      }
      if (!contact.location && piece.includes(",") && !/\d/.test(piece)) {
        contact.location = piece
        continue
      }
      rest.push(piece)
    }
  }
  return { contact, rest }
}

function groupEntryBlock(type: SectionType, block: string[]): DraftEntry[] {
  const entries: DraftEntry[] = []
  let current: DraftEntry | null = null
  let currentHasBullets = false

  const pushCurrent = () => {
    if (current) entries.push(current)
    current = null
    currentHasBullets = false
  }

  const startEntry = (): DraftEntry => {
    current = { title: "", meta: "", lines: [] }
    currentHasBullets = false
    return current
  }

  for (const raw of block) {
    const bullet = isBullet(raw)
    const text = bullet ? stripBullet(raw) : raw.trim()
    if (!text) continue

    if (bullet) {
      current = current ?? startEntry()
      current.lines.push(text)
      currentHasBullets = true
      continue
    }

    const { rest, date } = extractDateRange(text)
    if (date) {
      const restClean = (rest ?? "").replace(/[\s|·:;,\-–—]+$/g, "").trim()
      const isNewTitle = Boolean(restClean && restClean.includes("|"))
      if (current && (current.meta || isNewTitle)) pushCurrent()
      current = current ?? startEntry()
      if (restClean && !current.title) {
        current.title = restClean
        current.meta = current.meta ? `${current.meta} | ${date}` : date
      } else if (restClean) {
        current.meta = current.meta
          ? `${current.meta} | ${restClean} · ${date}`
          : `${restClean} · ${date}`
      } else {
        current.meta = current.meta ? `${current.meta} | ${date}` : date
      }
      continue
    }

    if (current && currentHasBullets) pushCurrent()
    current = current ?? startEntry()
    if (!current.title) current.title = text
    else current.lines.push(text)
  }
  pushCurrent()

  if (type === "skills" || type === "softSkills") {
    const flat: DraftEntry[] = []
    const rawLines = entries.flatMap((entry) => [entry.title, ...entry.lines])
    // A long "Category: a, b, c," list can wrap onto a second line with no
    // category of its own; when the previous line ended on a separator the
    // wrapped part belongs to the same category.
    let carried = ""
    for (const raw of rawLines) {
      const text = raw.trim()
      if (!text) continue
      const split = type === "skills" ? splitSkillCategory(text) : { category: "", rest: text }
      const category = split.category || carried
      for (const title of splitSkillLine(split.rest)) {
        flat.push({ title, meta: category, lines: [] })
      }
      carried = /[,;]\s*$/.test(text) ? category : ""
    }
    return flat
  }
  return entries
}

const TITLE_ONLY_SECTIONS: SectionType[] = [
  "certifications",
  "languages",
  "awards",
  "publications",
  "courses",
]

function sectionFor(type: SectionType, block: string[]): DraftSection {
  if (type === "summary") {
    const text = block
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ")
    return { type, entries: text ? [{ title: "", meta: "", lines: [text] }] : [] }
  }
  if (type === "languages") {
    const entries = block
      .map((l) => stripBullet(l))
      .filter(Boolean)
      .flatMap(
        (line) => parseLanguageLine(line) ?? [{ title: line, meta: "", lines: [] as string[] }],
      )
    return { type, entries }
  }
  if (TITLE_ONLY_SECTIONS.includes(type)) {
    const entries = block
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => ({ title: line, meta: "", lines: [] as string[] }))
    return { type, entries }
  }
  const entries = groupEntryBlock(type, block)
  return { type, entries }
}

export function linesToDraft(lines: Array<string | SourceLine>): DraftCv {
  const texts = lines.map((l) => stripNullChars(typeof l === "string" ? l : l.text).trim())
  const headingIndexes: Array<{ index: number; type: SectionType }> = []
  texts.forEach((line, index) => {
    const type = matchHeading(line)
    if (type) headingIndexes.push({ index, type })
  })

  const contactZone = texts.slice(0, headingIndexes[0]?.index ?? texts.length)
  const { contact, rest: contactRest } = extractContact(contactZone)

  const sections: DraftSection[] = []
  const unmapped = [...contactRest]

  for (let i = 0; i < headingIndexes.length; i++) {
    const { type } = headingIndexes[i]
    const start = headingIndexes[i].index + 1
    const end = headingIndexes[i + 1]?.index ?? texts.length
    const block = texts.slice(start, end)
    if (block.some((line) => line.trim().length > 0)) {
      sections.push(sectionFor(type, block))
    }
  }

  const consumed = new Set<number>()
  for (const { index } of headingIndexes) consumed.add(index)
  const sectionBoundaries: Array<[number, number]> = headingIndexes.map((h, i) => [
    h.index,
    headingIndexes[i + 1]?.index ?? texts.length,
  ])
  sectionBoundaries.forEach(([start, end]) => {
    for (let i = start + 1; i < end; i++) {
      if (texts[i].trim()) consumed.add(i)
    }
  })
  texts.forEach((line, index) => {
    if (index < (headingIndexes[0]?.index ?? texts.length)) return
    if (!consumed.has(index) && line.trim()) unmapped.push(line)
  })

  return { contact, sections, unmapped, warnings: [] }
}
