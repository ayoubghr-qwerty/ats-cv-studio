import { CvEditorStore } from "@ats/core"
import type { CvDocument, CoverLetterDocument } from "@ats/core"
import type { DocumentStatus } from "../persistence"
import { useDocument } from "../persistence"
import { useEditorContext } from "./editor-context"

export interface CvEditorController {
  store: CvEditorStore | null
  document: CvDocument | CoverLetterDocument | null
  isCv: boolean
  status: DocumentStatus
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  updateDocument: (
    updater: (doc: CvDocument | CoverLetterDocument) => CvDocument | CoverLetterDocument,
  ) => void
  saveNow: () => Promise<void>
}

export function useCvEditor(docId: string | undefined): CvEditorController {
  const { document, status, updateDocument, saveNow } = useDocument(docId)
  const context = useEditorContext()

  return {
    document,
    isCv: document?.type === "cv",
    status,
    updateDocument,
    saveNow,
    store: context.store,
    canUndo: context.canUndo,
    canRedo: context.canRedo,
    undo: context.undo,
    redo: context.redo,
  }
}

export function useActiveCvEditor() {
  return useEditorContext()
}
