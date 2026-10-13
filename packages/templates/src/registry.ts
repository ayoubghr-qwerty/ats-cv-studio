import type { TemplateDefinition, TemplateRenderFn, TemplateSettings } from "./types"
import { FAMILY_DESCRIPTIONS, FAMILY_NAMES, VARIANTS } from "./localization"
import { ClassicTemplate, classicDocxMapping } from "./families/classic"
import { CompactTemplate, compactDocxMapping } from "./families/compact"
import { ExecutiveTemplate, executiveDocxMapping } from "./families/executive"
import { FocusTemplate, focusDocxMapping } from "./families/focus"
import { FunctionalTemplate, functionalDocxMapping } from "./families/functional"
import { HeadlineTemplate, headlineDocxMapping } from "./families/headline"
import { MinimalTemplate, minimalDocxMapping } from "./families/minimal"
import { ModernTemplate, modernDocxMapping } from "./families/modern"
import { ProfessionalTemplate, professionalDocxMapping } from "./families/professional"
import { TechnicalTemplate, technicalDocxMapping } from "./families/technical"

export interface TemplateEntry extends TemplateDefinition {
  render: TemplateRenderFn
}

export const DEFAULT_CUSTOMIZATION = {
  allowFontChange: true,
  allowMarginChange: true,
  allowSpacingChange: true,
  allowHeadingStyleChange: true,
  allowSeparatorChange: true,
  allowContactAlignmentChange: true,
  allowBulletStyleChange: true,
} as const

interface VariantSpec {
  id: string
  family: TemplateEntry["family"]
  defaults: Omit<TemplateSettings, "bulletStyle">
  index: number
  applyLook?: boolean
}

function buildEntry(
  render: TemplateRenderFn,
  docxMapping: TemplateDefinition["docxMapping"],
  { id, family, defaults, index, applyLook }: VariantSpec,
): TemplateEntry {
  return {
    id,
    family,
    name: {
      en: `${FAMILY_NAMES.en[family]} ${VARIANTS.en[index]}`,
      fr: `${FAMILY_NAMES.fr[family]} ${VARIANTS.fr[index]}`,
      ar: `${FAMILY_NAMES.ar[family]} ${VARIANTS.ar[index]}`,
    },
    description: {
      en: FAMILY_DESCRIPTIONS.en[family],
      fr: FAMILY_DESCRIPTIONS.fr[family],
      ar: FAMILY_DESCRIPTIONS.ar[family],
    },
    locales: ["en", "fr", "ar"],
    defaults: { bulletStyle: "disc", ...defaults },
    customization: { ...DEFAULT_CUSTOMIZATION },
    docxMapping,
    thumbnail: "",
    sampleDataIds: ["en", "fr", "ar"],
    atsComplianceVersion: "1.0",
    ...(applyLook ? { applyLook } : {}),
    render,
  }
}

