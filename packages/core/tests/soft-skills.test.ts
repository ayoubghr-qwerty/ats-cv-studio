import { describe, expect, it } from "vitest"

import { createCoverLetterDocument, createCvDocument, ensureAllSections } from "../src/factories"
import { cvDocumentSchema, cvSectionSchema, SECTION_TYPES } from "../src/schema"
import { parseCvItem } from "../src/schema/items"
import { addItem, createItem } from "../src/store/cv-store"

describe("soft skills section", () => {
  it("is a registered section type, present but disabled on a new CV", () => {
    expect(SECTION_TYPES).toContain("softSkills")
    const doc = createCvDocument({ locale: "en" })
    const section = doc.sections.find((s) => s.type === "softSkills")!
    expect(section).toBeDefined()
    expect(section.enabled).toBe(false)
    expect(section.title).toBe("Soft Skills")
  })

  it("has a default title in every locale", () => {
    expect(
      createCvDocument({ locale: "fr" }).sections.find((s) => s.type === "softSkills")!.title,
    ).toBe("Compétences transversales")
    expect(
      createCvDocument({ locale: "ar" }).sections.find((s) => s.type === "softSkills")!.title,
    ).toBe("المهارات الشخصية")
  })

  it("creates plain { id, name } items and stores them in a section", () => {
    const item = createItem("softSkills")
    expect(Object.keys(item).sort()).toEqual(["id", "name"])
    const doc = createCvDocument({ locale: "en" })
    const section = doc.sections.find((s) => s.type === "softSkills")!
    const next = addItem(doc, section.id, { ...item, name: "Teamwork" } as never)
    expect(next.sections.find((s) => s.id === section.id)!.items).toHaveLength(1)
    expect(cvDocumentSchema.safeParse(next).success).toBe(true)
  })

  it("still opens documents saved before soft skills existed", () => {
    const doc = createCvDocument({ locale: "en" })
    const legacy = {
      ...doc,
      sections: doc.sections.filter((s) => s.type !== "softSkills"),
    }
    const parsed = cvDocumentSchema.safeParse(legacy)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.sections.some((s) => s.type === "softSkills")).toBe(false)
    }
  })

  it("keeps soft skills and technical skills apart when a section is parsed", () => {
    const soft = cvSectionSchema.parse({
      id: "s1",
      type: "softSkills",
      title: "",
      enabled: true,
      order: 0,
      items: [{ id: "i1", name: "Communication" }],
    })
    expect(soft.items[0]).toEqual({ id: "i1", name: "Communication" })
    const tech = cvSectionSchema.parse({
      id: "s2",
      type: "skills",
      title: "",
      enabled: true,
      order: 1,
      items: [{ id: "i2", name: "SQL", category: "Databases" }],
    })
    expect(tech.items[0]).toEqual({ id: "i2", name: "SQL", category: "Databases" })
  })

  it("never turns a categorised technical skill into a soft skill when reparsing an orphan item", () => {
    expect(parseCvItem({ id: "i", name: "SQL", category: "Databases" })).toEqual({
      id: "i",
      name: "SQL",
      category: "Databases",
    })
  })
})

describe("ensureAllSections (documents saved before a section type existed)", () => {
  const legacy = () => {
    const doc = createCvDocument({ locale: "fr" })
    return { ...doc, sections: doc.sections.filter((s) => s.type !== "softSkills") }
  }

  it("adds the missing section disabled and empty, right after Skills", () => {
    const fixed = ensureAllSections(legacy())
    const types = fixed.sections.map((s) => s.type)
    expect(types.indexOf("softSkills")).toBe(types.indexOf("skills") + 1)
    const soft = fixed.sections.find((s) => s.type === "softSkills")!
    expect(soft.enabled).toBe(false)
    expect(soft.items).toEqual([])
    expect(soft.title).toBe("Compétences transversales")
  })

  it("keeps every existing section, its content and its enabled state", () => {
    const doc = legacy()
    doc.sections[0] = { ...doc.sections[0], enabled: false }
    doc.sections[3] = { ...doc.sections[3], items: [{ id: "k", name: "SQL" }] }
    const fixed = ensureAllSections(doc)
    for (const original of doc.sections) {
      const kept = fixed.sections.find((s) => s.id === original.id)!
      expect(kept.enabled).toBe(original.enabled)
      expect(kept.items).toEqual(original.items)
    }
    expect(fixed.sections.map((s) => s.order)).toEqual(fixed.sections.map((_, i) => i))
  })

  it("is idempotent and returns the same object when nothing is missing", () => {
    const complete = createCvDocument({ locale: "en" })
    expect(ensureAllSections(complete)).toBe(complete)
    const once = ensureAllSections(legacy())
    expect(ensureAllSections(once)).toBe(once)
  })

  it("gives a CV with only a few sections (e.g. imported) the rest, disabled", () => {
    const doc = createCvDocument({ locale: "en" })
    const few = {
      ...doc,
      sections: doc.sections.filter((s) => ["summary", "skills"].includes(s.type)),
    }
    const fixed = ensureAllSections(few)
    expect(fixed.sections).toHaveLength(12)
    expect(fixed.sections.filter((s) => s.enabled).map((s) => s.type)).toEqual(
      few.sections.filter((s) => s.enabled).map((s) => s.type),
    )
    expect(cvDocumentSchema.safeParse(fixed).success).toBe(true)
  })

  it("leaves cover letters alone", () => {
    const letter = createCoverLetterDocument({ name: "Letter" })
    expect(ensureAllSections(letter)).toBe(letter)
  })
})
