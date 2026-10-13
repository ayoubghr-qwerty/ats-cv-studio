import { describe, expect, it } from "vitest"

import { assignUnmappedLine } from "../src/editing"
import { emptyDraft } from "../src/types"

describe("assignUnmappedLine", () => {
  it("creates a new entry when no target entry is given", () => {
    const draft = emptyDraft()
    draft.unmapped = ["Some stray line"]
    const next = assignUnmappedLine(draft, 0, "experience")
    expect(next.unmapped).toEqual([])
    const section = next.sections.find((s) => s.type === "experience")!
    expect(section).toBeDefined()
    expect(section.entries).toEqual([{ title: "Some stray line", meta: "", lines: [] }])
  })

  it("appends the line to an existing entry's details", () => {
    const draft = emptyDraft()
    draft.sections = [
      {
        type: "experience",
        entries: [{ title: "Senior Developer", meta: "Jan 2020", lines: ["Led a team"] }],
      },
    ]
    draft.unmapped = ["Shipped the v2 platform"]
    const next = assignUnmappedLine(draft, 0, "experience", 0)
    expect(next.sections[0].entries[0].lines).toEqual(["Led a team", "Shipped the v2 platform"])
    expect(next.unmapped).toEqual([])
  })

  it("adds a missing section without touching existing ones", () => {
    const draft = emptyDraft()
    draft.sections = [
      { type: "summary", entries: [{ title: "", meta: "", lines: ["Hello"] }] },
      { type: "skills", entries: [{ title: "React", meta: "", lines: [] }] },
    ]
    draft.unmapped = ["Details"]
    const next = assignUnmappedLine(draft, 0, "experience")
    expect(next.sections).toHaveLength(3)
    expect(next.sections[0].entries[0].lines).toEqual(["Hello"])
    expect(next.sections[1].entries[0].title).toBe("React")
    expect(next.sections[2].type).toBe("experience")
    expect(next.sections[2].entries).toEqual([{ title: "Details", meta: "", lines: [] }])
  })

  it("does not mutate the input draft", () => {
    const draft = emptyDraft()
    draft.unmapped = ["Line"]
    const snapshot = JSON.stringify(draft)
    assignUnmappedLine(draft, 0, "education")
    expect(JSON.stringify(draft)).toBe(snapshot)
  })
})
