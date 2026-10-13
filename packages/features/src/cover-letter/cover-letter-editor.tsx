import type { CoverLetterDocument } from "@ats/core"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetDescription,
  SheetTitle,
  Textarea,
} from "@ats/ui"
import { ResizableSheetContent, useResizableSheet } from "@ats/ui"
import {
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  Loader2Icon,
  PaletteIcon,
  PrinterIcon,
  UserIcon,
  UserRoundPlusIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useDocuments, useStorage } from "../persistence"
import type { DocumentStatus } from "../persistence/use-document"
import { useDesignPanelStore } from "../editor/design-panel-position"
import { saveCoverLetterDocx } from "./cover-letter-actions"
import { CoverLetterDesignPanel } from "./cover-letter-design-panel"
import { CoverLetterPreview } from "./cover-letter-preview"
import { exportPdfFile } from "../export/export-actions"

export interface CoverLetterEditorProps {
  document: CoverLetterDocument
  status: DocumentStatus
  updateDocument: (updater: (doc: CoverLetterDocument) => CoverLetterDocument) => void
}

function SaveStatus({ status }: { status: DocumentStatus }) {
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

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
  rows,
  type,
  name,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  textarea?: boolean
  placeholder?: string
  rows?: number
  type?: string
  name?: string
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows ?? 5}
          placeholder={placeholder}
        />
      ) : (
        <Input
          type={type}
          name={name}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  )
}

