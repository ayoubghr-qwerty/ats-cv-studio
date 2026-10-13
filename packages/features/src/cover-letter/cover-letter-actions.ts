import type { CoverLetterDocument } from "@ats/core"
import { toCoverLetterBlob } from "@ats/exporters"

export type CoverLetterSaveResult = "saved" | "cancelled" | "error"

export async function saveCoverLetterDocx(
  letter: CoverLetterDocument,
  fileName: string,
): Promise<CoverLetterSaveResult> {
  try {
    const blob = await toCoverLetterBlob(letter)
    const name = fileName.endsWith(".docx") ? fileName : `${fileName}.docx`
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeFile } = await import("@tauri-apps/plugin-fs")
      const path = await save({
        defaultPath: name,
        filters: [{ name: "Word Document", extensions: ["docx"] }],
      })
      if (!path) return "cancelled"
      const bytes = new Uint8Array(await blob.arrayBuffer())
      await writeFile(path, bytes)
      return "saved"
    }
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement("a")
    anchor.href = url
    anchor.download = name
    window.document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    return "saved"
  } catch {
    return "error"
  }
}
