import { MARGIN_PRESETS } from "./tokens"

/**
 * The `@page` rule for the print view.
 *
 * A CV's margin is a PAGE margin, not padding on one tall block: padding on a
 * fixed-height block only exists at the start and end of that block, so every
 * continuation page of a multi-page CV started at the top edge of the paper
 * (text at ~0.6 mm) and page 1 ran down to the bottom edge. As a page margin
 * it is applied on every page. The desktop export prints with zero printer
 * margins, and the CSS page margin still applies in that case.
 *
 * Cover letters keep their own padding and a zero page margin.
 */
export function printPageRule(
  pageSize: string,
  kind: "cv" | "cover-letter",
  marginPreset?: string,
): string {
  const marginMm =
    kind === "cv" ? (MARGIN_PRESETS[marginPreset as keyof typeof MARGIN_PRESETS] ?? 16) : 0
  return `@page { size: ${pageSize} portrait; margin: ${marginMm}mm; }`
}
