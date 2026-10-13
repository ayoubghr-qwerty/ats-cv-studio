import { isTauri } from "@tauri-apps/api/core"
import { resourceDir, join } from "@tauri-apps/api/path"
import { exists } from "@tauri-apps/plugin-fs"

const PORTABLE_MARKER = "portable.json"
const PORTABLE_DATA_DIR = "ATSData"

export function isDesktopEnvironment(): boolean {
  return isTauri()
}

export async function detectPortableRoot(): Promise<string | null> {
  if (!isTauri()) return null
  try {
    // resourceDir() resolves to the executable's own directory on Windows,
    // unlike executableDir() which the dirs crate only implements for Linux.
    const exeDir = await resourceDir()
    const marker = await join(exeDir, PORTABLE_MARKER)
    if (await exists(marker)) {
      return await join(exeDir, PORTABLE_DATA_DIR)
    }
  } catch {
    // Fall through: no portable mode
  }
  return null
}
