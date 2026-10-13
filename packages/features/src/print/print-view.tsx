import {
  printPageRule,
  resolveCoverLetterTemplate,
  resolveTemplate,
  type TemplateSettings,
} from "@ats/templates"
import { Button } from "@ats/ui"
import { ArrowLeftIcon, FileTextIcon, Loader2Icon, PrinterIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { useDocument } from "../persistence/use-document"

// Lifecycle trace for the desktop PDF export handshake. The hidden export
// window forwards these to the backend log (see export_pdf in lib.rs), so a
// stuck export leaves a trail showing exactly which stage never ran.
// Fire-and-forget and silent outside Tauri (browser build).
function tracePrintStage(stage: string, detail = "") {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return
  import("@tauri-apps/api/event")
    .then(({ emit }) => emit("print-view-trace", { stage, detail }))
    .catch(() => undefined)
}

export function PrintView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { documentId } = useParams<{ documentId?: string }>()
  const { document, status } = useDocument(documentId)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(-1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [navigate])

  // Trace mount + document-load progress so a stuck export shows in the
  // backend log exactly where the hidden window stopped (route boot, storage
  // read, or the ready handshake below).
  useEffect(() => {
    tracePrintStage("route-mounted", documentId ?? "")
  }, [documentId])
  useEffect(() => {
    tracePrintStage(`status:${status}`, documentId ?? "")
  }, [status, documentId])

  // Signal the hidden desktop export window that the printable page is
  // ready. The backend closes the window right after printing, so the
  // handshake must survive a missed first event: webfont loading is bounded
  // (a stalled font must not block the export forever) and the signal is
  // retried until it goes through or the window unmounts.
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return
    if (status === "loading" || !document) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const fontsSettled = Promise.race([
      window.document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ])
    const sendReady = (attemptsLeft: number) => {
      if (cancelled || attemptsLeft <= 0) return
      import("@tauri-apps/api/event")
        .then(({ emit }) => emit("print-view-ready"))
        .then(
          () => tracePrintStage("ready-sent", `${5 - attemptsLeft + 1}/5`),
          (error: unknown) => {
            window.console.error("[print-view] ready signal failed:", error)
            tracePrintStage("ready-failed", error instanceof Error ? error.message : String(error))
            timer = setTimeout(() => sendReady(attemptsLeft - 1), 1500)
          },
        )
    }
    void fontsSettled.then(() => {
      if (!cancelled) tracePrintStage("fonts-settled")
      sendReady(5)
    })
    return () => {
      cancelled = true
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [status, document])

  // The PDF's Title metadata is the page title: name the CV rather than the app.
  useEffect(() => {
    if (!document) return
    const previous = globalThis.document.title
    globalThis.document.title =
      document.type === "cv" && document.contact.fullName
        ? `${document.contact.fullName} - CV`
        : document.name
    return () => {
      globalThis.document.title = previous
    }
  }, [document])

  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <Loader2Icon className="size-6 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-white text-center">
        <FileTextIcon className="size-10 text-slate-300" aria-hidden="true" />
        <p className="text-sm text-slate-500">{t("print.notFound")}</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeftIcon aria-hidden="true" />
          {t("nav.dashboard")}
        </Button>
      </div>
    )
  }

  const pageSize = document.type === "cv" ? document.pageSettings.size.toLowerCase() : "a4"

  const handlePrint = () => {
    setPrinting(true)
    window.setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 100)
  }

  return (
    <div dir={document.direction} className="min-h-screen bg-white print:bg-white">
      <style>
        {printPageRule(
          pageSize,
          document.type,
          document.type === "cv" ? document.templateSettings.marginPreset : undefined,
        )}
      </style>
      <div className="no-print sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          aria-label={t("print.back")}
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {t("print.back")}
        </button>
        <span className="truncate text-sm font-semibold">{document.name}</span>
        <Button onClick={handlePrint} disabled={printing} aria-label={t("print.print")}>
          <PrinterIcon className="size-4" aria-hidden="true" />
          {t("print.print")}
        </Button>
      </div>
      <div className="flex justify-center py-8 print:block print:py-0">
        {document.type === "cv" ? (
          resolveTemplate(document.templateId).render({
            document,
            settings: document.templateSettings as TemplateSettings,
            locale: document.locale,
            direction: document.direction,
            mode: "print",
          })
        ) : (
          <div className="px-4 print:px-0">
            {resolveCoverLetterTemplate(document.templateId).render(document)}
          </div>
        )}
      </div>
    </div>
  )
}
