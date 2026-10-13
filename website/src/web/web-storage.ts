import type { DocumentMeta, StorageAdapter, StoredDocument } from "@ats/core"
import {
  duplicateDocument as duplicateDoc,
  parseWorkspaceBundle,
  serializeWorkspaceBundle,
  toMeta,
} from "@ats/core"
import Dexie, { type Table } from "dexie"

interface StoredDocRecord {
  id: string
  type: "cv" | "cover-letter"
  name: string
  data: StoredDocument
  updatedAt: string
}

interface SettingsRecord {
  key: string
  value: unknown
}

interface BackupRecord {
  id?: number
  createdAt: string
  payload: string
}

class AtsDatabase extends Dexie {
  documents!: Table<StoredDocRecord, string>
  settings!: Table<SettingsRecord, string>
  backups!: Table<BackupRecord, number>

  constructor() {
    super("ats-cv-studio")
    this.version(1).stores({
      documents: "id, type, name, updatedAt",
      settings: "key",
      backups: "++id, createdAt",
    })
  }
}

const db = new AtsDatabase()

export class IndexedDbStorage implements StorageAdapter {
  async listDocuments(): Promise<DocumentMeta[]> {
    const rows = await db.documents.orderBy("updatedAt").reverse().toArray()
    return rows.map((r) => ({ id: r.id, type: r.type, name: r.name, updatedAt: r.updatedAt }))
  }

  async getDocument(id: string): Promise<StoredDocument | null> {
    const row = await db.documents.get(id)
    return row?.data ?? null
  }

  async saveDocument(doc: StoredDocument): Promise<void> {
    const meta = toMeta(doc)
    await db.documents.put({
      id: doc.id,
      type: meta.type,
      name: meta.name,
      data: doc,
      updatedAt: doc.updatedAt,
    })
  }

  async deleteDocument(id: string): Promise<void> {
    await db.documents.delete(id)
  }

  async duplicateDocument(id: string): Promise<StoredDocument> {
    const source = await this.getDocument(id)
    if (!source) throw new Error(`Document not found: ${id}`)
    const copy = duplicateDoc(source)
    await this.saveDocument(copy)
    return copy
  }

  async exportWorkspace(): Promise<string> {
    const rows = await db.documents.toArray()
    return serializeWorkspaceBundle(rows.map((r) => r.data))
  }

  async importWorkspace(json: string): Promise<{ imported: number; skipped: string[] }> {
    const bundle = parseWorkspaceBundle(json)
    let imported = 0
    const skipped: string[] = []
    for (const doc of bundle.documents) {
      try {
        await this.saveDocument(doc)
        imported += 1
      } catch {
        skipped.push(doc.name || doc.id)
      }
    }
    return { imported, skipped }
  }
}
