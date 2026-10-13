import { z } from "zod"

import {
  awardItemSchema,
  certificationItemSchema,
  courseItemSchema,
  educationItemSchema,
  experienceItemSchema,
  languageItemSchema,
  parseCvItem,
  projectItemSchema,
  publicationItemSchema,
  skillItemSchema,
  softSkillItemSchema,
  summaryItemSchema,
  volunteeringItemSchema,
  type CvItem,
} from "./items"

const ITEM_SCHEMAS_BY_TYPE = {
  summary: summaryItemSchema,
  experience: experienceItemSchema,
  education: educationItemSchema,
  skills: skillItemSchema,
  softSkills: softSkillItemSchema,
  projects: projectItemSchema,
  certifications: certificationItemSchema,
  languages: languageItemSchema,
  awards: awardItemSchema,
  volunteering: volunteeringItemSchema,
  publications: publicationItemSchema,
  courses: courseItemSchema,
} as const

function parseItemForSection(type: (typeof SECTION_TYPES)[number], item: unknown): CvItem {
  const schema = ITEM_SCHEMAS_BY_TYPE[type]
  const result = schema.safeParse(item)
  if (result.success) return result.data as CvItem
  return parseCvItem(item)
}

export const CV_LOCALES = ["en", "fr", "ar"] as const
export const TEXT_DIRECTIONS = ["ltr", "rtl"] as const
export const PAGE_SIZES = ["A4", "LETTER"] as const
export const DENSITY_PRESETS = ["compact", "standard", "comfortable"] as const
export const HEADING_STYLES = ["simple", "bold", "uppercase"] as const
export const SEPARATOR_STYLES = ["none", "subtle", "ruled", "dashed"] as const
export const CONTACT_ALIGNMENTS = ["left", "center"] as const
export const BULLET_STYLES = ["disc", "hyphen"] as const
export const LIST_COLUMNS = ["single", "two"] as const
export const SKILLS_LAYOUTS = ["list", "inline"] as const
export const DATE_PLACEMENTS = ["inline", "right"] as const
export const LANGUAGES_LAYOUTS = ["list", "inline"] as const
export const INLINE_SEPARATORS = ["comma", "bullet"] as const
export const SECTION_TYPES = [
  "summary",
  "experience",
  "education",
  "skills",
  "softSkills",
  "projects",
  "certifications",
  "languages",
  "awards",
  "volunteering",
  "publications",
  "courses",
] as const

export const contactSchema = z.object({
  fullName: z.string().default(""),
  jobTitle: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
})

export const ACCENT_COLORS = ["none", "navy", "teal", "burgundy", "forest"] as const

export const templateSettingsSchema = z.object({
  fontId: z.string().default("arial"),
  marginPreset: z.enum(DENSITY_PRESETS).default("standard"),
  spacingDensity: z.enum(DENSITY_PRESETS).default("standard"),
  headingStyle: z.enum(HEADING_STYLES).default("bold"),
  separatorStyle: z.enum(SEPARATOR_STYLES).default("subtle"),
  contactAlignment: z.enum(CONTACT_ALIGNMENTS).default("left"),
  bulletStyle: z.enum(BULLET_STYLES).default("disc"),
  listColumns: z.enum(LIST_COLUMNS).default("single"),
  // "list": one bullet per skill, grouped under a category heading (current
  // default). "inline": dense "Category: item, item, item" line per
  // category, matching the classic single-line resume convention — more
  // compact, better for fitting a dense skill set onto one page.
  skillsLayout: z.enum(SKILLS_LAYOUTS).default("list"),
  // Where item dates go: "inline" (after the title, "Role - Company · Date") or
  // "right" (right-aligned on the title line). Deliberately optional with no
  // default: undefined means "use the template's own default" (the Headline
  // family right-aligns, every other family stays inline), so documents
  // saved before this setting existed keep rendering exactly as before.
  datePlacement: z.enum(DATE_PLACEMENTS).optional(),
  // "list" (default): one line per language, as today. "inline": one dense
  // "Name: Level  Name: Level" paragraph, matching the reference resume's
  // "Arabic: Bilingual  Tamazight: Native" convention.
  languagesLayout: z.enum(LANGUAGES_LAYOUTS).default("list"),
  // Separator between items of the one-line lists (inline skills, soft skills):
  // "comma" (default) or "bullet". Languages always use a vertical bar.
  inlineSeparator: z.enum(INLINE_SEPARATORS).default("comma"),
  accentColor: z.enum(ACCENT_COLORS).default("none"),
})

export const pageSettingsSchema = z.object({
  size: z.enum(PAGE_SIZES).default("A4"),
})

export const cvSectionSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(SECTION_TYPES),
    title: z.string().default(""),
    enabled: z.boolean().default(true),
    order: z.number().int().default(0),
    items: z.array(z.unknown()),
  })
  .transform((section) => ({
    ...section,
    items: section.items.map((item) => parseItemForSection(section.type, item)),
  }))

export const versionSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().default(""),
  createdAt: z.string(),
  snapshot: z.unknown(),
})

export const cvDocumentSchema = z.object({
  schemaVersion: z.number().int().default(1),
  id: z.string().min(1),
  type: z.literal("cv"),
  name: z.string().min(1),
  nameSource: z.enum(["auto", "manual"]).default("manual"),
  locale: z.enum(CV_LOCALES),
  direction: z.enum(TEXT_DIRECTIONS),
  templateId: z.string().default("ats-classic-01"),
  templateSettings: templateSettingsSchema.default({
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
  }),
  pageSettings: pageSettingsSchema.default({ size: "A4" }),
  headline: z.string().optional(),
  contact: contactSchema.default({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
  }),
  sections: z.array(cvSectionSchema).default([]),
  versions: z.array(versionSnapshotSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ContactInfo = z.infer<typeof contactSchema>
export type TemplateSettings = z.infer<typeof templateSettingsSchema>
export type PageSettings = z.infer<typeof pageSettingsSchema>
export type CvSection = z.infer<typeof cvSectionSchema>
export type SectionType = (typeof SECTION_TYPES)[number]
export type VersionSnapshot = z.infer<typeof versionSnapshotSchema>
export type CvDocument = z.infer<typeof cvDocumentSchema>
export type CvLocale = (typeof CV_LOCALES)[number]
