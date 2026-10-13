import { describe, expect, it } from "vitest"

import { createCvDocument } from "../src/factories"
import { addItem, createItem, setSummaryText } from "../src/store/cv-store"
import { validateCv } from "../src/validation"

function base() {
  const d = createCvDocument({ locale: "en" })
  return {
    ...d,
    contact: { ...d.contact, fullName: "Ada Lovelace" },
  }
}

describe("validateCv", () => {
  it("flags missing full name", () => {
    const warnings = validateCv(createCvDocument({ locale: "en" }))
    expect(warnings.some((w) => w.kind === "missingFullName")).toBe(true)
  })

  it("flags invalid email and phone", () => {
    const d = base()
    const w = validateCv({ ...d, contact: { ...d.contact, email: "nope", phone: "!!!" } })
    expect(w.some((x) => x.kind === "invalidEmail")).toBe(true)
    expect(w.some((x) => x.kind === "invalidPhone")).toBe(true)
  })

  it("accepts valid email and phone", () => {
    const d = base()
    const w = validateCv({
      ...d,
      contact: { ...d.contact, email: "ada@example.com", phone: "+1 (555) 123-4567" },
    })
    expect(w.some((x) => x.kind === "invalidEmail")).toBe(false)
    expect(w.some((x) => x.kind === "invalidPhone")).toBe(false)
  })

  it("flags empty enabled sections but ignores disabled ones", () => {
    const d = base()
    const w = validateCv(d)
    expect(w.some((x) => x.kind === "emptySection")).toBe(true)
    const disabled = w.filter((x) => x.kind === "emptySection")
    const enabledIds = new Set(d.sections.filter((s) => s.enabled).map((s) => s.id))
    expect(disabled.every((x) => enabledIds.has(x.sectionId ?? ""))).toBe(true)
  })

  it("flags inverted date ranges", () => {
    const d = base()
    const exp = d.sections.find((s) => s.type === "experience")!
    const item = createItem("experience")
    const withItem = addItem(d, exp.id, {
      ...item,
      startDate: "2022-01",
      endDate: "2020-01",
    } as never)
    const w = validateCv(withItem)
    expect(w.some((x) => x.kind === "invalidDateRange")).toBe(true)
  })

  it("flags end date while current is checked", () => {
    const d = base()
    const exp = d.sections.find((s) => s.type === "experience")!
    const item = createItem("experience")
    const withItem = addItem(d, exp.id, {
      ...item,
      startDate: "2022-01",
      endDate: "2023-01",
      current: true,
    } as never)
    const w = validateCv(withItem)
    expect(w.some((x) => x.kind === "invalidDateRange")).toBe(true)
  })

  it("summary text does not produce an empty-section warning", () => {
    const d = base()
    const withSummary = setSummaryText(d, "I build things.")
    const w = validateCv(withSummary)
    const summary = withSummary.sections.find((s) => s.type === "summary")!
    expect(w.some((x) => x.kind === "emptySection" && x.sectionId === summary.id)).toBe(false)
  })
})
