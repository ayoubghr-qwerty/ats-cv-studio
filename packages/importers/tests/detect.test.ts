import { describe, expect, it } from "vitest"

import { linesToDraft, matchHeading, extractDateRange } from "../src/detect"

describe("extractDateRange", () => {
  it("extracts a month-year range from a line", () => {
    const { rest, date } = extractDateRange("Senior Developer | ACME | Jan 2020 - Present")
    expect(date).toContain("Jan 2020")
    expect(rest).toBe("Senior Developer | ACME")
  })

  it("extracts a year range", () => {
    const { date } = extractDateRange("2015-2019")
    expect(date).toContain("2015")
  })

  it("extracts MM/YYYY", () => {
    const { date } = extractDateRange("06/2018")
    expect(date).toContain("06/2018")
  })

  it("returns the line unchanged when no date is present", () => {
    const { rest, date } = extractDateRange("Just a plain title")
    expect(date).toBe("")
    expect(rest).toBe("Just a plain title")
  })
})

describe("matchHeading", () => {
  it("detects English section headings", () => {
    expect(matchHeading("WORK EXPERIENCE")).toBe("experience")
    expect(matchHeading("Professional Summary")).toBe("summary")
    expect(matchHeading("Skills")).toBe("skills")
    expect(matchHeading("Education")).toBe("education")
  })

  it("detects French section headings", () => {
    expect(matchHeading("Expérience professionnelle")).toBe("experience")
    expect(matchHeading("Compétences")).toBe("skills")
    expect(matchHeading("Formation")).toBe("education")
  })

  it("detects Arabic section headings", () => {
    expect(matchHeading("الخبرة المهنية")).toBe("experience")
    expect(matchHeading("المهارات")).toBe("skills")
  })

  it("prefers the longest pattern for ambiguous headings", () => {
    expect(matchHeading("Formations complémentaires")).toBe("courses")
  })

  it("rejects body lines that merely contain a keyword", () => {
    expect(matchHeading("Summary of results achieved in the role")).toBeNull()
    expect(matchHeading("5 years of experience in SaaS")).toBeNull()
  })
})

