import { describe, expect, it } from "vitest"

import {
  createCoverLetterDocument,
  createCvDocument,
  duplicateDocument,
  toMeta,
} from "../src/factories"
import { coverLetterDocumentSchema, cvDocumentSchema } from "../src/schema"
import {
  parseStoredDocument,
  parseStoredDocumentValue,
  parseWorkspaceBundle,
  serializeDocument,
  serializeWorkspaceBundle,
} from "../src/storage"

describe("createCvDocument", () => {
  it("creates a valid CV document with defaults", () => {
    const doc = createCvDocument()
    const result = cvDocumentSchema.safeParse(doc)
    expect(result.success).toBe(true)
    expect(doc.type).toBe("cv")
    expect(doc.sections).toHaveLength(12)
    expect(doc.sections.filter((s) => s.enabled).map((s) => s.type)).toEqual([
      "summary",
      "experience",
      "education",
      "skills",
    ])
    expect(doc.templateId).toBe("ats-classic-01")
    expect(doc.locale).toBe("en")
    expect(doc.direction).toBe("ltr")
    expect(doc.templateSettings.bulletStyle).toBe("disc")
  })

  it("defaults bulletStyle to disc for documents without it", () => {
    const doc = createCvDocument()
    delete (doc as { templateSettings: Record<string, unknown> }).templateSettings.bulletStyle
    const stored = parseStoredDocumentValue(JSON.parse(serializeDocument(doc)))
    expect(stored.templateSettings.bulletStyle).toBe("disc")
  })

  it("sets RTL direction for Arabic documents", () => {
    const doc = createCvDocument({ locale: "ar" })
    expect(doc.direction).toBe("rtl")
  })

  it("rejects malformed documents", () => {
    const bad = { id: "cv-1", type: "cv" }
    expect(cvDocumentSchema.safeParse(bad).success).toBe(false)
  })
})

describe("createCoverLetterDocument", () => {
  it("creates a valid cover letter document", () => {
    const doc = createCoverLetterDocument({ locale: "fr" })
    const result = coverLetterDocumentSchema.safeParse(doc)
    expect(result.success).toBe(true)
    expect(doc.type).toBe("cover-letter")
    expect(doc.direction).toBe("ltr")
  })
})

describe("duplicateDocument", () => {
  it("creates a copy with a new id and updated name", () => {
    const original = createCvDocument({ name: "Engineer CV" })
    const copy = duplicateDocument(original)
    expect(copy.id).not.toBe(original.id)
    expect(copy.name).toBe("Engineer CV (Copy)")
    expect(copy.type).toBe("cv")
    if (copy.type === "cv") {
      expect(copy.sections).toEqual(original.sections)
      expect(copy.nameSource).toBe("manual")
    }
  })
})

describe("toMeta", () => {
  it("extracts document metadata", () => {
    const doc = createCvDocument({ name: "My CV" })
    const meta = toMeta(doc)
    expect(meta.id).toBe(doc.id)
    expect(meta.type).toBe("cv")
    expect(meta.name).toBe("My CV")
  })
})

describe("JSON storage helpers", () => {
  it("round-trips a document through serialize/parse", () => {
    const doc = createCvDocument({ name: "Roundtrip" })
    const json = serializeDocument(doc)
    const parsed = parseStoredDocument(json)
    expect(parsed).toEqual(doc)
  })

  it("rejects invalid document JSON", () => {
    expect(() => parseStoredDocument(JSON.stringify({ nope: true }))).toThrow()
  })

  it("rejects malformed JSON input", () => {
    expect(() => parseStoredDocument("{not json")).toThrow()
  })

  it("detects a valid workspace bundle", () => {
    const cv = createCvDocument()
    const letter = createCoverLetterDocument()
    const json = serializeWorkspaceBundle([cv, letter])
    const bundle = parseWorkspaceBundle(json)
    expect(bundle.documents).toHaveLength(2)
  })

  it("rejects an invalid workspace bundle", () => {
    expect(() => parseWorkspaceBundle(JSON.stringify({ foo: 1 }))).toThrow()
  })

  it("accepts only valid documents in a bundle", () => {
    const cv = createCvDocument()
    expect(parseStoredDocumentValue(cv)).toEqual(cv)
    expect(() => parseStoredDocumentValue({ id: "x" })).toThrow()
  })
})

