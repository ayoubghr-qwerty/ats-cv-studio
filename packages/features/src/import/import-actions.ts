export type ImportFileKind = "pdf" | "docx" | "json"

export interface PickedImportFile {
  name: string
  data: Uint8Array
}

const ACCEPTS: Record<ImportFileKind, string> = {
  pdf: "application/pdf,.pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx",
  json: "application/json,.json",
}

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer)
}

export async function pickImportFile(kind: ImportFileKind): Promise<PickedImportFile | null> {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const { readFile } = await import("@tauri-apps/plugin-fs")
    const path = await open({
      multiple: false,
      directory: false,
      filters: [{ name: kind.toUpperCase(), extensions: [kind] }],
    })
    if (typeof path !== "string") return null
    const name = path.split(/[\\/]/).pop() ?? "import"
    const data = await readFile(path)
    return { name, data }
  }

  return new Promise((resolve) => {
    const input = window.document.createElement("input")
    input.type = "file"
    input.accept = ACCEPTS[kind]
    input.style.display = "none"
    input.onchange = () => {
      const file = input.files?.[0]
      input.remove()
      if (!file) {
        resolve(null)
        return
      }
      file
        .arrayBuffer()
        .then((buffer) => resolve({ name: file.name, data: toUint8Array(buffer) }))
        .catch(() => resolve(null))
    }
    window.document.body.appendChild(input)
    input.click()
  })
}
