import { createCvDocument, newId } from "@ats/core"
import type { CvDocument, CvSection } from "@ats/core"

function section(doc: CvDocument, type: CvSection["type"], items: CvSection["items"]): CvSection {
  return { ...doc.sections.find((s) => s.type === type)!, enabled: true, items }
}

export function sampleEn(): CvDocument {
  const doc = createCvDocument({ locale: "en", name: "Sample CV (EN)" })
  return {
    ...doc,
    contact: {
      fullName: "Sarah Mitchell",
      jobTitle: "Senior Product Designer",
      email: "sarah.mitchell@example.com",
      phone: "+1 (555) 234-5678",
      location: "New York, NY, USA",
      website: "sarahmitchell.design",
      linkedin: "linkedin.com/in/sarahmitchell",
      github: "github.com/sarahmitchell",
    },
    sections: [
      section(doc, "summary", [
        {
          id: newId("item"),
          text: "Product designer with 8+ years of experience crafting accessible, conversion-focused digital products for fintech and SaaS companies. Led design systems used by 40+ engineers and mentored a team of five designers. Passionate about research-driven design and measurable outcomes.",
        },
      ]),
      section(doc, "experience", [
        {
          id: newId("item"),
          role: "Senior Product Designer",
          company: "Fincloud Inc.",
          location: "New York, NY",
          startDate: "2021-03",
          endDate: "",
          current: true,
          bullets: [
            "Led redesign of the onboarding flow, lifting activation by 24% within two quarters",
            "Built and maintained the company design system used by 6 product teams",
            "Established a lightweight usability testing program that reduced regression reports by 40%",
          ],
        },
        {
          id: newId("item"),
          role: "Product Designer",
          company: "Brightlane Software",
          location: "Boston, MA",
          startDate: "2017-06",
          endDate: "2021-02",
          current: false,
          bullets: [
            "Designed and shipped 30+ features across web and mobile platforms",
            "Ran discovery interviews with 60+ customers to inform the 2020 roadmap",
            "Improved checkout conversion by 12% through targeted UX iterations",
          ],
        },
        {
          id: newId("item"),
          role: "UI Designer",
          company: "Northwind Agency",
          location: "Boston, MA",
          startDate: "2015-01",
          endDate: "2017-05",
          current: false,
          bullets: [
            "Delivered responsive web designs for 15+ client projects",
            "Collaborated with developers to refine handoff and QA processes",
          ],
        },
      ]),
      section(doc, "education", [
        {
          id: newId("item"),
          degree: "BFA in Graphic Design",
          institution: "Rhode Island School of Design",
          location: "Providence, RI",
          startDate: "2011-09",
          endDate: "2015-05",
          current: false,
          details: "Graduated with honors. Focus on interaction design and typography.",
        },
        {
          id: newId("item"),
          degree: "UX Research Certificate",
          institution: "Nielsen Norman Group",
          location: "Online",
          startDate: "2019-01",
          endDate: "2019-06",
          current: false,
          details: "",
        },
      ]),
      section(doc, "skills", [
        { id: newId("item"), name: "Figma" },
        { id: newId("item"), name: "Design Systems" },
        { id: newId("item"), name: "Usability Testing" },
        { id: newId("item"), name: "Wireframing" },
        { id: newId("item"), name: "Prototyping" },
        { id: newId("item"), name: "Accessibility (WCAG)" },
        { id: newId("item"), name: "HTML/CSS" },
        { id: newId("item"), name: "User Interviews" },
        { id: newId("item"), name: "Journey Mapping" },
        { id: newId("item"), name: "Design Tokens" },
      ]),
      section(doc, "projects", [
        {
          id: newId("item"),
          name: "Pulse - Personal Finance Tracker",
          description:
            "Designed the full product experience for a privacy-first budgeting app serving 100k monthly users.",
          link: "pulseapp.example",
          startDate: "2020-04",
          endDate: "2021-01",
          current: false,
          bullets: [
            "Shipped MVP in 9 months with a two-person design team",
            "Achieved a 4.7 average app store rating",
          ],
        },
        {
          id: newId("item"),
          name: "OpenA11y - Accessibility Toolkit",
          description: "Open-source Figma plugin suite that audits designs against WCAG 2.1.",
          link: "github.com/sarahmitchell/opena11y",
          startDate: "2022-05",
          endDate: "",
          current: true,
          bullets: ["Adopted by 4 design agencies and 3 university programs"],
        },
      ]),
      section(doc, "certifications", [
        {
          id: newId("item"),
          name: "Certified Usability Analyst",
          issuer: "HFI",
          date: "2018-10",
          link: "",
        },
        {
          id: newId("item"),
          name: "Google UX Design Professional Certificate",
          issuer: "Google",
          date: "2020-08",
          link: "",
        },
      ]),
      section(doc, "languages", [
        { id: newId("item"), name: "English", level: "native" },
        { id: newId("item"), name: "French", level: "fluent" },
      ]),
      section(doc, "awards", [
        {
          id: newId("item"),
          title: "Design Excellence Award",
          issuer: "Fincloud Inc.",
          date: "2023-12",
          description: "Recognized for the onboarding redesign initiative.",
        },
      ]),
      section(doc, "volunteering", [
        {
          id: newId("item"),
          role: "Design Mentor",
          organization: "DesignMentors NYC",
          location: "New York, NY",
          startDate: "2022-01",
          endDate: "",
          current: true,
          description: "Mentor early-career designers from underrepresented backgrounds.",
        },
      ]),
      section(doc, "publications", [
        {
          id: newId("item"),
          title: "Designing for Financial Confidence",
          publisher: "UX Collective",
          date: "2023-04",
          url: "uxdesign.cc",
        },
      ]),
      section(doc, "courses", [
        {
          id: newId("item"),
          name: "Advanced Prototyping in Figma",
          provider: "Maven",
          date: "2023-09",
          description: "",
        },
      ]),
    ],
  }
}
