import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  SectionType,
  Tab,
  TabStopType,
  TextRun,
  convertMillimetersToTwip,
  type ParagraphChild,
} from "docx"
import type {
  AwardItem,
  CertificationItem,
  CourseItem,
  CvDocument,
  CvItem,
  CvSection,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
  PublicationItem,
  SkillItem,
  SoftSkillItem,
  SummaryItem,
  VolunteeringItem,
} from "@ats/core"
import {
  getTemplate,
  LEVEL_LABELS,
  resolveItemFormat,
  resolveSectionTitle,
  type DocxLook,
  type FontId,
  type ItemFormatTokens,
  type Locale,
} from "@ats/templates"
import { formatDateRange, formatMonthYear } from "@ats/templates"
import { ACCENTS, LANGUAGES_SEPARATOR, inlineSeparatorText } from "@ats/templates"

const LANGUAGE_TAGS: Record<string, string> = { en: "en-US", fr: "fr-FR", ar: "ar-SA" }

export const DOCX_FONT_MAP: Record<FontId, string> = {
  arial: "Arial",
  helvetica: "Helvetica",
  times: "Times New Roman",
  georgia: "Georgia",
  calibri: "Calibri",
  verdana: "Verdana",
  trebuchet: "Trebuchet MS",
  tahoma: "Tahoma",
  // Web fonts bundled for the preview and the PDF are not installed with Word,
  // which would swap them for something unpredictable. Use the font that ends
  // each one's CSS stack instead, so the Word file looks the same everywhere.
  inter: "Arial",
  "source-sans": "Calibri",
  lora: "Georgia",
  montserrat: "Arial",
  cambria: "Cambria",
  garamond: "Garamond",
  candara: "Candara",
  aptos: "Aptos",
}

const MARGIN_PRESETS_MM: Record<string, number> = {
  compact: 12,
  standard: 16,
  comfortable: 20,
}

type SectionHeadingLevel = (typeof HeadingLevel)[keyof typeof HeadingLevel]

const PAGE_SIZE_MM: Record<CvDocument["pageSettings"]["size"], { width: number; height: number }> =
  {
    A4: { width: 210, height: 297 },
    LETTER: { width: 216, height: 279 },
  }

export interface DocxBuildOptions {
  locale: Locale
  direction: "ltr" | "rtl"
  pageSize: CvDocument["pageSettings"]["size"]
  fontName: string
  marginMm: number
  sectionHeadingLevel: SectionHeadingLevel
  useBullets: boolean
  bulletStyle: "disc" | "hyphen"
  listColumns: "single" | "two"
  /** "inline" = one "Category: a, b, c" paragraph per skill group. */
  skillsLayout: "list" | "inline"
  languagesLayout: "list" | "inline"
  /** Between items of inline skills and soft skills. */
  inlineSeparator: "comma" | "bullet"
  /** Hex color (no #) for headings/name when an accent is set. */
  headingColor?: string
  /** "right" = date on the title line behind a right tab stop (LTR only). */
  datePlacement: "inline" | "right"
  itemFormat: ItemFormatTokens
  /** Printable width between the margins, in twips (right tab position). */
  contentWidthTwip: number
  look: DocxLook
  headingStyle: "simple" | "bold" | "uppercase"
  separatorStyle: "none" | "subtle" | "ruled" | "dashed"
  contactAlignment: "left" | "center"
  /** Vertical-spacing multiplier: compact 0.75, standard 1, comfortable 1.25. */
  spacingScale: number
}

const SPACING_SCALE: Record<string, number> = { compact: 0.75, standard: 1, comfortable: 1.25 }

/** A spacing value in twips, scaled by the document's spacing density. */
const sp = (opts: DocxBuildOptions, twips: number) => Math.round(twips * opts.spacingScale)

const LIST_COLUMN_SECTION_TYPES = new Set<string>([
  "skills",
  "languages",
  "certifications",
  "courses",
])

