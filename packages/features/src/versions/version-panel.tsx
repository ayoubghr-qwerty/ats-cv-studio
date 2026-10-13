import type { CvDocument } from "@ats/core"
import { removeVersion, restoreVersion, snapshotDocument } from "@ats/core"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@ats/ui"
import { HistoryIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export interface VersionPanelProps {
  document: CvDocument
  open: boolean
  onOpenChange: (open: boolean) => void
  updateDocument: (updater: (doc: CvDocument) => CvDocument) => void
}

export function VersionPanel({ document, open, onOpenChange, updateDocument }: VersionPanelProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [restoring, setRestoring] = useState<string | null>(null)

  const createSnapshot = () => {
    const label = name.trim() || t("versions.defaultName")
    updateDocument((d) => snapshotDocument(d, label))
    setName("")
    toast.success(t("versions.created"))
  }

  const confirmRestore = () => {
    if (!restoring) return
    updateDocument((d) => restoreVersion(d, restoring))
    setRestoring(null)
    onOpenChange(false)
    toast.success(t("versions.restored"))
  }

  const deleteVersion = (versionId: string) => {
    updateDocument((d) => removeVersion(d, versionId))
    toast.success(t("common.saved"))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("versions.title")}</DialogTitle>
          <DialogDescription>{t("versions.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createSnapshot()}
              placeholder={t("versions.namePlaceholder")}
              aria-label={t("versions.namePlaceholder")}
            />
            <Button onClick={createSnapshot}>
              <HistoryIcon className="size-4" aria-hidden="true" />
              {t("versions.create")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {document.versions.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("versions.empty")}</p>
          )}
          {[...document.versions].reverse().map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">
                  {version.name || t("versions.untitled")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(version.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRestoring(version.id)}
                  aria-label={t("versions.restore")}
                >
                  <RotateCcwIcon className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("versions.restore")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteVersion(version.id)}
                  aria-label={t("common.delete")}
                >
                  <Trash2Icon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>

      <Dialog open={restoring !== null} onOpenChange={(open) => !open && setRestoring(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("versions.restoreTitle")}</DialogTitle>
            <DialogDescription>{t("versions.restoreDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRestoring(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={confirmRestore}>{t("versions.restore")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
