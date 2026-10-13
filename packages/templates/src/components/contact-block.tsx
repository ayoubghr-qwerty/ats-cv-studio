import { Fragment } from "react"
import type { CvDocument } from "@ats/core"

import type { TemplateStyles } from "../tokens"
import type { ContactAlignment } from "../types"

export interface ContactBlockProps {
  document: CvDocument
  styles: TemplateStyles
  alignment: ContactAlignment
  separator: string
  variant?: "standard" | "headline" | "compact" | "focus" | "functional"
  /** Thin rule under the header block, in the accent colour (standard layout). */
  rule?: boolean
}

export function ContactBlock({
  document,
  styles,
  alignment,
  separator,
  variant = "standard",
  rule = false,
}: ContactBlockProps) {
  const { fullName, jobTitle, email, phone, location, website, linkedin, github } = document.contact
  const lines = [email, phone, location, website, linkedin, github].filter(Boolean)

  if (variant === "compact") {
    // One-line contact: "Name | title — email · phone · location" keeps the
    // header tight for one-page senior CVs. Still pure text (ATS-safe).
    const contactItems = [email, phone, location].filter((v): v is string => Boolean(v))
    const linkItems = [website, linkedin, github].filter((v): v is string => Boolean(v))
    // Each item is unbreakable but the line may wrap BETWEEN items: a single
    // nowrap run made a full set of contact details run past the right margin
    // (and, in right-to-left text, off the left edge of the page).
    const renderItems = (items: string[]) =>
      items.map((item, index) => (
        <Fragment key={item}>
          {index > 0 ? " · " : null}
          <span style={{ whiteSpace: "nowrap" }}>{item}</span>
        </Fragment>
      ))
    const nameSize = Number(String(styles.name.fontSize).replace("pt", ""))
    return (
      <div className="cv-contact" style={{ ...styles.contactBlock, textAlign: alignment }}>
        {fullName ? (
          <h1
            className="cv-name"
            style={{ ...styles.name, fontSize: `${nameSize - 2}pt`, display: "inline" }}
          >
            {fullName}
          </h1>
        ) : null}
        {fullName && jobTitle ? <span style={{ fontWeight: 400 }}> {separator} </span> : null}
        {jobTitle ? (
          <span className="cv-title" style={styles.title}>
            {jobTitle}
          </span>
        ) : null}
        {contactItems.length > 0 ? (
          <span className="cv-contact-line" style={styles.contactLine}>
            {fullName || jobTitle ? " — " : ""}
            {renderItems(contactItems)}
          </span>
        ) : null}
        {linkItems.length > 0 ? (
          <span className="cv-contact-line" style={styles.contactLine}>
            {" "}
            {"· "}
            {renderItems(linkItems)}
          </span>
        ) : null}
      </div>
    )
  }

  if (variant === "focus") {
    // Split header: name + headline left, contact lines right-aligned in the
    // same band. DOM order stays name -> contact (parse-safe); flex row with
    // space-between provides the visual split.
    return (
      <div
        className="cv-contact"
        style={{
          ...styles.contactBlock,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "16pt",
        }}
      >
        <div style={{ textAlign: alignment }}>
          {fullName ? (
            <h1 className="cv-name" style={{ ...styles.name, margin: 0 }}>
              {fullName}
            </h1>
          ) : null}
          {document.headline || jobTitle ? (
            <p
              className="cv-headline"
              style={{
                ...styles.title,
                fontWeight: 600,
                margin: "2pt 0 0 0",
                ...(styles.accent && document.headline ? { color: styles.accent } : {}),
              }}
            >
              {document.headline || jobTitle}
            </p>
          ) : null}
        </div>
        {lines.length > 0 ? (
          <p className="cv-contact-line" style={{ ...styles.contactLine, textAlign: "end" }}>
            {lines.join(` ${separator} `)}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className="cv-contact"
      style={{
        ...styles.contactBlock,
        textAlign: alignment,
        ...(rule
          ? { borderBottom: `1.25pt solid ${styles.accent || "#2d2d2d"}`, paddingBottom: "6pt" }
          : {}),
      }}
    >
      {fullName ? (
        <h1 className="cv-name" style={styles.name}>
          {fullName}
        </h1>
      ) : null}
      {variant === "headline" && document.headline ? (
        <p
          className="cv-headline"
          style={{
            ...styles.title,
            fontWeight: 700,
            letterSpacing: 0.3,
            margin: "1pt 0 2pt",
            ...(styles.accent ? { color: styles.accent } : {}),
          }}
        >
          {document.headline}
        </p>
      ) : jobTitle ? (
        <p className="cv-title" style={styles.title}>
          {jobTitle}
        </p>
      ) : null}
      {lines.length > 0 ? (
        <p className="cv-contact-line" style={styles.contactLine}>
          {lines.join(` ${separator} `)}
        </p>
      ) : null}
    </div>
  )
}