export function docxOptionsFor(document: CvDocument): DocxBuildOptions {
  const fontName = DOCX_FONT_MAP[document.templateSettings.fontId as FontId] ?? "Arial"
  const mapping = getTemplate(document.templateId)?.docxMapping
  const sectionHeadingLevel =
    mapping?.sectionHeadingStyle === "Heading3" ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_2
  const accent = document.templateSettings.accentColor
    ? (ACCENTS[document.templateSettings.accentColor] ?? "")
    : ""
  const headingColor = accent ? accent.replace("#", "").toUpperCase() : undefined
  return {
    locale: document.locale,
    direction: document.direction,
    pageSize: document.pageSettings.size,
    fontName,
    marginMm: MARGIN_PRESETS_MM[document.templateSettings.marginPreset] ?? 16,
    sectionHeadingLevel,
    useBullets: true,
    bulletStyle: document.templateSettings.bulletStyle === "hyphen" ? "hyphen" : "disc",
    listColumns: document.templateSettings.listColumns === "two" ? "two" : "single",
    skillsLayout: document.templateSettings.skillsLayout === "inline" ? "inline" : "list",
    languagesLayout: document.templateSettings.languagesLayout === "inline" ? "inline" : "list",
    inlineSeparator: document.templateSettings.inlineSeparator === "bullet" ? "bullet" : "comma",
    headingColor,
    // Word output only right-aligns when explicitly chosen; the Headline
    // family's HTML-only default keeps its existing two-line Word layout.
    datePlacement: document.templateSettings.datePlacement === "right" ? "right" : "inline",
    itemFormat: resolveItemFormat(mapping?.itemFormat),
    contentWidthTwip: convertMillimetersToTwip(
      PAGE_SIZE_MM[document.pageSettings.size].width -
        2 * (MARGIN_PRESETS_MM[document.templateSettings.marginPreset] ?? 16),
    ),
    look: mapping?.look ?? {},
    headingStyle:
      document.templateSettings.headingStyle === "uppercase" ||
      document.templateSettings.headingStyle === "simple"
        ? document.templateSettings.headingStyle
        : "bold",
    separatorStyle: (["none", "subtle", "ruled", "dashed"] as const).includes(
      document.templateSettings.separatorStyle as "none",
    )
      ? document.templateSettings.separatorStyle
      : "subtle",
    contactAlignment: document.templateSettings.contactAlignment === "center" ? "center" : "left",
    spacingScale: SPACING_SCALE[document.templateSettings.spacingDensity] ?? 1,
  }
}

function run(
  text: string,
  opts: { bold?: boolean; italic?: boolean; font: string; size?: number; color?: string },
): ParagraphChild {
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italic,
    font: opts.font,
    size: opts.size,
    ...(opts.color ? { color: opts.color } : {}),
  })
}

function makeParagraph(
  children: ParagraphChild[],
  opts: {
    rtl?: boolean
    bullet?: boolean
    spacingAfter?: number
    rightTab?: number
    /** Hex colour (no #) of a thin rule under the paragraph. */
    bottomRule?: string
    alignment?: "center"
  } = {},
): Paragraph {
  return new Paragraph({
    children,
    ...(opts.spacingAfter !== undefined ? { spacing: { after: opts.spacingAfter } } : {}),
    ...(opts.bottomRule
      ? {
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, space: 4, color: opts.bottomRule },
          },
        }
      : {}),
    ...(opts.rightTab ? { tabStops: [{ type: TabStopType.RIGHT, position: opts.rightTab }] } : {}),
    ...(opts.bullet ? { bullet: { level: 0 } } : {}),
    ...(opts.rtl ? { bidirectional: true, alignment: AlignmentType.RIGHT } : {}),
    ...(opts.alignment === "center" ? { alignment: AlignmentType.CENTER } : {}),
  })
}

function makeBullet(text: string, opts: DocxBuildOptions): Paragraph {
  const rtl = opts.direction === "rtl"
  if (opts.bulletStyle === "hyphen") {
    return makeParagraph([run("- ", { font: opts.fontName }), run(text, { font: opts.fontName })], {
      rtl,
    })
  }
  return makeParagraph([run(text, { font: opts.fontName })], { rtl, bullet: opts.useBullets })
}

