import type { ReactElement } from "react"

import type { CoverLetterDocument } from "@ats/core"

export type CoverLetterLocale = "en" | "fr" | "ar"

export interface CoverLetterTemplateEntry {
  id: string
  name: Record<CoverLetterLocale, string>
  description: Record<CoverLetterLocale, string>
  render: (doc: CoverLetterDocument) => ReactElement
}
