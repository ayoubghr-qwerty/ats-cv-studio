import type { CSSProperties } from "react"

import type {
  ContactAlignment,
  FontId,
  HeadingStyle,
  Locale,
  MarginPreset,
  SeparatorStyle,
  ItemFormatTokens,
  SpacingDensity,
  TemplateSettings,
} from "./types"

export const FONTS: Record<FontId, string> = {
  arial: "Arial, Helvetica, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  calibri: "Calibri, Carlito, Arial, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  times: "'Times New Roman', Times, 'Liberation Serif', serif",
  verdana: "Verdana, Geneva, Arial, sans-serif",
  trebuchet: "'Trebuchet MS', Tahoma, Arial, sans-serif",
  tahoma: "Tahoma, Arial, sans-serif",
  inter: "'Inter Variable', 'Inter', 'Segoe UI', Arial, sans-serif",
  "source-sans": "'Source Sans 3 Variable', 'Source Sans 3', 'Segoe UI', Arial, sans-serif",
  lora: "'Lora Variable', 'Lora', Georgia, serif",
  montserrat: "'Montserrat Variable', 'Montserrat', 'Segoe UI', Arial, sans-serif",
  cambria: "Cambria, 'Caladea', 'Times New Roman', serif",
  garamond: "'Garamond', 'EB Garamond', 'Times New Roman', serif",
  candara: "Candara, 'Segoe UI', Arial, sans-serif",
  aptos: "Aptos, 'Segoe UI', Arial, sans-serif",
}

export const ARABIC_FONT_STACK = "Tahoma, 'Noto Sans Arabic', 'Segoe UI', Arial, sans-serif"

export const FONT_IDS = Object.keys(FONTS) as FontId[]

/**
 * Accent colors — applied to name, headline, section rules and heading text.
 * Values are parse-safe solid hex colors; "none" keeps the default ink color.
 */
export const ACCENTS: Record<string, string> = {
  none: "",
  navy: "#1f3a5f",
  teal: "#0f6e6e",
  burgundy: "#6e1f2e",
  forest: "#1f5c33",
}

export const ACCENT_IDS = Object.keys(ACCENTS)

export const MARGIN_PRESETS: Record<MarginPreset, number> = {
  compact: 12,
  standard: 16,
  comfortable: 20,
}

export type PageSize = "A4" | "LETTER"

export const PAGE_SIZE_MM: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 216, height: 279 },
}

export interface SpacingTokens {
  section: number
  item: number
  paragraph: number
  bullet: number
}

export const SPACING_DENSITY: Record<SpacingDensity, SpacingTokens> = {
  compact: { section: 12, item: 8, paragraph: 6, bullet: 2 },
  standard: { section: 16, item: 10, paragraph: 8, bullet: 3 },
  comfortable: { section: 20, item: 12, paragraph: 10, bullet: 4 },
}

export function lineHeightFor(locale: Locale): number {
  return locale === "ar" ? 1.45 : 1.35
}

export interface FamilyFlavor {
  nameSize: number
  nameWeight: number
  nameLetterSpacing: number
  titleSize: number
  titleWeight: number
  titleStyle: "normal" | "italic"
  headingSize: number
  headingWeight: number
  headingLetterSpacing: number
  bodySize: number
  metaSize: number
  itemTitleWeight: number
  itemMetaStyle: "normal" | "italic"
  contactSeparator: string
  spacingFactor: number
  /** Uppercase the candidate name (e.g. "GAHAR AYOUB"). */
  nameTransform?: "uppercase"
  /** Ink for the job-title line under the name (default: body ink). */
  titleColor?: string
  /** Point size for uppercase section headings (default: max(12, headingSize - 0.5)). */
  uppercaseHeadingSize?: number
  /** Draw a rule under the contact block, in the accent colour. */
  contactRule?: boolean
  /** Punctuation of item title lines; defaults to "Role - Company · City". */
  itemFormat?: ItemFormatTokens
}

function headingStyleFor(
  style: HeadingStyle,
  flavor: FamilyFlavor,
): {
  fontSize: string
  fontWeight: number
  textTransform: "none" | "uppercase"
  letterSpacing: number
} {
  switch (style) {
    case "bold":
      return {
        fontSize: `${flavor.headingSize + 0.5}pt`,
        fontWeight: 700,
        textTransform: "none",
        letterSpacing: flavor.headingLetterSpacing + 0.5,
      }
    case "uppercase":
      return {
        fontSize: `${flavor.uppercaseHeadingSize ?? Math.max(12, flavor.headingSize - 0.5)}pt`,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: flavor.headingLetterSpacing + 1,
      }
    default:
      return {
        fontSize: `${flavor.headingSize}pt`,
        fontWeight: 600,
        textTransform: "none",
        letterSpacing: flavor.headingLetterSpacing,
      }
  }
}

