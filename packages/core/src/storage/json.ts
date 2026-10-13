import { z } from "zod"

import { coverLetterDocumentSchema, cvDocumentSchema, documentMetaSchema } from "../schema"
import type { CoverLetterDocument, CvDocument, DocumentMeta } from "../schema"
import { toMeta } from "../factories"

export type StoredDocument = CvDocument | CoverLetterDocument

export const workspaceBundleSchema = z.object({
  schemaVersion: z.number().int().default(1),
  exportedAt: z.string(),
  documents: z.array(z.union([cvDocumentSchema, coverLetterDocumentSchema])),
})

export type WorkspaceBundle = z.infer<typeof workspaceBundleSchema>

export function parseStoredDocument(json: string): StoredDocument {
  const parsed: unknown = JSON.parse(json)
  return parseStoredDocumentValue(parsed)
}

export function parseStoredDocumentValue(value: unknown): StoredDocument {
  const cv = cvDocumentSchema.safeParse(value)
  if (cv.success) return cv.data
  const cover = coverLetterDocumentSchema.safeParse(value)
  if (cover.success) return cover.data
  throw new Error("Invalid document: not a valid CV or cover letter")
}

export function serializeDocument(doc: StoredDocument): string {
  return JSON.stringify(doc, null, 2)
}

export function parseWorkspaceBundle(json: string): WorkspaceBundle {
  const result = workspaceBundleSchema.safeParse(JSON.parse(json))
  if (!result.success) {
    throw new Error("Invalid workspace bundle: structure does not match the expected schema")
  }
  return result.data
}

export function serializeWorkspaceBundle(documents: StoredDocument[]): string {
  const bundle: WorkspaceBundle = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    documents,
  }
  return JSON.stringify(bundle, null, 2)
}

export function metaFromDocument(doc: StoredDocument): DocumentMeta {
  return toMeta(doc)
}

export function validateDocumentMeta(value: unknown): DocumentMeta {
  const result = documentMetaSchema.safeParse(value)
  if (!result.success) {
    throw new Error("Invalid document metadata")
  }
  return result.data
}
