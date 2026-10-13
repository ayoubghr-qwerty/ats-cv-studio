import type { TemplateRenderFn } from "../types"
import { TemplateRenderer as BaseRenderer } from "../components/template-renderer"
import type { FamilyFlavor } from "../tokens"
import type { DocxStyleMapping } from "../types"

export const modernFlavor: FamilyFlavor = {
  nameSize: 24,
  nameWeight: 700,
  nameLetterSpacing: 0,
  titleSize: 13.5,
  titleWeight: 500,
  titleStyle: "normal",
  headingSize: 12,
  headingWeight: 650,
  headingLetterSpacing: 0.5,
  bodySize: 10.5,
  metaSize: 9.5,
  itemTitleWeight: 650,
  itemMetaStyle: "italic",
  contactSeparator: "|",
  spacingFactor: 1,
}

export const modernDocxMapping: DocxStyleMapping = {
  sectionHeadingStyle: "Heading2",
  useBuiltinListBullets: true,
  contactStyle: "Normal",
  titleStyle: "Title",
  rtlSupport: true,
}

export const ModernTemplate: TemplateRenderFn = (props) => (
  <BaseRenderer {...props} flavor={modernFlavor} />
)
