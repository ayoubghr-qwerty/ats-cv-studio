import type { CvDocument, CvEditorStore } from "@ats/core"
import { EMAIL_RE, PHONE_RE, setContactField } from "@ats/core"
import { Input } from "@ats/ui"
import { useTranslation } from "react-i18next"

function ContactField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type,
  name,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  type?: string
  name?: string
  autoComplete?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-xs text-destructive">{hint}</p>}
    </div>
  )
}

export function ContactEditor({ doc, store }: { doc: CvDocument; store: CvEditorStore }) {
  const { t } = useTranslation()
  const contact = doc.contact

  const set = (field: keyof CvDocument["contact"]) => (value: string) => {
    store.mutate((d) => setContactField(d, field, value), "text")
  }

  const setHeadline = (value: string) => {
    store.mutate((d) => ({ ...d, headline: value }), "text")
  }

  const emailHint =
    contact.email && !EMAIL_RE.test(contact.email) ? t("editor.invalidEmail") : undefined
  const phoneHint =
    contact.phone && !PHONE_RE.test(contact.phone) ? t("editor.invalidPhone") : undefined

  return (
    <div className="flex flex-col gap-4">
      <ContactField
        label={t("editor.headline")}
        value={doc.headline ?? ""}
        onChange={setHeadline}
        placeholder={t("editor.headlinePlaceholder")}
        hint={t("editor.headlineHint")}
        name="contact-headline"
        autoComplete="organization-title"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ContactField
          label={t("editor.fullName")}
          value={contact.fullName}
          onChange={set("fullName")}
          placeholder={t("editor.fullNamePlaceholder")}
          name="contact-name"
          autoComplete="name"
        />
        <ContactField
          label={t("editor.jobTitle")}
          value={contact.jobTitle}
          onChange={set("jobTitle")}
          placeholder={t("editor.jobTitlePlaceholder")}
          name="contact-title"
          autoComplete="organization-title"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ContactField
          label={t("editor.email")}
          value={contact.email}
          onChange={set("email")}
          placeholder={t("editor.emailPlaceholder")}
          hint={emailHint}
          type="email"
          name="contact-email"
          autoComplete="email"
        />
        <ContactField
          label={t("editor.phone")}
          value={contact.phone}
          onChange={set("phone")}
          placeholder={t("editor.phonePlaceholder")}
          hint={phoneHint}
          type="tel"
          name="contact-phone"
          autoComplete="tel"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ContactField
          label={t("editor.location")}
          value={contact.location}
          onChange={set("location")}
          placeholder={t("editor.locationPlaceholder")}
          name="contact-location"
          autoComplete="address-level1"
        />
        <ContactField
          label={t("editor.website")}
          value={contact.website ?? ""}
          onChange={set("website")}
          placeholder={t("editor.websitePlaceholder")}
          type="url"
          name="contact-website"
          autoComplete="url"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ContactField
          label={t("editor.linkedin")}
          value={contact.linkedin ?? ""}
          onChange={set("linkedin")}
          placeholder={t("editor.linkedinPlaceholder")}
          type="url"
          name="contact-linkedin"
        />
        <ContactField
          label={t("editor.github")}
          value={contact.github ?? ""}
          onChange={set("github")}
          placeholder={t("editor.githubPlaceholder")}
          type="url"
          name="contact-github"
        />
      </div>
    </div>
  )
}
