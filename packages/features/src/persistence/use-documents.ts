import type { CoverLetterDocument, CvDocument, DocumentMeta, StoredDocument } from "@ats/core"
import { createCoverLetterDocument, createCvDocument } from "@ats/core"
import { toast } from "sonner"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useStorage } from "./storage-provider"

export function useDocuments() {
  const storage = useStorage()
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<DocumentMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const list = await storage.listDocuments()
      list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      setDocuments(list)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setDocuments([])
    }
  }, [storage])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createCv = useCallback(
    async (locale?: "en" | "fr" | "ar"): Promise<CvDocument> => {
      const doc = createCvDocument({ locale })
      await storage.saveDocument(doc)
      await refresh()
      return doc
    },
    [storage, refresh],
  )

  const createCoverLetter = useCallback(
    async (locale?: "en" | "fr" | "ar"): Promise<CoverLetterDocument> => {
      const doc = createCoverLetterDocument({ locale })
      await storage.saveDocument(doc)
      await refresh()
      return doc
    },
    [storage, refresh],
  )

  const rename = useCallback(
    async (id: string, name: string) => {
      const doc = await storage.getDocument(id)
      if (!doc) throw new Error("Document not found")
      const updated: StoredDocument =
        doc.type === "cv"
          ? { ...doc, name, nameSource: "manual", updatedAt: new Date().toISOString() }
          : { ...doc, name, updatedAt: new Date().toISOString() }
      await storage.saveDocument(updated)
      await refresh()
    },
    [storage, refresh],
  )

  const duplicate = useCallback(
    async (id: string): Promise<StoredDocument> => {
      const doc = await storage.duplicateDocument(id)
      await refresh()
      return doc
    },
    [storage, refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await storage.deleteDocument(id)
      await refresh()
    },
    [storage, refresh],
  )

  const exportWorkspace = useCallback(async (): Promise<string> => {
    return storage.exportWorkspace()
  }, [storage])

  const importWorkspace = useCallback(
    async (json: string): Promise<{ imported: number; skipped: string[] }> => {
      try {
        const result = await storage.importWorkspace(json)
        await refresh()
        return result
      } catch (err) {
        toast.error(t("dashboard.importError"))
        throw err
      }
    },
    [storage, refresh, t],
  )

  return {
    documents,
    error,
    refresh,
    createCv,
    createCoverLetter,
    rename,
    duplicate,
    remove,
    exportWorkspace,
    importWorkspace,
  }
}
