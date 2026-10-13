import { Button } from "@ats/ui"
import { FileQuestionIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

export function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <FileQuestionIcon className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">{t("notFound.title")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{t("notFound.description")}</p>
      </div>
      <Button variant="outline" onClick={() => navigate("/")}>
        {t("notFound.back")}
      </Button>
    </div>
  )
}
