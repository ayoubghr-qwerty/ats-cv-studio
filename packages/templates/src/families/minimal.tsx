import type { TemplateRenderFn } from "../types"
import { TemplateRenderer as BaseRenderer } from "../components/template-renderer"
import type { FamilyFlavor } from "../tokens"
import type { DocxStyleMapping } from "../types"

export const minimalFlavor: FamilyFlavor = {
  nameSize: 20,
  nameWeight: 600,
  nameLetterSpacing: 0,
  titleSize: 12,
  titleWeight: 500,
  titleStyle: "normal",
  headingSize: 12,
  headingWeight: 600,
  headingLetterSpacing: 1.5,
  bodySize: 10.5,
  metaSize: 9.5,
  itemTitleWeight: 600,
  itemMetaStyle: "normal",
  contactSeparator: "|",
  spacingFactor: 1.05,
}

export const minimalDocxMapping: DocxStyleMapping = {
  sectionHeadingStyle: "Heading2",
  useBuiltinListBullets: true,
  contactStyle: "Normal",
  titleStyle: "Title",
  rtlSupport: true,
}

export const MinimalTemplate: TemplateRenderFn = (props) => (
  <BaseRenderer {...props} flavor={minimalFlavor} />
)
