import type { DocumentMeta, StorageAdapter, StoredDocument } from "@ats/core"
import {
  SerialQueue,
  duplicateDocument as duplicateDoc,
  parseStoredDocument,
  parseWorkspaceBundle,
  serializeDocument,
  serializeWorkspaceBundle,
  toMeta,
  workspaceSchema,
} from "@ats/core"
import { isTauri } from "@tauri-apps/api/core"
import { appDataDir, join } from "@tauri-apps/api/path"
import { exists, mkdir, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs"

import { detectPortableRoot } from "./portable-mode"

const WORKSPACE_FILE = "workspace.json"
const DOCUMENTS_DIR = "documents"

export class FileSystemStorage implements StorageAdapter {
  private rootPromise: Promise<string> | null = null
  // Serializes every read-modify-write of workspace.json (save/delete both
  // read the current document list, then write the whole file back). Two
  // overlapping calls — e.g. an explicit saveNow() flush racing a pending
  // debounced autosave — would otherwise interleave and one write could
  // clobber the other's list entry. See SerialQueue for the mechanism.
  private readonly workspaceQueue = new SerialQueue()

  private resolveRoot(): Promise<string> {
    if (!this.rootPromise) {
      this.rootPromise = this.initRoot()
    }
    return this.rootPromise
  }

  private async initRoot(): Promise<string> {
    if (!isTauri()) {
      throw new Error("FileSystemStorage requires the Tauri runtime")
    }
    const portableRoot = await detectPortableRoot()
    const root = portableRoot ? portableRoot : await join(await appDataDir(), "ATS_CV_Studio")
    await mkdir(root, { recursive: true })
    await mkdir(await join(root, DOCUMENTS_DIR), { recursive: true })
    return root
  }

  private async workspacePath(): Promise<string> {
    return join(await this.resolveRoot(), WORKSPACE_FILE)
  }

  private async documentPath(id: string): Promise<string> {
    return join(await this.resolveRoot(), DOCUMENTS_DIR, `${id}.json`)
  }

  async listDocuments(): Promise<DocumentMeta[]> {
    const wsPath = await this.workspacePath()
    if (!(await exists(wsPath))) return []
    try {
      const raw = JSON.parse(await readTextFile(wsPath))
      const parsed = workspaceSchema.safeParse(raw)
      return parsed.success ? parsed.data.documents : []
    } catch {
      return []
    }
  }

  async getDocument(id: string): Promise<StoredDocument | null> {
    const path = await this.documentPath(id)
    if (!(await exists(path))) return null
    const json = await readTextFile(path)
    return parseStoredDocument(json)
  }

  async saveDocument(doc: StoredDocument): Promise<void> {
    const docPath = await this.documentPath(doc.id)
    await writeTextFile(docPath, serializeDocument(doc))

    const meta = toMeta(doc)
    await this.workspaceQueue.run(async () => {
      const list = await this.listDocuments()
      const index = list.findIndex((m) => m.id === doc.id)
      if (index >= 0) {
        list[index] = meta
      } else {
        list.push(meta)
      }
      const wsPath = await this.workspacePath()
      await writeTextFile(
        wsPath,
        JSON.stringify(
          {
            schemaVersion: 1,
            documents: list,
            updatedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      )
    })
  }

  async deleteDocument(id: string): Promise<void> {
    const path = await this.documentPath(id)
    if (await exists(path)) {
      await remove(path)
    }
    await this.workspaceQueue.run(async () => {
      const list = await this.listDocuments()
      const next = list.filter((m) => m.id !== id)
      const wsPath = await this.workspacePath()
      await writeTextFile(
        wsPath,
        JSON.stringify(
          {
            schemaVersion: 1,
            documents: next,
            updatedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      )
    })
  }

  async duplicateDocument(id: string): Promise<StoredDocument> {
    const source = await this.getDocument(id)
    if (!source) throw new Error(`Document not found: ${id}`)
    const copy = duplicateDoc(source)
    await this.saveDocument(copy)
    return copy
  }

  async exportWorkspace(): Promise<string> {
    const list = await this.listDocuments()
    const documents: StoredDocument[] = []
    for (const meta of list) {
      const doc = await this.getDocument(meta.id)
      if (doc) documents.push(doc)
    }
    return serializeWorkspaceBundle(documents)
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
