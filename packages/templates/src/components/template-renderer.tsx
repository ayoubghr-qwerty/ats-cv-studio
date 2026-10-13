import { useMemo } from "react"
import type {
  AwardItem as AwardItemData,
  CertificationItem as CertificationItemData,
  CourseItem as CourseItemData,
  CvDocument,
  CvItem,
  CvSection,
  EducationItem as EducationItemData,
  ExperienceItem as ExperienceItemData,
  LanguageItem as LanguageItemData,
  ProjectItem as ProjectItemData,
  PublicationItem as PublicationItemData,
  SkillItem,
  SoftSkillItem,
  SummaryItem,
  VolunteeringItem as VolunteeringItemData,
} from "@ats/core"

import type { FamilyFlavor, TemplateStyles } from "../tokens"
import { buildTemplateStyles } from "../tokens"
import type { DatePlacement, ItemFormatTokens, Locale, TemplateSettings } from "../types"
import { resolveDatePlacement } from "../item-format"
import { resolveSectionTitle } from "../localization"
import { CertificationItem } from "./certification-item"
import { ContactBlock } from "./contact-block"
import { EducationItem } from "./education-item"
import { ExperienceItem } from "./experience-item"
import { LanguageItem, LanguagesInline } from "./language-item"
import { SoftSkillsInline } from "./soft-skills-inline"
import {
  AwardItem,
  CourseItem,
  PublicationItem,
  SummaryItems,
  VolunteeringItem,
} from "./misc-items"
import { ProjectItem } from "./project-item"
import { SkillsList } from "./skills-list"
import { TemplatePage } from "./template-page"
import { TemplateSection } from "./template-section"

export interface TemplateRendererProps {
  document: CvDocument
  settings: TemplateSettings
  locale: Locale
  direction: "ltr" | "rtl"
  mode: "preview" | "print"
  flavor?: FamilyFlavor
  variant?: TemplateVariant
}

export type TemplateVariant = "standard" | "headline" | "compact" | "focus" | "functional"

const defaultFlavor: FamilyFlavor = {
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

function renderItem(
  type: CvSection["type"],
  item: CvItem,
  styles: TemplateStyles,
  locale: Locale,
  bulletStyle: "disc" | "hyphen",
  datePlacement: DatePlacement = "inline",
  format?: ItemFormatTokens,
) {
  switch (type) {
    case "experience":
      return (
        <ExperienceItem
          key={item.id}
          item={item as ExperienceItemData}
          styles={styles}
          locale={locale}
          bulletStyle={bulletStyle}
          datePlacement={datePlacement}
          format={format}
        />
      )
    case "education":
      return (
        <EducationItem
          key={item.id}
          item={item as EducationItemData}
          styles={styles}
          locale={locale}
          datePlacement={datePlacement}
          format={format}
        />
      )
    case "projects":
      return (
        <ProjectItem
          key={item.id}
          item={item as ProjectItemData}
          styles={styles}
          locale={locale}
          bulletStyle={bulletStyle}
          datePlacement={datePlacement}
          format={format}
        />
      )
    case "certifications":
      return (
        <CertificationItem
          key={item.id}
          item={item as CertificationItemData}
          styles={styles}
          locale={locale}
        />
      )
    case "languages":
      return (
        <LanguageItem
          key={item.id}
          item={item as LanguageItemData}
          styles={styles}
          locale={locale}
        />
      )
    case "awards":
      return (
        <AwardItem key={item.id} item={item as AwardItemData} styles={styles} locale={locale} />
      )
    case "volunteering":
      return (
        <VolunteeringItem
          key={item.id}
          item={item as VolunteeringItemData}
          styles={styles}
          locale={locale}
          datePlacement={datePlacement}
          format={format}
        />
      )
    case "publications":
      return (
        <PublicationItem
          key={item.id}
          item={item as PublicationItemData}
          styles={styles}
          locale={locale}
        />
      )
    case "courses":
      return (
        <CourseItem key={item.id} item={item as CourseItemData} styles={styles} locale={locale} />
      )
    default:
      return null
  }
}

export function TemplateRenderer({
  document,
  settings,
  locale,
  direction,
  mode,
  flavor = defaultFlavor,
  variant = "standard",
}: TemplateRendererProps) {
  const bulletStyle = settings.bulletStyle === "hyphen" ? "hyphen" : "disc"
  const twoColumns = settings.listColumns === "two"
  const styles = useMemo(
    () => buildTemplateStyles(settings, flavor, locale, document.pageSettings.size),
    [settings, flavor, locale, document.pageSettings.size],
  )
  const enabledSections = document.sections
    .filter((section) => section.enabled && section.items.length > 0)
    .sort((a, b) => a.order - b.order)

  // Sections follow the user's own order in every family and in the Word export.
  const sections = enabledSections

  const datePlacement = resolveDatePlacement(
    settings.datePlacement,
    variant === "headline" ? "right" : "inline",
  )
  const itemFormat = flavor.itemFormat

  // Headline and Functional space their headings a little tighter; the rule
  // under them comes from the separator style like in every other family
  // (it used to be hard-coded here, so the setting did nothing).
  const headingStyle =
    variant === "headline" || variant === "functional"
      ? { ...styles.sectionHeading, paddingBottom: "1.5pt", marginBottom: "4pt" }
      : styles.sectionHeading

  return (
    <TemplatePage styles={styles} direction={direction} mode={mode}>
      <ContactBlock
        document={document}
        styles={styles}
        alignment={settings.contactAlignment}
        separator={flavor.contactSeparator}
        variant={variant}
        rule={flavor.contactRule}
      />
      {sections.map((section) => (
        <TemplateSection
          key={section.id}
          title={resolveSectionTitle(section.title, section.type, locale)}
          styles={{ heading: headingStyle, body: styles.sectionBody }}
        >
          {section.type === "summary" ? (
            <SummaryItems items={section.items as SummaryItem[]} styles={styles} />
          ) : section.type === "languages" && settings.languagesLayout === "inline" ? (
            <LanguagesInline
              items={section.items as LanguageItemData[]}
              styles={styles}
              locale={locale}
            />
          ) : section.type === "softSkills" ? (
            <SoftSkillsInline
              items={section.items as SoftSkillItem[]}
              styles={styles}
              separator={settings.inlineSeparator}
            />
          ) : section.type === "skills" ? (
            <SkillsList
              items={section.items as SkillItem[]}
              styles={styles}
              bulletStyle={bulletStyle}
              columns={settings.listColumns}
              layout={settings.skillsLayout}
              separator={settings.inlineSeparator}
            />
          ) : LIST_COLUMN_SECTIONS.has(section.type) && twoColumns ? (
            <div style={{ columns: "2", columnGap: "18pt" }}>
              {section.items.map((item) =>
                renderItem(
                  section.type,
                  item,
                  styles,
                  locale,
                  bulletStyle,
                  datePlacement,
                  itemFormat,
                ),
              )}
            </div>
          ) : (
            section.items.map((item) =>
              renderItem(
                section.type,
                item,
                styles,
                locale,
                bulletStyle,
                datePlacement,
                itemFormat,
              ),
            )
          )}
        </TemplateSection>
      ))}
    </TemplatePage>
  )
}

const LIST_COLUMN_SECTIONS = new Set<string>(["languages", "certifications", "courses"])
