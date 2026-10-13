import { describe, expect, it } from "vitest"

import { languageItemSchema } from "../src/schema"

describe("language level scale", () => {
  it("accepts every level, including Bilingual", () => {
    for (const level of ["intermediate", "advanced", "fluent", "bilingual", "native"]) {
      const parsed = languageItemSchema.safeParse({ id: "l", name: "Arabic", level })
      expect(parsed.success, level).toBe(true)
      if (parsed.success) expect(parsed.data.level).toBe(level)
    }
  })

  it("still opens languages saved before Bilingual existed", () => {
    for (const level of ["intermediate", "advanced", "fluent", "native"]) {
      const parsed = languageItemSchema.parse({ id: "l", name: "French", level })
      expect(parsed.level).toBe(level)
    }
  })
})
