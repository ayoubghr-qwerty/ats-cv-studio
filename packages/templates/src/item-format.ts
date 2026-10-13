import type { DatePlacement, InlineSeparator, ItemFormatTokens, TemplateDefinition } from "./types"

/**
 * Separators for one-line lists. Non-breaking spaces sit before the mark and a
 * normal space after it, so a wrapped line never starts with the mark and the
 * gap stays visible (plain spaces collapse in HTML).
 */
export const INLINE_SEPARATOR_TEXT: Record<InlineSeparator, string> = {
  comma: ", ",
  bullet: "\u00a0\u00a0\u2022\u00a0 ",
}

/** Between languages on one line: "French: Advanced  |  Arabic: Fluent". */
export const LANGUAGES_SEPARATOR = "\u00a0\u00a0|\u00a0 "

export function inlineSeparatorText(kind?: InlineSeparator): string {
  return INLINE_SEPARATOR_TEXT[kind === "bullet" ? "bullet" : "comma"]
}

/** "Role - Company · City" and "Feb 2025 - Nov 2025": the long-standing default. */
export const DEFAULT_ITEM_FORMAT: ItemFormatTokens = {
  titleSeparator: " - ",
  metaSeparator: " \u00b7 ",
  rangeSeparator: " - ",
}

export function resolveItemFormat(format?: ItemFormatTokens): ItemFormatTokens {
  return format ? { ...DEFAULT_ITEM_FORMAT, ...format } : DEFAULT_ITEM_FORMAT
}

/**
 * Effective date placement. An explicit user choice always wins; otherwise
 * the family decides (Headline right-aligns, everything else stays inline).
 */
export function resolveDatePlacement(
  chosen: DatePlacement | undefined,
  familyDefault: DatePlacement,
): DatePlacement {
  return chosen ?? familyDefault
}

/**
 * Settings a document ends up with after a template is applied to it.
 * Regular templates keep the document's own settings and only fill gaps;
 * "ready-made look" templates (`applyLook`) overwrite them with their own.
 */
export function mergeTemplateSettings<T extends object>(
  template: Pick<TemplateDefinition, "defaults" | "applyLook">,
  current: T,
): T {
  const merged = template.applyLook
    ? { ...current, ...template.defaults }
    : { ...template.defaults, ...current }
  return merged as T
}
