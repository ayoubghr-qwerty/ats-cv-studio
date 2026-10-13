import type {
  CoverLetterDocument,
  CvDocument,
  CvLocale,
  CvSection,
  DocumentMeta,
  DocumentType,
} from "./schema"
import { SECTION_TYPES } from "./schema"
import { newId, nowIso } from "./utils"

function directionFor(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr"
}

const DEFAULT_SECTION_TITLES: Record<CvLocale, Record<CvSection["type"], string>> = {
  en: {
    summary: "Summary",
    experience: "Work Experience",
    education: "Education",
    skills: "Skills",
    softSkills: "Soft Skills",
    projects: "Projects",
    certifications: "Certifications",
    languages: "Languages",
    awards: "Awards",
    volunteering: "Volunteering",
    publications: "Publications",
    courses: "Courses",
  },
  fr: {
    summary: "Résumé",
    experience: "Expérience",
    education: "Formation",
    skills: "Compétences",
    softSkills: "Compétences transversales",
    projects: "Projets",
    certifications: "Certifications",
    languages: "Langues",
    awards: "Distinctions",
    volunteering: "Bénévolat",
    publications: "Publications",
    courses: "Formations complémentaires",
  },
  ar: {
    summary: "الملخص",
    experience: "الخبرة المهنية",
    education: "التعليم",
    skills: "المهارات",
    softSkills: "المهارات الشخصية",
    projects: "المشاريع",
    certifications: "الشهادات",
    languages: "اللغات",
    awards: "الجوائز",
    volunteering: "العمل التطوعي",
    publications: "المنشورات",
    courses: "الدورات",
  },
}

const DEFAULT_ENABLED: CvSection["type"][] = ["summary", "experience", "education", "skills"]

export function createDefaultSections(locale: CvLocale = "en"): CvSection[] {
  const titles = DEFAULT_SECTION_TITLES[locale]
  const types = Object.keys(titles) as CvSection["type"][]
  return types.map((type, index) => ({
    id: newId("section"),
    type,
    title: titles[type],
    enabled: DEFAULT_ENABLED.includes(type),
    order: index,
    items: [],
  }))
}

/**
 * Makes sure a CV has one section of every known type, adding any that are
 * missing as *disabled, empty* sections. This is how documents saved before a
 * section type existed (or imported CVs, which only carry the sections they
 * contained) get access to it: the editor toggles sections on and off but has
 * no "add section" control, so a section that is absent cannot be enabled.
 *
 * Each missing section is placed right after the nearest earlier section type
 * (in the canonical order) that the document has, so "Soft Skills" lands next
 * to "Skills". Idempotent: returns the same object when nothing is missing.
 * Non-CV documents pass through untouched.
 */
export function ensureAllSections<T extends CvDocument | CoverLetterDocument>(doc: T): T {
  if (doc.type !== "cv") return doc
  const cv = doc as CvDocument
  const present = new Set(cv.sections.map((section) => section.type))
  const missing = SECTION_TYPES.filter((type) => !present.has(type))
  if (missing.length === 0) return doc

  const titles = DEFAULT_SECTION_TITLES[cv.locale]
  const sections = [...cv.sections]
  for (const type of missing) {
    const canonical = SECTION_TYPES.indexOf(type)
    let insertAt = sections.length
    for (let i = canonical - 1; i >= 0; i--) {
      const at = sections.findIndex((section) => section.type === SECTION_TYPES[i])
      if (at >= 0) {
        insertAt = at + 1
        break
      }
    }
    sections.splice(insertAt, 0, {
      id: newId("section"),
      type,
      title: titles[type],
      enabled: false,
      order: 0,
      items: [],
    })
  }
  return { ...cv, sections: sections.map((section, order) => ({ ...section, order })) } as T
}

export function createCvDocument(partial?: {
  name?: string
  locale?: "en" | "fr" | "ar"
}): CvDocument {
  const locale = partial?.locale ?? "en"
  const now = nowIso()
  return {
    schemaVersion: 1,
    id: newId("cv"),
    type: "cv",
    name: partial?.name ?? "Untitled CV",
    nameSource: "auto",
    locale,
    direction: directionFor(locale),
    templateId: "ats-classic-01",
    templateSettings: {
      fontId: "arial",
      marginPreset: "standard",
      spacingDensity: "standard",
      headingStyle: "bold",
      separatorStyle: "subtle",
      contactAlignment: "left",
      bulletStyle: "disc",
      listColumns: "single",
      skillsLayout: "list",
      languagesLayout: "list",
      inlineSeparator: "comma",
      accentColor: "none",
    },
    pageSettings: { size: "A4" },
    contact: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
    },
    sections: createDefaultSections(locale),
    versions: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function createCoverLetterDocument(partial?: {
  name?: string
  locale?: "en" | "fr" | "ar"
}): CoverLetterDocument {
  const locale = partial?.locale ?? "en"
  const now = nowIso()
  return {
    schemaVersion: 1,
    id: newId("cover-letter"),
    type: "cover-letter",
    name: partial?.name ?? "Untitled Cover Letter",
    locale,
    direction: directionFor(locale),
    templateId: "classic",
    templateSettings: {
      fontId: "arial",
      marginPreset: "standard",
      spacingDensity: "standard",
    },
    sender: { fullName: "", email: "", phone: "", location: "" },
    recipient: {},
    date: "",
    body: "",
    createdAt: now,
    updatedAt: now,
  }
}

export function toMeta(doc: CvDocument | CoverLetterDocument): DocumentMeta {
  return {
    id: doc.id,
    type: doc.type as DocumentType,
    name: doc.name,
    updatedAt: doc.updatedAt,
  }
}

export function duplicateDocument(
  doc: CvDocument | CoverLetterDocument,
): CvDocument | CoverLetterDocument {
  const now = nowIso()
  const base = JSON.parse(JSON.stringify(doc)) as CvDocument | CoverLetterDocument
  const result: CvDocument | CoverLetterDocument = {
    ...base,
    id: newId(doc.type === "cv" ? "cv" : "cover-letter"),
    name: `${doc.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
  }
  if (doc.type === "cv") {
    ;(result as CvDocument).nameSource = "manual"
  }
  return result
}
