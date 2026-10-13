import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import ar from "./ar.json"
import en from "./en.json"
import fr from "./fr.json"

export const SUPPORTED_LANGUAGES = ["en", "fr", "ar"] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
}

export function isSupportedLanguage(value: string | null | undefined): value is Language {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

export function getDirection(language: string): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr"
}

export function setDocumentLanguage(language: string): void {
  document.documentElement.lang = language
  document.documentElement.dir = getDirection(language)
}

export const LANGUAGE_STORAGE_KEY = "ats.language"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    load: "languageOnly",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on("languageChanged", (lng) => {
  setDocumentLanguage(lng)
})

if (typeof document !== "undefined" && i18n.isInitialized) {
  setDocumentLanguage(i18n.language)
}

export default i18n
