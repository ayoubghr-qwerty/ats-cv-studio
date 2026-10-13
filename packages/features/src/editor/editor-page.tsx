import {
  reorderSectionsByIndex,
  setDocumentLocale,
  setSectionTitle,
  toggleSection,
  validateCv,
  type CvSection,
} from "@ats/core"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  ScrollArea,
  Sheet,
  SheetDescription,
  SheetTitle,
  Skeleton,
} from "@ats/ui"
import { ResizableSheetContent, useResizableSheet } from "@ats/ui"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  HistoryIcon,
  PaletteIcon,
  UserIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { CoverLetterEditor } from "../cover-letter/cover-letter-editor"
import { ContactEditor } from "./contact-editor"
import { SectionEditor } from "./section-editors"
import { SectionList } from "./section-list"
import { DesignPanel } from "../templates/design-panel"
import { useDesignPanelStore } from "./design-panel-position"
import { ExportModal } from "../export/export-modal"
import { PreviewPane, usePreviewPaneVisibility } from "../preview/preview-pane"
import { VersionPanel } from "../versions/version-panel"
import { useEditorContext } from "./editor-context"
import { useUiLocale } from "../hooks/use-ui-locale"
import { useDocument } from "../persistence"
import { EditorProvider } from "./editor-context"

const WARNING_LABELS = {
  missingFullName: "editor.warnMissingName",
  invalidEmail: "editor.invalidEmail",
  invalidPhone: "editor.invalidPhone",
  invalidDateRange: "editor.invalidDateRange",
  emptySection: "editor.warnEmptySection",
} as const

function SaveStatus({ status }: { status: string }) {
  const { t } = useTranslation()
  if (status === "saving") {
    return (
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
        {t("common.saving")}
      </span>
    )
  }
  if (status === "saved") {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
        {t("common.saved")}
      </span>
    )
  }
  return null
}

