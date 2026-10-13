import { describe, expect, it } from "vitest"
import { inflateRawSync } from "node:zlib"
import { HeadingLevel } from "docx"
import { sampleAr, sampleEn } from "@ats/templates"

import { buildDocxDocument, docxOptionsFor, toDocxBuffer } from "../src/docx/docx-exporter"

function readDocumentXml(buffer: Buffer, part = "word/document.xml"): string {
  const end = buffer.lastIndexOf(Buffer.from("PK\x05\x06"))
  const entryCount = buffer.readUInt16LE(end + 10)
  const entries: Record<string, { localOffset: number; size: number; method: number }> = {}
  let offset = buffer.readUInt32LE(end + 16)
  for (let i = 0; i < entryCount; i++) {
    const nameLen = buffer.readUInt16LE(offset + 28)
    const extraLen = buffer.readUInt16LE(offset + 30)
    const commentLen = buffer.readUInt16LE(offset + 32)
    const name = buffer.subarray(offset + 46, offset + 46 + nameLen).toString()
    entries[name] = {
      localOffset: buffer.readUInt32LE(offset + 42),
      size: buffer.readUInt32LE(offset + 20),
      method: buffer.readUInt16LE(offset + 10),
    }
    offset += 46 + nameLen + extraLen + commentLen
  }
  const entry = entries[part]
  const localHeaderSize =
    30 + buffer.readUInt16LE(entry.localOffset + 26) + buffer.readUInt16LE(entry.localOffset + 28)
  const data = buffer.subarray(
    entry.localOffset + localHeaderSize,
    entry.localOffset + localHeaderSize + entry.size,
  )
  return entry.method === 0 ? data.toString("utf8") : inflateRawSync(data).toString("utf8")
}

