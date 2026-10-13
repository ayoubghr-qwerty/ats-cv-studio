import { renderToStaticMarkup } from "react-dom/server"

import type { TemplateDefinition, TemplateRenderFn, TemplateSettings } from "./types"
import { FONT_IDS } from "./tokens"

const ID_PATTERN =
  /^ats-(classic|minimal|modern|executive|technical|headline|compact|focus|functional|professional)-\d{2}$/

const FORBIDDEN_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /<table[\s>]/i, label: "table element" },
  { pattern: /<img[\s>]/i, label: "img element" },
  { pattern: /<svg[\s>]/i, label: "svg element" },
  { pattern: /position\s*:\s*(absolute|fixed)/i, label: "absolute/fixed positioning" },
  { pattern: /float\s*:\s*(left|right)/i, label: "float layout" },
  { pattern: /column-count/i, label: "column-count" },
  { pattern: /columns\s*:/i, label: "columns shorthand" },
  { pattern: /display\s*:\s*none/i, label: "hidden text (display:none)" },
  { pattern: /visibility\s*:\s*hidden/i, label: "hidden text (visibility:hidden)" },
  { pattern: /text-indent\s*:\s*-\d+/i, label: "offscreen text (negative indent)" },
]

export interface RegistryIssue {
  severity: "error" | "warning"
  templateId: string
  message: string
}

export function validateTemplateDefinition(definition: TemplateDefinition): RegistryIssue[] {
  const issues: RegistryIssue[] = []
  const id = definition.id

  if (!ID_PATTERN.test(id)) {
    issues.push({ severity: "error", templateId: id, message: `invalid template id "${id}"` })
  }
  if (!definition.name.en || !definition.name.fr || !definition.name.ar) {
    issues.push({ severity: "error", templateId: id, message: "missing localized name" })
  }
  if (!definition.description.en || !definition.description.fr || !definition.description.ar) {
    issues.push({ severity: "error", templateId: id, message: "missing localized description" })
  }
  for (const locale of ["en", "fr", "ar"] as const) {
    if (!definition.locales.includes(locale)) {
      issues.push({
        severity: "error",
        templateId: id,
        message: `missing locale support: ${locale}`,
      })
    }
  }
  if (!FONT_IDS.includes(definition.defaults.fontId)) {
    issues.push({
      severity: "error",
      templateId: id,
      message: `unapproved font "${definition.defaults.fontId}"`,
    })
  }
  if (definition.customization.allowFontChange && !definition.defaults.fontId) {
    issues.push({
      severity: "error",
      templateId: id,
      message: "font customization enabled without default font",
    })
  }
  if (!definition.docxMapping || !definition.docxMapping.sectionHeadingStyle) {
    issues.push({ severity: "error", templateId: id, message: "missing DOCX style mapping" })
  }
  if (!definition.atsComplianceVersion) {
    issues.push({ severity: "warning", templateId: id, message: "missing atsComplianceVersion" })
  }
  return issues
}

// 17 originally; 16 since the Banner style was removed on purpose.
const MIN_TEMPLATES = 16

export function validateRegistry(definitions: TemplateDefinition[]): RegistryIssue[] {
  const issues: RegistryIssue[] = []
  if (definitions.length < MIN_TEMPLATES) {
    issues.push({
      severity: "error",
      templateId: "*",
      message: `only ${definitions.length} templates registered (need >= ${MIN_TEMPLATES})`,
    })
  }
  const seen = new Set<string>()
  for (const definition of definitions) {
    if (seen.has(definition.id)) {
      issues.push({
        severity: "error",
        templateId: definition.id,
        message: "duplicate template id",
      })
    }
    seen.add(definition.id)
    issues.push(...validateTemplateDefinition(definition))
  }
  return issues
}

// Multi-column CSS is the one construct a user can switch on knowingly (the
// "Two columns" list layout), accepting that some ATS read columns out of order.
const COLUMN_LABELS = new Set(["column-count", "columns shorthand"])

export function atsViolations(html: string, options: { allowColumns?: boolean } = {}): string[] {
  const violations: string[] = []
  for (const { pattern, label } of FORBIDDEN_PATTERNS) {
    if (options.allowColumns && COLUMN_LABELS.has(label)) continue
    if (pattern.test(html)) {
      violations.push(label)
    }
  }
  return violations
}

export function renderTemplateHtml(
  renderer: TemplateRenderFn,
  document: Parameters<TemplateRenderFn>[0]["document"],
  settings: TemplateSettings,
  locale: Parameters<TemplateRenderFn>[0]["locale"],
  direction: Parameters<TemplateRenderFn>[0]["direction"],
  mode: Parameters<TemplateRenderFn>[0]["mode"] = "print",
): string {
  return renderToStaticMarkup(renderer({ document, settings, locale, direction, mode }))
}

export function validateTemplateRender(
  html: string,
  options: { allowColumns?: boolean } = {},
): string[] {
  return atsViolations(html, options)
}
