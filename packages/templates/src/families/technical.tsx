import type { TemplateRenderFn } from "../types"
import { TemplateRenderer as BaseRenderer } from "../components/template-renderer"
import type { FamilyFlavor } from "../tokens"
import type { DocxStyleMapping } from "../types"

export const technicalFlavor: FamilyFlavor = {
  nameSize: 21,
  nameWeight: 700,
  nameLetterSpacing: 0.3,
  titleSize: 12.5,
  titleWeight: 600,
  titleStyle: "normal",
  headingSize: 12,
  headingWeight: 700,
  headingLetterSpacing: 0.8,
  bodySize: 10,
  metaSize: 9.5,
  itemTitleWeight: 600,
  itemMetaStyle: "normal",
  contactSeparator: "|",
  spacingFactor: 0.95,
}

export const technicalDocxMapping: DocxStyleMapping = {
  sectionHeadingStyle: "Heading3",
  useBuiltinListBullets: true,
  contactStyle: "Normal",
  titleStyle: "Heading1",
  rtlSupport: true,
}

export const TechnicalTemplate: TemplateRenderFn = (props) => (
  <BaseRenderer {...props} flavor={technicalFlavor} />
)
