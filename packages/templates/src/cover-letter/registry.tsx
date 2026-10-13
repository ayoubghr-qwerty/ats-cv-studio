import type { CSSProperties, ReactNode } from "react"

import type { CoverLetterDocument, CoverLetterTemplateSettings } from "@ats/core"

import type { CoverLetterLocale, CoverLetterTemplateEntry } from "./types"
import type { FontId } from "../types"
import { ARABIC_FONT_STACK, FONTS, MARGIN_PRESETS, SPACING_DENSITY } from "../tokens"

const DEFAULT_LETTER_SETTINGS: CoverLetterTemplateSettings = {
  fontId: "arial",
  marginPreset: "standard",
  spacingDensity: "standard",
}

function letterStyle(
  doc: CoverLetterDocument,
  settings: CoverLetterTemplateSettings,
): CSSProperties {
  const marginMm = MARGIN_PRESETS[settings.marginPreset] ?? 16
  const fontStack = FONTS[settings.fontId as FontId] ?? FONTS.arial
  const baseFont = doc.direction === "rtl" ? ARABIC_FONT_STACK : fontStack
  return {
    position: "relative",
    width: "210mm",
    minHeight: "297mm",
    padding: `${marginMm}mm ${marginMm + 2}mm`,
    margin: "0 auto",
    boxSizing: "border-box",
    background: "#fff",
    color: "#1a1a1a",
    fontFamily: baseFont,
    fontSize: "11pt",
    lineHeight: 1.55,
    textAlign: doc.direction === "rtl" ? "right" : "left",
  }
}

function CoverLetterPage({
  doc,
  settings,
  children,
}: {
  doc: CoverLetterDocument
  settings: CoverLetterTemplateSettings
  children: ReactNode
}) {
  const style = letterStyle(doc, settings)
  return (
    <div dir={doc.direction} className="cl-page" style={style}>
      {children}
    </div>
  )
}

function SenderBlock({ doc, align }: { doc: CoverLetterDocument; align: "left" | "center" }) {
  const style: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: align === "center" ? "center" : "flex-start",
    marginBottom: "10mm",
  }
  const contact = [doc.sender.email, doc.sender.phone, doc.sender.location]
    .filter((part): part is string => Boolean(part))
    .join(" · ")
  return (
    <header style={style}>
      {doc.sender.fullName && (
        <h1 style={{ margin: 0, fontSize: "16pt", fontWeight: 700, letterSpacing: "0.02em" }}>
          {doc.sender.fullName}
        </h1>
      )}
      {contact && <p style={{ margin: "2mm 0 0", fontSize: "9.5pt", color: "#444" }}>{contact}</p>}
    </header>
  )
}

function DateLine({ doc, align }: { doc: CoverLetterDocument; align: "left" | "right" }) {
  if (!doc.date) return null
  return (
    <p style={{ margin: "0 0 4mm", textAlign: align, fontSize: "10pt", color: "#333" }}>
      {doc.date}
    </p>
  )
}

function RecipientBlock({ doc }: { doc: CoverLetterDocument }) {
  const { name, position, company } = doc.recipient
  const lines = [name, company, position].filter((line): line is string =>
    Boolean(line && line.trim()),
  )
  if (lines.length === 0) return null
  return (
    <div style={{ margin: "0 0 6mm", fontSize: "10.5pt" }}>
      {lines.map((line, i) => (
        <p key={i} style={{ margin: 0 }}>
          {line}
        </p>
      ))}
    </div>
  )
}

function Subject({ doc }: { doc: CoverLetterDocument }) {
  if (!doc.subject) return null
  return <p style={{ margin: "0 0 4mm", fontWeight: 700, fontSize: "11pt" }}>{doc.subject}</p>
}

function Body({ doc, spacing }: { doc: CoverLetterDocument; spacing: number }) {
  const paragraphs = doc.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  return (
    <div style={{ margin: `0 0 ${spacing * 1.25}pt` }}>
      {paragraphs.map((paragraph, i) => (
        <p key={i} style={{ margin: `0 0 ${spacing}pt` }}>
          {paragraph.replace(/\n/g, " ")}
        </p>
      ))}
    </div>
  )
}

function Signature({ doc, spacing }: { doc: CoverLetterDocument; spacing: number }) {
  if (!doc.sender.fullName) return null
  return (
    <div style={{ marginTop: `${spacing * 1.25}pt` }}>
      <p style={{ margin: `0 0 ${spacing}pt` }} />
      <p style={{ margin: 0, fontWeight: 600 }}>{doc.sender.fullName}</p>
    </div>
  )
}

