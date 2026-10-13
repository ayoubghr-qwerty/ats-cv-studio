import { z } from "zod"

const idSchema = z.string().min(1)

export const monthYearSchema = z
  .string()
  .regex(/^$|^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM or empty")
  .default("")

// Canonical scale (ascending): intermediate < advanced < fluent < bilingual < native.
// Legacy values from the previous scale are folded onto the new one so
// documents saved before the rename still parse: basic -> intermediate,
// conversational -> advanced.
const LEGACY_LANGUAGE_LEVELS: Record<string, "intermediate" | "advanced"> = {
  basic: "intermediate",
  conversational: "advanced",
}

export const languageLevelSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value in LEGACY_LANGUAGE_LEVELS
      ? LEGACY_LANGUAGE_LEVELS[value]
      : value,
  z.enum(["intermediate", "advanced", "fluent", "bilingual", "native"]),
)

export const experienceItemSchema = z.object({
  id: idSchema,
  role: z.string().default(""),
  company: z.string().default(""),
  location: z.string().default(""),
  startDate: monthYearSchema,
  endDate: monthYearSchema,
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
})

export const educationItemSchema = z.object({
  id: idSchema,
  degree: z.string().default(""),
  institution: z.string().default(""),
  location: z.string().default(""),
  startDate: monthYearSchema,
  endDate: monthYearSchema,
  current: z.boolean().default(false),
  details: z.string().default(""),
})

export const skillItemSchema = z.object({
  id: idSchema,
  name: z.string().default(""),
  category: z.string().max(500).optional(),
})

// Deliberately shaped differently from skillItemSchema (no `category`): the
// two are dispatched by section type, not by shape, but parseCvItem's
// fallback scores items by key overlap when a section is damaged, and a
// distinct shape keeps a stray soft skill from being reparented as a
// technical skill or vice versa.
export const softSkillItemSchema = z.object({
  id: idSchema,
  name: z.string().default(""),
})

export const projectItemSchema = z.object({
  id: idSchema,
  name: z.string().default(""),
  description: z.string().default(""),
  link: z.string().default(""),
  startDate: monthYearSchema,
  endDate: monthYearSchema,
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
})

export const certificationItemSchema = z.object({
  id: idSchema,
  name: z.string().default(""),
  issuer: z.string().default(""),
  date: monthYearSchema,
  link: z.string().default(""),
})

export const languageItemSchema = z.object({
  id: idSchema,
  name: z.string().default(""),
  level: languageLevelSchema.default("intermediate"),
})

export const awardItemSchema = z.object({
  id: idSchema,
  title: z.string().default(""),
  issuer: z.string().default(""),
  date: monthYearSchema,
  description: z.string().default(""),
})

export const volunteeringItemSchema = z.object({
  id: idSchema,
  role: z.string().default(""),
  organization: z.string().default(""),
  location: z.string().default(""),
  startDate: monthYearSchema,
  endDate: monthYearSchema,
  current: z.boolean().default(false),
  description: z.string().default(""),
})

export const publicationItemSchema = z.object({
  id: idSchema,
  title: z.string().default(""),
  publisher: z.string().default(""),
  date: monthYearSchema,
  url: z.string().default(""),
})

export const courseItemSchema = z.object({
  id: idSchema,
  name: z.string().default(""),
  provider: z.string().default(""),
  date: monthYearSchema,
  description: z.string().default(""),
})

export const summaryItemSchema = z.object({
  id: idSchema,
  text: z.string().default(""),
})

export const cvItemSchema = z.union([
  experienceItemSchema,
  educationItemSchema,
  skillItemSchema,
  softSkillItemSchema,
  projectItemSchema,
  certificationItemSchema,
  languageItemSchema,
  awardItemSchema,
  volunteeringItemSchema,
  publicationItemSchema,
  courseItemSchema,
  summaryItemSchema,
])

const ITEM_SCHEMAS = [
  experienceItemSchema,
  educationItemSchema,
  skillItemSchema,
  softSkillItemSchema,
  projectItemSchema,
  certificationItemSchema,
  languageItemSchema,
  awardItemSchema,
  volunteeringItemSchema,
  publicationItemSchema,
  courseItemSchema,
  summaryItemSchema,
] as const

function shapeKeys(schema: unknown): Set<string> {
  const shape = (schema as { shape?: Record<string, unknown> } | null)?.shape
  return new Set(shape ? Object.keys(shape) : [])
}

export function parseCvItem(value: unknown): CvItem {
  const entries = typeof value === "object" && value !== null ? Object.keys(value) : []
  let best: CvItem | null = null
  let bestScore = -1
  for (const schema of ITEM_SCHEMAS) {
    const result = schema.safeParse(value)
    if (!result.success) continue
    const keys = shapeKeys(schema)
    const score = entries.filter((key) => keys.has(key)).length
    if (score > bestScore) {
      bestScore = score
      best = result.data
    }
  }
  if (best === null) {
    throw new Error("Invalid CV item: does not match any known item shape")
  }
  return best
}

export type ExperienceItem = z.infer<typeof experienceItemSchema>
export type EducationItem = z.infer<typeof educationItemSchema>
export type SkillItem = z.infer<typeof skillItemSchema>
export type SoftSkillItem = z.infer<typeof softSkillItemSchema>
export type ProjectItem = z.infer<typeof projectItemSchema>
export type CertificationItem = z.infer<typeof certificationItemSchema>
export type LanguageItem = z.infer<typeof languageItemSchema>
export type AwardItem = z.infer<typeof awardItemSchema>
export type VolunteeringItem = z.infer<typeof volunteeringItemSchema>
export type PublicationItem = z.infer<typeof publicationItemSchema>
export type CourseItem = z.infer<typeof courseItemSchema>
export type SummaryItem = z.infer<typeof summaryItemSchema>
export type CvItem = z.infer<typeof cvItemSchema>
