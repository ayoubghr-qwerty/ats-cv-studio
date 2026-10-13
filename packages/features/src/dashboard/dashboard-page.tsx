import type { DocumentMeta } from "@ats/core"
import { duplicateAsVariant, formatRelativeDate, type CvLocale } from "@ats/core"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@ats/ui"
import {
  CopyIcon,
  CopyPlusIcon,
  DownloadIcon,
  FileTextIcon,
  FolderInputIcon,
  MailIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { downloadJson, safeFilename } from "../files"
import { useDocuments, useStorage } from "../persistence"

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const storage = useStorage()
  const docs = useDocuments()
  const [renaming, setRenaming] = useState<DocumentMeta | null>(null)
  const [deleting, setDeleting] = useState<DocumentMeta | null>(null)
  const [variantOf, setVariantOf] = useState<DocumentMeta | null>(null)
  const [variantName, setVariantName] = useState("")
  const [variantLocale, setVariantLocale] = useState<"en" | "fr" | "ar">(
    () => (i18n.resolvedLanguage as "en" | "fr" | "ar") ?? "en",
  )
  const [renameValue, setRenameValue] = useState("")

  const locale = (i18n.resolvedLanguage ?? "en") as CvLocale

  const openRename = (doc: DocumentMeta) => {
    setRenaming(doc)
    setRenameValue(doc.name)
  }

  const confirmRename = async () => {
    if (!renaming || !renameValue.trim()) return
    try {
      await docs.rename(renaming.id, renameValue.trim())
      toast.success(t("common.renamed"))
      setRenaming(null)
    } catch {
      toast.error(t("common.saveError"))
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await docs.remove(deleting.id)
      toast.success(t("common.deleted"))
      setDeleting(null)
    } catch {
      toast.error(t("common.error"))
    }
  }

  const createCv = async () => {
    try {
      const doc = await docs.createCv(locale)
      navigate(`/editor/${doc.id}`)
    } catch {
      toast.error(t("common.error"))
    }
  }

  const createCoverLetter = async () => {
    try {
      const doc = await docs.createCoverLetter(locale)
      navigate(`/editor/${doc.id}`)
    } catch {
      toast.error(t("common.error"))
    }
  }

  const duplicate = async (doc: DocumentMeta) => {
    try {
      await docs.duplicate(doc.id)
      toast.success(t("common.duplicated"))
    } catch {
      toast.error(t("common.error"))
    }
  }

  const openVariant = (doc: DocumentMeta) => {
    setVariantOf(doc)
    setVariantName(`${doc.name} (Variant)`)
  }

  const confirmVariant = async () => {
    if (!variantOf) return
    try {
      const full = await storage.getDocument(variantOf.id)
      if (!full) throw new Error("missing")
      const variant = duplicateAsVariant(full, { name: variantName, locale: variantLocale })
      await storage.saveDocument(variant)
      await docs.refresh()
      toast.success(t("common.saved"))
      setVariantOf(null)
    } catch {
      toast.error(t("common.error"))
    }
  }

  const exportSingle = async (doc: DocumentMeta) => {
    try {
      const full = await storage.getDocument(doc.id)
      if (!full) throw new Error("missing")
      downloadJson(`${safeFilename(doc.name)}.json`, JSON.stringify(full, null, 2))
    } catch {
      toast.error(t("dashboard.exportError"))
    }
  }

  const exportWorkspace = async () => {
    try {
      const json = await docs.exportWorkspace()
      downloadJson("workspace.json", json)
    } catch {
      toast.error(t("dashboard.exportError"))
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-6 lg:p-10">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={createCv}>
              <PlusIcon aria-hidden="true" />
              {t("dashboard.newCv")}
            </Button>
            <Button variant="outline" onClick={createCoverLetter}>
              <MailIcon aria-hidden="true" />
              {t("dashboard.newCoverLetter")}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/import")}>
              <FolderInputIcon aria-hidden="true" />
              {t("dashboard.import")}
            </Button>
            <Button variant="ghost" onClick={exportWorkspace}>
              <DownloadIcon aria-hidden="true" />
              {t("dashboard.exportWorkspace")}
            </Button>
          </div>
        </section>

        {docs.documents === null ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : docs.documents.length === 0 ? (
          <section className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <FileTextIcon className="size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{t("dashboard.emptyTitle")}</h2>
              <p className="max-w-sm text-sm text-muted-foreground">{t("dashboard.emptyText")}</p>
            </div>
            <Button onClick={createCv}>
              <PlusIcon aria-hidden="true" />
              {t("dashboard.createFirst")}
            </Button>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {docs.documents.map((doc) => (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/editor/${doc.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    navigate(`/editor/${doc.id}`)
                  }
                }}
                className="group flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-ring/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {doc.type === "cv" ? (
                        <FileTextIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <MailIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {doc.type === "cv"
                          ? t("dashboard.cvBadge")
                          : t("dashboard.coverLetterBadge")}
                        {" · "}
                        {t("dashboard.updatedAt")}: {formatRelativeDate(doc.updatedAt, locale)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-60 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontalIcon aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem onSelect={() => navigate(`/editor/${doc.id}`)}>
                        <FileTextIcon aria-hidden="true" />
                        {t("common.open")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openRename(doc)}>
                        <PencilIcon aria-hidden="true" />
                        {t("common.rename")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => duplicate(doc)}>
                        <CopyIcon aria-hidden="true" />
                        {t("common.duplicate")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openVariant(doc)}>
                        <CopyPlusIcon aria-hidden="true" />
                        {t("dashboard.duplicateVariant")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => exportSingle(doc)}>
                        <DownloadIcon aria-hidden="true" />
                        {t("dashboard.exportJson")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(doc)}>
                        <Trash2Icon aria-hidden="true" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.renameTitle")}</DialogTitle>
            <DialogDescription>{t("dashboard.renameLabel")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rename-input">{t("dashboard.renameLabel")}</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={confirmRename}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.deleteDescription", { name: deleting?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={variantOf !== null} onOpenChange={(open) => !open && setVariantOf(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.variantTitle")}</DialogTitle>
            <DialogDescription>{t("dashboard.variantDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">{t("dashboard.variantName")}</span>
              <Input
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmVariant()}
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">{t("dashboard.variantLocale")}</span>
              <Select
                value={variantLocale}
                onValueChange={(v) => setVariantLocale(v as "en" | "fr" | "ar")}
              >
                <SelectTrigger>
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
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVariantOf(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void confirmVariant()} disabled={!variantName.trim()}>
              <CopyPlusIcon aria-hidden="true" />
              {t("dashboard.duplicate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
