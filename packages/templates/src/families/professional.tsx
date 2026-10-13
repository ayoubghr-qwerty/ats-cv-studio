import type { DocxStyleMapping, TemplateRenderFn } from "../types"
import { TemplateRenderer as BaseRenderer } from "../components/template-renderer"
import type { FamilyFlavor } from "../tokens"

/**
 * "Professional" — the classic one-page resume look: candidate name in caps,
 * grey job title, a thin rule under the header, caps section headings with a
 * rule, "Role — Company, City" with the date in italics on the right, and
 * skills as one dense "Category: a, b, c" line each. Single column, plain
 * text, native bullets: fully ATS-safe like every other family.
 */
export const professionalFlavor: FamilyFlavor = {
  nameSize: 20,
  nameWeight: 700,
  nameLetterSpacing: 0.3,
  nameTransform: "uppercase",
  titleSize: 11,
  titleWeight: 400,
  titleStyle: "normal",
  titleColor: "#595959",
  headingSize: 10.5,
  uppercaseHeadingSize: 10.5,
  headingWeight: 700,
  headingLetterSpacing: 0.3,
  bodySize: 10,
  metaSize: 9,
  itemTitleWeight: 700,
  itemMetaStyle: "italic",
  contactSeparator: "|",
  contactRule: true,
  spacingFactor: 0.95,
  itemFormat: {
    titleSeparator: " \u2014 ",
    metaSeparator: ", ",
    rangeSeparator: " \u2013 ",
  },
}

export const professionalDocxMapping: DocxStyleMapping = {
  sectionHeadingStyle: "Heading2",
  useBuiltinListBullets: true,
  contactStyle: "Normal",
  titleStyle: "Title",
  rtlSupport: true,
  itemFormat: professionalFlavor.itemFormat,
  look: {
    nameUppercase: true,
    titleColor: "595959",
    contactRule: true,
    bodySize: 20,
    headingSize: 21,
    contactSeparator: " | ",
  },
}

export const ProfessionalTemplate: TemplateRenderFn = (props) => (
  <BaseRenderer {...props} flavor={professionalFlavor} />
)
