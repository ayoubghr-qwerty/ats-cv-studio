import { z } from "zod"

import { CV_LOCALES, DENSITY_PRESETS, TEXT_DIRECTIONS } from "./cv"

export const coverLetterSenderSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
})

export const coverLetterRecipientSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
})

export const coverLetterTemplateSettingsSchema = z.object({
  fontId: z.string().default("arial"),
  marginPreset: z.enum(DENSITY_PRESETS).default("standard"),
  spacingDensity: z.enum(DENSITY_PRESETS).default("standard"),
})

export type CoverLetterTemplateSettings = z.infer<typeof coverLetterTemplateSettingsSchema>

export const coverLetterDocumentSchema = z.object({
  schemaVersion: z.number().int().default(1),
  id: z.string().min(1),
  type: z.literal("cover-letter"),
  name: z.string().min(1),
  locale: z.enum(CV_LOCALES),
  direction: z.enum(TEXT_DIRECTIONS),
  templateId: z.string().default("classic"),
  templateSettings: coverLetterTemplateSettingsSchema.default({
    fontId: "arial",
    marginPreset: "standard",
    spacingDensity: "standard",
  }),
  sender: coverLetterSenderSchema.default({
    fullName: "",
    email: "",
    phone: "",
    location: "",
  }),
  recipient: coverLetterRecipientSchema.default({}),
  date: z.string().default(""),
  subject: z.string().optional(),
  body: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CoverLetterSender = z.infer<typeof coverLetterSenderSchema>
export type CoverLetterRecipient = z.infer<typeof coverLetterRecipientSchema>
export type CoverLetterDocument = z.infer<typeof coverLetterDocumentSchema>
