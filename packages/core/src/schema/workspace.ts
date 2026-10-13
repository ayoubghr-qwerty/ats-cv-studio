import { z } from "zod"

export const DOCUMENT_TYPES = ["cv", "cover-letter"] as const

export const documentMetaSchema = z.object({
  id: z.string().min(1),
  type: z.enum(DOCUMENT_TYPES),
  name: z.string().min(1),
  updatedAt: z.string(),
})

export const workspaceSchema = z.object({
  schemaVersion: z.number().int().default(1),
  documents: z.array(documentMetaSchema).default([]),
  updatedAt: z.string(),
})

export type DocumentMeta = z.infer<typeof documentMetaSchema>
export type DocumentType = (typeof DOCUMENT_TYPES)[number]
export type WorkspaceMetadata = z.infer<typeof workspaceSchema>
