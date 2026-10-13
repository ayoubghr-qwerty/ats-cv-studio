import type { TemplateRenderFn } from "../types"
import { TemplateRenderer as BaseRenderer } from "../components/template-renderer"
import type { FamilyFlavor } from "../tokens"
import type { DocxStyleMapping } from "../types"

export const executiveFlavor: FamilyFlavor = {
  nameSize: 23,
  nameWeight: 600,
  nameLetterSpacing: 1.2,
  titleSize: 13,
  titleWeight: 500,
  titleStyle: "italic",
  headingSize: 13,
  headingWeight: 600,
  headingLetterSpacing: 1,
  bodySize: 11,
  metaSize: 10,
  itemTitleWeight: 700,
  itemMetaStyle: "normal",
  contactSeparator: "|",
  spacingFactor: 1.1,
}

export const executiveDocxMapping: DocxStyleMapping = {
  sectionHeadingStyle: "Heading2",
  useBuiltinListBullets: true,
  contactStyle: "Normal",
  titleStyle: "Title",
  rtlSupport: true,
}

export const ExecutiveTemplate: TemplateRenderFn = (props) => (
  <BaseRenderer {...props} flavor={executiveFlavor} />
)
