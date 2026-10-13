import type { DraftEntry } from "./types"

export type ImportedLanguageLevel = "intermediate" | "advanced" | "fluent" | "bilingual" | "native"

/**
 * Maps free text ("Bilingual", "Langue maternelle", "C1", "Courant"...) to the
 * app's level scale. Returns null when nothing is recognised, so callers can
 * keep the original text instead of guessing.
 */
export function languageLevelFromText(text: string): ImportedLanguageLevel | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  if (/bilingu|ثنائي/u.test(t)) return "bilingual"
  if (/native|natif|mother|maternel|اللغة الأم|لغة أم/u.test(t)) return "native"
  if (/fluent|courant|fluide|full professional|professional working|\bc[12]\b|فصيح|طلق/u.test(t)) {
    return "fluent"
  }
  if (/upper|advanced|avanc|\bb2\b|متقدم/u.test(t)) return "advanced"
  if (
    /intermediate|interm|\bb1\b|\ba[12]\b|basic|beginner|elementary|notion|d[ée]but|scolaire|متوسط|مبتدئ/u.test(
      t,
    )
  ) {
    return "intermediate"
  }
  return null
}

// Level phrases the line scanner is allowed to consume after a language name.
// Longest alternatives first so "Native language" wins over "Native".
const LEVEL_PHRASE = [
  String.raw`bilingual`,
  String.raw`bilingue`,
  String.raw`ثنائي\s+اللغة`,
  String.raw`native\s+(?:language|speaker|tongue)`,
  String.raw`mother\s+tongue`,
  String.raw`langue\s+maternelle`,
  String.raw`اللغة\s+الأم`,
  String.raw`لغة\s+أم`,
  String.raw`maternelle`,
  String.raw`native`,
  String.raw`natif`,
  String.raw`full\s+professional(?:\s+proficiency)?`,
  String.raw`professional\s+working(?:\s+proficiency)?`,
  String.raw`fluent`,
  String.raw`courant`,
  String.raw`fluide`,
  String.raw`فصيح`,
  String.raw`طلق`,
  String.raw`upper[-\s]intermediate`,
  String.raw`advanced`,
  String.raw`avanc[ée]`,
  String.raw`متقدم`,
  String.raw`intermediate`,
  String.raw`interm[ée]diaire`,
  String.raw`متوسط`,
  String.raw`beginner`,
  String.raw`basic`,
  String.raw`elementary`,
  String.raw`notions?`,
  String.raw`d[ée]butant`,
  String.raw`scolaire`,
  String.raw`مبتدئ`,
  String.raw`[abc][12]`,
].join("|")

// "Name: Level", "Name - Level" (spaced dash), or "Name (Level)".
const NAME_LEVEL = new RegExp(
  String.raw`([\p{L}\p{M}][\p{L}\p{M}\s'’.\-]*?)\s*(?::|\s[-–—]\s|\()\s*(${LEVEL_PHRASE})\)?`,
  "giu",
)

const LEFTOVER_ONLY = /^[\s,;|•·]*$/u
const MAX_LANGUAGE_NAME = 40

/**
 * Splits one line of a Languages section into one entry per language, with
 * the level text kept in `meta` (shown to the user in the import review and
 * turned into a level by the mapper).
 *
 * Handles several languages on one line ("Arabic: Bilingual  Tamazight:
 * Native language"), including when a PDF has collapsed the spacing between
 * them. Returns null unless the WHOLE line is understood, so an unusual line
 * is kept verbatim as a single entry rather than half-parsed.
 */
export function parseLanguageLine(line: string): DraftEntry[] | null {
  const entries: DraftEntry[] = []
  let leftover = line
  for (const match of line.matchAll(NAME_LEVEL)) {
    const name = match[1].trim()
    if (!name || name.length > MAX_LANGUAGE_NAME) return null
    entries.push({ title: name, meta: match[2].trim(), lines: [] })
    leftover = leftover.replace(match[0], " ")
  }
  if (entries.length === 0 || !LEFTOVER_ONLY.test(leftover)) return null
  return entries
}

// "Programming Languages: Java (basics), Python, SQL"
const CATEGORY_LINE = /^([^:,;|•·]{2,40}?)\s*:\s+(\S.*)$/u

/**
 * Splits "Category: a, b, c" into its category and the list. A line without
 * a category comes back with an empty one. Requires whitespace after the
 * colon, so URLs and times ("http://", "10:30") are never taken for one.
 */
export function splitSkillCategory(line: string): { category: string; rest: string } {
  const match = CATEGORY_LINE.exec(line.trim())
  if (!match) return { category: "", rest: line.trim() }
  return { category: match[1].trim(), rest: match[2].trim() }
}