function EditorContent() {
  const { t } = useTranslation()
  const uiLocale = useUiLocale()
  const navigate = useNavigate()
  const { docId } = useParams<{ docId?: string }>()
  const { document, status, store, updateDocument, undo, redo } = useEditorContext()
  const [selectedId, setSelectedId] = useState<string>("contact")
  const [exportOpen, setExportOpen] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)
  const preview = usePreviewPaneVisibility(false)
  const designSide = useDesignPanelStore((s) => s.side)
  const designWidth = useDesignPanelStore((s) => s.width)
  const setDesignWidth = useDesignPanelStore((s) => s.setWidth)
  const { width: sheetWidth, startResize } = useResizableSheet({
    side: designSide,
    initialWidth: designWidth,
    onWidthChange: setDesignWidth,
  })

  useEffect(() => {
    if (document && document.type === "cover-letter") return
    if (
      document &&
      !document.sections.some((s) => s.id === selectedId) &&
      selectedId !== "contact"
    ) {
      setSelectedId("contact")
    }
  }, [document, selectedId])

  useEffect(() => {
    if (!document || document.type !== "cv" || !store) return
    if (document.locale !== uiLocale) {
      store.mutate((d) => setDocumentLocale(d as import("@ats/core").CvDocument, uiLocale))
    }
  }, [uiLocale, store])

  useEffect(() => {
    if (!docId || document?.type !== "cv") return
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [docId, document?.type])

  if (!docId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <FileTextIcon className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="max-w-sm text-sm text-muted-foreground">{t("editor.selectPrompt")}</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeftIcon aria-hidden="true" />
          {t("nav.dashboard")}
        </Button>
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div className="flex h-full flex-col gap-4 p-6 lg:p-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="mt-4 h-[50vh]" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <FileTextIcon className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="max-w-sm text-sm text-muted-foreground">{t("editor.notFound")}</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeftIcon aria-hidden="true" />
          {t("nav.dashboard")}
        </Button>
      </div>
    )
  }

  if (document.type === "cover-letter") {
    return (
      <CoverLetterEditor
        document={document}
        status={status}
        updateDocument={(updater) =>
          updateDocument((doc) => updater(doc as import("@ats/core").CoverLetterDocument))
        }
      />
    )
  }

  if (!store) return null

  const warnings = validateCv(document)
  const sections = [...document.sections].sort((a, b) => a.order - b.order)
  const selectedSection: CvSection | undefined = sections.find((s) => s.id === selectedId)

  const onReorder = (from: number, to: number) => {
    store.mutate((d) => reorderSectionsByIndex(d, from, to))
  }

  const onToggle = (id: string) => {
    store.mutate((d) => toggleSection(d, id))
  }

  return (
    <div className="flex h-full flex-col" dir={document.direction}>
      <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 lg:px-6">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-lg font-semibold">{document.name}</span>
          <span className="text-xs text-muted-foreground">
            {t("dashboard.cvBadge")} · {document.locale.toUpperCase()}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={designOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setDesignOpen((v) => !v)}
            aria-label={t("editor.design")}
            aria-pressed={designOpen}
          >
            <PaletteIcon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("editor.design")}</span>
          </Button>
          <Button
            variant={preview.visible ? "secondary" : "ghost"}
            size="sm"
            onClick={() => preview.setVisible((v) => !v)}
            aria-label={t("preview.title")}
            aria-pressed={preview.visible}
          >
            <EyeIcon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("preview.title")}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVersionsOpen(true)}
            aria-label={t("versions.title")}
          >
            <HistoryIcon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("versions.title")}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            aria-label={t("export.title")}
          >
            <DownloadIcon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("export.title")}</span>
          </Button>
          <SaveStatus status={status} />
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="flex shrink-0 items-start gap-2 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {warnings.map((w, i) => (
              <span key={i}>{t(WARNING_LABELS[w.kind])}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 flex-col gap-2 overflow-y-auto border-r p-4 md:flex">
          <button
            type="button"
            onClick={() => setSelectedId("contact")}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left ${
              selectedId === "contact" ? "border-primary/50" : "bg-card"
            }`}
          >
            <UserIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium">{t("editor.contact")}</span>
          </button>
          <SectionList
            sections={sections}
            selectedId={selectedId === "contact" ? null : selectedId}
            onSelect={setSelectedId}
            onToggle={onToggle}
            onReorder={onReorder}
          />
        </aside>

        <ScrollArea className="min-h-0 min-w-0 flex-1">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 lg:p-8">
            {selectedId === "contact" ? (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold">{t("editor.contact")}</h2>
                  <p className="text-sm text-muted-foreground">{t("editor.contactHint")}</p>
                </div>
                <ContactEditor doc={document} store={store} />
              </>
            ) : selectedSection ? (
              <>
                <div className="flex flex-col gap-2">
                  <Input
                    value={selectedSection.title}
                    onChange={(e) =>
                      store.mutate(
                        (d) => setSectionTitle(d, selectedSection.id, e.target.value),
                        "text",
                      )
                    }
                    className="h-auto text-xl font-semibold"
                    aria-label="Section title"
                  />
                  <p className="text-sm text-muted-foreground">
                    {selectedSection.enabled ? t("editor.sectionOn") : t("editor.sectionOff")}
                  </p>
                </div>
                <SectionEditor section={selectedSection} store={store} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("editor.selectPrompt")}</p>
            )}
          </div>
        </ScrollArea>

        {preview.visible && (
          <Dialog open onOpenChange={(open) => !open && preview.setVisible(false)}>
            <DialogContent
              showCloseButton={false}
              className="!max-w-none flex h-[92vh] max-h-[92vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden rounded-lg border p-0"
            >
              <DialogTitle className="sr-only">{t("preview.title")}</DialogTitle>
              <DialogDescription className="sr-only">{t("editor.contactHint")}</DialogDescription>
              <PreviewPane
                document={document}
                onClose={() => preview.setVisible(false)}
                className="h-full border-0"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Sheet open={designOpen} onOpenChange={setDesignOpen}>
        <ResizableSheetContent
          side={designSide}
          width={sheetWidth}
          onResizeStart={startResize}
          className="gap-0 overflow-hidden"
        >
          <SheetTitle className="sr-only">{t("editor.design")}</SheetTitle>
          <SheetDescription className="sr-only">{t("editor.designHint")}</SheetDescription>
          <div className="h-full overflow-y-auto p-4 pt-12">
            <DesignPanel document={document} store={store} />
          </div>
        </ResizableSheetContent>
      </Sheet>

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        document={document}
        onPrint={() => navigate(`/print/cv/${document.id}`)}
      />

      <VersionPanel
        document={document}
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        updateDocument={(updater) => store.mutate((doc) => updater(doc), "versions")}
      />
    </div>
  )
}

function EditorProviderGate() {
  const { docId } = useParams<{ docId?: string }>()
  const { document, status, updateDocument, saveNow } = useDocument(docId)

  return (
    <EditorProvider
      document={document}
      status={status}
      updateDocument={updateDocument}
      saveNow={saveNow}
    >
      <EditorContent />
    </EditorProvider>
  )
}

export function EditorPage() {
  return <EditorProviderGate />
}