export function CoverLetterEditor({ document, status, updateDocument }: CoverLetterEditorProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const docs = useDocuments()
  const storage = useStorage()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [savingDocx, setSavingDocx] = useState(false)
  const [savingPdf, setSavingPdf] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)
  const designSide = useDesignPanelStore((s) => s.side)
  const designWidth = useDesignPanelStore((s) => s.width)
  const setDesignWidth = useDesignPanelStore((s) => s.setWidth)
  const { width: sheetWidth, startResize } = useResizableSheet({
    side: designSide,
    initialWidth: designWidth,
    onWidthChange: setDesignWidth,
  })

  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

  const set = <K extends keyof CoverLetterDocument>(key: K, value: CoverLetterDocument[K]) => {
    updateDocument((d) => ({ ...d, [key]: value }))
  }

  const setSender = (key: keyof CoverLetterDocument["sender"], value: string) => {
    updateDocument((d) => ({ ...d, sender: { ...d.sender, [key]: value } }))
  }

  const setRecipient = (key: keyof CoverLetterDocument["recipient"], value: string) => {
    updateDocument((d) => ({ ...d, recipient: { ...d.recipient, [key]: value } }))
  }

  const cvList = (docs.documents ?? []).filter((doc) => doc.type === "cv")

  const importFromCv = (metaId: string) => {
    void (async () => {
      try {
        const full = await storage.getDocument(metaId)
        if (!full || full.type !== "cv") return
        updateDocument((d) => ({
          ...d,
          sender: {
            fullName: full.contact.fullName,
            email: full.contact.email,
            phone: full.contact.phone,
            location: full.contact.location,
          },
        }))
        toast.success(t("coverLetter.importedContact"))
      } catch {
        toast.error(t("common.error"))
      }
    })()
  }

  const handleDocx = async () => {
    setSavingDocx(true)
    const result = await saveCoverLetterDocx(document, document.name || "cover-letter")
    setSavingDocx(false)
    if (result === "saved") {
      toast.success(t("export.docxDone"))
    } else if (result === "error") {
      toast.error(t("export.docxError"))
    }
  }

  const handlePdf = async () => {
    if (!isTauri) {
      navigate(`/print/cover-letter/${document.id}`)
      return
    }
    setSavingPdf(true)
    const result = await exportPdfFile(
      document,
      document.name || "cover-letter",
      "cover-letter",
      "a4",
    )
    setSavingPdf(false)
    if (result.status === "saved") {
      toast.success(t("export.pdfDone"))
    } else if (result.status === "error") {
      toast.error(t("export.pdfError"), { description: result.message })
    }
  }

  return (
    <div className="flex h-full flex-col" dir={document.direction}>
      <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 lg:px-6">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-lg font-semibold">{document.name}</span>
          <span className="text-xs text-muted-foreground">
            {t("dashboard.coverLetterBadge")} · {document.locale.toUpperCase()}
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
            variant={previewOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPreviewOpen((v) => !v)}
            aria-label={t("preview.title")}
            aria-pressed={previewOpen}
          >
            <EyeIcon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("preview.title")}</span>
          </Button>
          {isTauri ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handlePdf()}
              disabled={savingPdf}
              aria-label={t("export.pdfDownload")}
            >
              {savingPdf ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <DownloadIcon className="size-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{t("export.pdfDownload")}</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/print/cover-letter/${document.id}`)}
              aria-label={t("export.pdf")}
            >
              <PrinterIcon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("export.pdf")}</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => void handleDocx()}
            disabled={savingDocx}
            aria-label={t("export.docx")}
          >
            <DownloadIcon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("export.docx")}</span>
          </Button>
          <SaveStatus status={status} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <ScrollArea className="min-h-0 min-w-0 flex-1">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 lg:p-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">{t("coverLetter.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("coverLetter.subtitle")}</p>
            </div>

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{t("coverLetter.sender")}</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={t("coverLetter.fullName")}
                  value={document.sender.fullName}
                  onChange={(v) => setSender("fullName", v)}
                  name="sender-name"
                  autoComplete="name"
                />
                <Field
                  label={t("coverLetter.email")}
                  value={document.sender.email}
                  onChange={(v) => setSender("email", v)}
                  type="email"
                  name="sender-email"
                  autoComplete="email"
                />
                <Field
                  label={t("coverLetter.phone")}
                  value={document.sender.phone}
                  onChange={(v) => setSender("phone", v)}
                  type="tel"
                  name="sender-phone"
                  autoComplete="tel"
                />
                <Field
                  label={t("coverLetter.location")}
                  value={document.sender.location}
                  onChange={(v) => setSender("location", v)}
                  name="sender-location"
                  autoComplete="address-level1"
                />
              </div>
              {cvList.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select value="" onValueChange={importFromCv}>
                    <SelectTrigger className="w-64" aria-label={t("coverLetter.importFromCv")}>
                      <SelectValue placeholder={t("coverLetter.importFromCv")} />
                    </SelectTrigger>
                    <SelectContent>
                      {cvList.map((meta) => (
                        <SelectItem key={meta.id} value={meta.id}>
                          {meta.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <UserRoundPlusIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{t("coverLetter.recipient")}</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={t("coverLetter.recipientName")}
                  value={document.recipient.name ?? ""}
                  onChange={(v) => setRecipient("name", v)}
                />
                <Field
                  label={t("coverLetter.recipientCompany")}
                  value={document.recipient.company ?? ""}
                  onChange={(v) => setRecipient("company", v)}
                />
                <Field
                  label={t("coverLetter.recipientPosition")}
                  value={document.recipient.position ?? ""}
                  onChange={(v) => setRecipient("position", v)}
                />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">{t("coverLetter.content")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={t("coverLetter.date")}
                  value={document.date}
                  onChange={(v) => set("date", v)}
                  placeholder={new Date().toLocaleDateString()}
                />
              </div>
              <Field
                label={t("coverLetter.subject")}
                value={document.subject ?? ""}
                onChange={(v) => set("subject", v)}
              />
              <Field
                label={t("coverLetter.body")}
                value={document.body}
                onChange={(v) => set("body", v)}
                textarea
                rows={14}
                placeholder={t("coverLetter.bodyPlaceholder")}
              />
            </section>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileTextIcon className="size-3.5" aria-hidden="true" />
              {t("coverLetter.hint")}
            </div>
          </div>
        </ScrollArea>

        {previewOpen && (
          <Dialog open onOpenChange={(open) => !open && setPreviewOpen(false)}>
            <DialogContent
              showCloseButton={false}
              className="!max-w-none flex h-[92vh] max-h-[92vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden rounded-lg border p-0"
            >
              <DialogTitle className="sr-only">{t("preview.title")}</DialogTitle>
              <DialogDescription className="sr-only">{t("coverLetter.subtitle")}</DialogDescription>
              <CoverLetterPreview document={document} onClose={() => setPreviewOpen(false)} />
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
            <CoverLetterDesignPanel document={document} updateDocument={updateDocument} />
          </div>
        </ResizableSheetContent>
      </Sheet>
    </div>
  )
}
