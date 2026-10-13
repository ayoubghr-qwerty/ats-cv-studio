import { describe, expect, it } from "vitest"

import { cvDocumentSchema } from "@ats/core"

import { linesToDraft, matchHeading } from "../src/detect"
import { draftToCv } from "../src/mapper"
import {
  languageLevelFromText,
  parseLanguageLine,
  splitSkillCategory,
} from "../src/structured-lines"

const pairs = (line: string) => parseLanguageLine(line)?.map((e) => [e.title, e.meta])

describe("languageLevelFromText", () => {
  it("maps English, French and Arabic wording, including Bilingual", () => {
    expect(languageLevelFromText("Bilingual")).toBe("bilingual")
    expect(languageLevelFromText("Bilingue")).toBe("bilingual")
    expect(languageLevelFromText("ثنائي اللغة")).toBe("bilingual")
    expect(languageLevelFromText("Native language")).toBe("native")
    expect(languageLevelFromText("Langue maternelle")).toBe("native")
    expect(languageLevelFromText("Mother tongue")).toBe("native")
    expect(languageLevelFromText("Fluent")).toBe("fluent")
    expect(languageLevelFromText("Courant")).toBe("fluent")
    expect(languageLevelFromText("Avancé")).toBe("advanced")
    expect(languageLevelFromText("Intermédiaire")).toBe("intermediate")
  })

  it("maps CEFR levels", () => {
    expect(languageLevelFromText("C2")).toBe("fluent")
    expect(languageLevelFromText("C1")).toBe("fluent")
    expect(languageLevelFromText("B2")).toBe("advanced")
    expect(languageLevelFromText("B1")).toBe("intermediate")
    expect(languageLevelFromText("A2")).toBe("intermediate")
  })

  it("does not confuse upper-intermediate with intermediate, and returns null when unsure", () => {
    expect(languageLevelFromText("Upper-intermediate")).toBe("advanced")
    expect(languageLevelFromText("")).toBeNull()
    expect(languageLevelFromText("some words")).toBeNull()
  })
})

describe("parseLanguageLine", () => {
  it("splits several languages on one line (DOCX spacing)", () => {
    expect(pairs("Arabic: Bilingual    Tamazight: Native language")).toEqual([
      ["Arabic", "Bilingual"],
      ["Tamazight", "Native language"],
    ])
  })

  it("splits them even when a PDF collapsed the spacing", () => {
    expect(pairs("Arabic: Bilingual Tamazight: Native language")).toEqual([
      ["Arabic", "Bilingual"],
      ["Tamazight", "Native language"],
    ])
    expect(pairs("French: Bilingual English: Fluent")).toEqual([
      ["French", "Bilingual"],
      ["English", "Fluent"],
    ])
  })

  it("handles French punctuation with a space before the colon", () => {
    expect(pairs("Arabe : Bilingue    Tamazight : Langue maternelle")).toEqual([
      ["Arabe", "Bilingue"],
      ["Tamazight", "Langue maternelle"],
    ])
    expect(pairs("Français : Bilingue Anglais : Courant")).toEqual([
      ["Français", "Bilingue"],
      ["Anglais", "Courant"],
    ])
  })

  it("handles 'Name - Level' and 'Name (Level)'", () => {
    expect(pairs("English - Fluent")).toEqual([["English", "Fluent"]])
    expect(pairs("Anglais – Courant")).toEqual([["Anglais", "Courant"]])
    expect(pairs("Spanish (B2)")).toEqual([["Spanish", "B2"]])
  })

  it("keeps a hyphenated language name intact", () => {
    expect(pairs("Anglo-Norman: Advanced")).toEqual([["Anglo-Norman", "Advanced"]])
  })

  it("returns null (keep the line as is) when it is not fully understood", () => {
    expect(parseLanguageLine("English, French, Arabic")).toBeNull()
    expect(parseLanguageLine("Arabic: Native, plus some travel notes")).toBeNull()
    expect(parseLanguageLine("")).toBeNull()
  })
})

