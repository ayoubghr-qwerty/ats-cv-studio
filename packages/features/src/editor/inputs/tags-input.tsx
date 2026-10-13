import { Input } from "@ats/ui"
import { XIcon } from "lucide-react"
import { useState, type KeyboardEvent } from "react"

interface TagsInputProps {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

export function TagsInput({ value, onChange, placeholder }: TagsInputProps) {
  const [draft, setDraft] = useState("")

  const commit = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, " ")
    if (!tag) return
    if (!value.includes(tag)) {
      onChange([...value, tag])
    }
    setDraft("")
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      commit(draft)
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-sm"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => remove(tag)}
              className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <XIcon className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={placeholder}
      />
    </div>
  )
}
