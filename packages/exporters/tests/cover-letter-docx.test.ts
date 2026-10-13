import { describe, expect, it } from "vitest"
import { inflateRawSync } from "node:zlib"

import { createCoverLetterDocument } from "@ats/core"

import { buildCoverLetterDocument, toCoverLetterBuffer } from "../src/docx/cover-letter-docx"

function readDocumentXml(buffer: Buffer): string {
  const end = buffer.lastIndexOf(Buffer.from("PK\x05\x06"))
  const entryCount = buffer.readUInt16LE(end + 10)
  const entries: Record<string, { localOffset: number; size: number; method: number }> = {}
  let offset = buffer.readUInt32LE(end + 16)
  for (let i = 0; i < entryCount; i++) {
    const nameLen = buffer.readUInt16LE(offset + 28)
    const extraLen = buffer.readUInt16LE(offset + 30)
    const commentLen = buffer.readUInt16LE(offset + 32)
    const name = buffer.subarray(offset + 46, offset + 46 + nameLen).toString()
    entries[name] = {
      localOffset: buffer.readUInt32LE(offset + 42),
      size: buffer.readUInt32LE(offset + 20),
      method: buffer.readUInt16LE(offset + 10),
    }
    offset += 46 + nameLen + extraLen + commentLen
  }
  const entry = entries["word/document.xml"]
  const localHeaderSize =
    30 + buffer.readUInt16LE(entry.localOffset + 26) + buffer.readUInt16LE(entry.localOffset + 28)
  const data = buffer.subarray(
    entry.localOffset + localHeaderSize,
    entry.localOffset + localHeaderSize + entry.size,
  )
  return entry.method === 0 ? data.toString("utf8") : inflateRawSync(data).toString("utf8")
}

function sampleLetter() {
  return {
    ...createCoverLetterDocument({ locale: "en", name: "Cover letter" }),
    sender: {
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      phone: "+1 555 123 4567",
      location: "Paris, France",
    },
    recipient: { name: "Hiring Manager", company: "ACME Corp", position: "Software Engineer" },
    date: "2026-08-13",
    subject: "Application for Software Engineer",
    body: "Dear Hiring Manager,\n\nI am writing to apply for the role.\n\nThank you for your consideration.",
  }
}

describe("cover letter docx exporter", () => {
  it("includes all letter fields in the output", async () => {
    const xml = readDocumentXml(await toCoverLetterBuffer(sampleLetter()))
    expect(xml).toContain("Jane Doe")
    expect(xml).toContain("Hiring Manager")
    expect(xml).toContain("ACME Corp")
    expect(xml).toContain("Application for Software Engineer")
    expect(xml).toContain("I am writing to apply for the role.")
  })

  it("marks Arabic letters as RTL", async () => {
    const letter = {
      ...sampleLetter(),
      locale: "ar" as const,
      direction: "rtl" as const,
      sender: { ...sampleLetter().sender, fullName: "أحمد علي" },
      body: "عزيزي مدير التوظيف،\n\nأكتب إليكم للتقدم لهذا المنصب.",
    }
    const xml = readDocumentXml(await toCoverLetterBuffer(letter))
    expect(xml).toMatch(/<w:bidi\/>/)
  })

  it("does not use tables for layout", async () => {
    const xml = readDocumentXml(await toCoverLetterBuffer(sampleLetter()))
    expect(xml).not.toMatch(/<w:tbl>/)
  })

  it("produces a valid docx zip", async () => {
    const buffer = await toCoverLetterBuffer(sampleLetter())
    expect(buffer.length).toBeGreaterThan(800)
    expect(buffer.subarray(0, 2).toString()).toBe("PK")
    expect(buildCoverLetterDocument(sampleLetter())).toBeDefined()
  })
})
