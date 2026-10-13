import type { CvSection, SectionType } from "@ats/core"
import { resolveSectionTitle, type Locale } from "@ats/templates"
import { Switch, Tooltip, TooltipContent, TooltipTrigger } from "@ats/ui"
import { useTranslation } from "react-i18next"
import { useUiLocale } from "../hooks/use-ui-locale"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AwardIcon,
  BookOpenIcon,
  BriefcaseIcon,
  FileTextIcon,
  GraduationCapIcon,
  GripVerticalIcon,
  HeartHandshakeIcon,
  LanguagesIcon,
  RocketIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

export const SECTION_ICONS: Record<SectionType, LucideIcon> = {
  summary: FileTextIcon,
  experience: BriefcaseIcon,
  education: GraduationCapIcon,
  skills: ZapIcon,
  softSkills: UsersIcon,
  projects: RocketIcon,
  certifications: AwardIcon,
  languages: LanguagesIcon,
  awards: TrophyIcon,
  volunteering: HeartHandshakeIcon,
  publications: BookOpenIcon,
  courses: TargetIcon,
}

function SectionRow({
  section,
  selected,
  onSelect,
  onToggle,
  locale,
}: {
  section: CvSection
  selected: boolean
  onSelect: () => void
  onToggle: () => void
  locale: Locale
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })
  const Icon = SECTION_ICONS[section.type]
  const { t } = useTranslation()
  const displayTitle = resolveSectionTitle(section.title, section.type, locale)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
        isDragging ? "z-10 border-primary/40 bg-muted shadow-sm" : "bg-card"
      } ${selected ? "border-primary/50" : ""} ${section.enabled ? "" : "opacity-50"}`}
    >
      <button
        type="button"
        aria-label="Reorder section"
        className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate text-sm font-medium">{displayTitle}</span>
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Switch
              checked={section.enabled}
              onCheckedChange={onToggle}
              aria-label="Toggle section"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent side="left">
          {section.enabled ? t("editor.sectionEnabled") : t("editor.sectionDisabled")}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export function SectionList({
  sections,
  selectedId,
  onSelect,
  onToggle,
  onReorder,
}: {
  sections: CvSection[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onReorder: (from: number, to: number) => void
}) {
  const { t } = useTranslation()
  const locale = useUiLocale()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = sections.findIndex((s) => s.id === active.id)
    const to = sections.findIndex((s) => s.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(from, to)
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SectionRow
              key={section.id}
              section={section}
              selected={selectedId === section.id}
              onSelect={() => onSelect(section.id)}
              onToggle={() => onToggle(section.id)}
              locale={locale}
            />
          ))}
        </SortableContext>
      </DndContext>
      <p className="px-1 text-xs text-muted-foreground">{t("editor.dragHint")}</p>
    </div>
  )
}