describe("splitSkillCategory", () => {
  it("separates a leading category", () => {
    expect(
      splitSkillCategory("Programming Languages: Java (basics), Python (basics), SQL"),
    ).toEqual({
      category: "Programming Languages",
      rest: "Java (basics), Python (basics), SQL",
    })
    expect(splitSkillCategory("Outils & plateformes : Odoo, NS-3")).toEqual({
      category: "Outils & plateformes",
      rest: "Odoo, NS-3",
    })
  })

  it("leaves a plain list and URLs alone", () => {
    expect(splitSkillCategory("React, TypeScript").category).toBe("")
    expect(splitSkillCategory("https://example.com").category).toBe("")
    expect(splitSkillCategory("Meeting at 10:30").category).toBe("")
  })
})

describe("skills and languages through the whole import", () => {
  const lines = [
    "Jane Doe",
    "jane@example.com",
    "",
    "TECHNICAL SKILLS",
    "Programming Languages: Java (basics), Python (basics), SQL",
    "Web Development: HTML, CSS, WordPress",
    "Support & Maintenance: Hardware troubleshooting, software installation,",
    "technical support, software testing",
    "",
    "LANGUAGES",
    "Arabic: Bilingual    Tamazight: Native language",
    "French: Bilingual    English: Fluent",
  ]

  it("gives every technical skill its category, including a wrapped continuation", () => {
    const draft = linesToDraft(lines)
    const skills = draft.sections.find((s) => s.type === "skills")!
    expect(skills.entries.map((e) => [e.title, e.meta])).toEqual([
      ["Java (basics)", "Programming Languages"],
      ["Python (basics)", "Programming Languages"],
      ["SQL", "Programming Languages"],
      ["HTML", "Web Development"],
      ["CSS", "Web Development"],
      ["WordPress", "Web Development"],
      ["Hardware troubleshooting", "Support & Maintenance"],
      ["software installation", "Support & Maintenance"],
      ["technical support", "Support & Maintenance"],
      ["software testing", "Support & Maintenance"],
    ])
  })

  it("does not let a category leak onto the next line when the list was complete", () => {
    const draft = linesToDraft(["Jane Doe", "", "SKILLS", "Languages: Java, SQL", "Docker, Git"])
    const skills = draft.sections.find((s) => s.type === "skills")!
    expect(skills.entries.map((e) => [e.title, e.meta])).toEqual([
      ["Java", "Languages"],
      ["SQL", "Languages"],
      ["Docker", ""],
      ["Git", ""],
    ])
  })

  it("produces a valid document with categorised skills and real language levels", () => {
    const doc = draftToCv(linesToDraft(lines), "en")
    expect(cvDocumentSchema.safeParse(doc).success).toBe(true)
    const skills = doc.sections.find((s) => s.type === "skills")!.items as {
      name: string
      category?: string
    }[]
    expect(skills[0]).toMatchObject({ name: "Java (basics)", category: "Programming Languages" })
    const languages = doc.sections.find((s) => s.type === "languages")!.items as {
      name: string
      level: string
    }[]
    expect(languages.map((l) => [l.name, l.level])).toEqual([
      ["Arabic", "bilingual"],
      ["Tamazight", "native"],
      ["French", "bilingual"],
      ["English", "fluent"],
    ])
  })

  it("falls back to the default level for text it cannot read, without losing the language", () => {
    const doc = draftToCv(
      linesToDraft(["Jane Doe", "", "LANGUAGES", "Klingon (conversational)"]),
      "en",
    )
    const languages = doc.sections.find((s) => s.type === "languages")!.items as {
      name: string
      level: string
    }[]
    expect(languages).toHaveLength(1)
    expect(languages[0].name).toBe("Klingon (conversational)")
    expect(languages[0].level).toBe("intermediate")
  })
})

describe("headings versus category lines", () => {
  it("does not take 'Category: list' for a section heading", () => {
    expect(matchHeading("Languages: Java, SQL")).toBeNull()
    expect(matchHeading("Skills: Java")).toBeNull()
    expect(matchHeading("Langues : Anglais, Français")).toBeNull()
  })

  it("still recognises real headings, with or without a trailing colon", () => {
    expect(matchHeading("Skills")).toBe("skills")
    expect(matchHeading("SKILLS :")).toBe("skills")
    expect(matchHeading("Langues:")).toBe("languages")
    expect(matchHeading("Technical Skills")).toBe("skills")
  })
})
