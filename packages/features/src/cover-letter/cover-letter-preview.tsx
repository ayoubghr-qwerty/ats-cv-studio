import type { CoverLetterDocument } from "@ats/core"
import { resolveCoverLetterTemplate } from "@ats/templates"
import { Button, ScrollArea } from "@ats/ui"
import { XIcon } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

export interface CoverLetterPreviewProps {
  document: CoverLetterDocument
  onClose: () => void
}

const PAGE_WIDTH_PX = 794
const PAGE_HEIGHT_PX = 1123
const PAGE_GAP_PX = 24

export function CoverLetterPreview({ document, onClose }: CoverLetterPreviewProps) {
  const { t } = useTranslation()
  const template = resolveCoverLetterTemplate(document.templateId)
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [contentHeight, setContentHeight] = useState(PAGE_HEIGHT_PX)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const measure = () => {
      const width = viewport.clientWidth
      setScale(Math.max(0.1, (width - 48) / PAGE_WIDTH_PX))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    const measure = () => {
      setContentHeight(Math.max(PAGE_HEIGHT_PX, content.scrollHeight))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => observer.disconnect()
  }, [document])

  return (
    <div className="flex h-full min-w-0 flex-col bg-muted/30">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b bg-background px-3">
        <span className="text-sm font-medium">{t("preview.title")}</span>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("preview.close")}>
          <XIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <div ref={viewportRef} className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div
            className="flex justify-center"
            style={{
              paddingTop: PAGE_GAP_PX / 2,
              paddingBottom: PAGE_GAP_PX / 2,
              width: "max-content",
              minWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Layout box matches the SCALED size so the scroll range is exact
                at every zoom level. Forced LTR — pure geometry box. */}
            <div
              dir="ltr"
              style={{
                width: PAGE_WIDTH_PX * scale,
                height: contentHeight * scale,
                marginInline: "auto",
                position: "relative",
              }}
            >
              <div
                ref={contentRef}
                style={{
                  width: PAGE_WIDTH_PX,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                {template.render(document)}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
