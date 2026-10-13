import type { CoverLetterDocument, CvDocument, CvLocale } from "./schema"
import { newId, nowIso } from "./utils"

type StoredDocument = CvDocument | CoverLetterDocument

function stripVersioning(doc: StoredDocument): Record<string, unknown> {
  const copy = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>
  delete copy.id
  delete copy.createdAt
  delete copy.updatedAt
  if (doc.type === "cv") delete copy.versions
  return copy
}

export function snapshotDocument(doc: CvDocument, name: string): CvDocument {
  return {
    ...doc,
    versions: [
      ...doc.versions,
      { id: newId("version"), name, createdAt: nowIso(), snapshot: stripVersioning(doc) },
    ],
    updatedAt: nowIso(),
  }
}

export function restoreVersion(doc: CvDocument, versionId: string): CvDocument {
  const found = doc.versions.find((v) => v.id === versionId)
  if (!found) return doc
  return {
    ...(found.snapshot as Omit<CvDocument, "id" | "versions" | "createdAt" | "updatedAt">),
    id: doc.id,
    name: doc.name,
    nameSource: doc.nameSource,
    versions: doc.versions,
    createdAt: doc.createdAt,
    updatedAt: nowIso(),
  }
}

export function removeVersion(doc: CvDocument, versionId: string): CvDocument {
  return { ...doc, versions: doc.versions.filter((v) => v.id !== versionId), updatedAt: nowIso() }
}

export function duplicateAsVariant(
  doc: StoredDocument,
  options?: { name?: string; locale?: CvLocale },
): StoredDocument {
  const now = nowIso()
  const locale = options?.locale ?? doc.locale
  const direction = locale === "ar" ? "rtl" : "ltr"
  const base = JSON.parse(JSON.stringify(doc)) as StoredDocument
  const next = {
    ...base,
    id: newId(doc.type === "cv" ? "cv" : "cover-letter"),
    name: options?.name?.trim() ? options.name.trim() : `${doc.name} (Copy)`,
    locale,
    direction,
    createdAt: now,
    updatedAt: now,
  }
  if (doc.type === "cv") {
    return { ...(next as CvDocument), versions: [], nameSource: "manual" }
  }
  return next as CoverLetterDocument
}
