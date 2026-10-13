import type { CoverLetterDocument, CoverLetterTemplateSettings } from "@ats/core"
import { COVER_LETTER_TEMPLATES, FONT_IDS } from "@ats/templates"
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ats/ui"
import { CheckIcon, PaletteIcon, RotateCcwIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { CoverLetterLocale } from "@ats/templates"

function uiLocale(language: string | undefined): CoverLetterLocale {
  const code = language?.slice(0, 2)
  return code === "fr" || code === "ar" ? code : "en"
}

type UpdateDocument = (updater: (doc: CoverLetterDocument) => CoverLetterDocument) => void

export interface CoverLetterDesignPanelProps {
  document: CoverLetterDocument
  updateDocument: UpdateDocument
}

export function CoverLetterDesignPanel({ document, updateDocument }: CoverLetterDesignPanelProps) {
  const { t, i18n } = useTranslation()
  const locale = uiLocale(i18n.language)
  const settings = document.templateSettings

  const setField = <K extends keyof CoverLetterTemplateSettings>(
    key: K,
    value: CoverLetterTemplateSettings[K],
  ) => {
    updateDocument((d) =>
      d.templateSettings[key] === value
        ? d
        : { ...d, templateSettings: { ...d.templateSettings, [key]: value } },
    )
  }

  const setTemplate = (templateId: string) => {
    updateDocument((d) => (d.templateId === templateId ? d : { ...d, templateId }))
  }

  const resetDesign = () => {
    updateDocument((d) => ({
      ...d,
      templateSettings: { fontId: "arial", marginPreset: "standard", spacingDensity: "standard" },
    }))
  }

  const densityOptions = ["compact", "standard", "comfortable"] as const

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <PaletteIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium">{t("editor.design")}</span>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">{t("coverLetter.template")}</Label>
        <div className="flex flex-col gap-1.5">
          {COVER_LETTER_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setTemplate(template.id)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                document.templateId === template.id
                  ? "border-primary/50 bg-primary/5"
                  : "bg-card hover:bg-accent"
              }`}
              aria-pressed={document.templateId === template.id}
            >
              <span>{template.name[locale]}</span>
              {document.templateId === template.id && (
                <CheckIcon className="size-4 text-primary" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground" htmlFor="cl-font">
          {t("editor.font")}
        </Label>
        <Select value={settings.fontId} onValueChange={(v) => setField("fontId", v)}>
          <SelectTrigger id="cl-font" size="sm" aria-label={t("editor.font")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_IDS.map((fontId) => (
              <SelectItem key={fontId} value={fontId}>
                {fontId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground" htmlFor="cl-margin">
          {t("editor.margin")}
        </Label>
        <Select
          value={settings.marginPreset}
          onValueChange={(v) =>
            setField("marginPreset", v as CoverLetterTemplateSettings["marginPreset"])
          }
        >
          <SelectTrigger id="cl-margin" size="sm" aria-label={t("editor.margin")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {densityOptions.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`editor.density.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground" htmlFor="cl-spacing">
          {t("editor.spacing")}
        </Label>
        <Select
          value={settings.spacingDensity}
          onValueChange={(v) =>
            setField("spacingDensity", v as CoverLetterTemplateSettings["spacingDensity"])
          }
        >
          <SelectTrigger id="cl-spacing" size="sm" aria-label={t("editor.spacing")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {densityOptions.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`editor.density.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" className="justify-start" onClick={resetDesign}>
        <RotateCcwIcon className="size-4" aria-hidden="true" />
        {t("editor.resetDesign")}
      </Button>
    </div>
  )
}
