import { getDocument, GlobalWorkerOptions } from "pdfjs-dist"

import type { PdfTextItem } from "../types"

if (typeof document !== "undefined") {
  const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)
  GlobalWorkerOptions.workerSrc = workerUrl.toString()
}

export async function parsePdf(buffer: ArrayBuffer | Uint8Array): Promise<PdfTextItem[]> {
  const pdf = await getDocument({ data: buffer }).promise
  const items: PdfTextItem[] = []
  let yOffset = 0
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()
      for (const item of content.items) {
        if ("str" in item && item.str.trim()) {
          const transform = item.transform
          items.push({
            str: item.str,
            x: transform[4],
            y: yOffset + (viewport.height - transform[5]),
          })
        }
      }
      yOffset += viewport.height
    }
  } finally {
    await pdf.destroy()
  }
  return items
}
