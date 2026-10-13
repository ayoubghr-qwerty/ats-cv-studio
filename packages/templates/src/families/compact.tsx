import type { TemplateRenderFn } from "../types"
import { TemplateRenderer as BaseRenderer } from "../components/template-renderer"
import type { FamilyFlavor } from "../tokens"
import type { DocxStyleMapping } from "../types"

export const compactFlavor: FamilyFlavor = {
  nameSize: 17,
  nameWeight: 700,
  nameLetterSpacing: 0.3,
  titleSize: 10.5,
  titleWeight: 500,
  titleStyle: "normal",
  headingSize: 10.5,
  headingWeight: 700,
  headingLetterSpacing: 0.8,
  bodySize: 9.5,
  metaSize: 9,
  itemTitleWeight: 600,
  itemMetaStyle: "normal",
  contactSeparator: "|",
  spacingFactor: 0.85,
}

export const compactDocxMapping: DocxStyleMapping = {
  sectionHeadingStyle: "Heading3",
  useBuiltinListBullets: true,
  contactStyle: "Normal",
  titleStyle: "Normal",
  rtlSupport: true,
}

export const CompactTemplate: TemplateRenderFn = (props) => (
  <BaseRenderer {...props} flavor={compactFlavor} variant="compact" />
)
