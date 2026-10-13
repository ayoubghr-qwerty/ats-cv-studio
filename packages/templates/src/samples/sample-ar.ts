import { createCvDocument, newId } from "@ats/core"
import type { CvDocument, CvSection } from "@ats/core"

function section(doc: CvDocument, type: CvSection["type"], items: CvSection["items"]): CvSection {
  return { ...doc.sections.find((s) => s.type === type)!, enabled: true, items }
}

export function sampleAr(): CvDocument {
  const doc = createCvDocument({ locale: "ar", name: "نموذج سيرة ذاتية (عربي)" })
  return {
    ...doc,
    contact: {
      fullName: "خالد بن عمر الشريف",
      jobTitle: "مهندس برمجيات أول",
      email: "khaled.sharif@example.com",
      phone: "+966 55 123 4567",
      location: "الرياض، المملكة العربية السعودية",
      website: "khaledsharif.dev",
      linkedin: "linkedin.com/in/khaledsharif",
      github: "github.com/khaledsharif",
    },
    sections: [
      section(doc, "summary", [
        {
          id: newId("item"),
          text: "مهندس برمجيات أول بخبرة تزيد عن 9 سنوات في تطوير الأنظمة المالية السحابية. قيادة فرق من 6 مطورين، وبناء منصات تخدم أكثر من مليون مستخدم. متخصص في الهندسة المتوافرة عالية التوفر وتحسين الأداء وخفض تكاليف التشغيل بنسبة 30%.",
        },
      ]),
      section(doc, "experience", [
        {
          id: newId("item"),
          role: "مهندس برمجيات أول",
          company: "بنك المستقبل الرقمي",
          location: "الرياض",
          startDate: "2020-05",
          endDate: "",
          current: true,
          bullets: [
            "قادت تطوير منصة الدفع الرقمي التي تخدم 1.2 مليون مستخدم يومياً",
            "خفضت زمن الاستجابة من 420ms إلى 95ms عبر إعادة هيكلة الأنظمة",
            "أشرفت على تدريب وتطوير 6 مهندسين مبتدئين",
          ],
        },
        {
          id: newId("item"),
          role: "مطور برمجيات",
          company: "شركة الأفق للتقنية",
          location: "جدة",
          startDate: "2016-02",
          endDate: "2020-04",
          current: false,
          bullets: [
            "طوّرت خدمات RESTful متكاملة مع أنظمة مصرفية قديمة",
            "أتممت خطوط نشر CI/CD فقللت وقت الإصدار من أسبوع إلى يوم واحد",
          ],
        },
        {
          id: newId("item"),
          role: "مطور مبتدئ",
          company: "مركز البيانات الوطني",
          location: "الرياض",
          startDate: "2014-07",
          endDate: "2016-01",
          current: false,
          bullets: ["ساهمت في بناء لوحات تحكم تشغيلية للبنية التحتية"],
        },
      ]),
      section(doc, "education", [
        {
          id: newId("item"),
          degree: "بكالوريوس علوم الحاسب",
          institution: "جامعة الملك سعود",
          location: "الرياض",
          startDate: "2009-09",
          endDate: "2014-06",
          current: false,
          details: "بتقدير امتياز مع مرتبة الشرف.",
        },
        {
          id: newId("item"),
          degree: "شهادة في الحوسبة السحابية",
          institution: "جامعة الملك عبدالله للعلوم والتقنية",
          location: "ثول",
          startDate: "2017-01",
          endDate: "2017-06",
          current: false,
          details: "",
        },
      ]),
      section(doc, "skills", [
        { id: newId("item"), name: "Java" },
        { id: newId("item"), name: "Spring Boot" },
        { id: newId("item"), name: "Microservices" },
        { id: newId("item"), name: "Kafka" },
        { id: newId("item"), name: "PostgreSQL" },
        { id: newId("item"), name: "Redis" },
        { id: newId("item"), name: "Docker" },
        { id: newId("item"), name: "Kubernetes" },
        { id: newId("item"), name: "AWS" },
        { id: newId("item"), name: "تطوير واجهات REST" },
        { id: newId("item"), name: "أمن المعلومات" },
        { id: newId("item"), name: "قيادة فرق تقنية" },
      ]),
      section(doc, "projects", [
        {
          id: newId("item"),
          name: "منصة التحويلات الفورية",
          description:
            "نظام تحويلات مالية فورية متوافق مع معايير البنك المركزي، يعالج 40 ألف عملية في الثانية.",
          link: "",
          startDate: "2021-06",
          endDate: "2022-03",
          current: false,
          bullets: ["حققنا توافراً بنسبة 99.99% منذ الإطلاق"],
        },
        {
          id: newId("item"),
          name: "مكتبة المكونات المشتركة",
          description: "مكتبة Java مفتوحة المصدر للمصادقة والتخويل تستخدمها 12 فرقة داخل الشركة.",
          link: "github.com/khaledsharif/authkit",
          startDate: "2023-01",
          endDate: "",
          current: true,
          bullets: [],
        },
      ]),
      section(doc, "certifications", [
        {
          id: newId("item"),
          name: "AWS Solutions Architect",
          issuer: "Amazon",
          date: "2021-11",
          link: "",
        },
        {
          id: newId("item"),
          name: "شهادة مايكروسوفت المهنية Azure",
          issuer: "Microsoft",
          date: "2019-08",
          link: "",
        },
      ]),
      section(doc, "languages", [
        { id: newId("item"), name: "العربية", level: "native" },
        { id: newId("item"), name: "الإنجليزية", level: "fluent" },
      ]),
      section(doc, "awards", [
        {
          id: newId("item"),
          title: "جائزة أفضل مبادرة تقنية",
          issuer: "بنك المستقبل الرقمي",
          date: "2022-12",
          description: "تقديراً لمنصة الدفع الرقمي.",
        },
      ]),
      section(doc, "volunteering", [
        {
          id: newId("item"),
          role: "مدرب تطوعي",
          organization: "مؤسسة مهارات التقنية",
          location: "الرياض",
          startDate: "2021-09",
          endDate: "",
          current: true,
          description: "تدريب الطلاب الجامعيين على أساسيات البرمجة.",
        },
      ]),
      section(doc, "publications", [
        {
          id: newId("item"),
          title: "تحسين أداء الأنظمة المالية السحابية",
          publisher: "مجلة التقنية المصرفية",
          date: "2023-10",
          url: "",
        },
      ]),
      section(doc, "courses", [
        {
          id: newId("item"),
          name: "إدارة منصات Kubernetes المتقدمة",
          provider: "أكاديمية الحوسبة",
          date: "2022-05",
          description: "",
        },
      ]),
    ],
  }
}
