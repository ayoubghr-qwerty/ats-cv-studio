import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  convertMillimetersToTwip,
  type ParagraphChild,
} from "docx"
import type { CoverLetterDocument } from "@ats/core"

const FONT = "Arial"

function run(
  text: string,
  opts: { bold?: boolean; italic?: boolean; font?: string } = {},
): ParagraphChild {
  return new TextRun({ text, bold: opts.bold, italics: opts.italic, font: opts.font ?? FONT })
}

function makeParagraph(
  children: ParagraphChild[],
  opts: { rtl?: boolean; spacingAfter?: number } = {},
): Paragraph {
  return new Paragraph({
    children,
    spacing: { after: opts.spacingAfter ?? 120 },
    ...(opts.rtl ? { bidirectional: true, alignment: AlignmentType.RIGHT } : {}),
  })
}

export function buildCoverLetterDocument(letter: CoverLetterDocument): Document {
  const rtl = letter.direction === "rtl"
  const children: Paragraph[] = []

  if (letter.sender.fullName) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [run(letter.sender.fullName)],
        spacing: { after: 160 },
        ...(rtl ? { bidirectional: true, alignment: AlignmentType.RIGHT } : {}),
      }),
    )
  }
  const contact = [letter.sender.email, letter.sender.phone, letter.sender.location]
    .filter((part): part is string => Boolean(part))
    .join(" · ")
  if (contact) {
    children.push(makeParagraph([run(contact, { font: FONT })], { rtl, spacingAfter: 220 }))
  }

  if (letter.date) {
    children.push(makeParagraph([run(letter.date)], { rtl, spacingAfter: 160 }))
  }

  const recipientLines = [
    letter.recipient.name,
    letter.recipient.company,
    letter.recipient.position,
  ].filter((line): line is string => Boolean(line && line.trim()))
  for (const line of recipientLines) {
    children.push(makeParagraph([run(line)], { rtl, spacingAfter: 40 }))
  }
  if (recipientLines.length > 0) {
    children.push(makeParagraph([run("")], { rtl }))
  }

  if (letter.subject) {
    children.push(makeParagraph([run(letter.subject, { bold: true })], { rtl, spacingAfter: 160 }))
  }

  const paragraphs = letter.body
    .split(/\n{2,}/)
    .map((p) => p.trim().replace(/\n/g, " "))
    .filter(Boolean)
  for (const paragraph of paragraphs) {
    children.push(makeParagraph([run(paragraph)], { rtl, spacingAfter: 160 }))
  }

  if (letter.sender.fullName) {
    children.push(makeParagraph([run("")], { rtl }))
    children.push(makeParagraph([run(letter.sender.fullName, { bold: true })], { rtl }))
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22 },
          paragraph: { spacing: { after: 120 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
            margin: {
              top: convertMillimetersToTwip(18),
              bottom: convertMillimetersToTwip(18),
              left: convertMillimetersToTwip(20),
              right: convertMillimetersToTwip(20),
            },
          },
        },
        children,
      },
    ],
  })
}

export async function toCoverLetterBlob(letter: CoverLetterDocument): Promise<Blob> {
  return Packer.toBlob(buildCoverLetterDocument(letter))
}

export async function toCoverLetterBuffer(letter: CoverLetterDocument): Promise<Buffer> {
  return Packer.toBuffer(buildCoverLetterDocument(letter))
}
