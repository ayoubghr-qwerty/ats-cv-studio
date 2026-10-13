import type { CSSProperties, ReactNode } from "react"

export interface TemplateSectionProps {
  title: string
  styles: {
    heading: CSSProperties
    body: CSSProperties
  }
  children: ReactNode
}

export function TemplateSection({ title, styles, children }: TemplateSectionProps) {
  return (
    <section className="cv-section">
      <h2 className="cv-section-heading" style={styles.heading}>
        {title}
      </h2>
      <div className="cv-section-body" style={styles.body}>
        {children}
      </div>
    </section>
  )
}
