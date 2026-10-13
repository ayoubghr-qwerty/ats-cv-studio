import type { ReactElement } from "react"

import type { CvDocument } from "@ats/core"

export type Locale = "en" | "fr" | "ar"
export type TemplateFamily =
  | "classic"
  | "minimal"
  | "modern"
  | "executive"
  | "technical"
  | "headline"
  | "compact"
  | "focus"
  | "functional"
  | "professional"

export type FontId =
  | "arial"
  | "helvetica"
  | "calibri"
  | "georgia"
  | "times"
  | "verdana"
  | "trebuchet"
  | "tahoma"
  | "inter"
  | "source-sans"
  | "lora"
  | "montserrat"
  | "cambria"
  | "garamond"
  | "candara"
  | "aptos"

export type MarginPreset = "compact" | "standard" | "comfortable"
export type SpacingDensity = "compact" | "standard" | "comfortable"
export type HeadingStyle = "simple" | "bold" | "uppercase"
export type SeparatorStyle = "none" | "subtle" | "ruled" | "dashed"
export type ContactAlignment = "left" | "center"
export type BulletStyle = "disc" | "hyphen"
export type ListColumns = "single" | "two"
export type SkillsLayout = "list" | "inline"
export type LanguagesLayout = "list" | "inline"
export type InlineSeparator = "comma" | "bullet"
export type DatePlacement = "inline" | "right"

/**
 * Punctuation used on an item's title line. Shared by the HTML renderer and
 * the DOCX exporter so both produce the same text. Defaults (used by every
 * family that does not override it): "Role - Company · City", "Feb 2025 - Nov 2025".
 */
export interface ItemFormatTokens {
  titleSeparator: string
  metaSeparator: string
  rangeSeparator: string
}

export interface TemplateSettings {
  fontId: FontId
  marginPreset: MarginPreset
  spacingDensity: SpacingDensity
  headingStyle: HeadingStyle
  separatorStyle: SeparatorStyle
  contactAlignment: ContactAlignment
  bulletStyle: BulletStyle
  listColumns: ListColumns
  // Optional so the 33 registry `defaults` need no change; undefined means "list".
  skillsLayout?: SkillsLayout
  languagesLayout?: LanguagesLayout
  // Undefined means "comma".
  inlineSeparator?: InlineSeparator
  // Undefined = the template family's own default (see resolveDatePlacement).
  datePlacement?: DatePlacement
  accentColor?: string
}

export interface TemplateCustomizationSchema {
  allowFontChange: boolean
  allowMarginChange: boolean
  allowSpacingChange: boolean
  allowHeadingStyleChange: boolean
  allowSeparatorChange: boolean
  allowContactAlignmentChange: boolean
  allowBulletStyleChange: boolean
}

/** Optional Word-output styling for "ready-made look" families. */
export interface DocxLook {
  nameUppercase?: boolean
  /** Hex without "#": the job-title line becomes plain (not italic) in this ink. */
  titleColor?: string
  /** Thin rule under the contact line, in the accent colour. */
  contactRule?: boolean
  /** Half-points (Word units), e.g. 20 = 10pt. */
  bodySize?: number
  headingSize?: number
  contactSeparator?: string
}

export interface DocxStyleMapping {
  sectionHeadingStyle: "Heading2" | "Heading3"
  useBuiltinListBullets: boolean
  contactStyle: "Normal" | "Emphasis"
  titleStyle: "Title" | "Heading1" | "Normal"
  rtlSupport: boolean
  /** Optional punctuation override, identical to the family's render flavor. */
  itemFormat?: ItemFormatTokens
  look?: DocxLook
}

export interface TemplateDefinition {
  id: string
  family: TemplateFamily
  name: Record<Locale, string>
  description: Record<Locale, string>
  locales: Locale[]
  defaults: TemplateSettings
  customization: TemplateCustomizationSchema
  docxMapping: DocxStyleMapping
  thumbnail: string
  sampleDataIds: Locale[]
  atsComplianceVersion: string
  /**
   * When true, applying this template adopts its whole look (font, colours,
   * headings, skills layout, date placement) instead of keeping the document's
   * own settings. Off for the classic gallery templates, whose settings are
   * user-tunable on top of the layout; on for "ready-made" looks.
   */
  applyLook?: boolean
}

export interface TemplateRenderProps {
  document: CvDocument
  settings: TemplateSettings
  locale: Locale
  direction: "ltr" | "rtl"
  mode: "preview" | "print"
}

export type TemplateRenderFn = (props: TemplateRenderProps) => ReactElement
