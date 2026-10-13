import { describe, expect, it } from "vitest"

import { createCvDocument } from "../src/factories"
import { setTemplateId, setTemplateSettingsField } from "../src/store/cv-store"
import { debounce } from "../src/utils/debounce"

describe("template actions", () => {
  it("sets the template id", () => {
    const doc = createCvDocument({ locale: "en" })
    expect(doc.templateId).toBe("ats-classic-01")
    const next = setTemplateId(doc, "ats-modern-02")
    expect(next.templateId).toBe("ats-modern-02")
    expect(next).not.toBe(doc)
  })

  it("returns the same reference when the value is unchanged", () => {
    const doc = createCvDocument({ locale: "en" })
    expect(setTemplateId(doc, "ats-classic-01")).toBe(doc)
    expect(setTemplateSettingsField(doc, "fontId", "arial")).toBe(doc)
  })

  it("updates individual template settings fields", () => {
    const doc = createCvDocument({ locale: "en" })
    const next = setTemplateSettingsField(doc, "fontId", "georgia")
    expect(next.templateSettings.fontId).toBe("georgia")
    expect(next.templateSettings.marginPreset).toBe("standard")
    const dense = setTemplateSettingsField(next, "spacingDensity", "compact")
    expect(dense.templateSettings.spacingDensity).toBe("compact")
  })

  it("includes separatorStyle and contactAlignment defaults", () => {
    const doc = createCvDocument({ locale: "en" })
    expect(doc.templateSettings.separatorStyle).toBe("subtle")
    expect(doc.templateSettings.contactAlignment).toBe("left")
  })
})

describe("debounce", () => {
  it("fires after the delay", async () => {
    let calls = 0
    const fn = debounce(() => (calls += 1), 20)
    fn()
    expect(calls).toBe(0)
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(calls).toBe(1)
  })

  it("cancel prevents a pending call", async () => {
    let calls = 0
    const fn = debounce(() => (calls += 1), 20)
    fn()
    fn.cancel()
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(calls).toBe(0)
  })

  it("cancel allows further calls afterwards", async () => {
    let calls = 0
    const fn = debounce(() => (calls += 1), 20)
    fn()
    fn.cancel()
    fn()
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(calls).toBe(1)
  })

  it("flush runs a pending call immediately", async () => {
    let calls = 0
    const fn = debounce(() => (calls += 1), 20)
    fn()
    fn.flush()
    expect(calls).toBe(1)
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(calls).toBe(1)
  })

  it("flush passes the last scheduled args", async () => {
    const seen: string[] = []
    const fn = debounce((value: string) => seen.push(value), 20)
    fn("a")
    fn("b")
    fn.flush()
    expect(seen).toEqual(["b"])
  })

  it("flush does nothing when nothing is pending", async () => {
    let calls = 0
    const fn = debounce(() => (calls += 1), 20)
    fn.flush()
    fn.cancel()
    fn.flush()
    expect(calls).toBe(0)
  })
})
