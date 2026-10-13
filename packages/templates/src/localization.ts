import type { SectionType } from "@ats/core"

import type { Locale } from "./types"

const SECTION_LABELS: Record<Locale, Record<SectionType, string>> = {
  en: {
    summary: "Professional Summary",
    experience: "Work Experience",
    education: "Education",
    skills: "Skills",
    softSkills: "Soft Skills",
    projects: "Projects",
    certifications: "Certifications",
    languages: "Languages",
    awards: "Awards",
    volunteering: "Volunteering",
    publications: "Publications",
    courses: "Courses",
  },
  fr: {
    summary: "Profil professionnel",
    experience: "Expérience professionnelle",
    education: "Formation",
    skills: "Compétences",
    softSkills: "Compétences transversales",
    projects: "Projets",
    certifications: "Certifications",
    languages: "Langues",
    awards: "Distinctions",
    volunteering: "Bénévolat",
    publications: "Publications",
    courses: "Cours",
  },
  ar: {
    summary: "الملخص المهني",
    experience: "الخبرة المهنية",
    education: "التعليم",
    skills: "المهارات",
    softSkills: "المهارات الشخصية",
    projects: "المشاريع",
    certifications: "الشهادات",
    languages: "اللغات",
    awards: "الجوائز",
    volunteering: "العمل التطوعي",
    publications: "المنشورات",
    courses: "الدورات",
  },
}

const FACTORY_DEFAULT_TITLES: Record<Locale, Record<SectionType, string>> = {
  en: {
    summary: "Summary",
    experience: "Work Experience",
    education: "Education",
    skills: "Skills",
    softSkills: "Soft Skills",
    projects: "Projects",
    certifications: "Certifications",
    languages: "Languages",
    awards: "Awards",
    volunteering: "Volunteering",
    publications: "Publications",
    courses: "Courses",
  },
  fr: {
    summary: "Résumé",
    experience: "Expérience",
    education: "Formation",
    skills: "Compétences",
    softSkills: "Compétences transversales",
    projects: "Projets",
    certifications: "Certifications",
    languages: "Langues",
    awards: "Distinctions",
    volunteering: "Bénévolat",
    publications: "Publications",
    courses: "Formations complémentaires",
  },
  ar: {
    summary: "الملخص",
    experience: "الخبرة المهنية",
    education: "التعليم",
    skills: "المهارات",
    softSkills: "المهارات الشخصية",
    projects: "المشاريع",
    certifications: "الشهادات",
    languages: "اللغات",
    awards: "الجوائز",
    volunteering: "العمل التطوعي",
    publications: "المنشورات",
    courses: "الدورات",
  },
}

const KNOWN_DEFAULT_TITLES = new Set<string>()
for (const locale of ["en", "fr", "ar"] as Locale[]) {
  for (const type of Object.keys(SECTION_LABELS[locale]) as SectionType[]) {
    KNOWN_DEFAULT_TITLES.add(SECTION_LABELS[locale][type])
    KNOWN_DEFAULT_TITLES.add(FACTORY_DEFAULT_TITLES[locale][type])
  }
}

export { SECTION_LABELS }

export function resolveSectionTitle(
  title: string,
  sectionType: SectionType,
  locale: Locale,
): string {
  if (!title || KNOWN_DEFAULT_TITLES.has(title)) {
    return SECTION_LABELS[locale][sectionType] || title
  }
  return title
}

export const PRESENT_LABELS: Record<Locale, string> = {
  en: "Present",
  fr: "Présent",
  ar: "حتى الآن",
}

export const LEVEL_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    intermediate: "Intermediate",
    advanced: "Advanced",
    fluent: "Fluent",
    bilingual: "Bilingual",
    native: "Native",
  },
  fr: {
    intermediate: "Intermédiaire",
    advanced: "Avancé",
    fluent: "Courant",
    bilingual: "Bilingue",
    native: "Langue maternelle",
  },
  ar: {
    intermediate: "متوسط",
    advanced: "متقدم",
    fluent: "فصيح",
    bilingual: "ثنائي اللغة",
    native: "اللغة الأم",
  },
}

