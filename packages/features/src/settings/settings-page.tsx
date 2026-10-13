import type { Language } from "@ats/i18n"
import { isSupportedLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from "@ats/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ats/ui"
import {
  DownloadIcon,
  FolderInputIcon,
  LanguagesIcon,
  MonitorIcon,
  MoonIcon,
  PanelLeftIcon,
  PanelRightIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { downloadJson, pickJsonFile } from "../files"
import { useDesignPanelStore } from "../editor/design-panel-position"
import { useDocuments, useStorage } from "../persistence"
import { useTheme } from "../theme"

const THEME_OPTIONS = [
  { value: "light", label: "theme.light", icon: SunIcon },
  { value: "dark", label: "theme.dark", icon: MoonIcon },
  { value: "system", label: "theme.system", icon: MonitorIcon },
] as const

const PANEL_SIDE_OPTIONS = [
  { value: "left", label: "settings.panelSideLeft", icon: PanelLeftIcon },
  { value: "right", label: "settings.panelSideRight", icon: PanelRightIcon },
] as const

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const docs = useDocuments()
  const storage = useStorage()
  const designSide = useDesignPanelStore((s) => s.side)
  const setDesignSide = useDesignPanelStore((s) => s.setSide)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const currentLanguage = isSupportedLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : "en"

  const changeLanguage = (lng: Language) => {
    void i18n.changeLanguage(lng)
  }

  const exportWorkspace = async () => {
    try {
      const json = await docs.exportWorkspace()
      downloadJson("workspace.json", json)
    } catch {
      toast.error(t("dashboard.exportError"))
    }
  }

  const importWorkspace = async () => {
    try {
      const json = await pickJsonFile()
      const result = await docs.importWorkspace(json)
      if (result.imported > 0)
        toast.success(t("dashboard.importSuccess", { count: result.imported }))
      if (result.skipped.length > 0) {
        toast.info(t("dashboard.importSkipped", { count: result.skipped.length }))
      }
    } catch {
      toast.error(t("dashboard.importError"))
    }
  }

  const clearAll = async () => {
    if (busy) return
    setBusy(true)
    try {
      const list = await storage.listDocuments()
      for (const doc of list) {
        await storage.deleteDocument(doc.id)
      }
      await docs.refresh()
      toast.success(t("settings.clearAllSuccess"))
    } catch {
      toast.error(t("common.error"))
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  const docCount = docs.documents?.length ?? 0

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-6 lg:p-10">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground">{t("settings.subtitle")}</p>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{t("settings.appearanceTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.appearanceDescription")}</p>
          </div>
          <div className="flex items-center gap-4">
            <Label className="min-w-32">{t("settings.themeLabel")}</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as typeof theme)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <Icon />
                    {t(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{t("settings.languageTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.languageDescription")}</p>
          </div>
          <div className="flex items-center gap-4">
            <Label className="min-w-32">{t("settings.languageLabel")}</Label>
            <Select value={currentLanguage} onValueChange={(v) => changeLanguage(v as Language)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lng) => (
                  <SelectItem key={lng} value={lng}>
                    <LanguagesIcon aria-hidden="true" />
                    {LANGUAGE_NAMES[lng]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{t("settings.editorTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.editorDescription")}</p>
          </div>
          <div className="flex items-center gap-4">
            <Label className="min-w-32">{t("settings.panelSideLabel")}</Label>
            <Select value={designSide} onValueChange={(v) => setDesignSide(v as typeof designSide)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PANEL_SIDE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <Icon aria-hidden="true" />
                    {t(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{t("settings.dataTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.dataDescription")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => void exportWorkspace()}
            >
              <DownloadIcon aria-hidden="true" />
              {t("settings.exportLabel")}
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => void importWorkspace()}
            >
              <FolderInputIcon aria-hidden="true" />
              {t("settings.importLabel")}
            </Button>
            <Button
              variant="destructive"
              className="justify-start"
              disabled={docCount === 0 || busy}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2Icon aria-hidden="true" />
              {t("settings.clearAllLabel")}
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => !open && setConfirmOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("settings.clearAllTitle")}</DialogTitle>
            <DialogDescription>
              {t("settings.clearAllDescription", { count: docCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => void clearAll()}>
              <Trash2Icon aria-hidden="true" />
              {t("settings.clearAllConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