function makeHeading(
  text: string,
  opts: {
    rtl?: boolean
    level: SectionHeadingLevel
    font: string
    /** Ink of the heading text; accent when set, otherwise the body ink. */
    color: string
    size: number
    charSpacing: number
    rule?: { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string }
    before: number
    after: number
  },
): Paragraph {
  return new Paragraph({
    heading: opts.level,
    children: [
      new TextRun({
        text,
        font: opts.font,
        bold: true,
        size: opts.size,
        color: opts.color,
        ...(opts.charSpacing ? { characterSpacing: opts.charSpacing } : {}),
      }),
    ],
    spacing: { before: opts.before, after: opts.after },
    keepNext: true,
    ...(opts.rule
      ? {
          border: {
            bottom: {
              style: opts.rule.style,
              size: opts.rule.size,
              space: 2,
              color: opts.rule.color,
            },
          },
        }
      : {}),
    ...(opts.rtl ? { bidirectional: true, alignment: AlignmentType.RIGHT } : {}),
  })
}

// Same rules as the preview: ruled 1pt dark, subtle/dashed 0.75pt light; the
// accent colours the rule too. Sizes are eighths of a point.
const RULES = {
  ruled: { style: BorderStyle.SINGLE, size: 8, color: "2D2D2D" },
  subtle: { style: BorderStyle.SINGLE, size: 6, color: "C8C8C8" },
  dashed: { style: BorderStyle.DASHED, size: 6, color: "C8C8C8" },
} as const
const HEADING_SIZE = { simple: 25, bold: 26, uppercase: 24 } as const
const HEADING_SPACING = { simple: 0, bold: 10, uppercase: 20 } as const

function sectionHeading(section: CvSection, opts: DocxBuildOptions): Paragraph {
  const title = resolveSectionTitle(section.title, section.type, opts.locale)
  const rule = opts.separatorStyle === "none" ? undefined : RULES[opts.separatorStyle]
  return makeHeading(opts.headingStyle === "uppercase" ? title.toUpperCase() : title, {
    rtl: opts.direction === "rtl",
    level: opts.sectionHeadingLevel,
    font: opts.fontName,
    color: opts.headingColor ?? "111111",
    size: opts.look.headingSize ?? HEADING_SIZE[opts.headingStyle],
    charSpacing: HEADING_SPACING[opts.headingStyle],
    rule: rule && { ...rule, color: opts.headingColor ?? rule.color },
    before: sp(opts, 200),
    after: sp(opts, 120),
  })
}

/**
 * Title line of a dated item (role, degree, project...).
 *  - inline (default, unchanged): bold title paragraph, then one italic
 *    "meta · date" paragraph.
 *  - right (LTR only): one paragraph, bold title + plain meta, and the italic
 *    date behind a right tab stop — the classic Word resume layout. A tab stop
 *    is ordinary linear text to an ATS, unlike a table or text box.
 */
function datedHead(
  title: string,
  parts: string[],
  dateLabel: string,
  opts: DocxBuildOptions,
): Paragraph[] {
  const rtl = opts.direction === "rtl"
  const fmt = opts.itemFormat
  const meta = parts.filter(Boolean)
  if (opts.datePlacement === "right" && dateLabel && !rtl) {
    // If the title and date cannot share a line, a right tab would let the
    // date word-wrap in the middle ("Sep 2022 – Jul" / "2024"). Estimate the
    // width (deliberately on the wide side) and, when it will not fit, put the
    // whole date on the next line, still right-aligned and still in the same
    // paragraph so the reading order is unchanged.
    const sizePt = (opts.look.bodySize ?? 22) / 2
    const charPt = sizePt * 0.52
    const lead =
      title.length * 1.06 +
      (meta.length > 0 ? fmt.titleSeparator.length + meta.join(fmt.metaSeparator).length : 0)
    const needsBreak =
      lead * charPt + dateLabel.length * charPt * 0.95 + 12 > opts.contentWidthTwip / 20
    const children: ParagraphChild[] = []
    if (title) children.push(run(title, { bold: true, font: opts.fontName }))
    if (meta.length > 0) {
      children.push(
        run(`${title ? fmt.titleSeparator : ""}${meta.join(fmt.metaSeparator)}`, {
          font: opts.fontName,
        }),
      )
    }
    children.push(
      new TextRun({
        children: [new Tab(), dateLabel],
        italics: true,
        font: opts.fontName,
        ...(needsBreak ? { break: 1 } : {}),
      }),
    )
    return [
      makeParagraph(children, { rtl, spacingAfter: sp(opts, 60), rightTab: opts.contentWidthTwip }),
    ]
  }
  const out: Paragraph[] = []
  if (title) out.push(makeParagraph([run(title, { bold: true, font: opts.fontName })], { rtl }))
  const all = [...meta, dateLabel].filter(Boolean)
  if (all.length > 0) {
    out.push(
      makeParagraph([run(all.join(fmt.metaSeparator), { italic: true, font: opts.fontName })], {
        rtl,
      }),
    )
  }
  return out
}