export const FAMILY_NAMES: Record<Locale, Record<string, string>> = {
  en: {
    classic: "Classic ATS",
    minimal: "Minimal ATS",
    modern: "Modern ATS",
    executive: "Executive ATS",
    technical: "Technical ATS",
    headline: "Headline ATS",
    compact: "Compact ATS",
    focus: "Focus ATS",
    functional: "Functional ATS",
    professional: "Professional ATS",
  },
  fr: {
    classic: "Classique ATS",
    minimal: "Minimal ATS",
    modern: "Moderne ATS",
    executive: "Exécutif ATS",
    technical: "Technique ATS",
    headline: "Accroche ATS",
    compact: "Compact ATS",
    focus: "Focus ATS",
    functional: "Fonctionnel ATS",
    professional: "Professionnel ATS",
  },
  ar: {
    classic: "كلاسيكي ATS",
    minimal: "بسيط ATS",
    modern: "عصري ATS",
    executive: "تنفيذي ATS",
    technical: "تقني ATS",
    headline: "عنوان رئيسي ATS",
    compact: "مضغوط ATS",
    focus: "تركيز ATS",
    functional: "وظيفي ATS",
    professional: "احترافي ATS",
  },
}

export const FAMILY_DESCRIPTIONS: Record<Locale, Record<string, string>> = {
  en: {
    classic: "Traditional, conservative, recruiter-friendly layout.",
    minimal: "Clean whitespace and simple headings for maximum clarity.",
    modern: "Contemporary and crisp while staying fully ATS-safe.",
    executive: "Formal and elegant presentation for senior-level profiles.",
    technical: "Compact and precise, optimized for engineering roles.",
    headline:
      "Bold resume headline under your name with ruled headings and right-aligned dates — maximizes ATS job-title matching.",
    compact: "One-line contact header and tight spacing — fits long careers on fewer pages.",
    focus:
      "Split header: name and headline on the left, contact aligned right — the popular modern header style.",
    functional: "Clean single-column layout with a light rule under each section heading.",
    professional: "One-page resume look: caps headings, dates on the right, compact skills lines.",
  },
  fr: {
    classic: "Mise en page traditionnelle et conservatrice, appréciée des recruteurs.",
    minimal: "Espaces épurés et titres simples pour une clarté maximale.",
    modern: "Look contemporain et net, entièrement compatible ATS.",
    executive: "Présentation formelle et élégante pour profils seniors.",
    technical: "Compacte et précise, optimisée pour les profils techniques.",
    headline:
      "Titre d'accroche en gras sous votre nom, titres soulignés et dates alignées à droite — maximise le matching ATS.",
    compact: "Contact sur une ligne et espacement resserré — tient sur moins de pages.",
    focus:
      "En-tête scindé : nom et accroche à gauche, contact aligné à droite — le style d'en-tête moderne populaire.",
    functional:
      "Mise en page sobre sur une colonne, avec un filet léger sous chaque titre de section.",
    professional:
      "Look CV une page : titres en majuscules, dates à droite, compétences en lignes compactes.",
  },
  ar: {
    classic: "تخطيط تقليدي محافظ يناسب معظم القطاعات.",
    minimal: "مساحات نظيفة وعناوين بسيطة لوضوح أقصى.",
    modern: "مظهر عصري وأنيق مع بقائه متوافقاً مع أنظمة ATS.",
    executive: "عرض رسمي وأنيق للملفات القيادية.",
    technical: "مضغوط ودقيق، مصمم للملفات التقنية.",
    headline:
      "عنوان رئيسي بارز تحت الاسم مع عناوين مسطرة وتواريخ إلى اليمين — يعزز مطابقة أنظمة ATS.",
    compact: "جهة اتصال بسطر واحد وتباعد ضيق — يناسب المسيرات الطويلة في صفحات أقل.",
    focus:
      "ترويسة منقسمة: الاسم والعنوان الرئيسي يساراً وبيانات التواصل يميناً — أسلوب الترويسة العصرية الشائع.",
    functional: "تخطيط بسيط بعمود واحد مع خط خفيف تحت عنوان كل قسم.",
    professional:
      "مظهر سيرة ذاتية من صفحة واحدة: عناوين بحروف كبيرة وتواريخ على اليمين ومهارات في أسطر مضغوطة.",
  },
}

export const VARIANTS: Record<Locale, string[]> = {
  en: ["1", "2", "3", "4"],
  fr: ["1", "2", "3", "4"],
  ar: ["١", "٢", "٣", "٤"],
}