describe("item type preservation on parse", () => {
  const mixed = {
    id: "cv-mixed",
    type: "cv",
    name: "Mixed",
    locale: "en",
    direction: "ltr",
    templateId: "ats-classic-01",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    sections: [
      {
        id: "s-cert",
        type: "certifications",
        title: "Certifications",
        enabled: true,
        order: 0,
        items: [
          {
            id: "c1",
            name: "AWS Certified",
            issuer: "Amazon",
            date: "2021-11",
            link: "credly.example/abc",
          },
        ],
      },
      {
        id: "s-edu",
        type: "education",
        title: "Education",
        enabled: true,
        order: 1,
        items: [
          {
            id: "e1",
            degree: "BSc",
            institution: "MIT",
            location: "Boston",
            startDate: "2014-09",
            endDate: "2018-06",
            current: false,
            details: "Thesis",
          },
        ],
      },
      {
        id: "s-skills",
        type: "skills",
        title: "Skills",
        enabled: true,
        order: 2,
        items: [{ id: "k1", name: "TypeScript" }],
      },
      {
        id: "s-projects",
        type: "projects",
        title: "Projects",
        enabled: true,
        order: 3,
        items: [
          {
            id: "p1",
            name: "LedgerKit",
            description: "Accounting",
            link: "github.com/x/ledgerkit",
            startDate: "2020-01",
            endDate: "2020-06",
            current: false,
            bullets: ["Built it"],
          },
        ],
      },
      {
        id: "s-lang",
        type: "languages",
        title: "Languages",
        enabled: true,
        order: 4,
        items: [{ id: "l1", name: "English", level: "native" }],
      },
      {
        id: "s-awards",
        type: "awards",
        title: "Awards",
        enabled: true,
        order: 5,
        items: [
          { id: "a1", title: "Best Dev", issuer: "ACM", date: "2022-01", description: "Top prize" },
        ],
      },
      {
        id: "s-vol",
        type: "volunteering",
        title: "Volunteering",
        enabled: true,
        order: 6,
        items: [
          {
            id: "v1",
            role: "Mentor",
            organization: "Code Club",
            location: "Paris",
            startDate: "2021-01",
            endDate: "",
            current: true,
            description: "Teach kids",
          },
        ],
      },
      {
        id: "s-pub",
        type: "publications",
        title: "Publications",
        enabled: true,
        order: 7,
        items: [
          {
            id: "u1",
            title: "Consistency",
            publisher: "ACM Queue",
            date: "2023-06",
            url: "acmqueue.example",
          },
        ],
      },
      {
        id: "s-course",
        type: "courses",
        title: "Courses",
        enabled: true,
        order: 8,
        items: [
          {
            id: "o1",
            name: "React Deep Dive",
            provider: "Udemy",
            date: "2022-09",
            description: "Advanced",
          },
        ],
      },
      {
        id: "s-summary",
        type: "summary",
        title: "Summary",
        enabled: true,
        order: 9,
        items: [{ id: "m1", text: "Engineer with 10 years of experience" }],
      },
    ],
  }

  it("preserves certification items with name, issuer, date and link", () => {
    const parsed = parseStoredDocumentValue(mixed)
    const certs = parsed.sections.find((s) => s.type === "certifications")!.items
    expect(certs).toHaveLength(1)
    expect(certs[0]).toMatchObject({
      name: "AWS Certified",
      issuer: "Amazon",
      date: "2021-11",
      link: "credly.example/abc",
    })
  })

  it("preserves every non-experience item type", () => {
    const parsed = parseStoredDocumentValue(mixed) as {
      sections: { type: string; items: Record<string, unknown>[] }[]
    }
    const byType = Object.fromEntries(parsed.sections.map((s) => [s.type, s.items]))
    expect(byType.education[0]).toMatchObject({
      degree: "BSc",
      institution: "MIT",
      details: "Thesis",
    })
    expect(byType.skills[0]).toMatchObject({ name: "TypeScript" })
    expect(byType.projects[0]).toMatchObject({
      name: "LedgerKit",
      link: "github.com/x/ledgerkit",
      bullets: ["Built it"],
    })
    expect(byType.languages[0]).toMatchObject({ name: "English", level: "native" })
    expect(byType.awards[0]).toMatchObject({ title: "Best Dev", description: "Top prize" })
    expect(byType.volunteering[0]).toMatchObject({
      role: "Mentor",
      organization: "Code Club",
      current: true,
    })
    expect(byType.publications[0]).toMatchObject({ title: "Consistency", url: "acmqueue.example" })
    expect(byType.courses[0]).toMatchObject({ name: "React Deep Dive", provider: "Udemy" })
    expect(byType.summary[0]).toMatchObject({ text: "Engineer with 10 years of experience" })
  })
})