function renderItem(type: CvSection["type"], item: CvItem, opts: DocxBuildOptions): Paragraph[] {
  const rtl = opts.direction === "rtl"
  switch (type) {
    case "summary": {
      const summary = item as SummaryItem
      return summary.text
        .split("\n")
        .filter(Boolean)
        .map((line) => makeParagraph([run(line, { font: opts.fontName })], { rtl }))
    }
    case "experience": {
      const exp = item as ExperienceItem
      const parts: string[] = [exp.company, exp.location].filter(Boolean)
      const dateLabel = formatDateRange(
        exp.startDate,
        exp.endDate,
        exp.current,
        opts.locale,
        opts.itemFormat.rangeSeparator,
      )
      const out: Paragraph[] = datedHead(exp.role, parts, dateLabel, opts)
      for (const bullet of exp.bullets) {
        if (bullet.trim()) {
          out.push(makeBullet(bullet, opts))
        }
      }
      return out
    }
    case "education": {
      const edu = item as EducationItem
      const dateLabel = formatDateRange(
        edu.startDate,
        edu.endDate,
        edu.current,
        opts.locale,
        opts.itemFormat.rangeSeparator,
      )
      const out: Paragraph[] = datedHead(
        edu.degree,
        [edu.institution, edu.location],
        dateLabel,
        opts,
      )
      if (edu.details) {
        out.push(makeParagraph([run(edu.details, { font: opts.fontName })], { rtl }))
      }
      return out
    }
    case "skills": {
      const skill = item as SkillItem
      return [makeBullet(skill.name, opts)]
    }
    case "projects": {
      const proj = item as ProjectItem
      const dateLabel = formatDateRange(
        proj.startDate,
        proj.endDate,
        proj.current,
        opts.locale,
        opts.itemFormat.rangeSeparator,
      )
      const out: Paragraph[] = datedHead(proj.name, [proj.link], dateLabel, opts)
      if (proj.description) {
        out.push(makeParagraph([run(proj.description, { font: opts.fontName })], { rtl }))
      }
      for (const bullet of proj.bullets) {
        if (bullet.trim()) {
          out.push(makeBullet(bullet, opts))
        }
      }
      return out
    }
    case "certifications": {
      const cert = item as CertificationItem
      const out: Paragraph[] = []
      const certTitle = [cert.name, cert.link].filter(Boolean).join(" - ")
      if (certTitle) {
        out.push(makeParagraph([run(certTitle, { bold: true, font: opts.fontName })], { rtl }))
      }
      const meta: string[] = [cert.issuer, formatMonthYear(cert.date, opts.locale)].filter(Boolean)
      if (meta.length > 0) {
        out.push(
          makeParagraph([run(meta.join(" · "), { italic: true, font: opts.fontName })], { rtl }),
        )
      }
      return out
    }
    case "languages": {
      const lang = item as LanguageItem
      // Localize the stored level key ("intermediate" | "advanced" | "fluent" | "bilingual" | "native")
      // so DOCX matches the on-screen CV instead of leaking the raw key.
      const levelLabel = LEVEL_LABELS[opts.locale]?.[lang.level] ?? lang.level
      return [
        makeParagraph(
          [
            run(lang.name, { bold: true, font: opts.fontName }),
            run(` - ${levelLabel}`, { font: opts.fontName }),
          ],
          { rtl },
        ),
      ]
    }
    case "awards": {
      const award = item as AwardItem
      const out: Paragraph[] = []
      if (award.title) {
        out.push(makeParagraph([run(award.title, { bold: true, font: opts.fontName })], { rtl }))
      }
      const meta: string[] = [award.issuer, formatMonthYear(award.date, opts.locale)].filter(
        Boolean,
      )
      if (meta.length > 0) {
        out.push(
          makeParagraph([run(meta.join(" · "), { italic: true, font: opts.fontName })], { rtl }),
        )
      }
      if (award.description) {
        out.push(makeParagraph([run(award.description, { font: opts.fontName })], { rtl }))
      }
      return out
    }
    case "volunteering": {
      const vol = item as VolunteeringItem
      const dateLabel = formatDateRange(
        vol.startDate,
        vol.endDate,
        vol.current,
        opts.locale,
        opts.itemFormat.rangeSeparator,
      )
      const out: Paragraph[] = datedHead(
        vol.role,
        [vol.organization, vol.location],
        dateLabel,
        opts,
      )
      if (vol.description) {
        out.push(makeParagraph([run(vol.description, { font: opts.fontName })], { rtl }))
      }
      return out
    }
    case "publications": {
      const pub = item as PublicationItem
      const out: Paragraph[] = []
      const pubTitle = [pub.title, pub.url].filter(Boolean).join(" - ")
      if (pubTitle) {
        out.push(makeParagraph([run(pubTitle, { bold: true, font: opts.fontName })], { rtl }))
      }
      const meta: string[] = [pub.publisher, formatMonthYear(pub.date, opts.locale)].filter(Boolean)
      if (meta.length > 0) {
        out.push(
          makeParagraph([run(meta.join(" · "), { italic: true, font: opts.fontName })], { rtl }),
        )
      }
      return out
    }
    case "courses": {
      const course = item as CourseItem
      const out: Paragraph[] = []
      if (course.name) {
        out.push(makeParagraph([run(course.name, { bold: true, font: opts.fontName })], { rtl }))
      }
      const meta: string[] = [course.provider, formatMonthYear(course.date, opts.locale)].filter(
        Boolean,
      )
      if (meta.length > 0) {
        out.push(
          makeParagraph([run(meta.join(" · "), { italic: true, font: opts.fontName })], { rtl }),
        )
      }
      if (course.description) {
        out.push(makeParagraph([run(course.description, { font: opts.fontName })], { rtl }))
      }
      return out
    }
    default:
      return []
  }
}

