import { describe, expect, it } from "vitest"

import { createCvDocument } from "../src/factories"
import { setTemplateSettingsField } from "../src/store/cv-store"
import { cvSectionSchema } from "../src/schema/cv"

describe("skill categories", () => {
  it("keeps a valid category on a skill item", () => {
    const result = cvSectionSchema.parse({
      id: "sec-skills",
      type: "skills",
      title: "",
      enabled: true,
      order: 3,
      items: [
        { id: "item-1", name: "React", category: "Technical" },
        { id: "item-2", name: "Communication" },
      ],
    })
    const items = result.items as Array<{ name: string; category?: string }>
    expect(items[0].category).toBe("Technical")
    expect(items[1].category).toBeUndefined()
  })

  it("does not reject oversized categories (data survives)", () => {
    const result = cvSectionSchema.parse({
      id: "sec-skills",
      type: "skills",
      title: "",
      enabled: true,
      order: 3,
      items: [{ id: "item-1", name: "React", category: "x".repeat(400) }],
    })
    expect((result.items[0] as { name: string }).name).toBe("React")
  })

  it("defaults listColumns to single and allows switching to two", () => {
    const doc = createCvDocument({ locale: "en" })
    expect(doc.templateSettings.listColumns).toBe("single")
    const next = setTemplateSettingsField(doc, "listColumns", "two")
    expect(next.templateSettings.listColumns).toBe("two")
  })
})
