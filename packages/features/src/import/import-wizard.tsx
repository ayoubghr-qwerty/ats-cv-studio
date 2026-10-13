import type { SectionType, StoredDocument } from "@ats/core"
import { parseStoredDocumentValue } from "@ats/core"
import type { DraftCv, DraftEntry } from "@ats/importers"
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@ats/ui"
import { AlertTriangleIcon, FileTextIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useDocuments, useStorage } from "../persistence"
import { pickImportFile, type ImportFileKind } from "./import-actions"

type Step = "choose" | "parsing" | "review"

const SECTION_LABEL_KEY: Record<SectionType, string> = {
  summary: "import.section.summary",
  experience: "import.section.experience",
  education: "import.section.education",
  skills: "import.section.skills",
  softSkills: "import.section.softSkills",
  projects: "import.section.projects",
  certifications: "import.section.certifications",
  languages: "import.section.languages",
  awards: "import.section.awards",
  volunteering: "import.section.volunteering",
  publications: "import.section.publications",
  courses: "import.section.courses",
}

export function ImportPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const storage = useStorage()
  const docs = useDocuments()
  const [step, setStep] = useState<Step>("choose")
  const [fileName, setFileName] = useState("")
  const [draft, setDraft] = useState<DraftCv | null>(null)
  const [unmappedTargets, setUnmappedTargets] = useState<Record<number, SectionType | "">>({})
  const [locale, setLocale] = useState<"en" | "fr" | "ar">(() => {
    const resolved = i18n.resolvedLanguage ?? "en"
    return resolved === "fr" || resolved === "ar" ? resolved : "en"
  })
  const [importing, setImporting] = useState(false)

  const handlePicked = async (kind: ImportFileKind) => {
    const picked = await pickImportFile(kind)
    if (!picked) return
    setFileName(picked.name)
    setStep("parsing")
    try {
      if (kind === "pdf") {
        const { parsePdf } = await import("@ats/importers")
        const items = await parsePdf(picked.data)
        const { pdfToDraft } = await import("@ats/importers")
        setDraft(pdfToDraft(items))
      } else if (kind === "docx") {
        const { parseDocx, paragraphsToDraft } = await import("@ats/importers")
        const paragraphs = await parseDocx(picked.data)
        setDraft(paragraphsToDraft(paragraphs))
      } else {
        const text = new TextDecoder().decode(picked.data)
        const parsed: unknown = JSON.parse(text)
        const doc = await parseJsonDocument(parsed)
        if (doc) {
          await saveImportedDocument(doc)
          return
        }
      }
      setStep("review")
    } catch {
      setStep("choose")
      toast.error(t("import.parseError"))
    }
  }

  const parseJsonDocument = async (value: unknown): Promise<StoredDocument | null> => {
    try {
      const doc = parseStoredDocumentValue(value)
      const existing = docs.documents?.some((meta) => meta.id === doc.id) ?? false
      if (existing) {
        const { newId } = await import("@ats/core")
        return { ...doc, id: newId("cv"), updatedAt: new Date().toISOString() }
      }
      return doc
    } catch {
      const result = await docs.importWorkspace(JSON.stringify(value))
      toast.success(t("dashboard.importSuccess", { count: result.imported }))
      navigate("/")
      return null
    }
  }

  const saveImportedDocument = async (doc: StoredDocument) => {
    setImporting(true)
    try {
      await storage.saveDocument(doc)
      await docs.refresh()
      toast.success(t("import.done"))
      navigate(`/editor/${doc.id}`)
    } catch {
      toast.error(t("common.saveError"))
    } finally {
      setImporting(false)
    }
  }

  const confirmImport = async () => {
    if (!draft) return
    const { draftToCv } = await import("@ats/importers")
    const cv = draftToCv(draft, locale, draft.contact.fullName)
    await saveImportedDocument(cv)
  }

  const updateContact = (field: keyof DraftCv["contact"], value: string) => {
    setDraft((prev) => (prev ? { ...prev, contact: { ...prev.contact, [field]: value } } : prev))
  }

  const updateEntry = (sectionIndex: number, entryIndex: number, patch: Partial<DraftEntry>) => {
    setDraft((prev) => {
      if (!prev) return prev
      const sections = [...prev.sections]
      const entries = [...sections[sectionIndex].entries]
      entries[entryIndex] = { ...entries[entryIndex], ...patch }
      sections[sectionIndex] = { ...sections[sectionIndex], entries }
      return { ...prev, sections }
    })
  }

  const removeEntry = (sectionIndex: number, entryIndex: number) => {
    setDraft((prev) => {
      if (!prev) return prev
      const sections = [...prev.sections]
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        entries: sections[sectionIndex].entries.filter((_, i) => i !== entryIndex),
      }
      return { ...prev, sections }
    })
  }

  const assignUnmapped = async (lineIndex: number, target: string) => {
    const sectionType = unmappedTargets[lineIndex]
    if (!sectionType || !draft) return
    const { assignUnmappedLine } = await import("@ats/importers/editing")
    const entryIndex = target === "__new__" ? null : Number(target)
    setDraft((prev) => (prev ? assignUnmappedLine(prev, lineIndex, sectionType, entryIndex) : prev))
    setUnmappedTargets((prev) => {
      const next = { ...prev }
      delete next[lineIndex]
      return next
    })
  }

  const allSections = (Object.keys(SECTION_LABEL_KEY) as SectionType[]).map((type) => ({
    type,
    label: t(SECTION_LABEL_KEY[type]),
  }))

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-6 overflow-y-auto p-6 lg:p-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("import.title")}</h1>
        <p className="text-muted-foreground">{t("import.subtitle")}</p>
      </div>

      {step === "choose" && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {(["pdf", "docx", "json"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => void handlePicked(kind)}
                className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-colors hover:border-ring/40"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <UploadIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium">{t(`import.${kind}`)}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t("import.hint")}</p>
        </div>
      )}

      {step === "parsing" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-12 text-center">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t("import.parsing", { file: fileName })}</p>
        </div>
      )}

      {step === "review" && draft && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileTextIcon className="size-4" aria-hidden="true" />
              <span className="truncate">{fileName}</span>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("import.language")}</span>
              <Select value={locale} onValueChange={(v) => setLocale(v as "en" | "fr" | "ar")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          {draft.warnings.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangleIcon className="size-4 shrink-0" aria-hidden="true" />
              <span>{draft.warnings.map((w) => t(w)).join(" ")}</span>
            </div>
          )}

          <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold">{t("import.contact")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["fullName", "import.contactFullName"],
                  ["jobTitle", "import.contactJobTitle"],
                  ["email", "import.contactEmail"],
                  ["phone", "import.contactPhone"],
                  ["location", "import.contactLocation"],
                ] as const
              ).map(([field, labelKey]) => (
                <label key={field} className="flex flex-col gap-1 text-sm">
                  <span className="text-muted-foreground">{t(labelKey)}</span>
                  <Input
                    value={draft.contact[field]}
                    onChange={(e) => updateContact(field, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </section>

          {draft.sections.map((section, sectionIndex) => (
            <section
              key={section.type}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4"
            >
              <h2 className="text-sm font-semibold">{t(SECTION_LABEL_KEY[section.type])}</h2>
              {section.entries.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("import.emptySection")}</p>
              )}
              {section.entries.map((entry, entryIndex) => (
                <div key={entryIndex} className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-muted-foreground">{t("import.entryTitle")}</span>
                        <Input
                          value={entry.title}
                          onChange={(e) =>
                            updateEntry(sectionIndex, entryIndex, { title: e.target.value })
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-muted-foreground">{t("import.entryMeta")}</span>
                        <Input
                          value={entry.meta}
                          onChange={(e) =>
                            updateEntry(sectionIndex, entryIndex, { meta: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeEntry(sectionIndex, entryIndex)}
                      aria-label={t("common.delete")}
                    >
                      <Trash2Icon className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">{t("import.entryLines")}</span>
                    <Textarea
                      rows={Math.min(4, Math.max(1, entry.lines.length))}
                      value={entry.lines.join("\n")}
                      onChange={(e) =>
                        updateEntry(sectionIndex, entryIndex, {
                          lines: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                        })
                      }
                    />
                  </label>
                </div>
              ))}
            </section>
          ))}

          {draft.unmapped.length > 0 && (
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <h2 className="text-sm font-semibold">{t("import.unmapped")}</h2>
              <p className="text-xs text-muted-foreground">{t("import.unmappedHint")}</p>
              <div className="flex flex-col gap-2">
                {draft.unmapped.map((line, lineIndex) => {
                  const target = unmappedTargets[lineIndex] ?? ""
                  const section = target ? draft.sections.find((s) => s.type === target) : undefined
                  return (
                    <div key={lineIndex} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">{line}</span>
                      <Select
                        value={target}
                        onValueChange={(v) =>
                          setUnmappedTargets((prev) => ({ ...prev, [lineIndex]: v as SectionType }))
                        }
                      >
                        <SelectTrigger className="w-44" aria-label={t("import.assignTo")}>
                          <SelectValue placeholder={t("import.assignTo")} />
                        </SelectTrigger>
                        <SelectContent>
                          {allSections.map((s) => (
                            <SelectItem key={s.type} value={s.type}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value=""
                        disabled={!target}
                        onValueChange={(v) => void assignUnmapped(lineIndex, v)}
                      >
                        <SelectTrigger className="w-56" aria-label={t("import.assignEntry")}>
                          <SelectValue placeholder={t("import.assignEntry")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__new__">{t("import.newEntry")}</SelectItem>
                          {section?.entries.map((entry, entryIndex) => (
                            <SelectItem key={entryIndex} value={String(entryIndex)}>
                              {entry.title || t("import.untitledEntry")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <div className="flex justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep("choose")}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void confirmImport()} disabled={importing}>
              {importing ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileTextIcon className="size-4" aria-hidden="true" />
              )}
              {t("import.confirm")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
