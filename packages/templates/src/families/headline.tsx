import type { TemplateRenderFn } from "../types"
import { TemplateRenderer as BaseRenderer } from "../components/template-renderer"
import type { FamilyFlavor } from "../tokens"
import type { DocxStyleMapping } from "../types"

export const headlineFlavor: FamilyFlavor = {
  nameSize: 23,
  nameWeight: 700,
  nameLetterSpacing: 0.4,
  titleSize: 12.5,
  titleWeight: 600,
  titleStyle: "normal",
  headingSize: 12,
  headingWeight: 700,
  headingLetterSpacing: 1.2,
  bodySize: 10.5,
  metaSize: 9.5,
  itemTitleWeight: 700,
  itemMetaStyle: "normal",
  contactSeparator: "|",
  spacingFactor: 1,
}

export const headlineDocxMapping: DocxStyleMapping = {
  sectionHeadingStyle: "Heading2",
  useBuiltinListBullets: true,
  contactStyle: "Normal",
  titleStyle: "Title",
  rtlSupport: true,
}

export const HeadlineTemplate: TemplateRenderFn = (props) => (
  <BaseRenderer {...props} flavor={headlineFlavor} variant="headline" />
)