interface SkillGroup {
  label?: string
  names: string[]
}

function groupSkillsByCategory(items: SkillItem[]): SkillGroup[] {
  const groups = new Map<string, string[]>()
  const ungrouped: string[] = []
  for (const item of items) {
    const name = item.name.trim()
    if (!name) continue
    const category = item.category?.trim()
    if (category) {
      const bucket = groups.get(category)
      if (bucket) bucket.push(name)
      else groups.set(category, [name])
    } else {
      ungrouped.push(name)
    }
  }
  const result: SkillGroup[] = []
  if (ungrouped.length > 0) result.push({ names: ungrouped })
  for (const [label, names] of groups) result.push({ label, names })
  return result
}

function pushSkillItems(children: Paragraph[], section: CvSection, opts: DocxBuildOptions): void {
  const groups = groupSkillsByCategory(section.items as SkillItem[])
  if (opts.skillsLayout === "inline") {
    for (const group of groups) {
      const runs: ParagraphChild[] = []
      if (group.label) {
        runs.push(run(`${group.label}: `, { bold: true, font: opts.fontName }))
      }
      runs.push(
        run(group.names.join(inlineSeparatorText(opts.inlineSeparator)), { font: opts.fontName }),
      )
      children.push(
        makeParagraph(runs, { rtl: opts.direction === "rtl", spacingAfter: sp(opts, 60) }),
      )
    }
    return
  }
  for (const group of groups) {
    if (group.label) {
      children.push(
        makeParagraph([run(group.label, { bold: true, font: opts.fontName })], {
          rtl: opts.direction === "rtl",
        }),
      )
    }
    for (const name of group.names) {
      children.push(makeBullet(name, opts))
    }
  }
}

