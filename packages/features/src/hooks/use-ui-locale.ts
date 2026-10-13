import { useTranslation } from "react-i18next"

import type { CvLocale } from "@ats/core"

export function useUiLocale(): CvLocale {
  const { i18n } = useTranslation()
  const code = i18n.language?.slice(0, 2)
  return (code === "fr" || code === "ar" ? code : "en") as CvLocale
}