function separatorFor(style: SeparatorStyle): CSSProperties {
  switch (style) {
    case "ruled":
      return { borderBottom: "1px solid #2d2d2d" }
    case "subtle":
      return { borderBottom: "0.75px solid #c8c8c8" }
    case "dashed":
      return { borderBottom: "0.75px dashed #c8c8c8" }
    default:
      return {}
  }
}

export interface TemplateStyles {
  page: CSSProperties
  /** Active accent hex ("" when none) — used by headline rules. */
  accent: string
  name: CSSProperties
  title: CSSProperties
  contactLine: CSSProperties
  contactBlock: CSSProperties
  sectionHeading: CSSProperties
  sectionBody: CSSProperties
  itemBlock: CSSProperties
  itemTitle: CSSProperties
  itemMeta: CSSProperties
  itemBody: CSSProperties
  bullet: CSSProperties
  categoryLabel: CSSProperties
  paragraph: CSSProperties
}

export function buildTemplateStyles(
  settings: TemplateSettings,
  flavor: FamilyFlavor,
  locale: Locale,
  pageSize: PageSize = "A4",
): TemplateStyles {
  const marginMm = MARGIN_PRESETS[settings.marginPreset]
  const density = SPACING_DENSITY[settings.spacingDensity]
  const factor = flavor.spacingFactor
  const heading = headingStyleFor(settings.headingStyle, flavor)
  const separator = separatorFor(settings.separatorStyle)
  const fontFamily = locale === "ar" ? ARABIC_FONT_STACK : FONTS[settings.fontId]
  const { width, height } = PAGE_SIZE_MM[pageSize]

  const contactAlign: ContactAlignment = settings.contactAlignment

  // Accent: colors the name, headline, section headings and rules. Empty when
  // "none" — elements keep the default ink.
  const accent = settings.accentColor ? (ACCENTS[settings.accentColor] ?? "") : ""

  return {
    page: {
      fontFamily,
      fontSize: `${flavor.bodySize}pt`,
      lineHeight: lineHeightFor(locale),
      color: "#111111",
      background: "#ffffff",
      padding: `${marginMm}mm`,
      width: `${width}mm`,
      height: `${height}mm`,
      textAlign: "start",
      boxSizing: "border-box",
    },
    accent,
    name: {
      fontSize: `${flavor.nameSize}pt`,
      fontWeight: flavor.nameWeight,
      letterSpacing: `${flavor.nameLetterSpacing}px`,
      ...(flavor.nameTransform ? { textTransform: flavor.nameTransform } : {}),
      margin: 0,
      lineHeight: 1.2,
      ...(accent ? { color: accent } : {}),
    },
    title: {
      fontSize: `${flavor.titleSize}pt`,
      fontWeight: flavor.titleWeight,
      fontStyle: flavor.titleStyle,
      ...(flavor.titleColor ? { color: flavor.titleColor } : {}),
      margin: "2pt 0 0 0",
      lineHeight: 1.25,
    },
    contactBlock: {
      textAlign: contactAlign,
      marginBottom: `${density.section * factor}pt`,
    },
    contactLine: {
      marginTop: "3pt",
      fontSize: `${flavor.metaSize}pt`,
      color: "#333333",
    },
    sectionHeading: {
      ...heading,
      ...separator,
      margin: 0,
      paddingBottom: `${density.bullet + 2}pt`,
      marginBottom: `${density.paragraph * factor}pt`,
      lineHeight: 1.2,
      textAlign: "start",
      ...(accent
        ? {
            color: accent,
            ...(separator.borderBottom ? { borderBottomColor: accent } : {}),
          }
        : {}),
    },
    sectionBody: {
      marginBottom: `${density.section * factor}pt`,
    },
    itemBlock: {
      marginBottom: `${density.item * factor}pt`,
      breakInside: "avoid",
    },
    itemTitle: {
      fontSize: `${flavor.bodySize + 0.5}pt`,
      fontWeight: flavor.itemTitleWeight,
      margin: 0,
      lineHeight: 1.25,
    },
    itemMeta: {
      fontSize: `${flavor.metaSize}pt`,
      fontStyle: flavor.itemMetaStyle,
      color: "#333333",
      marginTop: "1pt",
      marginBottom: "2pt",
    },
    itemBody: {
      margin: "2pt 0 0 0",
    },
    bullet: {
      margin: `${density.bullet}pt 0 0 0`,
      textAlign: "start",
    },
    categoryLabel: {
      margin: `${density.paragraph * factor}pt 0 0 0`,
      fontWeight: 700,
      textAlign: "start",
    },
    paragraph: {
      margin: `${density.paragraph * factor}pt 0 0 0`,
    },
  }
}