/** One "A, B, C" (or "A • B • C") paragraph, matching the inline HTML rendering of soft skills. */
function pushSoftSkillItems(
  children: Paragraph[],
  section: CvSection,
  opts: DocxBuildOptions,
): void {
  const names = (section.items as SoftSkillItem[]).map((item) => item.name).filter(Boolean)
  if (names.length === 0) return
  children.push(
    makeParagraph(
      [run(names.join(inlineSeparatorText(opts.inlineSeparator)), { font: opts.fontName })],
      {
        rtl: opts.direction === "rtl",
        spacingAfter: sp(opts, 60),
      },
    ),
  )
}

/** One "Name: Level   Name: Level" paragraph, wrapping naturally like the inline HTML layout. */
function pushLanguageItems(
  children: Paragraph[],
  section: CvSection,
  opts: DocxBuildOptions,
): void {
  const items = section.items as LanguageItem[]
  if (items.length === 0) return
  const runs: ParagraphChild[] = []
  items.forEach((lang, index) => {
    const level = LEVEL_LABELS[opts.locale]?.[lang.level] ?? lang.level
    const gap = index > 0 ? LANGUAGES_SEPARATOR : ""
    if (level) {
      runs.push(run(`${gap}${lang.name}:`, { bold: true, font: opts.fontName }))
      runs.push(run(` ${level}`, { font: opts.fontName }))
    } else {
      runs.push(run(`${gap}${lang.name}`, { bold: true, font: opts.fontName }))
    }
  })
  children.push(
    makeParagraph(runs, {
      rtl: opts.direction === "rtl",
      spacingAfter: sp(opts, 60),
    }),
  )
}

interface DocxSegment {
  twoColumns: boolean
  children: Paragraph[]
}

