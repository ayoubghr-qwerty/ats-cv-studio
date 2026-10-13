import { Textarea } from "@ats/ui"
import { useEffect, useRef } from "react"

interface AutoTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minRows?: number
  maxRows?: number
  className?: string
  id?: string
}

export function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 3,
  maxRows = 14,
  className,
  id,
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "0px"
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 20
    const min = minRows * lineHeight + 20
    const max = maxRows * lineHeight + 20
    const next = Math.min(Math.max(el.scrollHeight, min), max)
    el.style.height = `${next}px`
  }, [value, minRows, maxRows])

  return (
    <Textarea
      ref={ref}
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`resize-none overflow-hidden ${className ?? ""}`}
      rows={minRows}
    />
  )
}
