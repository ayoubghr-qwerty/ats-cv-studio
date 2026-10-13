import type { CSSProperties, ReactNode } from "react"

import type { TemplateStyles } from "../tokens"

export interface TemplatePageProps {
  styles: TemplateStyles
  direction: "ltr" | "rtl"
  mode: "preview" | "print"
  children: ReactNode
}

export function TemplatePage({ styles, direction, mode, children }: TemplatePageProps) {
  // On screen the page is a sheet with its own padding. In print the margin
  // comes from the @page rule (see printPageRule), so the block must not add
  // padding or a fixed height of its own: those only apply to the first and
  // last page of a CV that spans several.
  const pageStyle: CSSProperties =
    mode === "preview"
      ? { ...styles.page, margin: "0 auto" }
      : { ...styles.page, padding: 0, width: "auto", height: "auto" }
  return (
    <div dir={direction} className="cv-page" style={pageStyle}>
      {children}
    </div>
  )
}