function buildDocxSegments(document: CvDocument): DocxSegment[] {
  const opts = docxOptionsFor(document)
  const rtl = opts.direction === "rtl"
  const segments: DocxSegment[] = [{ twoColumns: false, children: [] }]

  const centered = opts.contactAlignment === "center" ? ("center" as const) : undefined
  const pushContact = (): void => {
    const children = segments[segments.length - 1].children

    if (document.contact.fullName) {
      children.push(
        new Paragraph({
          children: [
            run(
              opts.look.nameUppercase
                ? document.contact.fullName.toUpperCase()
                : document.contact.fullName,
              {
                font: opts.fontName,
                bold: true,
                size: 44,
                ...(opts.headingColor ? { color: opts.headingColor } : {}),
              },
            ),
          ],
          spacing: { after: sp(opts, 80) },
          ...(rtl ? { bidirectional: true, alignment: AlignmentType.RIGHT } : {}),
          ...(opts.contactAlignment === "center" ? { alignment: AlignmentType.CENTER } : {}),
        }),
      )
    }
    if (document.contact.jobTitle) {
      children.push(
        makeParagraph(
          [
            run(document.contact.jobTitle, {
              italic: opts.look.titleColor ? undefined : true,
              font: opts.fontName,
              ...(opts.look.titleColor ? { color: opts.look.titleColor } : {}),
            }),
          ],
          { rtl, spacingAfter: sp(opts, 80), alignment: centered },
        ),
      )
    }
    // The preview shows one of the two when they are the same text; so does Word.
    const sameAsJobTitle =
      document.headline?.trim().toLowerCase() === document.contact.jobTitle?.trim().toLowerCase()
    if (document.headline && !sameAsJobTitle) {
      children.push(
        makeParagraph(
          [
            run(document.headline, {
              bold: true,
              font: opts.fontName,
              size: 26,
              ...(opts.headingColor ? { color: opts.headingColor } : {}),
            }),
          ],
          {
            rtl,
            spacingAfter: sp(opts, 80),
            alignment: centered,
          },
        ),
      )
    }
    const contactParts: string[] = [
      document.contact.email,
      document.contact.phone,
      document.contact.location,
      document.contact.website,
      document.contact.linkedin,
      document.contact.github,
    ].filter((part): part is string => Boolean(part))
    if (contactParts.length > 0) {
      children.push(
        makeParagraph(
          [run(contactParts.join(opts.look.contactSeparator ?? " · "), { font: opts.fontName })],
          {
            rtl,
            spacingAfter: sp(opts, 160),
            alignment: centered,
            ...(opts.look.contactRule ? { bottomRule: opts.headingColor ?? "2D2D2D" } : {}),
          },
        ),
      )
    }
  }

  pushContact()

  const sections = document.sections
    .filter((section) => section.enabled && section.items.length > 0)
    .sort((a, b) => a.order - b.order)

  for (const section of sections) {
    const current = segments[segments.length - 1]
    current.children.push(sectionHeading(section, opts))
    if (LIST_COLUMN_SECTION_TYPES.has(section.type) && opts.listColumns === "two") {
      const columnChildren: Paragraph[] = []
      if (section.type === "skills") {
        pushSkillItems(columnChildren, section, opts)
      } else if (section.type === "softSkills") {
        pushSoftSkillItems(columnChildren, section, opts)
      } else if (section.type === "languages" && opts.languagesLayout === "inline") {
        pushLanguageItems(columnChildren, section, opts)
      } else {
        for (const item of section.items) {
          columnChildren.push(...renderItem(section.type, item, opts))
        }
      }
      segments.push({ twoColumns: true, children: columnChildren })
      segments.push({ twoColumns: false, children: [] })
    } else if (section.type === "skills") {
      pushSkillItems(current.children, section, opts)
    } else if (section.type === "softSkills") {
      pushSoftSkillItems(current.children, section, opts)
    } else if (section.type === "languages" && opts.languagesLayout === "inline") {
      pushLanguageItems(current.children, section, opts)
    } else {
      for (const item of section.items) {
        current.children.push(...renderItem(section.type, item, opts))
      }
    }
  }

  return segments.filter((segment, index) => index === 0 || segment.children.length > 0)
}

export function buildDocxDocument(document: CvDocument): Document {
  const opts = docxOptionsFor(document)
  const { height, width } = PAGE_SIZE_MM[opts.pageSize]
  const pageProps = {
    size: {
      width: convertMillimetersToTwip(width),
      height: convertMillimetersToTwip(height),
    },
    margin: {
      top: convertMillimetersToTwip(opts.marginMm),
      bottom: convertMillimetersToTwip(opts.marginMm),
      left: convertMillimetersToTwip(opts.marginMm),
      right: convertMillimetersToTwip(opts.marginMm),
    },
  }
  const segments = buildDocxSegments(document)
  const author = document.contact.fullName || document.name
  return new Document({
    creator: author,
    lastModifiedBy: author,
    title: document.contact.fullName ? `${document.contact.fullName} - CV` : document.name,
    styles: {
      default: {
        document: {
          run: {
            font: opts.fontName,
            size: opts.look.bodySize ?? 22,
            // Tag the language so Word spell-checks and hyphenates correctly,
            // and so a parser can tell which language the text is in.
            language: { value: LANGUAGE_TAGS[opts.locale], bidirectional: "ar-SA" },
          },
          paragraph: { spacing: { after: sp(opts, 120) } },
        },
      },
    },
    sections: segments.map((segment, index) => ({
      properties: {
        ...(index > 0 ? { type: SectionType.CONTINUOUS } : {}),
        ...(segment.twoColumns ? { column: { count: 2, space: 360 } } : {}),
        page: pageProps,
      },
      children: segment.children,
    })),
  })
}

export async function toDocxBlob(document: CvDocument): Promise<Blob> {
  return Packer.toBlob(buildDocxDocument(document))
}

export async function toDocxBuffer(document: CvDocument): Promise<Buffer> {
  return Packer.toBuffer(buildDocxDocument(document))
}
