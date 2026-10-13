import { createCvDocument, newId } from "@ats/core"
import type { CvDocument, CvSection } from "@ats/core"

function section(doc: CvDocument, type: CvSection["type"], items: CvSection["items"]): CvSection {
  return { ...doc.sections.find((s) => s.type === type)!, enabled: true, items }
}

export function sampleFr(): CvDocument {
  const doc = createCvDocument({ locale: "fr", name: "Exemple de CV (FR)" })
  return {
    ...doc,
    contact: {
      fullName: "Camille Dubois",
      jobTitle: "Cheffe de projet marketing",
      email: "camille.dubois@example.com",
      phone: "+33 6 12 34 56 78",
      location: "Paris, France",
      website: "camilledubois.fr",
      linkedin: "linkedin.com/in/camilledubois",
      github: "",
    },
    sections: [
      section(doc, "summary", [
        {
          id: newId("item"),
          text: "Cheffe de projet marketing avec 10 ans d'expérience dans le e-commerce et les marques grand public. Pilotage de campagnes multi-canaux, gestion d'équipes de 8 personnes et budgets dépassant 2 M€ par an. Orientée résultats avec une appétence pour l'analyse de données.",
        },
      ]),
      section(doc, "experience", [
        {
          id: newId("item"),
          role: "Cheffe de projet marketing",
          company: "Maison Verte",
          location: "Paris",
          startDate: "2019-04",
          endDate: "",
          current: true,
          bullets: [
            "Coordonné 25+ campagnes omnicanales par an, générant 3,4 M€ de CA attribué",
            "Mis en place un tableau de bord KPI unifié suivi par la direction",
            "Encadré et formé une équipe de 4 chargés de marketing",
          ],
        },
        {
          id: newId("item"),
          role: "Chef de produit junior",
          company: "Comptoir Digital",
          location: "Lyon",
          startDate: "2015-02",
          endDate: "2019-03",
          current: false,
          bullets: [
            "Lancé 3 gammes de produits avec une croissance moyenne de 18 % par an",
            "Réalisé 120+ entretiens clients pour affiner le positionnement",
          ],
        },
      ]),
      section(doc, "education", [
        {
          id: newId("item"),
          degree: "Master en Marketing Digital",
          institution: "EM Lyon",
          location: "Lyon",
          startDate: "2012-09",
          endDate: "2014-06",
          current: false,
          details: "Spécialisation e-commerce et analyse de données.",
        },
        {
          id: newId("item"),
          degree: "Licence en Communication",
          institution: "Université Lumière Lyon 2",
          location: "Lyon",
          startDate: "2009-09",
          endDate: "2012-06",
          current: false,
          details: "",
        },
      ]),
      section(doc, "skills", [
        { id: newId("item"), name: "Stratégie marketing" },
        { id: newId("item"), name: "Campagnes multicanales" },
        { id: newId("item"), name: "Google Ads" },
        { id: newId("item"), name: "SEO/SEA" },
        { id: newId("item"), name: "Analytics" },
        { id: newId("item"), name: "Gestion budgétaire" },
        { id: newId("item"), name: "Emailing (Brevo, Klaviyo)" },
        { id: newId("item"), name: "Management d'équipe" },
        { id: newId("item"), name: "Notion, Asana" },
        { id: newId("item"), name: "Copywriting" },
      ]),
      section(doc, "projects", [
        {
          id: newId("item"),
          name: "Refonte de la boutique en ligne",
          description:
            "Pilotage de la refonte UX/UI et du tunnel d'achat d'une boutique à 12 M€ de chiffre d'affaires.",
          link: "maisonverte.example",
          startDate: "2021-01",
          endDate: "2021-09",
          current: false,
          bullets: ["+22 % de taux de conversion après lancement"],
        },
      ]),
      section(doc, "certifications", [
        {
          id: newId("item"),
          name: "Google Analytics Certification",
          issuer: "Google",
          date: "2020-05",
          link: "",
        },
        {
          id: newId("item"),
          name: "Certification Scrum Product Owner",
          issuer: "Scrum.org",
          date: "2019-11",
          link: "",
        },
      ]),
      section(doc, "languages", [
        { id: newId("item"), name: "Français", level: "native" },
        { id: newId("item"), name: "Anglais", level: "fluent" },
        { id: newId("item"), name: "Espagnol", level: "advanced" },
      ]),
      section(doc, "awards", [
        {
          id: newId("item"),
          title: "Prix de l'innovation marketing",
          issuer: "Fédération du e-commerce",
          date: "2022-06",
          description: "Campagne de fidélisation primée, +15 % de réachat.",
        },
      ]),
      section(doc, "volunteering", [
        {
          id: newId("item"),
          role: "Marraine bénévole",
          organization: "Association Elles Numériques",
          location: "Paris",
          startDate: "2021-09",
          endDate: "",
          current: true,
          description: "Accompagnement de jeunes femmes vers les métiers du digital.",
        },
      ]),
      section(doc, "publications", [
        {
          id: newId("item"),
          title: "Le marketing omnicanal en 2024",
          publisher: "Revue du Marketing",
          date: "2024-02",
          url: "",
        },
      ]),
      section(doc, "courses", [
        {
          id: newId("item"),
          name: "Data Studio pour les marketeurs",
          provider: "OpenClassrooms",
          date: "2021-03",
          description: "",
        },
      ]),
    ],
  }
}
