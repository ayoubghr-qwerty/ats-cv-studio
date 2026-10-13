import { linesToDraft } from "../detect"
import type { DraftCv, DocxParagraph } from "../types"

export function paragraphsToDraft(paragraphs: DocxParagraph[]): DraftCv {
  return linesToDraft(paragraphs.map((p) => ({ text: p.text, bullet: p.bullet })))
}
