import type { TemplateRenderFn } from "../types"
import { TemplateRenderer as BaseRenderer } from "../components/template-renderer"
import type { FamilyFlavor } from "../tokens"
import type { DocxStyleMapping } from "../types"

export const classicFlavor: FamilyFlavor = {
  nameSize: 22,
  nameWeight: 700,
  nameLetterSpacing: 0.5,
  titleSize: 13,
  titleWeight: 600,
  titleStyle: "normal",
  headingSize: 12.5,
  headingWeight: 700,
  headingLetterSpacing: 0.5,
  bodySize: 10.5,
  metaSize: 9.5,
  itemTitleWeight: 700,
  itemMetaStyle: "normal",
  contactSeparator: "|",
  spacingFactor: 1,
}

export const classicDocxMapping: DocxStyleMapping = {
  sectionHeadingStyle: "Heading2",
  useBuiltinListBullets: true,
  contactStyle: "Normal",
  titleStyle: "Title",
  rtlSupport: true,
}

export const ClassicTemplate: TemplateRenderFn = (props) => (
  <BaseRenderer {...props} flavor={classicFlavor} />
)
