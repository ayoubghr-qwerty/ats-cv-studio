import { describe, expect, it } from "vitest"
import { parseStoredDocumentValue } from "../src/storage"
import type { CvDocument } from "../src/schema"

function baseDoc(): CvDocument {
  return parseStoredDocumentValue({
    id: "cv-x",
    type: "cv",
    name: "X",
    locale: "en",
    direction: "ltr",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    sections: [
      {
        id: "s-edu",
        type: "education",
        title: "Education",
        enabled: true,
        order: 0,
        items: [
          {
            id: "e1",
            role: "",
            company: "",
            location: "cgguhjljm",
            startDate: "",
            endDate: "",
            current: false,
            bullets: [],
          },
        ],
      },
    ],
  })
}

describe("damaged item re-entry (user scenario)", () => {
  it("typed degree on a damaged education item survives a reload", () => {
    const doc = baseDoc()
    const edu = doc.sections.find((s) => s.type === "education")!.items[0] as { degree?: string }
    expect(edu.degree).toBe("")
    ;(edu as Record<string, unknown>).degree = "BSc Computer Science"
    ;(edu as Record<string, unknown>).institution = "MIT"
    const reloaded = parseStoredDocumentValue(JSON.parse(JSON.stringify(doc)))
    const again = reloaded.sections.find((s) => s.type === "education")!.items[0] as Record<
      string,
      unknown
    >
    expect(again.degree).toBe("BSc Computer Science")
    expect(again.institution).toBe("MIT")
  })

  it("typed name on a damaged skills item survives a reload", () => {
    const doc = parseStoredDocumentValue({
      id: "cv-x",
      type: "cv",
      name: "X",
      locale: "en",
      direction: "ltr",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      sections: [
        {
          id: "s-sk",
          type: "skills",
          title: "Skills",
          enabled: true,
          order: 0,
          items: [
            {
              id: "k1",
              role: "",
              company: "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              bullets: [],
            },
          ],
        },
      ],
    })
    const item = doc.sections.find((s) => s.type === "skills")!.items[0] as Record<string, unknown>
    item.name = "TypeScript"
    const reloaded = parseStoredDocumentValue(JSON.parse(JSON.stringify(doc)))
    const again = reloaded.sections.find((s) => s.type === "skills")!.items[0] as Record<
      string,
      unknown
    >
    expect(again.name).toBe("TypeScript")
  })

  it("typed text on a damaged summary item survives a reload", () => {
    const doc = parseStoredDocumentValue({
      id: "cv-x",
      type: "cv",
      name: "X",
      locale: "en",
      direction: "ltr",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      sections: [
        {
          id: "s-sum",
          type: "summary",
          title: "Summary",
          enabled: true,
          order: 0,
          items: [
            {
              id: "m1",
              role: "",
              company: "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              bullets: [],
            },
          ],
        },
      ],
    })
    const item = doc.sections.find((s) => s.type === "summary")!.items[0] as Record<string, unknown>
    item.text = "Engineer with 10 years of experience"
    const reloaded = parseStoredDocumentValue(JSON.parse(JSON.stringify(doc)))
    const again = reloaded.sections.find((s) => s.type === "summary")!.items[0] as Record<
      string,
      unknown
    >
    expect(again.text).toBe("Engineer with 10 years of experience")
  })
})