describe("linesToDraft", () => {
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

  it("extracts contact fields", () => {
    const draft = linesToDraft(SAMPLE_EN)
    expect(draft.contact.fullName).toBe("Jane Doe")
    expect(draft.contact.jobTitle).toBe("Software Engineer")
    expect(draft.contact.email).toBe("jane.doe@example.com")
    expect(draft.contact.phone).toBe("+1 555 123 4567")
    expect(draft.contact.location).toBe("Paris, France")
  })

  it("extracts contact fields from a joined line (DOCX style)", () => {
    const draft = linesToDraft([
      "Jane Doe",
      "Software Engineer",
      "jane.doe@example.com · +1 555 123 4567 · Paris, France",
      "",
      "Professional Summary",
      "Hello.",
    ])
    expect(draft.contact.email).toBe("jane.doe@example.com")
    expect(draft.contact.phone).toBe("+1 555 123 4567")
    expect(draft.contact.location).toBe("Paris, France")
  })

  it("maps sections with localized headings", () => {
    const draft = linesToDraft(SAMPLE_EN)
    const types = draft.sections.map((s) => s.type)
    expect(types).toContain("summary")
    expect(types).toContain("experience")
    expect(types).toContain("education")
    expect(types).toContain("skills")
    expect(types).toContain("languages")
  })

  it("groups experience entries with title, meta and bullets", () => {
    const draft = linesToDraft(SAMPLE_EN)
    const experience = draft.sections.find((s) => s.type === "experience")!
    expect(experience.entries).toHaveLength(2)
    expect(experience.entries[0].title).toBe("Senior Developer | ACME Corp")
    expect(experience.entries[0].meta).toContain("Jan 2020")
    expect(experience.entries[0].lines).toEqual([
      "Led a team of 5 engineers",
      "Shipped the v2 platform",
    ])
    expect(experience.entries[1].title).toBe("Product Engineer | Globex")
    expect(experience.entries[1].meta).toContain("2015")
  })

  it("splits a date-bearing title line even when the current entry has no meta", () => {
    const draft = linesToDraft([
      "Work Experience",
      "Senior Developer | ACME Corp",
      "- Led a team of 5 engineers",
      "Product Engineer | Globex | 2015-2019",
    ])
    const experience = draft.sections.find((s) => s.type === "experience")!
    expect(experience.entries).toHaveLength(2)
    expect(experience.entries[0].title).toBe("Senior Developer | ACME Corp")
    expect(experience.entries[0].lines).toEqual(["Led a team of 5 engineers"])
    expect(experience.entries[1].title).toBe("Product Engineer | Globex")
    expect(experience.entries[1].meta).toContain("2015")
    expect(experience.entries[0].meta).toBe("")
  })

  it("keeps a DOCX-style meta line as metadata instead of splitting", () => {
    const draft = linesToDraft([
      "Professional Summary",
      "Hello.",
      "",
      "Work Experience",
      "Senior Developer",
      "ACME Corp · Jan 2020 – Present",
      "- Led a team of 5 engineers",
    ])
    const experience = draft.sections.find((s) => s.type === "experience")!
    expect(experience.entries).toHaveLength(1)
    expect(experience.entries[0].title).toBe("Senior Developer")
    expect(experience.entries[0].meta).toContain("Jan 2020")
    expect(experience.entries[0].lines).toEqual(["Led a team of 5 engineers"])
  })

  it("splits skills on separators", () => {
    const draft = linesToDraft(SAMPLE_EN)
    const skills = draft.sections.find((s) => s.type === "skills")!
    expect(skills.entries.map((e) => e.title)).toEqual([
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
    ])
  })

  it("splits each language line into a name and a level", () => {
    const draft = linesToDraft(SAMPLE_EN)
    const languages = draft.sections.find((s) => s.type === "languages")!
    expect(languages.entries.map((e) => [e.title, e.meta])).toEqual([
      ["English", "Native"],
      ["French", "Fluent"],
    ])
  })

  it("strips bullet markers from lines", () => {
    const draft = linesToDraft(["• Led", "- Led", "* Led"])
    expect(draft.unmapped).not.toContain("• Led")
  })

  it("collects unrecognized lines into unmapped", () => {
    const draft = linesToDraft(["Jane Doe", "some random quote 42", "another mystery line 7"])
    expect(draft.unmapped).toContain("some random quote 42")
    expect(draft.unmapped).toContain("another mystery line 7")
  })

  it("handles empty input without crashing", () => {
    const draft = linesToDraft([])
    expect(draft.sections).toHaveLength(0)
    expect(draft.contact.fullName).toBe("")
  })

  it("handles French input end to end", () => {
    const draft = linesToDraft([
      "Jean Dupont",
      "jean.dupont@mail.fr",
      "",
      "Profil professionnel",
      "Ingénieur logiciel passionné.",
      "",
      "Expérience professionnelle",
      "Développeur | TechCorp | Mars 2019 - Aujourd'hui",
      "- API REST",
      "",
      "Formation",
      "Master Informatique | Université Paris | 2015-2018",
      "",
      "Compétences",
      "Python, Django",
    ])
    expect(draft.contact.fullName).toBe("Jean Dupont")
    expect(draft.contact.email).toBe("jean.dupont@mail.fr")
    expect(draft.sections.map((s) => s.type)).toEqual(
      expect.arrayContaining(["summary", "experience", "education", "skills"]),
    )
    const experience = draft.sections.find((s) => s.type === "experience")!
    expect(experience.entries[0].title).toBe("Développeur | TechCorp")
    expect(experience.entries[0].meta).toContain("Mars 2019")
    const skills = draft.sections.find((s) => s.type === "skills")!
    expect(skills.entries.map((e) => e.title)).toEqual(["Python", "Django"])
  })

  it("handles Arabic input end to end", () => {
    const draft = linesToDraft([
      "أحمد علي",
      "ahmed@example.com",
      "",
      "الملخص المهني",
      "مهندس برمجيات بخبرة 10 سنوات.",
      "",
      "الخبرة المهنية",
      "مهندس أول | شركة التقنية | 2020 - الآن",
      "- قيادة فريق من 4 مهندسين",
      "",
      "المهارات",
      "TypeScript, React",
    ])
    expect(draft.contact.fullName).toBe("أحمد علي")
    expect(draft.sections.map((s) => s.type)).toEqual(
      expect.arrayContaining(["summary", "experience", "skills"]),
    )
    const experience = draft.sections.find((s) => s.type === "experience")!
    expect(experience.entries[0].title).toBe("مهندس أول | شركة التقنية")
    expect(experience.entries[0].meta).toContain("2020")
  })
})
describe("soft skills headings and content", () => {
  it("recognises soft-skills headings in English, French and Arabic", () => {
    expect(matchHeading("SOFT SKILLS")).toBe("softSkills")
    expect(matchHeading("Interpersonal Skills")).toBe("softSkills")
    expect(matchHeading("COMPÉTENCES TRANSVERSALES")).toBe("softSkills")
    expect(matchHeading("Savoir-être")).toBe("softSkills")
    expect(matchHeading("المهارات الشخصية")).toBe("softSkills")
  })

  it("keeps technical skills headings on the technical skills section", () => {
    expect(matchHeading("Skills")).toBe("skills")
    expect(matchHeading("Technical Skills")).toBe("skills")
    expect(matchHeading("Compétences techniques")).toBe("skills")
    expect(matchHeading("المهارات")).toBe("skills")
  })

  it("splits a 'A • B • C' line into separate soft skills", () => {
    const draft = linesToDraft([
      "Jane Doe",
      "jane@example.com",
      "",
      "Technical Skills",
      "Java, SQL",
      "",
      "Soft Skills",
      "Communication  •  Teamwork  •  Adaptability",
    ])
    const soft = draft.sections.find((s) => s.type === "softSkills")!
    expect(soft.entries.map((e) => e.title)).toEqual(["Communication", "Teamwork", "Adaptability"])
    const tech = draft.sections.find((s) => s.type === "skills")!
    expect(tech.entries.map((e) => e.title)).toEqual(["Java", "SQL"])
  })
})
