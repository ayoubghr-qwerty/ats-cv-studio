import { setTemplateId } from "@ats/core"
import { mergeTemplateSettings, sampleEn, TEMPLATES, type TemplateEntry } from "@ats/templates"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@ats/ui"
import { Button, ScrollArea } from "@ats/ui"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useDocuments } from "../persistence"
import { useStorage } from "../persistence"
import { TemplateThumb } from "./template-thumb"

const FAMILIES = [
  "classic",
  "minimal",
  "modern",
  "executive",
  "technical",
  "headline",
  "compact",
  "focus",
  "functional",
  "professional",
] as const

function uiLocale(language: string | undefined): "en" | "fr" | "ar" {
  const code = language?.slice(0, 2)
  return code === "fr" || code === "ar" ? code : "en"
}

export function TemplateGallery() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const storage = useStorage()
  const docs = useDocuments()
  const locale = uiLocale(i18n.language)
  const [family, setFamily] = useState<string>("all")
  const [selected, setSelected] = useState<TemplateEntry | null>(null)
  const [targetId, setTargetId] = useState<string>("")
  const [applying, setApplying] = useState(false)

  const cvs = useMemo(() => (docs.documents ?? []).filter((d) => d.type === "cv"), [docs.documents])
  const sample = useMemo(() => sampleEn(), [])

  const filtered = useMemo(
    () => (family === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.family === family)),
    [family],
  )

  const openApply = useCallback(
    (entry: TemplateEntry) => {
      setSelected(entry)
      const originId = (location.state as { docId?: string } | null)?.docId
      setTargetId(originId && cvs.some((meta) => meta.id === originId) ? originId : "")
    },
    [cvs, location.state],
  )

  const applyTemplate = useCallback(async () => {
    if (!selected || !targetId) return
    setApplying(true)
    try {
      const doc = await storage.getDocument(targetId)
      if (!doc || doc.type !== "cv") throw new Error("CV not found")
      const next = {
        ...setTemplateId(doc, selected.id),
        templateSettings: mergeTemplateSettings(selected, doc.templateSettings),
        updatedAt: new Date().toISOString(),
      }
      await storage.saveDocument(next)
      await docs.refresh()
      setSelected(null)
      toast.success(t("templates.applied"))
      navigate(`/editor/${targetId}`)
    } catch {
      toast.error(t("templates.applyError"))
    } finally {
      setApplying(false)
    }
  }, [selected, targetId, storage, docs, navigate, t])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("templates.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("templates.subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          key="all"
          variant={family === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFamily("all")}
        >
          {t("templates.all")}
        </Button>
        {FAMILIES.map((f) => (
          <Button
            key={f}
            variant={family === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFamily(f)}
          >
            {t(`templates.families.${f}`)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => openApply(entry)}
            className="group flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={entry.name[locale]}
          >
            <TemplateThumb entry={entry} document={sample} className="w-full border-b" />
            <div className="flex flex-col gap-1.5 p-3">
              <span className="truncate text-sm font-medium">{entry.name[locale]}</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                  {t(`templates.families.${entry.family}`)}
                </span>
                <span className="ml-auto text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                  {t("templates.use")}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selected?.name[locale]}</DialogTitle>
            <DialogDescription>{selected?.description[locale]}</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[40vh] justify-center overflow-hidden rounded-lg border">
            {selected ? (
              <TemplateThumb entry={selected} document={sample} className="w-56" />
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t("templates.applyTo")}</p>
            {cvs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("templates.noCvs")}{" "}
                <button
                  type="button"
                  className="text-primary underline-offset-2 hover:underline"
                  onClick={() => navigate("/")}
                >
                  {t("templates.createCv")}
                </button>
              </p>
            ) : (
              <ScrollArea className="max-h-40 rounded-md border">
                <div className="flex flex-col gap-1 p-2">
                  {cvs.map((meta) => (
                    <button
                      key={meta.id}
                      type="button"
                      onClick={() => setTargetId(meta.id)}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                        targetId === meta.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      }`}
                    >
                      <span className="truncate">{meta.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                        {meta.updatedAt.slice(0, 10)}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
            <Button onClick={() => void applyTemplate()} disabled={applying || !targetId}>
              {applying ? t("common.saving") : t("templates.apply")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
