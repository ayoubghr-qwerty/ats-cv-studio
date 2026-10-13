import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { ACCENT_IDS } from "../src/tokens"

type Locale = Record<string, unknown>

function load(locale: string): { editor: Locale } {
  const url = new URL(`../../i18n/src/${locale}.json`, import.meta.url)
  return JSON.parse(readFileSync(url, "utf8")) as { editor: Locale }
}

// The Design panel renders `editor.<group>.<value>` for every option; a missing
// key is shown to the user as the raw key (e.g. "editor.accent.none").
const GROUPS: Record<string, string[]> = {
  accentColor: ACCENT_IDS,
  inlineSeparator: ["comma", "bullet"],
  skillsLayout: ["list", "inline"],
  languagesLayout: ["list", "inline"],
  datePlacement: ["auto", "inline", "right"],
  density: ["compact", "standard", "comfortable"],
  heading: ["simple", "bold", "uppercase"],
  separatorStyle: ["none", "subtle", "ruled", "dashed"],
  bullet: ["disc", "hyphen"],
  columns: ["single", "two"],
  align: ["left", "center"],
}

describe("design panel labels", () => {
  for (const locale of ["en", "fr", "ar"]) {
    it(`${locale} has a label for every Design panel option`, () => {
      const editor = load(locale).editor
      for (const [group, values] of Object.entries(GROUPS)) {
        const labels = editor[group] as Record<string, unknown> | undefined
        for (const value of values) {
          expect(typeof labels?.[value], `editor.${group}.${value}`).toBe("string")
        }
      }
      expect(typeof editor.inlineSeparatorLabel).toBe("string")
    })
  }
})
