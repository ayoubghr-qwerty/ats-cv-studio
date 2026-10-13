import type { CvDocument } from "@ats/core"
import { toDocxBlob } from "@ats/exporters"

export function sanitizeFileName(name: string): string {
  const cleaned = [...name]
    .map((ch) => (/[<>:"/\\|?*]/.test(ch) || ch.charCodeAt(0) < 32 ? "-" : ch))
    .join("")
    .trim()
    .replace(/\s+/g, " ")
  return cleaned || "cv"
}

export type DocxSaveResult = "saved" | "cancelled" | "error"

export async function exportDocxFile(cv: CvDocument, fileName: string): Promise<DocxSaveResult> {
  try {
    const blob = await toDocxBlob(cv)
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeFile } = await import("@tauri-apps/plugin-fs")
      const path = await save({
        defaultPath: fileName.endsWith(".docx") ? fileName : `${fileName}.docx`,
        filters: [{ name: "Word Document", extensions: ["docx"] }],
      })
      if (!path) return "cancelled"
      const bytes = new Uint8Array(await blob.arrayBuffer())
      await writeFile(path, bytes)
      await revealItemInDir(path)
      return "saved"
    }
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement("a")
    anchor.href = url
    anchor.download = fileName.endsWith(".docx") ? fileName : `${fileName}.docx`
    window.document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    return "saved"
  } catch {
    return "error"
  }
}

export type PdfSaveResult =
  { status: "saved" | "cancelled" | "print" } | { status: "error"; message: string }

export async function exportPdfFile(
  document: { id: string },
  fileName: string,
  documentKind: "cv" | "cover-letter",
  pageSize: string,
): Promise<PdfSaveResult> {
  try {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { invoke } = await import("@tauri-apps/api/core")
      const path = await save({
        defaultPath: fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`,
        filters: [{ name: "PDF Document", extensions: ["pdf"] }],
      })
      if (!path) return { status: "cancelled" }
      await invoke("export_pdf", {
        documentId: document.id,
        documentKind,
        outputPath: path,
        pageSize,
      })
      await revealItemInDir(path)
      return { status: "saved" }
    }
    return { status: "print" }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

async function revealItemInDir(path: string): Promise<void> {
  try {
    const { revealItemInDir } = await import("@tauri-apps/plugin-opener")
    await revealItemInDir(path)
  } catch {
    // revealing the file in the OS file manager is best-effort
  }
}
