import { cvDocumentSchema } from "@ats/core"
import { describe, expect, it } from "vitest"

import { linesToDraft } from "../src/detect"
import { draftToCv } from "../src/mapper"
import { emptyDraft } from "../src/types"

const SAMPLE_EN = [
  "Jane Doe",
  "Software Engineer",
  "jane.doe@example.com",
  "+1 555 123 4567",
  "Paris, France",
  "",
  "Professional Summary",
  "Senior full-stack engineer with 8 years of experience.",
  "",
  "Work Experience",
  "Senior Developer | ACME Corp | Jan 2020 - Present",
  "- Led a team of 5 engineers",
  "- Shipped the v2 platform",
  "Product Engineer | Globex | 2015-2019",
  "Built internal tools with React and Node.",
  "",
  "Education",
  "MSc Computer Science | MIT | 2013-2015",
  "",
  "Skills",
  "React, TypeScript, Node.js, PostgreSQL",
  "",
  "Languages",
  "English (Native)",
  "French (Fluent)",
]

describe("draftToCv", () => {
  it("produces a schema-valid CV document", () => {
    const draft = linesToDraft(SAMPLE_EN)
    const cv = draftToCv(draft, "en")
    expect(cvDocumentSchema.safeParse(cv).success).toBe(true)
  })

  it("maps contact fields", () => {
    const cv = draftToCv(linesToDraft(SAMPLE_EN), "en")
    expect(cv.contact.fullName).toBe("Jane Doe")
    expect(cv.contact.jobTitle).toBe("Software Engineer")
    expect(cv.contact.email).toBe("jane.doe@example.com")
    expect(cv.contact.phone).toBe("+1 555 123 4567")
    expect(cv.contact.location).toBe("Paris, France")
  })

  it("splits experience titles and parses date ranges", () => {
    const cv = draftToCv(linesToDraft(SAMPLE_EN), "en")
    const exp = cv.sections.find((s) => s.type === "experience")!
    expect(exp.items).toHaveLength(2)
    const first = exp.items[0] as {
      role: string
      company: string
      startDate: string
      endDate: string
      current: boolean
      bullets: string[]
    }
    expect(first.role).toBe("Senior Developer")
    expect(first.company).toBe("ACME Corp")
    expect(first.startDate).toBe("2020-01")
    expect(first.endDate).toBe("")
    expect(first.current).toBe(true)
    expect(first.bullets).toEqual(["Led a team of 5 engineers", "Shipped the v2 platform"])
    const second = exp.items[1] as { startDate: string; endDate: string }
    expect(second.startDate).toBe("2015-01")
    expect(second.endDate).toBe("2019-12")
  })

  it("maps education entries", () => {
    const cv = draftToCv(linesToDraft(SAMPLE_EN), "en")
    const edu = cv.sections.find((s) => s.type === "education")!
    const item = edu.items[0] as { degree: string; institution: string }
    expect(item.degree).toBe("MSc Computer Science")
    expect(item.institution).toBe("MIT")
  })

  it("maps skills and summary", () => {
    const cv = draftToCv(linesToDraft(SAMPLE_EN), "en")
    const skills = cv.sections.find((s) => s.type === "skills")!
    expect(skills.items.map((i) => (i as { name: string }).name)).toEqual([
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
    ])
    const summary = cv.sections.find((s) => s.type === "summary")!
    expect((summary.items[0] as { text: string }).text).toContain("Senior full-stack engineer")
  })

  it("only includes detected sections, ordered by appearance", () => {
    const cv = draftToCv(linesToDraft(SAMPLE_EN), "en")
    expect(cv.sections.map((s) => s.type)).toEqual([
      "summary",
      "experience",
      "education",
      "skills",
      "languages",
    ])
    expect(cv.sections.every((s) => s.order === cv.sections.indexOf(s))).toBe(true)
  })

  it("sets Arabic direction for ar locale", () => {
    const cv = draftToCv(linesToDraft(["أحمد علي", "ahmed@x.com"]), "ar")
    expect(cv.direction).toBe("rtl")
    expect(cv.locale).toBe("ar")
  })

  it("handles French month names", () => {
    const draft = linesToDraft(["Jean Dupont", "Développeur | TechCorp | Mars 2019 - Aujourd'hui"])
    const cv = draftToCv(draft, "fr")
    const exp = cv.sections.find((s) => s.type === "experience")
    if (exp) {
      const item = exp.items[0] as { startDate: string; current: boolean }
      expect(item.startDate).toBe("2019-03")
      expect(item.current).toBe(true)
    }
  })

  it("handles an empty draft", () => {
    const cv = draftToCv(emptyDraft(), "en")
    expect(cvDocumentSchema.safeParse(cv).success).toBe(true)
    expect(cv.sections).toHaveLength(0)
  })
})

describe("draftToCv with soft skills", () => {
  it("keeps imported soft skills as plain items instead of dropping them", () => {
    const draft = emptyDraft()
    draft.sections.push({
      type: "softSkills",
      entries: [
        { title: "Communication", meta: "", lines: [] },
        { title: "Teamwork", meta: "", lines: [] },
      ],
    })
    const doc = draftToCv(draft, "en")
    const section = doc.sections.find((s) => s.type === "softSkills")!
    expect(section.items.map((i) => (i as { name: string }).name)).toEqual([
      "Communication",
      "Teamwork",
    ])
  })
})
