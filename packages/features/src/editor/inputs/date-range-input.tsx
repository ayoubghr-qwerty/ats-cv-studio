import { Label, Switch } from "@ats/ui"
import { useTranslation } from "react-i18next"

import { MonthYearPicker, parseMonthYear, type MonthYearValue } from "./month-year-picker"

export interface DateRangeValue {
  start: MonthYearValue
  end: MonthYearValue
  current: boolean
}

interface DateRangeInputProps {
  value: DateRangeValue
  onChange: (next: DateRangeValue) => void
  startLabel?: string
  endLabel?: string
}

export function DateRangeInput({ value, onChange, startLabel, endLabel }: DateRangeInputProps) {
  const { t } = useTranslation()

  const start = parseMonthYear(value.start)
  const end = parseMonthYear(value.end)
  const inverted = !value.current && !!start && !!end && value.start > value.end

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{startLabel ?? t("editor.startDate")}</Label>
          <MonthYearPicker value={value.start} onChange={(v) => onChange({ ...value, start: v })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{endLabel ?? t("editor.endDate")}</Label>
          <MonthYearPicker
            value={value.current ? "" : value.end}
            disabled={value.current}
            onChange={(v) => onChange({ ...value, end: v })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={value.current}
          onCheckedChange={(checked) =>
            onChange({ ...value, current: checked, end: checked ? "" : value.end })
          }
        />
        <Label className="text-sm">{t("editor.present")}</Label>
      </div>
      {inverted && <p className="text-xs text-destructive">{t("editor.invalidDateRange")}</p>}
    </div>
  )
}
