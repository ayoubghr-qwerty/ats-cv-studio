import { setTemplateSettingsField, type CvDocument } from "@ats/core"
import type { CvEditorStore } from "@ats/core"
import {
  FONT_IDS,
  getTemplate,
  type FontId,
  type TemplateCustomizationSchema,
} from "@ats/templates"
import { Button } from "@ats/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ats/ui"
import { PaletteIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

function uiLocale(language: string | undefined): "en" | "fr" | "ar" {
  const code = language?.slice(0, 2)
  return code === "fr" || code === "ar" ? code : "en"
}

export interface DesignPanelProps {
  document: CvDocument
  store: CvEditorStore
}

export function DesignPanel({ document, store }: DesignPanelProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = uiLocale(i18n.language)
  const template = getTemplate(document.templateId)
  const settings = document.templateSettings
  const customization = template?.customization

  const update = <K extends keyof CvDocument["templateSettings"]>(
    field: K,
    value: CvDocument["templateSettings"][K],
  ) => {
    store.mutate((d) => setTemplateSettingsField(d, field, value), "settings")
  }

  const fonts = FONT_IDS

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <PaletteIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium">{t("editor.design")}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">
          {template ? template.name[locale] : document.templateId}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/templates", { state: { docId: document.id } })}
        >
          {t("editor.changeTemplate")}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{t("editor.font")}</span>
          <Select
            value={settings.fontId}
            disabled={customization?.allowFontChange === false}
            onValueChange={(value) => update("fontId", value as FontId)}
          >
            <SelectTrigger size="sm" aria-label={t("editor.font")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((id) => (
                <SelectItem key={id} value={id}>
                  {t(`editor.fonts.${id}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(
          [
            ["marginPreset", t("editor.margin"), "density"],
            ["spacingDensity", t("editor.spacing"), "density"],
            ["headingStyle", t("editor.headingStyle"), "heading"],
            ["separatorStyle", t("editor.separator"), "separatorStyle"],
            ["contactAlignment", t("editor.contactAlignment"), "align"],
            ["bulletStyle", t("editor.bulletStyle"), "bullet"],
            ["listColumns", t("editor.listLayout"), "columns"],
            ["skillsLayout", t("editor.skillsLayoutLabel"), "skillsLayout"],
            ["languagesLayout", t("editor.languagesLayoutLabel"), "languagesLayout"],
            ["inlineSeparator", t("editor.inlineSeparatorLabel"), "inlineSeparator"],
            ["datePlacement", t("editor.datePlacementLabel"), "datePlacement"],
            ["accentColor", t("editor.accent"), "accentColor"],
          ] as const
        ).map(([field, label, group]) => {
          const options =
            group === "density"
              ? (["compact", "standard", "comfortable"] as const)
              : group === "heading"
                ? (["simple", "bold", "uppercase"] as const)
                : group === "separatorStyle"
                  ? (["none", "subtle", "ruled", "dashed"] as const)
                  : group === "bullet"
                    ? (["disc", "hyphen"] as const)
                    : group === "columns"
                      ? (["single", "two"] as const)
                      : group === "skillsLayout" || group === "languagesLayout"
                        ? (["list", "inline"] as const)
                        : group === "inlineSeparator"
                          ? (["comma", "bullet"] as const)
                          : group === "datePlacement"
                            ? (["auto", "inline", "right"] as const)
                            : group === "accentColor"
                              ? (["none", "navy", "teal", "burgundy", "forest"] as const)
                              : (["left", "center"] as const)
          return (
            <div key={field} className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Select
                value={
                  field === "datePlacement"
                    ? (settings.datePlacement ?? "auto")
                    : field === "inlineSeparator"
                      ? (settings.inlineSeparator ?? "comma")
                      : settings[field]
                }
                disabled={
                  customization?.[
                    `allow${field[0].toUpperCase()}${field.slice(1)}Change` as keyof TemplateCustomizationSchema
                  ] === false
                }
                onValueChange={(value) =>
                  update(
                    field,
                    (field === "datePlacement" && value === "auto"
                      ? undefined
                      : value) as CvDocument["templateSettings"][typeof field],
                  )
                }
              >
                <SelectTrigger size="sm" aria-label={label}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`editor.${group}.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
