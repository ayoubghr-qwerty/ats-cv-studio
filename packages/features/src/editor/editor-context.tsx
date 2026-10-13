import { CvEditorStore } from "@ats/core"
import type { DocumentStatus } from "../persistence"
import type { CvDocument, CoverLetterDocument } from "@ats/core"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

interface EditorContextValue {
  store: CvEditorStore | null
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  document: CvDocument | CoverLetterDocument | null
  status: DocumentStatus
  updateDocument: (
    updater: (doc: CvDocument | CoverLetterDocument) => CvDocument | CoverLetterDocument,
  ) => void
  saveNow: () => Promise<void>
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({
  children,
  document,
  status,
  updateDocument,
  saveNow,
}: {
  children: React.ReactNode
  document: CvDocument | CoverLetterDocument | null
  status: DocumentStatus
  updateDocument: (
    updater: (doc: CvDocument | CoverLetterDocument) => CvDocument | CoverLetterDocument,
  ) => void
  saveNow: () => Promise<void>
}) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Create store with useMemo - runs during render but returns stable value
  const store = useMemo(() => {
    if (document && document.type === "cv") {
      return new CvEditorStore(document)
    }
    return null
  }, [document?.id, document?.type])

  // Update canUndo/canRedo when store changes
  useEffect(() => {
    if (!store) {
      setCanUndo(false)
      setCanRedo(false)
      return
    }
    setCanUndo(store.canUndo)
    setCanRedo(store.canRedo)
  }, [store])

  // Side effects only: subscription and cleanup
  useEffect(() => {
    if (!store) return

    const syncToDocument = () => {
      updateDocument((d) => {
        const state = store.getState()
        if (d.type === "cv" && state.nameSource === "auto") {
          const jobTitle = state.contact.jobTitle.trim()
          return { ...state, name: jobTitle || "Untitled CV" }
        }
        return state
      })
    }
    const unsubscribe = store.subscribe(() => {
      setCanUndo(store.canUndo)
      setCanRedo(store.canRedo)
      syncToDocument()
    })
    return () => {
      unsubscribe()
    }
  }, [store, updateDocument])

  const value: EditorContextValue = {
    store,
    canUndo,
    canRedo,
    undo: () => store?.undo(),
    redo: () => store?.redo(),
    document,
    status,
    updateDocument,
    saveNow,
  }

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

const DEFAULT_EDITOR_CONTEXT: EditorContextValue = {
  store: null,
  canUndo: false,
  canRedo: false,
  undo: () => {},
  redo: () => {},
  document: null,
  status: "ready",
  updateDocument: () => {},
  saveNow: async () => {},
}

export function useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext)
  return context ?? DEFAULT_EDITOR_CONTEXT
}