const VARIANTS_LIST: VariantSpec[] = [
  {
    id: "ats-classic-01",
    family: "classic",
    index: 0,
    defaults: {
      fontId: "arial",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-classic-02",
    family: "classic",
    index: 1,
    defaults: {
      fontId: "times",
      contactAlignment: "center",
      headingStyle: "simple",
      separatorStyle: "ruled",
      spacingDensity: "comfortable",
      listColumns: "single",
      marginPreset: "comfortable",
    },
  },
  {
    id: "ats-classic-03",
    family: "classic",
    index: 2,
    defaults: {
      fontId: "georgia",
      contactAlignment: "left",
      headingStyle: "uppercase",
      separatorStyle: "none",
      spacingDensity: "compact",
      listColumns: "single",
      marginPreset: "compact",
    },
  },
  {
    id: "ats-classic-04",
    family: "classic",
    index: 3,
    defaults: {
      fontId: "calibri",
      contactAlignment: "center",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "comfortable",
    },
  },
  {
    id: "ats-minimal-01",
    family: "minimal",
    index: 0,
    defaults: {
      fontId: "helvetica",
      contactAlignment: "left",
      headingStyle: "simple",
      separatorStyle: "none",
      spacingDensity: "comfortable",
      listColumns: "single",
      marginPreset: "comfortable",
    },
  },
  {
    id: "ats-minimal-02",
    family: "minimal",
    index: 1,
    defaults: {
      fontId: "verdana",
      contactAlignment: "center",
      headingStyle: "simple",
      separatorStyle: "none",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-minimal-03",
    family: "minimal",
    index: 2,
    defaults: {
      fontId: "calibri",
      contactAlignment: "left",
      headingStyle: "simple",
      separatorStyle: "none",
      spacingDensity: "compact",
      listColumns: "single",
      marginPreset: "compact",
    },
  },
  {
    id: "ats-minimal-04",
    family: "minimal",
    index: 3,
    defaults: {
      fontId: "georgia",
      contactAlignment: "center",
      headingStyle: "simple",
      separatorStyle: "none",
      spacingDensity: "comfortable",
      listColumns: "single",
      marginPreset: "comfortable",
    },
  },
  {
    id: "ats-modern-01",
    family: "modern",
    index: 0,
    defaults: {
      fontId: "calibri",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-modern-02",
    family: "modern",
    index: 1,
    defaults: {
      fontId: "arial",
      contactAlignment: "center",
      headingStyle: "uppercase",
      separatorStyle: "subtle",
      spacingDensity: "compact",
      listColumns: "single",
      marginPreset: "compact",
    },
  },
  {
    id: "ats-modern-03",
    family: "modern",
    index: 2,
    defaults: {
      fontId: "trebuchet",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "comfortable",
    },
  },
  {
    id: "ats-modern-04",
    family: "modern",
    index: 3,
    defaults: {
      fontId: "verdana",
      contactAlignment: "center",
      headingStyle: "simple",
      separatorStyle: "subtle",
      spacingDensity: "comfortable",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-executive-01",
    family: "executive",
    index: 0,
    defaults: {
      fontId: "georgia",
      contactAlignment: "center",
      headingStyle: "simple",
      separatorStyle: "ruled",
      spacingDensity: "comfortable",
      listColumns: "single",
      marginPreset: "comfortable",
    },
  },
  {
    id: "ats-executive-02",
    family: "executive",
    index: 1,
    defaults: {
      fontId: "times",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-executive-03",
    family: "executive",
    index: 2,
    defaults: {
      fontId: "calibri",
      contactAlignment: "center",
      headingStyle: "simple",
      separatorStyle: "none",
      spacingDensity: "comfortable",
      listColumns: "single",
      marginPreset: "comfortable",
    },
  },
  {
    id: "ats-executive-04",
    family: "executive",
    index: 3,
    defaults: {
      fontId: "arial",
      contactAlignment: "left",
      headingStyle: "uppercase",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-technical-01",
    family: "technical",
    index: 0,
    defaults: {
      fontId: "arial",
      contactAlignment: "left",
      headingStyle: "uppercase",
      separatorStyle: "none",
      spacingDensity: "compact",
      listColumns: "single",
      marginPreset: "compact",
    },
  },
  {
    id: "ats-technical-02",
    family: "technical",
    index: 1,
    defaults: {
      fontId: "verdana",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-technical-03",
    family: "technical",
    index: 2,
    defaults: {
      fontId: "calibri",
      contactAlignment: "left",
      headingStyle: "simple",
      separatorStyle: "none",
      spacingDensity: "compact",
      listColumns: "single",
      marginPreset: "compact",
    },
  },
  {
    id: "ats-technical-04",
    family: "technical",
    index: 3,
    defaults: {
      fontId: "tahoma",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "compact",
    },
  },
  {
    id: "ats-headline-01",
    family: "headline",
    index: 0,
    defaults: {
      fontId: "arial",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "ruled",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-headline-02",
    family: "headline",
    index: 1,
    defaults: {
      fontId: "calibri",
      contactAlignment: "center",
      headingStyle: "uppercase",
      separatorStyle: "ruled",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-headline-03",
    family: "headline",
    index: 2,
    defaults: {
      fontId: "georgia",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "ruled",
      spacingDensity: "comfortable",
      listColumns: "single",
      marginPreset: "comfortable",
    },
  },
  {
    id: "ats-compact-01",
    family: "compact",
    index: 0,
    defaults: {
      fontId: "arial",
      contactAlignment: "left",
      headingStyle: "uppercase",
      separatorStyle: "none",
      spacingDensity: "compact",
      listColumns: "single",
      marginPreset: "compact",
    },
  },
  {
    id: "ats-compact-02",
    family: "compact",
    index: 1,
    defaults: {
      fontId: "calibri",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "compact",
      listColumns: "single",
      marginPreset: "compact",
    },
  },
  {
    id: "ats-compact-03",
    family: "compact",
    index: 2,
    defaults: {
      fontId: "times",
      contactAlignment: "left",
      headingStyle: "simple",
      separatorStyle: "subtle",
      spacingDensity: "compact",
      listColumns: "single",
      marginPreset: "standard",
    },
  },
  {
    id: "ats-focus-01",
    family: "focus",
    index: 0,
    defaults: {
      fontId: "calibri",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
      accentColor: "navy",
    },
  },
  {
    id: "ats-focus-02",
    family: "focus",
    index: 1,
    defaults: {
      fontId: "helvetica",
      contactAlignment: "left",
      headingStyle: "uppercase",
      separatorStyle: "ruled",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
      accentColor: "none",
    },
  },
  {
    id: "ats-functional-01",
    family: "functional",
    index: 0,
    defaults: {
      fontId: "arial",
      contactAlignment: "left",
      headingStyle: "bold",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
      accentColor: "teal",
    },
  },
  {
    id: "ats-functional-02",
    family: "functional",
    index: 1,
    defaults: {
      fontId: "georgia",
      contactAlignment: "center",
      headingStyle: "simple",
      separatorStyle: "subtle",
      spacingDensity: "standard",
      listColumns: "single",
      marginPreset: "standard",
      accentColor: "none",
    },
  },
  {
    id: "ats-professional-01",
    family: "professional",
    index: 0,
    applyLook: true,
    defaults: {
      fontId: "calibri",
      contactAlignment: "left",
      headingStyle: "uppercase",
      separatorStyle: "ruled",
      spacingDensity: "standard",
      listColumns: "single",
      skillsLayout: "inline",
      languagesLayout: "inline",
      datePlacement: "right",
      marginPreset: "compact",
      accentColor: "navy",
    },
  },
]

/**
 * Ids shown in the template gallery. The old "20 templates" were one layout
 * with preset permutations; the gallery now shows one representative per
 * legacy family plus the genuinely distinct Headline and Compact layouts.
 * Removed legacy ids still resolve via LEGACY_ALIASES so existing documents
 * keep rendering with the same family.
 */
const GALLERY_IDS = new Set([
  "ats-classic-01",
  "ats-minimal-01",
  "ats-modern-01",
  "ats-executive-01",
  "ats-technical-01",
  "ats-headline-01",
  "ats-headline-02",
  "ats-headline-03",
  "ats-compact-01",
  "ats-compact-02",
  "ats-compact-03",
  "ats-focus-01",
  "ats-focus-02",
  "ats-functional-01",
  "ats-functional-02",
  "ats-professional-01",
])

const LEGACY_ALIASES: Record<string, string> = {
  // The Banner style was removed; its documents open on the closest remaining layout.
  "ats-banner-01": "ats-classic-01",
  "ats-banner-02": "ats-classic-01",
  "ats-classic-02": "ats-classic-01",
  "ats-classic-03": "ats-classic-01",
  "ats-classic-04": "ats-classic-01",
  "ats-minimal-02": "ats-minimal-01",
  "ats-minimal-03": "ats-minimal-01",
  "ats-minimal-04": "ats-minimal-01",
  "ats-modern-02": "ats-modern-01",
  "ats-modern-03": "ats-modern-01",
  "ats-modern-04": "ats-modern-01",
  "ats-executive-02": "ats-executive-01",
  "ats-executive-03": "ats-executive-01",
  "ats-executive-04": "ats-executive-01",
  "ats-technical-02": "ats-technical-01",
  "ats-technical-03": "ats-technical-01",
  "ats-technical-04": "ats-technical-01",
}

const ALL_ENTRIES = VARIANTS_LIST.map((spec) => {
  switch (spec.family) {
    case "classic":
      return buildEntry(ClassicTemplate, classicDocxMapping, spec)
    case "minimal":
      return buildEntry(MinimalTemplate, minimalDocxMapping, spec)
    case "modern":
      return buildEntry(ModernTemplate, modernDocxMapping, spec)
    case "executive":
      return buildEntry(ExecutiveTemplate, executiveDocxMapping, spec)
    case "technical":
      return buildEntry(TechnicalTemplate, technicalDocxMapping, spec)
    case "headline":
      return buildEntry(HeadlineTemplate, headlineDocxMapping, spec)
    case "compact":
      return buildEntry(CompactTemplate, compactDocxMapping, spec)
    case "focus":
      return buildEntry(FocusTemplate, focusDocxMapping, spec)
    case "functional":
      return buildEntry(FunctionalTemplate, functionalDocxMapping, spec)
    case "professional":
      return buildEntry(ProfessionalTemplate, professionalDocxMapping, spec)
  }
})

/** Gallery entries — distinct visual layouts only. */
export const TEMPLATES: TemplateEntry[] = ALL_ENTRIES.filter((entry) => GALLERY_IDS.has(entry.id))

/** Full lookup. Legacy ids resolve to their family's gallery representative
 *  so the apply-flow and DesignPanel always reference a visible template. */
const BY_ID = new Map(ALL_ENTRIES.map((template) => [template.id, template]))

export function getTemplate(id: string): TemplateEntry | undefined {
  const alias = LEGACY_ALIASES[id]
  if (alias) return BY_ID.get(alias)
  return BY_ID.get(id)
}

export function getTemplatesByFamily(family: TemplateEntry["family"]): TemplateEntry[] {
  return TEMPLATES.filter((template) => template.family === family)
}

export function resolveTemplate(id: string): TemplateEntry {
  return getTemplate(id) ?? TEMPLATES[0]
}
