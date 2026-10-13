import type { CoverLetterDocument, CvDocument, DocumentMeta } from "../schema"

export interface StorageAdapter {
  listDocuments(): Promise<DocumentMeta[]>
  getDocument(id: string): Promise<CvDocument | CoverLetterDocument | null>
  saveDocument(doc: CvDocument | CoverLetterDocument): Promise<void>
  deleteDocument(id: string): Promise<void>
  duplicateDocument(id: string): Promise<CvDocument | CoverLetterDocument>
  exportWorkspace(): Promise<string>
  importWorkspace(json: string): Promise<{ imported: number; skipped: string[] }>
}
