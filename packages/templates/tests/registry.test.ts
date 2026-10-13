import { describe, expect, it } from "vitest"

import {
  FAMILY_DESCRIPTIONS,
  FAMILY_NAMES,
  LEVEL_LABELS,
  PRESENT_LABELS,
  SECTION_LABELS,
} from "../src/localization"
import { TEMPLATES, getTemplate, resolveTemplate } from "../src/registry"
import { mergeTemplateSettings, resolveDatePlacement } from "../src/item-format"
import {
  FONT_IDS,
  MARGIN_PRESETS,
  SPACING_DENSITY,
  buildTemplateStyles,
  lineHeightFor,
} from "../src/tokens"
import type { SectionType } from "@ats/core"

describe("template registry", () => {
  it("shows only the distinct gallery layouts", () => {
    expect(TEMPLATES).toHaveLength(16)
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("registers three headline variants and three compact variants", () => {
    expect(TEMPLATES.filter((t) => t.family === "headline")).toHaveLength(3)
    expect(TEMPLATES.filter((t) => t.family === "compact")).toHaveLength(3)
  })

  it("registers the focus and functional layout pairs", () => {
    expect(TEMPLATES.filter((t) => t.family === "focus")).toHaveLength(2)
    expect(TEMPLATES.filter((t) => t.family === "functional")).toHaveLength(2)
  })

  it("no longer offers the removed Banner style, and its old documents still open", () => {
    expect(TEMPLATES.some((t) => t.id.includes("banner"))).toBe(false)
    for (const id of ["ats-banner-01", "ats-banner-02"]) {
      expect(getTemplate(id)?.id).toBe("ats-classic-01")
      expect(resolveTemplate(id).id).toBe("ats-classic-01")
    }
  })

  it("keeps one representative per legacy family", () => {
    for (const family of ["classic", "minimal", "modern", "executive", "technical"] as const) {
      const entries = TEMPLATES.filter((t) => t.family === family)
      expect(entries).toHaveLength(1)
      expect(entries[0].id).toBe(`ats-${family}-01`)
    }
  })

  it("resolves legacy template ids to their family representative", () => {
    expect(getTemplate("ats-classic-03")?.id).toBe("ats-classic-01")
    expect(getTemplate("ats-modern-04")?.id).toBe("ats-modern-01")
    expect(getTemplate("ats-technical-02")?.id).toBe("ats-technical-01")
    expect(getTemplate("ats-minimal-02")?.id).toBe("ats-minimal-01")
    expect(getTemplate("ats-executive-04")?.id).toBe("ats-executive-01")
  })

  it("supports en, fr and ar with localized names and descriptions", () => {
    for (const template of TEMPLATES) {
      expect(template.locales).toContain("en")
      expect(template.locales).toContain("fr")
      expect(template.locales).toContain("ar")
      for (const locale of ["en", "fr", "ar"] as const) {
        expect(template.name[locale].length).toBeGreaterThan(0)
        expect(template.description[locale].length).toBeGreaterThan(0)
      }
    }
  })

  it("uses only approved default fonts", () => {
    for (const template of TEMPLATES) {
      expect(FONT_IDS).toContain(template.defaults.fontId)
    }
  })

  it("has a complete customization schema and DOCX mapping", () => {
    for (const template of TEMPLATES) {
      expect(template.customization.allowFontChange).toBe(true)
      expect(template.customization.allowMarginChange).toBe(true)
      expect(template.customization.allowSpacingChange).toBe(true)
      expect(template.customization.allowHeadingStyleChange).toBe(true)
      expect(template.customization.allowSeparatorChange).toBe(true)
      expect(template.customization.allowContactAlignmentChange).toBe(true)
      expect(template.docxMapping.sectionHeadingStyle).toBeTruthy()
      expect(template.docxMapping.useBuiltinListBullets).toBe(true)
      expect(template.docxMapping.rtlSupport).toBe(true)
    }
  })

  it("registers the Professional ready-made look", () => {
    const pro = getTemplate("ats-professional-01")!
    expect(pro.family).toBe("professional")
    expect(pro.applyLook).toBe(true)
    expect(pro.defaults.skillsLayout).toBe("inline")
    expect(pro.defaults.languagesLayout).toBe("inline")
    expect(pro.defaults.datePlacement).toBe("right")
    expect(TEMPLATES.filter((t) => t.applyLook)).toHaveLength(1)
  })

  it("applying a normal template keeps the document's own settings", () => {
    const classic = getTemplate("ats-classic-01")!
    const mine = { ...classic.defaults, fontId: "georgia" as const, accentColor: "burgundy" }
    expect(mergeTemplateSettings(classic, mine)).toEqual(mine)
  })

  it("applying a ready-made look overwrites style but keeps untouched settings", () => {
    const pro = getTemplate("ats-professional-01")!
    const mine = {
      ...pro.defaults,
      fontId: "georgia" as const,
      accentColor: "burgundy",
      skillsLayout: "list" as const,
    }
    const merged = mergeTemplateSettings(pro, mine)
    expect(merged.fontId).toBe("calibri")
    expect(merged.accentColor).toBe("navy")
    expect(merged.skillsLayout).toBe("inline")
  })

  it("date placement: an explicit choice wins over the family default", () => {
    expect(resolveDatePlacement(undefined, "right")).toBe("right")
    expect(resolveDatePlacement("inline", "right")).toBe("inline")
    expect(resolveDatePlacement("right", "inline")).toBe("right")
  })

  it("resolves unknown ids to a fallback template", () => {
    expect(resolveTemplate("ats-classic-01").id).toBe("ats-classic-01")
    expect(resolveTemplate("does-not-exist").id).toBe("ats-classic-01")
  })
})

describe("localization", () => {
  const sectionTypes = Object.keys(SECTION_LABELS.en) as SectionType[]

  it("has labels for every section type in every locale", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      for (const type of sectionTypes) {
        expect(SECTION_LABELS[locale][type].length).toBeGreaterThan(0)
      }
    }
  })

  it("has family names and descriptions for every locale", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      for (const family of ["classic", "minimal", "modern", "executive", "technical"]) {
        expect(FAMILY_NAMES[locale][family].length).toBeGreaterThan(0)
        expect(FAMILY_DESCRIPTIONS[locale][family].length).toBeGreaterThan(0)
      }
    }
  })

  it("localizes levels and present labels", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      expect(LEVEL_LABELS[locale].native.length).toBeGreaterThan(0)
      expect(PRESENT_LABELS[locale].length).toBeGreaterThan(0)
    }
  })
})

