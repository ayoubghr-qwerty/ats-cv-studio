import type { CvDocument } from "@ats/core"
import { getTemplate } from "@ats/templates"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ats/ui"
import { FileDownIcon, FileTextIcon, Loader2Icon, PrinterIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { exportDocxFile, exportPdfFile, sanitizeFileName } from "./export-actions"

export interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: CvDocument
  onPrint: () => void
}

export function ExportModal({ open, onOpenChange, document, onPrint }: ExportModalProps) {
  const { t, i18n } = useTranslation()
  const [exporting, setExporting] = useState(false)
  const [fileName, setFileName] = useState(() => sanitizeFileName(document.name))
  const locale = (
    i18n.language?.slice(0, 2) === "fr" || i18n.language?.slice(0, 2) === "ar"
      ? i18n.language.slice(0, 2)
      : "en"
  ) as "en" | "fr" | "ar"
  const template = getTemplate(document.templateId)
  const warnings: string[] = []
  if (!document.contact.fullName.trim()) warnings.push(t("export.warnings.noName"))
  if (document.sections.filter((s) => s.enabled && s.items.length > 0).length === 0) {
    warnings.push(t("export.warnings.empty"))
  }

  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

  const handleDocx = async () => {
    setExporting(true)
    const result = await exportDocxFile(document, fileName.trim() || "cv")
    setExporting(false)
    if (result === "saved") {
      toast.success(t("export.docxDone"))
      onOpenChange(false)
    } else if (result === "error") {
      toast.error(t("export.docxError"))
    }
  }

  const handlePdf = async () => {
    if (!isTauri) {
      onPrint()
      return
    }
    setExporting(true)
    const result = await exportPdfFile(
      document,
      fileName.trim() || "cv",
      "cv",
      document.pageSettings.size.toLowerCase(),
    )
    setExporting(false)
    if (result.status === "saved") {
      toast.success(t("export.pdfDone"))
      onOpenChange(false)
    } else if (result.status === "error") {
      toast.error(t("export.pdfError"), { description: result.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("export.title")}</DialogTitle>
          <DialogDescription>{t("export.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("export.language")}</span>
              <span className="font-medium uppercase">{document.locale}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("export.template")}</span>
              <span className="font-medium">
                {template ? template.name[locale] : document.templateId}
              </span>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t("export.fileName")}</span>
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              aria-label={t("export.fileName")}
            />
          </label>
          {warnings.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              {warnings.map((warning, i) => (
                <span key={i}>{warning}</span>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            {isTauri ? (
              <Button variant="outline" onClick={() => void handlePdf()} disabled={exporting}>
                {exporting ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileDownIcon className="size-4" aria-hidden="true" />
                )}
                {t("export.pdfDownload")}
              </Button>
            ) : (
              <Button variant="outline" onClick={onPrint}>
                <PrinterIcon className="size-4" aria-hidden="true" />
                {t("export.pdf")}
              </Button>
            )}
            <Button onClick={() => void handleDocx()} disabled={exporting}>
              {exporting ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileDownIcon className="size-4" aria-hidden="true" />
              )}
              {t("export.docx")}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileTextIcon className="size-3.5" aria-hidden="true" />
            {isTauri ? t("export.pdfHintDownload") : t("export.pdfHint")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
