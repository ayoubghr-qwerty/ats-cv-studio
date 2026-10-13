import { AutoTextarea } from "./auto-textarea"

interface LinesInputProps {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

export function LinesInput({ value, onChange, placeholder }: LinesInputProps) {
  return (
    <AutoTextarea
      value={value.join("\n")}
      minRows={2}
      onChange={(text) =>
        onChange(
          text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0),
        )
      }
      placeholder={placeholder}
    />
  )
}