describe("docx exporter", () => {
  it("places full name in the title paragraph", async () => {
    const xml = readDocumentXml(await toDocxBuffer(sampleEn()))
    expect(xml).toContain("Sarah Mitchell")
    expect(xml).toMatch(/w:sz w:val="44"/)
  })

  it("uses heading styles for sections", async () => {
    const xml = readDocumentXml(await toDocxBuffer(sampleEn()))
    expect(xml).toMatch(/w:pStyle w:val="Heading2"/)
    expect(xml).toContain("Work Experience")
    expect(xml).toContain("Education")
    expect(xml).toContain("Skills")
  })

  it("preserves section order in the output", async () => {
    const xml = readDocumentXml(await toDocxBuffer(sampleEn()))
    expect(xml.indexOf("Work Experience")).toBeLessThan(xml.indexOf("Education"))
  })

  it("emits bullets (numbering) for experience descriptions", async () => {
    const xml = readDocumentXml(await toDocxBuffer(sampleEn()))
    expect(xml).toMatch(/w:numPr/)
    expect(xml).toContain("Led redesign of the onboarding flow")
  })

  it("does not use tables for layout", async () => {
    const xml = readDocumentXml(await toDocxBuffer(sampleEn()))
    expect(xml).not.toMatch(/<w:tbl>/)
  })

  it("marks Arabic paragraphs as RTL", async () => {
    const xml = readDocumentXml(await toDocxBuffer(sampleAr()))
    expect(xml).toMatch(/<w:bidi\/>/)
  })

  it("emits bold category labels for categorized skills", async () => {
    const en = sampleEn()
    const skills = en.sections.find((section) => section.type === "skills")
    ;(skills!.items[0] as { category?: string }).category = "Technical"
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toContain(">Technical<")
  })

  it("renders one compact 'Category: a, b, c' paragraph per group when skillsLayout is inline", async () => {
    const en = sampleEn()
    const skills = en.sections.find((section) => section.type === "skills")!
    const items = skills.items as { name: string; category?: string }[]
    items[0].category = "Technical"
    items[1].category = "Technical"
    en.templateSettings.skillsLayout = "inline"
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toContain(">Technical: <")
    expect(xml).toContain(`>${items[0].name}, ${items[1].name}<`)
  })

  it("puts the date behind a right tab stop on the title line when datePlacement is right", async () => {
    const en = sampleEn()
    en.templateId = "ats-professional-01"
    en.templateSettings.datePlacement = "right"
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toMatch(/<w:tab w:val="right" w:pos="\d+"\/>/)
    expect(xml).toContain("<w:tab/>")
    // still linear text: no tables, no text boxes
    expect(xml).not.toContain("<w:tbl>")
    expect(xml).not.toContain("w:txbxContent")
  })

  it("uses the reference punctuation, caps name and caps headings for the Professional template", async () => {
    const en = sampleEn()
    en.templateId = "ats-professional-01"
    en.templateSettings.datePlacement = "right"
    en.templateSettings.accentColor = "navy"
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toContain(en.contact.fullName.toUpperCase())
    expect(xml).toContain("\u2013") // en dash in date ranges
    expect(xml).toMatch(/<w:pBdr><w:bottom /)
    expect(xml).toMatch(/w:val="\S*"\s[^>]*w:color="[0-9A-F]{6}"/)
  })

  it("keeps dates inline (no tab stop) unless right-aligned dates are chosen", async () => {
    const xml = readDocumentXml(await toDocxBuffer(sampleEn()))
    expect(xml).not.toContain("<w:tab/>")
  })

  it("renders one dense paragraph for Languages when languagesLayout is inline", async () => {
    const en = sampleEn()
    const langSection = en.sections.find((section) => section.type === "languages")!
    langSection.enabled = true
    en.templateSettings.languagesLayout = "inline"
    const xml = readDocumentXml(await toDocxBuffer(en))
    const items = langSection.items as { name: string }[]
    expect(xml).toContain(items[0].name)
  })

  it("writes the Bilingual level in the document language", async () => {
    for (const [locale, label] of [
      ["en", "Bilingual"],
      ["fr", "Bilingue"],
      ["ar", "ثنائي اللغة"],
    ] as const) {
      const doc = sampleEn()
      doc.locale = locale
      doc.direction = locale === "ar" ? "rtl" : "ltr"
      const languages = doc.sections.find((s) => s.type === "languages")!
      languages.enabled = true
      languages.items = [{ id: "lang-1", name: "Arabic", level: "bilingual" }]
      const xml = readDocumentXml(await toDocxBuffer(doc))
      expect(xml, locale).toContain(label)
    }
  })

  it("keeps languages as one block per line by default", () => {
    expect(docxOptionsFor(sampleEn()).languagesLayout).toBe("list")
  })

  function withSoftSkills() {
    const base = sampleEn()
    return {
      ...base,
      sections: [
        ...base.sections,
        {
          id: "section-soft",
          type: "softSkills" as const,
          title: "Soft Skills",
          enabled: true,
          order: base.sections.length,
          items: ["Communication", "Teamwork", "Adaptability"].map((name, i) => ({
            id: `soft-${i}`,
            name,
          })),
        },
      ],
    }
  }

  it("writes soft skills comma-separated by default", async () => {
    const xml = readDocumentXml(await toDocxBuffer(withSoftSkills()))
    expect(xml).toContain("Communication, Teamwork, Adaptability")
    expect(xml).toContain("Soft Skills")
  })

  it("writes soft skills bullet-separated when inlineSeparator is bullet", async () => {
    const en = withSoftSkills()
    en.templateSettings.inlineSeparator = "bullet"
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toContain("Communication\u00a0\u00a0\u2022\u00a0 Teamwork")
  })

  it("uses the same separator choice for inline skills", async () => {
    const en = sampleEn()
    en.templateSettings.skillsLayout = "inline"
    en.templateSettings.inlineSeparator = "bullet"
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toContain("\u2022")
    expect(docxOptionsFor(sampleEn()).inlineSeparator).toBe("comma")
  })

  it("separates inline languages with a vertical bar", async () => {
    const en = sampleEn()
    const langSection = en.sections.find((section) => section.type === "languages")!
    langSection.enabled = true
    en.templateSettings.languagesLayout = "inline"
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toContain("\u00a0\u00a0|\u00a0 ")
  })

  it("does not write the job title twice when the headline is the same text", async () => {
    const en = sampleEn()
    en.contact.jobTitle = "Computer Engineer"
    en.headline = "computer engineer "
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml.split("omputer ").length - 1).toBe(1)
  })

  it("keeps both lines when the headline differs from the job title", async () => {
    const en = sampleEn()
    en.contact.jobTitle = "Computer Engineer"
    en.headline = "Open to relocation"
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toContain("Computer Engineer")
    expect(xml).toContain("Open to relocation")
  })

  it("writes soft skills as one paragraph", async () => {
    const en = withSoftSkills()
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toContain("Communication")
    expect(xml).toContain("Soft Skills")
  })

  it("moves the whole date to its own line when the title is too long, instead of splitting it", async () => {
    const long = sampleEn()
    long.templateId = "ats-professional-01"
    long.templateSettings.datePlacement = "right"
    const edu = long.sections.find((s) => s.type === "education")!.items[0] as { degree: string }
    edu.degree =
      "Master of Science in Computer Mathematics and Distributed Information Systems Engineering"
    const longXml = readDocumentXml(await toDocxBuffer(long))
    expect(longXml).toMatch(/<w:br\/>\s*<w:tab\/>/)

    const short = sampleEn()
    short.templateId = "ats-professional-01"
    short.templateSettings.datePlacement = "right"
    const eduShort = short.sections.find((s) => s.type === "education")!.items[0] as {
      degree: string
    }
    eduShort.degree = "BSc"
    const shortXml = readDocumentXml(await toDocxBuffer(short))
    expect(shortXml).not.toMatch(/<w:br\/>\s*<w:tab\/>/)
  })

  it("draws the thin rule under the contact line for the Professional template only", async () => {
    const pro = sampleEn()
    pro.templateId = "ats-professional-01"
    const proXml = readDocumentXml(await toDocxBuffer(pro))
    const headingRules = (proXml.match(/<w:pBdr>/g) ?? []).length
    const sections = pro.sections.filter((s) => s.enabled && s.items.length > 0).length
    expect(headingRules).toBe(sections + 1) // one per heading + the contact line
    // another template: a rule under each heading (its separator style) but none under the contact line
    const other = readDocumentXml(await toDocxBuffer(sampleEn()))
    expect((other.match(/<w:pBdr>/g) ?? []).length).toBe(sections)
  })

  describe("design options reach the Word file", () => {
    const build = async (patch: Record<string, unknown>) => {
      const doc = sampleEn()
      Object.assign(doc.templateSettings, patch)
      return readDocumentXml(await toDocxBuffer(doc))
    }
    const afters = (xml: string) => (xml.match(/<w:spacing [^>]*w:after="(\d+)"/g) ?? []).join("|")

    it("scales vertical spacing with the spacing density", async () => {
      const [compact, standard, comfortable] = await Promise.all(
        ["compact", "standard", "comfortable"].map((spacingDensity) => build({ spacingDensity })),
      )
      expect(new Set([afters(compact), afters(standard), afters(comfortable)]).size).toBe(3)
      expect(standard).toMatch(/w:before="200"[^>]*w:after="120"|w:after="120"[^>]*w:before="200"/)
      expect(compact).toMatch(/w:before="150"/)
      expect(comfortable).toMatch(/w:before="250"/)
    })

    it("uppercases headings only for the uppercase heading style", async () => {
      const upper = await build({ headingStyle: "uppercase" })
      const bold = await build({ headingStyle: "bold" })
      const simple = await build({ headingStyle: "simple" })
      expect(upper).toContain(">WORK EXPERIENCE<")
      expect(bold).toContain(">Work Experience<")
      expect(simple).toContain(">Work Experience<")
      expect(new Set([upper, bold, simple]).size).toBe(3)
    })

    it("draws the chosen separator under headings, in the accent colour when there is one", async () => {
      // attribute order in the XML is not significant, so check each attribute on the border element
      const border = (xml: string) => xml.match(/<w:pBdr><w:bottom ([^>]*)\/><\/w:pBdr>/)?.[1] ?? ""
      expect(await build({ separatorStyle: "none" })).not.toContain("<w:pBdr>")
      const ruled = border(await build({ separatorStyle: "ruled" }))
      expect(ruled).toContain('w:val="single"')
      expect(ruled).toContain('w:sz="8"')
      expect(ruled).toContain('w:color="2D2D2D"')
      const subtle = border(await build({ separatorStyle: "subtle" }))
      expect(subtle).toContain('w:sz="6"')
      expect(subtle).toContain('w:color="C8C8C8"')
      expect(border(await build({ separatorStyle: "dashed" }))).toContain('w:val="dashed"')
      expect(border(await build({ separatorStyle: "ruled", accentColor: "navy" }))).toContain(
        'w:color="1F3A5F"',
      )
    })

    it("centres the name and contact lines when the contact alignment is centre", async () => {
      expect(await build({ contactAlignment: "left" })).not.toContain('<w:jc w:val="center"/>')
      const centred = await build({ contactAlignment: "center" })
      expect((centred.match(/<w:jc w:val="center"\/>/g) ?? []).length).toBeGreaterThanOrEqual(3)
    })

    it("gives headings an explicit bold dark ink instead of Word's thin default blue", async () => {
      const xml = await build({ accentColor: "none" })
      expect(xml).toMatch(
        /<w:pStyle w:val="Heading[23]"\/>[^]*?<w:b\/>[^]*?<w:color w:val="111111"\/>/,
      )
      expect(xml).not.toContain("2E74B5")
    })
  })

  describe("file properties", () => {
    it("names the author and title after the candidate, not 'Un-named'", async () => {
      const buf = await toDocxBuffer(sampleEn())
      const core = readDocumentXml(buf, "docProps/core.xml")
      expect(core).toContain("<dc:creator>Sarah Mitchell</dc:creator>")
      expect(core).toContain("<dc:title>Sarah Mitchell - CV</dc:title>")
      expect(core).not.toContain("Un-named")
    })

    it("tags the document language so Word and parsers know it", async () => {
      for (const [doc, tag] of [
        [sampleEn(), "en-US"],
        [sampleAr(), "ar-SA"],
      ] as const) {
        const styles = readDocumentXml(await toDocxBuffer(doc), "word/styles.xml")
        expect(styles).toContain(`w:val="${tag}"`)
      }
    })

    it("only uses fonts that are installed with Word and Windows/macOS", async () => {
      const { DOCX_FONT_MAP } = await import("../src/docx/docx-exporter")
      const webOnly = ["Inter", "Source Sans 3", "Lora", "Montserrat"]
      expect(Object.values(DOCX_FONT_MAP).filter((f) => webOnly.includes(f))).toEqual([])
      expect(DOCX_FONT_MAP.montserrat).toBe("Arial")
    })
  })

  it("bolds language names in the compact languages line", async () => {
    const en = sampleEn()
    en.templateSettings.languagesLayout = "inline"
    const lang = en.sections.find((s) => s.type === "languages")!
    lang.enabled = true
    const first = (lang.items[0] as { name: string }).name
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toMatch(new RegExp(`<w:b/>[^]*?<w:t[^>]*>${first}:</w:t>`))
  })

  it("keeps skills as a bulleted list by default", () => {
    expect(docxOptionsFor(sampleEn()).skillsLayout).toBe("list")
  })

  it("uses a continuous two-column section when listColumns is two", async () => {
    const en = sampleEn()
    en.templateSettings.listColumns = "two"
    const xml = readDocumentXml(await toDocxBuffer(en))
    expect(xml).toMatch(/w:cols[^>]*w:num="2"/)
  })

  it("keeps single-column output by default", async () => {
    const xml = readDocumentXml(await toDocxBuffer(sampleEn()))
    expect(xml).not.toMatch(/w:num="2"/)
  })

  it("maps font id to a Word font name", () => {
    const en = sampleEn()
    expect(docxOptionsFor(en).fontName).toBe("Arial")
    en.templateSettings.fontId = "times"
    expect(docxOptionsFor(en).fontName).toBe("Times New Roman")
  })

  it("uses Heading3 for technical family, Heading2 otherwise", () => {
    const en = sampleEn()
    en.templateId = "ats-technical-01"
    expect(docxOptionsFor(en).sectionHeadingLevel).toBe(HeadingLevel.HEADING_3)
    en.templateId = "ats-classic-01"
    expect(docxOptionsFor(en).sectionHeadingLevel).toBe(HeadingLevel.HEADING_2)
  })

  it("produces a valid docx zip", async () => {
    const buffer = await toDocxBuffer(sampleEn())
    expect(buffer.length).toBeGreaterThan(1000)
    expect(buffer.subarray(0, 2).toString()).toBe("PK")
    expect(buildDocxDocument(sampleEn())).toBeDefined()
  })

  it("maps bulletStyle from template settings", () => {
    const en = sampleEn()
    expect(docxOptionsFor(en).bulletStyle).toBe("disc")
    en.templateSettings.bulletStyle = "hyphen"
    expect(docxOptionsFor(en).bulletStyle).toBe("hyphen")
  })

  it("emits hyphen-prefixed plain paragraphs when bulletStyle is hyphen", async () => {
    const doc = sampleEn()
    doc.templateSettings.bulletStyle = "hyphen"
    const xml = readDocumentXml(await toDocxBuffer(doc))
    expect(xml).toMatch(/w:t[^>]*>- <\/w:t>/)
    expect(xml).toContain("Led redesign of the onboarding flow")
    expect(xml).not.toMatch(/w:numPr/)
  })

  it("includes certification links in the output", async () => {
    const doc = sampleEn()
    const certSection = doc.sections.find((section) => section.type === "certifications")
    expect(certSection).toBeDefined()
    const cert = certSection!.items[0] as { name: string; link: string }
    cert.link = "credly.example/verify/abc123"
    const xml = readDocumentXml(await toDocxBuffer(doc))
    expect(xml).toContain("credly.example/verify/abc123")
  })

  it("includes publication URLs in the output", async () => {
    const doc = sampleEn()
    const pubSection = doc.sections.find((section) => section.type === "publications")
    expect(pubSection).toBeDefined()
    const pub = pubSection!.items[0] as { title: string; url: string }
    pub.url = "doi.example/10.1000/xyz"
    const xml = readDocumentXml(await toDocxBuffer(doc))
    expect(xml).toContain("doi.example/10.1000/xyz")
  })
})
