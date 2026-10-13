import { describe, expect, it } from "vitest"

import { createCoverLetterDocument, createCvDocument } from "../src/factories"
import { setSectionTitle } from "../src/store/cv-store"
import {
  duplicateAsVariant,
  removeVersion,
  restoreVersion,
  snapshotDocument,
} from "../src/versioning"

function makeDoc() {
  const doc = createCvDocument({ locale: "en", name: "My CV" })
  return setSectionTitle(doc, doc.sections[1].id, "Work Experience")
}

describe("versioning", () => {
  it("snapshots the document with a name and timestamp", () => {
    const doc = makeDoc()
    const next = snapshotDocument(doc, "Before application")
    expect(next.versions).toHaveLength(1)
    expect(next.versions[0].name).toBe("Before application")
    expect(next.versions[0].createdAt).toBeTruthy()
    expect(next.versions[0].id).toMatch(/^version-/)
  })

  it("snapshot is isolated from later edits", () => {
    const doc = makeDoc()
    const next = snapshotDocument(doc, "v1")
    const edited = setSectionTitle(next, next.sections[1].id, "Career")
    expect(edited.sections[1].title).toBe("Career")
    expect(next.versions[0].snapshot).toBeDefined()
    const snap = next.versions[0].snapshot as { sections: Array<{ title: string }> }
    expect(snap.sections[1].title).toBe("Work Experience")
  })

  it("restores content from a snapshot", () => {
    const doc = makeDoc()
    const next = snapshotDocument(doc, "v1")
    const edited = setSectionTitle(next, next.sections[1].id, "Career")
    const restored = restoreVersion(edited, next.versions[0].id)
    expect(restored.sections[1].title).toBe("Work Experience")
    expect(restored.id).toBe(doc.id)
    expect(restored.name).toBe("My CV")
    expect(restored.versions).toHaveLength(1)
  })

  it("restore with unknown id returns the document unchanged", () => {
    const doc = makeDoc()
    const next = restoreVersion(doc, "version-missing")
    expect(next).toBe(doc)
  })

  it("removes a version snapshot", () => {
    const doc = makeDoc()
    const a = snapshotDocument(doc, "v1")
    const b = snapshotDocument(a, "v2")
    const removed = removeVersion(b, b.versions[0].id)
    expect(removed.versions).toHaveLength(1)
    expect(removed.versions[0].name).toBe("v2")
  })

  it("duplicates as a variant with a custom name and locale", () => {
    const doc = makeDoc()
    const variant = duplicateAsVariant(doc, { name: "French CV", locale: "fr" }) as ReturnType<
      typeof createCvDocument
    >
    expect(variant.id).not.toBe(doc.id)
    expect(variant.name).toBe("French CV")
    expect(variant.locale).toBe("fr")
    expect(variant.direction).toBe("ltr")
    expect(variant.versions).toEqual([])
  })

  it("duplicates with Arabic locale flips direction to rtl", () => {
    const doc = makeDoc()
    const variant = duplicateAsVariant(doc, { locale: "ar" }) as ReturnType<typeof createCvDocument>
    expect(variant.direction).toBe("rtl")
  })

  it("duplicates a cover letter as a variant", () => {
    const letter = createCoverLetterDocument({ locale: "en", name: "Cover" })
    const variant = duplicateAsVariant(letter, { name: "Cover (EN)" })
    expect(variant.id).not.toBe(letter.id)
    expect(variant.name).toBe("Cover (EN)")
  })
})
