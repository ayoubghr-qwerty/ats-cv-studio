import { useActiveCvEditor } from "@ats/features/active-editor"
import { useTheme } from "@ats/features/theme"
import { isSupportedLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from "@ats/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ats/ui"
import {
  CheckIcon,
  FileTextIcon,
  LanguagesIcon,
  MonitorIcon,
  MoonIcon,
  Redo2Icon,
  SunIcon,
  Undo2Icon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet } from "react-router-dom"

import { cn } from "@ats/ui"

function EditorHistoryButtons() {
  const { t } = useTranslation()
  const { canUndo, canRedo, undo, redo } = useActiveCvEditor()
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("editor.undo")}
        disabled={!canUndo}
        onClick={undo}
      >
        <Undo2Icon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("editor.redo")}
        disabled={!canRedo}
        onClick={redo}
      >
        <Redo2Icon />
      </Button>
    </>
  )
}

const navItems = [
  { to: "/", key: "dashboard" },
  { to: "/editor", key: "editor" },
  { to: "/templates", key: "templates" },
  { to: "/settings", key: "settings" },
] as const

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const currentLanguage = isSupportedLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : "en"

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const themeIcon =
    theme === "dark" ? <MoonIcon /> : theme === "light" ? <SunIcon /> : <MonitorIcon />

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <FileTextIcon className="size-5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("app.name")}</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <EditorHistoryButtons />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("topbar.language")}>
                <LanguagesIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("topbar.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SUPPORTED_LANGUAGES.map((lng) => (
                <DropdownMenuItem
                  key={lng}
                  onSelect={() => changeLanguage(lng)}
                  className="justify-between"
                >
                  {LANGUAGE_NAMES[lng]}
                  {currentLanguage === lng && <CheckIcon className="size-4" aria-hidden="true" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("topbar.theme")}>
                {themeIcon}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("topbar.theme")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(
                [
                  [
                    "light",
                    "theme.light",
                    <SunIcon key="i" className="size-4" aria-hidden="true" />,
                  ],
                  [
                    "dark",
                    "theme.dark",
                    <MoonIcon key="i" className="size-4" aria-hidden="true" />,
                  ],
                  [
                    "system",
                    "theme.system",
                    <MonitorIcon key="i" className="size-4" aria-hidden="true" />,
                  ],
                ] as const
              ).map(([value, label, icon]) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => setTheme(value)}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    {icon}
                    {t(label)}
                  </span>
                  {theme === value && <CheckIcon className="size-4" aria-hidden="true" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
