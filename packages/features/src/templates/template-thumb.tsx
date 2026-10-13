import type { CvDocument } from "@ats/core"
import type { TemplateEntry } from "@ats/templates"
import { useEffect, useRef, useState } from "react"

import { cn } from "@ats/ui"

const A4_WIDTH_PX = 794

export interface TemplateThumbProps {
  entry: TemplateEntry
  document: CvDocument
  className?: string
  label?: string
}

export function TemplateThumb({ entry, document, className, label }: TemplateThumbProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.28)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(el.clientWidth / A4_WIDTH_PX)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden={!label}
      title={label}
      className={cn("pointer-events-none relative overflow-hidden bg-white", className)}
      style={{ aspectRatio: "210 / 297" }}
    >
      <div
        style={{
          width: A4_WIDTH_PX,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <entry.render
          document={document}
          settings={entry.defaults}
          locale="en"
          direction="ltr"
          mode="preview"
        />
      </div>
    </div>
  )
}