describe("tokens", () => {
  const baseSettings = {
    fontId: "arial" as const,
    marginPreset: "standard" as const,
    spacingDensity: "standard" as const,
    headingStyle: "bold" as const,
    separatorStyle: "subtle" as const,
    contactAlignment: "left" as const,
  }

  it("maps margin presets to page padding", () => {
    expect(MARGIN_PRESETS.compact).toBe(12)
    expect(MARGIN_PRESETS.standard).toBe(16)
    expect(MARGIN_PRESETS.comfortable).toBe(20)
    for (const preset of ["compact", "standard", "comfortable"] as const) {
      const styles = buildTemplateStyles(
        { ...baseSettings, marginPreset: preset },
        {} as never,
        "en",
      )
      expect(String(styles.page.padding)).toContain(String(MARGIN_PRESETS[preset]))
    }
  })

  it("adjusts spacing per density", () => {
    expect(SPACING_DENSITY.compact.section).toBeLessThan(SPACING_DENSITY.standard.section)
    expect(SPACING_DENSITY.standard.section).toBeLessThan(SPACING_DENSITY.comfortable.section)
  })

  it("uses the Arabic font stack for Arabic", () => {
    const styles = buildTemplateStyles(baseSettings, {} as never, "ar")
    expect(String(styles.page.fontFamily)).toContain("Noto Sans Arabic")
    expect(lineHeightFor("ar")).toBeGreaterThan(lineHeightFor("en"))
  })

  it("maps heading styles to typography", () => {
    for (const headingStyle of ["simple", "bold", "uppercase"] as const) {
      const styles = buildTemplateStyles({ ...baseSettings, headingStyle }, {} as never, "en")
      const fontWeight = String(styles.sectionHeading.fontWeight)
      expect(Number(fontWeight)).toBeGreaterThanOrEqual(600)
    }
    const uppercase = buildTemplateStyles(
      { ...baseSettings, headingStyle: "uppercase" },
      {} as never,
      "en",
    )
    expect(uppercase.sectionHeading.textTransform).toBe("uppercase")
  })

  it("maps separator styles", () => {
    const none = buildTemplateStyles({ ...baseSettings, separatorStyle: "none" }, {} as never, "en")
    expect(none.sectionHeading.borderBottom).toBeUndefined()
    const ruled = buildTemplateStyles(
      { ...baseSettings, separatorStyle: "ruled" },
      {} as never,
      "en",
    )
    expect(String(ruled.sectionHeading.borderBottom)).toContain("1px solid")
  })

  it("applies A4 and Letter page dimensions", () => {
    const a4 = buildTemplateStyles(baseSettings, {} as never, "en", "A4")
    expect(a4.page.width).toBe("210mm")
    expect(a4.page.height).toBe("297mm")
    const letter = buildTemplateStyles(baseSettings, {} as never, "en", "LETTER")
    expect(letter.page.width).toBe("216mm")
    expect(letter.page.height).toBe("279mm")
  })

  it("defaults page size to A4", () => {
    const styles = buildTemplateStyles(baseSettings, {} as never, "en")
    expect(styles.page.width).toBe("210mm")
    expect(styles.page.height).toBe("297mm")
  })
})
