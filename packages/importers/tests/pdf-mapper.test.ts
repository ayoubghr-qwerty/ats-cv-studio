import { describe, expect, it } from "vitest"

import { clusterPdfLines } from "../src/pdf/pdf-mapper"

describe("clusterPdfLines", () => {
  it("groups text items on the same line by y position", () => {
    const lines = clusterPdfLines([
      { str: "Jane", x: 10, y: 20 },
      { str: "Doe", x: 40, y: 20 },
      { str: "jane@example.com", x: 10, y: 35 },
    ])
    expect(lines).toEqual([{ text: "Jane Doe" }, { text: "jane@example.com" }])
  })

  it("sorts lines top to bottom", () => {
    const lines = clusterPdfLines([
      { str: "second", x: 10, y: 50 },
      { str: "first", x: 10, y: 10 },
    ])
    expect(lines[0].text).toBe("first")
    expect(lines[1].text).toBe("second")
  })

  it("keeps separate lines within tolerance apart", () => {
    const lines = clusterPdfLines([
      { str: "Line A", x: 10, y: 10 },
      { str: "Line B", x: 10, y: 25 },
    ])
    expect(lines).toHaveLength(2)
  })

  it("drops empty items", () => {
    const lines = clusterPdfLines([
      { str: "   ", x: 10, y: 10 },
      { str: "Real", x: 10, y: 10 },
    ])
    expect(lines).toEqual([{ text: "Real" }])
  })
})
