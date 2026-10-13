import { toDocxBuffer } from "@ats/exporters"
import { describe, expect, it } from "vitest"

import { linesToDraft } from "../src/detect"
import { paragraphsToDraft } from "../src/docx/docx-mapper"
import { parseDocx } from "../src/docx/docx-parser"
import { draftToCv } from "../src/mapper"

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
  "",
  "Education",
  "MSc Computer Science | MIT | 2013-2015",
  "",
  "Skills",
  "React, TypeScript, Node.js, PostgreSQL",
]

async function sampleDocx() {
  const cv = draftToCv(linesToDraft(SAMPLE_EN), "en")
  return toDocxBuffer(cv)
}

describe("docx parser", () => {
  it("parses a DOCX produced by our exporter", async () => {
    const buffer = await sampleDocx()
    const paragraphs = await parseDocx(buffer)
    const texts = paragraphs.map((p) => p.text)
    expect(texts).toContain("Jane Doe")
    expect(texts).toContain("Senior Developer")
    expect(texts).toContain("Work Experience")
    expect(texts.some((t) => t.includes("ACME Corp"))).toBe(true)
    expect(texts).toContain("Led a team of 5 engineers")
    const bullet = paragraphs.find((p) => p.text === "Led a team of 5 engineers")
    expect(bullet?.bullet).toBe(true)
  })

  it("rejects non-DOCX data", async () => {
    const bogus = new TextEncoder().encode("not a zip file at all")
    await expect(parseDocx(bogus)).rejects.toThrow()
  })

  it("round-trips through detection into a draft", async () => {
    const buffer = await sampleDocx()
    const paragraphs = await parseDocx(buffer)
    const draft = paragraphsToDraft(paragraphs)
    expect(draft.contact.fullName).toBe("Jane Doe")
    const types = draft.sections.map((s) => s.type)
    expect(types).toEqual(expect.arrayContaining(["summary", "experience", "education", "skills"]))
    const experience = draft.sections.find((s) => s.type === "experience")!
    expect(experience.entries.length).toBeGreaterThanOrEqual(1)
    expect(experience.entries[0].title).toContain("Senior Developer")
    expect(experience.entries[0].lines).toContain("Led a team of 5 engineers")
  })
})
