import { printPageRule } from "../src/print"
import { describe, expect, it } from "vitest"

import { TEMPLATES } from "../src/registry"
import { renderTemplateHtml, validateRegistry, atsViolations } from "../src/validation"
import { sampleAr } from "../src/samples/sample-ar"
import { sampleEn } from "../src/samples/sample-en"
import { sampleFr } from "../src/samples/sample-fr"
import { sampleLong } from "../src/samples/sample-long"

/** The shared samples have no soft-skills section; add one for these tests. */
function withSoftSkills<T extends { sections: unknown[] }>(doc: T, names: string[]): T {
  const section = {
    id: "section-soft",
    type: "softSkills" as const,
    title: "Soft Skills",
    enabled: true,
    order: doc.sections.length,
    items: names.map((name, i) => ({ id: `soft-${i}`, name })),
  }
  return { ...doc, sections: [...doc.sections, section] }
}

describe("registry validation", () => {
  it("produces no errors for the full registry", () => {
    const issues = validateRegistry(TEMPLATES)
    const errors = issues.filter((issue) => issue.severity === "error")
    expect(errors).toEqual([])
  })
})

describe("ATS render safety", () => {
  const samples = [
    { name: "en", doc: sampleEn(), locale: "en" as const, direction: "ltr" as const },
    { name: "fr", doc: sampleFr(), locale: "fr" as const, direction: "ltr" as const },
    { name: "ar", doc: sampleAr(), locale: "ar" as const, direction: "rtl" as const },
    { name: "long", doc: sampleLong(), locale: "en" as const, direction: "ltr" as const },
  ]

  for (const template of TEMPLATES) {
    it(`${template.id} renders all samples without ATS violations`, () => {
      for (const sample of samples) {
        const html = renderTemplateHtml(
          template.render,
          sample.doc,
          template.defaults,
          sample.locale,
          sample.direction,
        )
        expect(atsViolations(html), `${template.id} + ${sample.name}`).toEqual([])
      }
    })
  }

  it("renders contact name, headings and skills for the English sample", () => {
    const template = TEMPLATES[0]
    const html = renderTemplateHtml(template.render, sampleEn(), template.defaults, "en", "ltr")
    expect(html).toContain("Sarah Mitchell")
    expect(html).toContain("Work Experience")
    expect(html).toContain("Figma")
  })

  it("renders localized fallback headings in French and Arabic", () => {
    const template = TEMPLATES[0]
    const frDoc = sampleFr()
    frDoc.sections.forEach((section) => {
      section.title = ""
    })
    const fr = renderTemplateHtml(template.render, frDoc, template.defaults, "fr", "ltr")
    expect(fr).toContain("Expérience professionnelle")
    const arDoc = sampleAr()
    arDoc.sections.forEach((section) => {
      section.title = ""
    })
    const ar = renderTemplateHtml(template.render, arDoc, template.defaults, "ar", "rtl")
    expect(ar).toContain("الخبرة المهنية")
    expect(ar).toContain('dir="rtl"')
  })

  it("respects user section title overrides", () => {
    const template = TEMPLATES[0]
    const doc = sampleEn()
    doc.sections[0].title = "My Custom Summary"
    const html = renderTemplateHtml(template.render, doc, template.defaults, "en", "ltr")
    expect(html).toContain("My Custom Summary")
    expect(html).not.toContain("Professional Summary")
  })

  it("omits empty and disabled sections", () => {
    const template = TEMPLATES[0]
    const doc = sampleEn()
    doc.sections.forEach((section) => {
      section.enabled = false
    })
    const html = renderTemplateHtml(template.render, doc, template.defaults, "en", "ltr")
    expect(html).not.toContain("Work Experience")
  })

  it("renders hyphen bullets when bulletStyle is hyphen", () => {
    const template = TEMPLATES[0]
    const html = renderTemplateHtml(
      template.render,
      sampleEn(),
      { ...template.defaults, bulletStyle: "hyphen" },
      "en",
      "ltr",
    )
    expect(html).toContain(">Shipped MVP in 9 months with a two-person design team</li>")
    expect(html).toContain("list-style:&quot;-&quot;")
    expect(html).not.toContain("- Shipped MVP")
  })

  it("renders disc bullets by default", () => {
    const template = TEMPLATES[0]
    const html = renderTemplateHtml(template.render, sampleEn(), template.defaults, "en", "ltr")
    expect(html).toContain("<li")
  })

  it("renders skills as disc bullets in every family", () => {
    for (const template of TEMPLATES) {
      const html = renderTemplateHtml(
        template.render,
        sampleEn(),
        { ...template.defaults, skillsLayout: "list" },
        "en",
        "ltr",
      )
      expect(html, `${template.id} should render skills as disc list items`).toMatch(
        /<li[^>]*>Figma<\/li>/,
      )
    }
  })

  it("renders skills as hyphen bullets in every family", () => {
    for (const template of TEMPLATES) {
      const html = renderTemplateHtml(
        template.render,
        sampleEn(),
        { ...template.defaults, bulletStyle: "hyphen", skillsLayout: "list" },
        "en",
        "ltr",
      )
      expect(html, `${template.id} should render skills as hyphen list items`).toMatch(
        /<li[^>]*>Figma<\/li>/,
      )
      expect(html, `${template.id} should use the hyphen marker`).toContain(
        "list-style:&quot;-&quot;",
      )
    }
  })

  it("keeps disc markers close to the text (no extra li padding)", () => {
    const template = TEMPLATES[0]
    const html = renderTemplateHtml(template.render, sampleEn(), template.defaults, "en", "ltr")
    const hyphenHtml = renderTemplateHtml(
      template.render,
      sampleEn(),
      { ...template.defaults, bulletStyle: "hyphen" },
      "en",
      "ltr",
    )
    expect(html).not.toContain("padding-inline-start:14pt")
    expect(hyphenHtml).not.toContain("padding-inline-start:14pt")
    expect(html).toContain('padding-inline-start:10pt"')
  })

  it("groups skills under custom category labels (uncategorized first)", () => {
    const template = TEMPLATES[0]
    const doc = sampleEn()
    const skills = doc.sections.find((section) => section.type === "skills")
    const items = skills!.items as Array<{ name: string; category?: string }>
    items[0].category = "Design"
    const html = renderTemplateHtml(template.render, doc, template.defaults, "en", "ltr")
    expect(html).toContain('class="cv-skill-category"')
    expect(html).toContain(">Design</p>")
    const labelAt = html.indexOf("cv-skill-category")
    const firstUngrouped = html.indexOf(items[1].name)
    const categorized = html.indexOf(items[0].name, labelAt)
    expect(firstUngrouped).toBeGreaterThan(-1)
    expect(firstUngrouped).toBeLessThan(labelAt)
    expect(categorized).toBeGreaterThan(labelAt)
  })

  it("renders two-column skill lists on screen when listColumns is two", () => {
    const template = TEMPLATES[0]
    const html = renderTemplateHtml(
      template.render,
      sampleEn(),
      { ...template.defaults, listColumns: "two" },
      "en",
      "ltr",
      "preview",
    )
    expect(html).toContain("columns:2")
    expect(html).toContain("column-gap:18pt")
  })

  it("applies columns within each category when combined, on screen", () => {
    const template = TEMPLATES[0]
    const doc = sampleEn()
    const skills = doc.sections.find((section) => section.type === "skills")
    ;(skills!.items[0] as { category?: string }).category = "Design"
    const html = renderTemplateHtml(
      template.render,
      doc,
      { ...template.defaults, listColumns: "two" },
      "en",
      "ltr",
      "preview",
    )
    const columnLists = html.match(/columns:2/g) ?? []
    expect(columnLists.length).toBeGreaterThanOrEqual(2)
  })

  it("renders a compact 'Category: a, b, c' line per group when skillsLayout is inline", () => {
    const template = TEMPLATES[0]
    const doc = sampleEn()
    const skills = doc.sections.find((section) => section.type === "skills")!
    const items = skills.items as { name: string; category?: string }[]
    items[0].category = "Technical"
    items[1].category = "Technical"
    const html = renderTemplateHtml(
      template.render,
      doc,
      { ...template.defaults, skillsLayout: "inline" },
      "en",
      "ltr",
      "print",
    )
    expect(html).toContain("cv-skill-inline")
    expect(html).toContain("Technical:")
    expect(html).toContain(`${items[0].name}, ${items[1].name}`)
    // The Skills section must be plain linear text: no <li> and no <ul> inside it.
    const skillsSection = html
      .split('<h2 class="cv-section-heading"')
      .find((chunk) => chunk.includes("cv-skill-inline"))!
    const skillsBody = skillsSection.split("</section>")[0]
    expect(skillsBody).not.toContain("<li")
    expect(skillsBody).not.toContain("<ul")
  })

  it("keeps inline skills ATS-clean on every template, even with listColumns two", () => {
    for (const template of TEMPLATES) {
      const doc = sampleEn()
      const skills = doc.sections.find((section) => section.type === "skills")!
      ;(skills.items[0] as { category?: string }).category = "Technical"
      const html = renderTemplateHtml(
        template.render,
        doc,
        { ...template.defaults, skillsLayout: "inline", listColumns: "two" },
        "en",
        "ltr",
        "print",
      )
      expect(html, `${template.id} inline skills`).toContain("cv-skill-inline")
      expect(atsViolations(html, { allowColumns: true }), `${template.id} inline skills`).toEqual(
        [],
      )
    }
  })

  it("right-aligns dates on the title line when datePlacement is right, on any template", () => {
    for (const template of TEMPLATES) {
      const html = renderTemplateHtml(
        template.render,
        sampleEn(),
        { ...template.defaults, datePlacement: "right" },
        "en",
        "ltr",
        "print",
      )
      expect(html, `${template.id} right dates`).toContain("cv-item-date")
      expect(atsViolations(html), `${template.id} right dates`).toEqual([])
    }
  })

  it("keeps dates inline by default, except on the Headline family", () => {
    for (const template of TEMPLATES) {
      const html = renderTemplateHtml(
        template.render,
        sampleEn(),
        template.defaults,
        "en",
        "ltr",
        "print",
      )
      const expected = template.family === "headline" || template.family === "professional"
      expect(html.includes("cv-item-date"), `${template.id}`).toBe(expected)
    }
  })

  it("lets an explicit inline choice override a family that right-aligns by default", () => {
    const headline = TEMPLATES.find((t) => t.family === "headline")!
    const html = renderTemplateHtml(
      headline.render,
      sampleEn(),
      { ...headline.defaults, datePlacement: "inline" },
      "en",
      "ltr",
      "print",
    )
    expect(html).not.toContain("cv-item-date")
  })

  it("writes the Professional look with reference punctuation: em dash, comma, en-dash range", () => {
    const pro = TEMPLATES.find((t) => t.id === "ats-professional-01")!
    const doc = sampleEn()
    const exp = doc.sections.find((s) => s.type === "experience")!.items[0] as {
      role: string
      company: string
      location: string
      startDate: string
      endDate: string
      current: boolean
    }
    exp.company = "Acme"
    exp.location = "Paris"
    exp.startDate = "2020-01"
    exp.endDate = "2022-03"
    exp.current = false
    const html = renderTemplateHtml(pro.render, doc, pro.defaults, "en", "ltr", "print")
    expect(html).toContain("\u2014 Acme, Paris")
    expect(html).toContain("Jan 2020 \u2013 Mar 2022")
    expect(html).toContain("text-transform:uppercase")
    expect(atsViolations(html)).toEqual([])
  })

  it("renders one dense line for Languages when languagesLayout is inline", () => {
    const template = TEMPLATES[0]
    const doc = sampleLong()
    const html = renderTemplateHtml(
      template.render,
      doc,
      { ...template.defaults, languagesLayout: "inline" },
      "en",
      "ltr",
      "print",
    )
    expect(html).toContain("cv-language-inline")
    const langSection = doc.sections.find((s) => s.type === "languages")!
    const items = langSection.items as { name: string }[]
    expect(html).toContain(items[0].name)
    if (items[1]) expect(html).toContain(items[1].name)
  })

  it("keeps languages ATS-clean on every template when inline, even with listColumns two", () => {
    for (const template of TEMPLATES) {
      const doc = sampleLong()
      const html = renderTemplateHtml(
        template.render,
        doc,
        { ...template.defaults, languagesLayout: "inline", listColumns: "two" },
        "en",
        "ltr",
        "print",
      )
      expect(html, `${template.id} inline languages`).toContain("cv-language-inline")
      expect(
        atsViolations(html, { allowColumns: true }),
        `${template.id} inline languages`,
      ).toEqual([])
    }
  })

  it("bolds the language names in the compact languages line", () => {
    const template = TEMPLATES[0]
    const doc = sampleLong()
    const first = (doc.sections.find((s) => s.type === "languages")!.items[0] as { name: string })
      .name
    const html = renderTemplateHtml(
      template.render,
      doc,
      { ...template.defaults, languagesLayout: "inline" },
      "en",
      "ltr",
      "print",
    )
    expect(html).toMatch(new RegExp(`font-weight:700">${first}:</span>`))
  })

  it("shows the Bilingual level in every language, in both language layouts", () => {
    const template = TEMPLATES[0]
    const cases = [
      ["en", "ltr", "Bilingual"],
      ["fr", "ltr", "Bilingue"],
      ["ar", "rtl", "ثنائي اللغة"],
    ] as const
    for (const layout of ["list", "inline"] as const) {
      for (const [locale, direction, label] of cases) {
        const doc = sampleEn()
        const languages = doc.sections.find((s) => s.type === "languages")!
        languages.enabled = true
        languages.items = [{ id: "lang-1", name: "Arabic", level: "bilingual" }]
        const html = renderTemplateHtml(
          template.render,
          doc,
          { ...template.defaults, languagesLayout: layout },
          locale,
          direction,
          "print",
        )
        expect(html, `${layout} ${locale}`).toContain(label)
        expect(atsViolations(html), `${layout} ${locale}`).toEqual([])
      }
    }
  })

  it("keeps one language block per line by default", () => {
    const template = TEMPLATES[0]
    const html = renderTemplateHtml(
      template.render,
      sampleLong(),
      template.defaults,
      "en",
      "ltr",
      "print",
    )
    expect(html).not.toContain("cv-language-inline")
  })

  it("renders soft skills as one comma-separated line on every template, ATS-clean", () => {
    for (const template of TEMPLATES) {
      const doc = withSoftSkills(sampleEn(), ["Communication", "Teamwork", "Adaptability"])
      const html = renderTemplateHtml(
        template.render,
        doc,
        { ...template.defaults, listColumns: "two" },
        "en",
        "ltr",
        "print",
      )
      expect(html, `${template.id}`).toContain("cv-softskills-inline")
      expect(html, `${template.id}`).toContain("Communication, Teamwork, Adaptability")
      expect(html, `${template.id}`).toContain("Soft Skills")
      expect(atsViolations(html, { allowColumns: true }), `${template.id}`).toEqual([])
    }
  })

  it("uses a bullet between soft skills and inline skills when inlineSeparator is bullet", () => {
    const template = TEMPLATES[0]
    const doc = withSoftSkills(sampleEn(), ["Communication", "Teamwork"])
    const html = renderTemplateHtml(
      template.render,
      doc,
      { ...template.defaults, inlineSeparator: "bullet", skillsLayout: "inline" },
      "en",
      "ltr",
      "print",
    )
    expect(html).toContain("Communication\u00a0\u00a0\u2022\u00a0 Teamwork")
    expect(atsViolations(html), template.id).toEqual([])
  })

  it("separates inline languages with a vertical bar, not bare spaces", () => {
    const template = TEMPLATES[0]
    const doc = sampleEn()
    const section = doc.sections.find((candidate) => candidate.type === "languages")!
    section.enabled = true
    const html = renderTemplateHtml(
      template.render,
      doc,
      { ...template.defaults, languagesLayout: "inline" },
      "en",
      "ltr",
      "print",
    )
    expect(html).toContain("cv-language-inline")
    expect(html).toContain("\u00a0\u00a0|\u00a0 ")
  })

  it("titles the soft skills section in the document language", () => {
    const template = TEMPLATES[0]
    const doc = withSoftSkills(sampleEn(), ["Communication"])
    const fr = renderTemplateHtml(template.render, doc, template.defaults, "fr", "ltr", "print")
    expect(fr).toContain("Compétences transversales")
    const ar = renderTemplateHtml(template.render, doc, template.defaults, "ar", "rtl", "print")
    expect(ar).toContain("المهارات الشخصية")
  })

  it("omits an empty soft skills section's content but never crashes", () => {
    const template = TEMPLATES[0]
    const doc = withSoftSkills(sampleEn(), [])
    const html = renderTemplateHtml(template.render, doc, template.defaults, "en", "ltr", "print")
    expect(html).not.toContain("cv-softskills-inline")
  })

  it("compact header: each contact item stays whole but the line can wrap between items", () => {
    for (const template of TEMPLATES.filter((t) => t.family === "compact")) {
      const doc = sampleEn()
      const { email, phone, location } = doc.contact
      const html = renderTemplateHtml(template.render, doc, template.defaults, "en", "ltr", "print")
      for (const item of [email, phone, location]) {
        expect(html, template.id).toContain(`white-space:nowrap">${item}</span>`)
      }
      // no single unbreakable run holding several items (that overflowed the margin)
      expect(html, template.id).not.toMatch(/white-space:nowrap[^>]*>[^<]*@[^<]* \u00b7 /)
      // the text a parser reads is unchanged
      const text = html.replace(/<[^>]+>/g, "")
      expect(text, template.id).toContain(`${email} \u00b7 ${phone} \u00b7 ${location}`)
    }
  })

  it("print pages carry no padding or fixed height of their own, the @page margin does", () => {
    for (const template of TEMPLATES) {
      const doc = sampleLong()
      const print = renderTemplateHtml(
        template.render,
        doc,
        template.defaults,
        "en",
        "ltr",
        "print",
      )
      const screen = renderTemplateHtml(
        template.render,
        doc,
        template.defaults,
        "en",
        "ltr",
        "preview",
      )
      const page = (html: string) => html.match(/<div[^>]*class="cv-page"[^>]*style="([^"]*)"/)![1]
      expect(page(print), `${template.id} print`).not.toMatch(/(^|;)padding:[1-9]/)
      expect(page(print), `${template.id} print`).not.toMatch(/(^|;)height:\d/)
      expect(page(screen), `${template.id} preview`).toMatch(/padding:\d/)
      expect(page(screen), `${template.id} preview`).toMatch(/height:\d/)
    }
  })

  it("builds the @page rule from the document's margin preset", () => {
    expect(printPageRule("a4", "cv", "compact")).toBe("@page { size: a4 portrait; margin: 12mm; }")
    expect(printPageRule("letter", "cv", "standard")).toBe(
      "@page { size: letter portrait; margin: 16mm; }",
    )
    expect(printPageRule("a4", "cv", "comfortable")).toBe(
      "@page { size: a4 portrait; margin: 20mm; }",
    )
    expect(printPageRule("a4", "cv", undefined)).toContain("margin: 16mm")
    expect(printPageRule("a4", "cover-letter")).toContain("margin: 0mm")
  })

  it("lists sections in the document's own order in every family, Functional included", () => {
    const headingsOf = (html: string) =>
      [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1].replace(/&amp;/g, "&"))
    const doc = sampleEn()
    const expected = doc.sections.filter((s) => s.enabled && s.items.length > 0).map((s) => s.type)
    for (const template of TEMPLATES) {
      const html = renderTemplateHtml(template.render, doc, template.defaults, "en", "ltr", "print")
      expect(headingsOf(html).length, template.id).toBe(expected.length)
      // Skills must never jump ahead of Experience, which the old Functional layout did.
      const order = headingsOf(html).map((h) => h.toLowerCase())
      const exp = order.findIndex((h) => h.includes("experience"))
      const skills = order.findIndex((h) => h.includes("skills"))
      expect(exp, template.id).toBeLessThan(skills)
    }
  })

  it("the separator style changes the rendering in every family (Headline and Functional included)", () => {
    const normalise = (html: string) =>
      html.replace(
        /style="([^"]*)"/g,
        (_m, css: string) =>
          `style="${css
            .split(";")
            .map((x) => x.trim())
            .filter(Boolean)
            .sort()
            .join(";")}"`,
      )
    for (const template of TEMPLATES) {
      const outputs = (["none", "subtle", "ruled", "dashed"] as const).map((separatorStyle) =>
        normalise(
          renderTemplateHtml(
            template.render,
            sampleEn(),
            { ...template.defaults, separatorStyle },
            "en",
            "ltr",
            "print",
          ),
        ),
      )
      expect(new Set(outputs).size, `${template.id} separator styles`).toBe(4)
    }
  })

  it("emits no multi-column CSS and no ATS violation by default, on every template", () => {
    for (const template of TEMPLATES) {
      for (const doc of [sampleLong(), sampleEn()]) {
        for (const mode of ["print", "preview"] as const) {
          const html = renderTemplateHtml(
            template.render,
            doc,
            template.defaults,
            "en",
            "ltr",
            mode,
          )
          expect(html, `${template.id} ${mode}`).not.toContain("columns:2")
          expect(atsViolations(html), `${template.id} ${mode}`).toEqual([])
        }
      }
    }
  })

  it("two columns is applied in the preview, the PDF and the lint still flags it", () => {
    // The user chose to accept the ATS risk of this layout, so print output follows
    // the preview. The lint keeps reporting it, and is only silenced on request.
    for (const template of TEMPLATES) {
      for (const mode of ["print", "preview"] as const) {
        const html = renderTemplateHtml(
          template.render,
          sampleLong(),
          { ...template.defaults, listColumns: "two" },
          "en",
          "ltr",
          mode,
        )
        expect(html, `${template.id} ${mode}`).toContain("columns:2")
        expect(atsViolations(html), `${template.id} ${mode}`).toContain("columns shorthand")
        expect(atsViolations(html, { allowColumns: true }), `${template.id} ${mode}`).toEqual([])
      }
    }
  })

  it("compact skills, languages and soft skills never use columns, even in a two-column document", () => {
    for (const template of TEMPLATES) {
      const doc = withSoftSkills(sampleLong(), ["Communication", "Teamwork"])
      const html = renderTemplateHtml(
        template.render,
        doc,
        {
          ...template.defaults,
          listColumns: "two",
          skillsLayout: "inline",
          languagesLayout: "inline",
        },
        "en",
        "ltr",
        "print",
      )
      for (const cls of ["cv-skill-inline", "cv-language-inline", "cv-softskills-inline"]) {
        expect(html, `${template.id} ${cls}`).toContain(cls)
        expect(html, `${template.id} ${cls}`).not.toMatch(new RegExp(`class="${cls}"[^>]*columns`))
      }
    }
  })

  it("renders certification links", () => {
    const template = TEMPLATES[0]
    const doc = sampleEn()
    const certSection = doc.sections.find((section) => section.type === "certifications")
    expect(certSection).toBeDefined()
    const cert = certSection!.items[0] as { name: string; link: string }
    cert.link = "credly.example/verify/abc123"
    const html = renderTemplateHtml(template.render, doc, template.defaults, "en", "ltr")
    expect(html).toContain(cert.name)
    expect(html).toContain("credly.example/verify/abc123")
  })
})
