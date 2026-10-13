import type { CvDocument } from "@ats/core"
import {
  PAGE_SIZE_MM,
  resolveTemplate,
  type TemplateEntry,
  type TemplateSettings,
} from "@ats/templates"
import { Button } from "@ats/ui"
import { Maximize2Icon, MinusIcon, PlusIcon, XIcon } from "lucide-react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const PAGE_GAP_PX = 24

const ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.66, 0.75, 1] as const

export interface PreviewPaneProps {
  document: CvDocument
  onClose: () => void
  className?: string
}

function resolveTemplateEntry(document: CvDocument): TemplateEntry {
  return resolveTemplate(document.templateId)
}

export function PreviewPane({ document, onClose, className }: PreviewPaneProps) {
  const { t } = useTranslation()
  const template = resolveTemplateEntry(document)
  const { width: pageWidthMm, height: pageHeightMm } = PAGE_SIZE_MM[document.pageSettings.size]
  const pageWidthPx = Math.round((pageWidthMm / 210) * A4_WIDTH_PX)
  const pageHeightPx = Math.round((pageHeightMm / 297) * A4_HEIGHT_PX)
  const [zoom, setZoom] = useState<number | "fit-width" | "fit-page">("fit-width")
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [fitWidth, setFitWidth] = useState(0.5)
  const [fitPage, setFitPage] = useState(0.5)
  const [pages, setPages] = useState(1)
  const [pageHeight, setPageHeight] = useState(pageHeightPx)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const measure = () => {
      // clientWidth already excludes the vertical scrollbar, so fit-width
      // never overflows by the scrollbar width.
      const width = viewport.clientWidth
      setFitWidth(Math.max(0.1, (width - 32) / pageWidthPx))
      setFitPage(Math.max(0.1, (viewport.clientHeight - 48) / pageHeightPx))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [pageWidthPx, pageHeightPx])

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    const measure = () => {
      setPageHeight(Math.max(pageHeightPx, content.scrollHeight))
      setPages(Math.max(1, Math.ceil(content.scrollHeight / pageHeightPx)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => observer.disconnect()
  }, [document, pageHeightPx])

  const effectiveZoom = zoom === "fit-width" ? fitWidth : zoom === "fit-page" ? fitPage : zoom

  const zoomIn = () => {
    const current = effectiveZoom
    const next = ZOOM_LEVELS.find((level) => level > current + 0.001)
    if (next) setZoom(next)
  }

  const zoomOut = () => {
    const current = effectiveZoom
    const candidates = [...ZOOM_LEVELS].reverse().find((level) => level < current - 0.001)
    if (candidates) setZoom(candidates)
  }

  return (
    <div className={`flex h-full min-w-0 flex-col bg-muted/30 ${className ?? ""}`}>
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b bg-background px-3">
        <span className="text-sm font-medium">{t("preview.title")}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            aria-label={t("preview.zoomOut")}
            disabled={effectiveZoom <= ZOOM_LEVELS[0] + 0.001}
          >
            <MinusIcon className="size-4" aria-hidden="true" />
          </Button>
          <span className="w-12 text-center text-xs text-muted-foreground">
            {Math.round(effectiveZoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            aria-label={t("preview.zoomIn")}
            disabled={effectiveZoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1] - 0.001}
          >
            <PlusIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant={zoom === "fit-width" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setZoom("fit-width")}
            aria-label={t("preview.fitWidth")}
          >
            <Maximize2Icon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant={zoom === "fit-page" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setZoom("fit-page")}
            aria-label={t("preview.fitPage")}
          >
            <Maximize2Icon className="size-4 -rotate-90" aria-hidden="true" />
          </Button>
          <span className="ml-1 text-xs text-muted-foreground" aria-label={t("preview.pageCount")}>
            {t("preview.pages", { count: pages })}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("preview.close")}>
            <XIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <div ref={viewportRef} className="h-full overflow-auto">
          <div
            style={{
              paddingTop: PAGE_GAP_PX / 2,
              paddingBottom: PAGE_GAP_PX / 2,
              width: "max-content",
              minWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Layout box matches the SCALED size so the scroll range is exact
                at every zoom level. Forced LTR: this box is pure geometry —
                under RTL the unscaled 794px page child would overflow the
                box leftward and break centering. The page content keeps its
                own direction via TemplatePage. */}
            <div
              dir="ltr"
              style={{
                width: pageWidthPx * effectiveZoom,
                height: pageHeight * effectiveZoom,
                marginInline: "auto",
                position: "relative",
              }}
            >
              <div
                ref={contentRef}
                style={{
                  width: pageWidthPx,
                  transform: `scale(${effectiveZoom})`,
                  transformOrigin: "top left",
                }}
              >
                {template.render({
                  document,
                  settings: document.templateSettings as TemplateSettings,
                  locale: document.locale,
                  direction: document.direction,
                  mode: "preview",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function usePreviewPaneVisibility(initial = false) {
  const [visible, setVisible] = useState(initial)
  useEffect(() => {
    if (!visible) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [visible])
  return { visible, setVisible }
}
