import { Button, Popover, PopoverContent, PopoverTrigger } from "@ats/ui"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export type MonthYearValue = string

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

export function parseMonthYear(value: string): { year: number; month: number } | null {
  const match = MONTH_PATTERN.exec(value)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1 }
}

export function formatMonthYear(value: string, locale: string): string {
  const parsed = parseMonthYear(value)
  if (!parsed) return ""
  const date = new Date(parsed.year, parsed.month, 1)
  const month = new Intl.DateTimeFormat(locale, { month: "long" }).format(date)
  return `${month} ${parsed.year}`
}

interface MonthYearPickerProps {
  value: MonthYearValue
  onChange: (value: MonthYearValue) => void
  placeholder?: string
  disabled?: boolean
}

export function MonthYearPicker({ value, onChange, placeholder, disabled }: MonthYearPickerProps) {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? "en"
  const parsed = parseMonthYear(value)
  const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear())
  const [open, setOpen] = useState(false)

  const monthNames = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) =>
      new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2000, m, 1)),
    )
  }, [locale])

  const label = parsed ? formatMonthYear(value, locale) : (placeholder ?? "")

  const select = (month: number) => {
    onChange(`${viewYear}-${String(month + 1).padStart(2, "0")}`)
    setOpen(false)
  }

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={parsed ? "" : "text-muted-foreground"}>{label}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewYear((y) => y - 1)}
              aria-label="Previous year"
            >
              <ChevronUpIcon className="size-4" aria-hidden="true" />
            </Button>
            <span className="text-sm font-medium">{viewYear}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewYear((y) => y + 1)}
              aria-label="Next year"
            >
              <ChevronDownIcon className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {monthNames.map((name, m) => {
              const active = parsed?.year === viewYear && parsed.month === m
              return (
                <Button
                  key={name}
                  type="button"
                  variant={active ? "default" : "ghost"}
                  className="px-1 text-xs"
                  onClick={() => select(m)}
                >
                  {name}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
