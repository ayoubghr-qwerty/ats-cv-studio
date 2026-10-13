import { linesToDraft } from "../detect"
import type { DraftCv, PdfTextItem, SourceLine } from "../types"

export function clusterPdfLines(items: PdfTextItem[], yTolerance = 3): SourceLine[] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  const lines: SourceLine[] = []
  let current: { y: number; parts: string[] } | null = null
  for (const item of sorted) {
    if (!current || Math.abs(item.y - current.y) > yTolerance) {
      if (current) lines.push({ text: current.parts.join(" ").trim() })
      current = { y: item.y, parts: [item.str] }
    } else {
      current.parts.push(item.str)
    }
  }
  if (current) lines.push({ text: current.parts.join(" ").trim() })
  return lines.filter((l) => l.text.length > 0)
}

export function pdfToDraft(items: PdfTextItem[]): DraftCv {
  const lines = clusterPdfLines(items)
  const draft = linesToDraft(lines)
  if (lines.length === 0) {
    draft.warnings.push("import.warningEmptyText")
  }
  return draft
}
