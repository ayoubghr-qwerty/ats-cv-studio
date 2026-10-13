import { describe, expect, it } from "vitest"

import { linesToDraft } from "../src/detect"
import { draftToCv } from "../src/mapper"

const header = (contactLine: string, title = "Senior Product Designer") =>
  linesToDraft(["Sarah Mitchell", title, contactLine, "", "Summary", "text"]).contact

describe("contact line", () => {
  const items = ["sarah@example.com", "+1 (555) 234-5678", "New York, NY, USA"]

  it("splits on a pipe, a middle dot or a bullet", () => {
    for (const sep of [" | ", " · ", " • "]) {
      const c = header(items.join(sep))
      expect(c.email, sep).toBe("sarah@example.com")
      expect(c.phone, sep).toBe("+1 (555) 234-5678")
      expect(c.location, sep).toBe("New York, NY, USA")
    }
  })

  it("recognises LinkedIn, GitHub and a personal site, without taking them for a name or title", () => {
    const c = header(
      [
        ...items,
        "sarahmitchell.design",
        "linkedin.com/in/sarahm",
        "https://github.com/sarahm",
      ].join(" | "),
    )
    expect(c.website).toBe("sarahmitchell.design")
    expect(c.linkedin).toBe("linkedin.com/in/sarahm")
    expect(c.github).toBe("https://github.com/sarahm")
    expect(c.fullName).toBe("Sarah Mitchell")
    expect(c.jobTitle).toBe("Senior Product Designer")
  })

  it("does not take versions, numbers or sentences for links", () => {
    const c = header([...items, "v1.2.3", "3.5"].join(" | "))
    expect(c.website ?? "").toBe("")
    expect(c.linkedin ?? "").toBe("")
  })

  it("accepts a job title longer than 60 characters, but not a closing sentence", () => {
    const long = "Ingénieur en Informatique — Systèmes d'Information Distribués"
    expect(long.length).toBeGreaterThan(60)
    expect(header(items.join(" | "), long).jobTitle).toBe(long)
    const sentence = linesToDraft([
      "Sarah Mitchell",
      "I build products people love and ship them fast.",
      items.join(" | "),
    ]).contact
    expect(sentence.jobTitle).toBe("")
  })

  it("carries the links into the imported CV", () => {
    const draft = linesToDraft([
      "Sarah Mitchell",
      "Designer",
      [...items, "linkedin.com/in/sarahm"].join(" | "),
      "",
      "Summary",
      "text",
    ])
    const cv = draftToCv(draft, "en")
    expect(cv.contact.linkedin).toBe("linkedin.com/in/sarahm")
    expect(cv.contact.phone).toBe("+1 (555) 234-5678")
  })
})
