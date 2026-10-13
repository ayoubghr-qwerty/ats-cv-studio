import type { StoredDocument } from "@ats/core"
import { debounce, ensureAllSections } from "@ats/core"
import { useEffect, useRef, useState } from "react"

import { useStorage } from "./storage-provider"

export type DocumentStatus = "loading" | "ready" | "saving" | "saved" | "error"

export function useDocument(id: string | undefined) {
  const storage = useStorage()
  const [document, setDocument] = useState<StoredDocument | null>(null)
  const [status, setStatus] = useState<DocumentStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const documentRef = useRef<StoredDocument | null>(null)
  documentRef.current = document

  useEffect(() => {
    if (!id) {
      setDocument(null)
      setStatus("ready")
      return
    }
    let cancelled = false
    setStatus("loading")
    storage
      .getDocument(id)
      .then((doc) => {
        if (cancelled) return
        // Older documents lack sections added since they were saved (e.g. Soft
        // Skills); add them disabled so they can be switched on. In memory only:
        // nothing is written until the user edits the document.
        setDocument(doc ? ensureAllSections(doc) : doc)
        setError(null)
        setStatus("ready")
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [id, storage])

  const saveSoon = useRef(
    debounce(async (storageAdapter: typeof storage, doc: StoredDocument) => {
      try {
        await storageAdapter.saveDocument(doc)
        setStatus("saved")
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setStatus("error")
      }
    }, 800),
  ).current

  useEffect(() => {
    return () => {
      saveSoon.flush()
    }
  }, [saveSoon])

  // Flush pending autosave when the tab is hidden or the window is about to close,
  // so the last keystrokes are not lost.
  useEffect(() => {
    const handleLeave = () => saveSoon.flush()
    globalThis.document.addEventListener("visibilitychange", handleLeave)
    globalThis.window.addEventListener("beforeunload", handleLeave)
    return () => {
      globalThis.document.removeEventListener("visibilitychange", handleLeave)
      globalThis.window.removeEventListener("beforeunload", handleLeave)
    }
  }, [saveSoon])

  const updateDocument = (updater: (doc: StoredDocument) => StoredDocument) => {
    const current = documentRef.current
    if (!current) return
    const next = {
      ...updater(current),
      updatedAt: new Date().toISOString(),
    }
    documentRef.current = next
    setDocument(next)
    setStatus("saving")
    saveSoon(storage, next)
  }

  const saveNow = async () => {
    const current = documentRef.current
    if (!current) return
    setStatus("saving")
    try {
      await storage.saveDocument(current)
      setStatus("saved")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus("error")
    }
  }

  return { document, status, error, updateDocument, saveNow }
}