type TemplateComponent = (props: {
  doc: CoverLetterDocument
  settings: CoverLetterTemplateSettings
}) => ReactNode

interface TemplateProps {
  doc: CoverLetterDocument
  settings: CoverLetterTemplateSettings
}

function ClassicTemplate({ doc, settings }: TemplateProps) {
  const spacing = SPACING_DENSITY[settings.spacingDensity] ?? SPACING_DENSITY.standard
  return (
    <CoverLetterPage doc={doc} settings={settings}>
      <SenderBlock doc={doc} align="center" />
      <div style={{ borderBottom: "1px solid #bbb", marginBottom: "8mm" }} />
      <DateLine doc={doc} align="right" />
      <RecipientBlock doc={doc} />
      <Subject doc={doc} />
      <div style={{ marginBottom: "3mm" }}>
        <Body doc={doc} spacing={spacing.paragraph} />
      </div>
      <Signature doc={doc} spacing={spacing.paragraph} />
    </CoverLetterPage>
  )
}

function ModernTemplate({ doc, settings }: TemplateProps) {
  const spacing = SPACING_DENSITY[settings.spacingDensity] ?? SPACING_DENSITY.standard
  return (
    <CoverLetterPage doc={doc} settings={settings}>
      <SenderBlock doc={doc} align="left" />
      <div style={{ height: "3px", background: "#1a1a1a", marginBottom: "8mm" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6mm" }}>
        <RecipientBlock doc={doc} />
        <DateLine doc={doc} align="left" />
      </div>
      <Subject doc={doc} />
      <div style={{ marginBottom: "3mm" }}>
        <Body doc={doc} spacing={spacing.paragraph} />
      </div>
      <Signature doc={doc} spacing={spacing.paragraph} />
    </CoverLetterPage>
  )
}

function MinimalTemplate({ doc, settings }: TemplateProps) {
  const resolved: CoverLetterTemplateSettings =
    settings.fontId === "arial" ? { ...settings, fontId: "georgia" } : settings
  const spacing = SPACING_DENSITY[resolved.spacingDensity] ?? SPACING_DENSITY.standard
  return (
    <CoverLetterPage doc={doc} settings={resolved}>
      <HeaderSpacer doc={doc} />
      <DateLine doc={doc} align="left" />
      <RecipientBlock doc={doc} />
      <Subject doc={doc} />
      <Body doc={doc} spacing={spacing.paragraph} />
      <Signature doc={doc} spacing={spacing.paragraph} />
    </CoverLetterPage>
  )
}

function HeaderSpacer({ doc }: { doc: CoverLetterDocument }) {
  return (
    <header
      style={{
        marginBottom: "8mm",
        paddingBottom: "4mm",
        borderBottom: "1px solid #ddd",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {doc.sender.fullName && (
        <h1 style={{ margin: 0, fontSize: "14pt", fontWeight: 600 }}>{doc.sender.fullName}</h1>
      )}
      {(doc.sender.email || doc.sender.phone) && (
        <p style={{ margin: "2mm 0 0", fontSize: "9pt", color: "#555" }}>
          {[doc.sender.email, doc.sender.phone, doc.sender.location]
            .filter((part): part is string => Boolean(part))
            .join(" · ")}
        </p>
      )}
    </header>
  )
}

function entry(
  id: string,
  name: Record<CoverLetterLocale, string>,
  Component: TemplateComponent,
): CoverLetterTemplateEntry {
  return {
    id,
    name,
    description: name,
    render: (doc) => (
      <Component doc={doc} settings={doc.templateSettings ?? DEFAULT_LETTER_SETTINGS} />
    ),
  }
}

export const COVER_LETTER_TEMPLATES: CoverLetterTemplateEntry[] = [
  entry("classic", { en: "Classic", fr: "Classique", ar: "كلاسيكي" }, (props) => (
    <ClassicTemplate {...props} />
  )),
  entry("modern", { en: "Modern", fr: "Moderne", ar: "حديث" }, (props) => (
    <ModernTemplate {...props} />
  )),
  entry("minimal", { en: "Minimal", fr: "Minimaliste", ar: "بسيط" }, (props) => (
    <MinimalTemplate {...props} />
  )),
]

const COVER_LETTER_BY_ID = new Map(
  COVER_LETTER_TEMPLATES.map((template) => [template.id, template]),
)

export function resolveCoverLetterTemplate(id: string | undefined): CoverLetterTemplateEntry {
  return COVER_LETTER_BY_ID.get(id ?? "") ?? COVER_LETTER_TEMPLATES[0]
}
