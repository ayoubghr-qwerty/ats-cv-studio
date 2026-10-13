import type { CvEditorStore, CvItem, CvSection, SectionType, ItemPatch } from "@ats/core"
import { addItem, createItem, moveItem, removeItem, setSummaryText, updateItem } from "@ats/core"
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ats/ui"
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
import { ChevronDownIcon, CopyIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AutoTextarea } from "./inputs/auto-textarea"
import { DateRangeInput, type DateRangeValue } from "./inputs/date-range-input"
import { LinesInput } from "./inputs/lines-input"
import { MonthYearPicker } from "./inputs/month-year-picker"
import { TagsInput } from "./inputs/tags-input"

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function itemTitle(type: SectionType, item: CvItem): string {
  switch (type) {
    case "experience":
      return (
        (item as { role?: string; company?: string }).role ||
        (item as { role?: string; company?: string }).company ||
        ""
      )
    case "education":
      return (
        (item as { degree?: string; institution?: string }).degree ||
        (item as { degree?: string; institution?: string }).institution ||
        ""
      )
    case "projects":
      return (item as { name?: string }).name || ""
    case "certifications":
      return (item as { name?: string }).name || ""
    case "languages":
      return (item as { name?: string }).name || ""
    case "awards":
      return (item as { title?: string }).title || ""
    case "volunteering":
      return (
        (item as { role?: string; organization?: string }).role ||
        (item as { role?: string; organization?: string }).organization ||
        ""
      )
    case "publications":
      return (item as { title?: string }).title || ""
    case "courses":
      return (item as { name?: string }).name || ""
    case "softSkills":
      return (item as { name?: string }).name || ""
    default:
      return ""
  }
}

function ItemCard({
  type,
  sectionId,
  item,
  store,
  open,
  onOpenChange,
  children,
}: {
  type: SectionType
  sectionId: string
  item: CvItem
  store: CvEditorStore
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const duplicate = () => {
    const copy = { ...(JSON.parse(JSON.stringify(item)) as CvItem), id: createItem(type).id }
    store.mutate((d) => addItem(d, sectionId, copy))
    onOpenChange(true)
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="rounded-lg border bg-card">
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={`flex items-center gap-2 px-3 py-2 ${isDragging ? "z-10 opacity-90" : ""}`}
      >
        <button
          type="button"
          aria-label="Reorder item"
          className="cursor-grab touch-none p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" aria-hidden="true" />
        </button>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span className="truncate text-sm font-medium">
              {itemTitle(type, item) || t("editor.newEntry")}
            </span>
            <ChevronDownIcon
              className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        <Button variant="ghost" size="icon" aria-label="Duplicate item" onClick={duplicate}>
          <CopyIcon className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Remove item"
          onClick={() => store.mutate((d) => removeItem(d, sectionId, item.id))}
        >
          <Trash2Icon className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 border-t px-3 py-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function DateRangeFields({
  sectionId,
  item,
  store,
}: {
  sectionId: string
  item: Extract<CvItem, { startDate: string; endDate: string; current: boolean }>
  store: CvEditorStore
}) {
  const { t } = useTranslation()
  const value: DateRangeValue = { start: item.startDate, end: item.endDate, current: item.current }
  return (
    <DateRangeInput
      value={value}
      onChange={(next) => {
        store.mutate(
          (d) =>
            updateItem(d, sectionId, item.id, {
              startDate: next.start,
              endDate: next.end,
              current: next.current,
            }),
          "text",
        )
      }}
      startLabel={t("editor.startDate")}
      endLabel={t("editor.endDate")}
    />
  )
}

function RepeatableSectionEditor({ section, store }: { section: CvSection; store: CvEditorStore }) {
  const { t } = useTranslation()
  const type = section.type

  const patch = (itemId: string, patch: ItemPatch) => {
    store.mutate((d) => updateItem(d, section.id, itemId, patch), "text")
  }

  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set())
  const openItem = (id: string) => setOpenItems((prev) => new Set(prev).add(id))
  const closeItem = (id: string) =>
    setOpenItems((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = section.items.findIndex((i) => i.id === active.id)
    const to = section.items.findIndex((i) => i.id === over.id)
    if (from < 0 || to < 0) return
    store.mutate((d) => moveItem(d, section.id, from, to))
  }

  const itemFields = (item: CvItem): Record<string, React.ReactNode> => {
    switch (type) {
      case "experience": {
        const i = item as { role: string; company: string; location: string }
        return {
          role: (
            <Input
              value={i.role}
              onChange={(e) => patch(item.id, { role: e.target.value })}
              placeholder={t("editor.role")}
            />
          ),
          company: (
            <Input
              value={i.company}
              onChange={(e) => patch(item.id, { company: e.target.value })}
              placeholder={t("editor.company")}
            />
          ),
          location: (
            <Input
              value={i.location}
              onChange={(e) => patch(item.id, { location: e.target.value })}
              placeholder={t("editor.location")}
            />
          ),
        }
      }
      case "education": {
        const i = item as { degree: string; institution: string; location: string }
        return {
          degree: (
            <Input
              value={i.degree}
              onChange={(e) => patch(item.id, { degree: e.target.value })}
              placeholder={t("editor.degree")}
            />
          ),
          institution: (
            <Input
              value={i.institution}
              onChange={(e) => patch(item.id, { institution: e.target.value })}
              placeholder={t("editor.institution")}
            />
          ),
          location: (
            <Input
              value={i.location}
              onChange={(e) => patch(item.id, { location: e.target.value })}
              placeholder={t("editor.location")}
            />
          ),
        }
      }
      case "projects": {
        const i = item as { name: string; description: string; link: string }
        return {
          name: (
            <Input
              value={i.name}
              onChange={(e) => patch(item.id, { name: e.target.value })}
              placeholder={t("editor.projectName")}
            />
          ),
          description: (
            <AutoTextarea
              value={i.description}
              minRows={2}
              onChange={(v) => patch(item.id, { description: v })}
              placeholder={t("editor.projectDescription")}
            />
          ),
          link: (
            <Input
              value={i.link}
              onChange={(e) => patch(item.id, { link: e.target.value })}
              placeholder={t("editor.link")}
            />
          ),
        }
      }
      case "certifications": {
        const i = item as { name: string; issuer: string; link: string }
        return {
          name: (
            <Input
              value={i.name}
              onChange={(e) => patch(item.id, { name: e.target.value })}
              placeholder={t("editor.certName")}
            />
          ),
          issuer: (
            <Input
              value={i.issuer}
              onChange={(e) => patch(item.id, { issuer: e.target.value })}
              placeholder={t("editor.issuer")}
            />
          ),
          link: (
            <Input
              value={i.link}
              onChange={(e) => patch(item.id, { link: e.target.value })}
              placeholder={t("editor.link")}
            />
          ),
        }
      }
      case "languages": {
        const i = item as { name: string; level: string }
        return {
          name: (
            <Input
              value={i.name}
              onChange={(e) => patch(item.id, { name: e.target.value })}
              placeholder={t("editor.languageName")}
            />
          ),
          level: (
            <Select value={i.level} onValueChange={(v) => patch(item.id, { level: v })}>
              <SelectTrigger>
                <SelectValue placeholder={t("editor.languageLevel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intermediate">{t("editor.levelIntermediate")}</SelectItem>
                <SelectItem value="advanced">{t("editor.levelAdvanced")}</SelectItem>
                <SelectItem value="fluent">{t("editor.levelFluent")}</SelectItem>
                <SelectItem value="bilingual">{t("editor.levelBilingual")}</SelectItem>
                <SelectItem value="native">{t("editor.levelNative")}</SelectItem>
              </SelectContent>
            </Select>
          ),
        }
      }
      case "awards": {
        const i = item as { title: string; issuer: string; description: string }
        return {
          title: (
            <Input
              value={i.title}
              onChange={(e) => patch(item.id, { title: e.target.value })}
              placeholder={t("editor.awardTitle")}
            />
          ),
          issuer: (
            <Input
              value={i.issuer}
              onChange={(e) => patch(item.id, { issuer: e.target.value })}
              placeholder={t("editor.issuer")}
            />
          ),
          description: (
            <AutoTextarea
              value={i.description}
              minRows={2}
              onChange={(v) => patch(item.id, { description: v })}
              placeholder={t("editor.awardDescription")}
            />
          ),
        }
      }
      case "volunteering": {
        const i = item as {
          role: string
          organization: string
          location: string
          description: string
        }
        return {
          role: (
            <Input
              value={i.role}
              onChange={(e) => patch(item.id, { role: e.target.value })}
              placeholder={t("editor.role")}
            />
          ),
          organization: (
            <Input
              value={i.organization}
              onChange={(e) => patch(item.id, { organization: e.target.value })}
              placeholder={t("editor.organization")}
            />
          ),
          location: (
            <Input
              value={i.location}
              onChange={(e) => patch(item.id, { location: e.target.value })}
              placeholder={t("editor.location")}
            />
          ),
          description: (
            <AutoTextarea
              value={i.description}
              minRows={2}
              onChange={(v) => patch(item.id, { description: v })}
              placeholder={t("editor.volunteeringDescription")}
            />
          ),
        }
      }
      case "publications": {
        const i = item as { title: string; publisher: string; url: string }
        return {
          title: (
            <Input
              value={i.title}
              onChange={(e) => patch(item.id, { title: e.target.value })}
              placeholder={t("editor.publicationTitle")}
            />
          ),
          publisher: (
            <Input
              value={i.publisher}
              onChange={(e) => patch(item.id, { publisher: e.target.value })}
              placeholder={t("editor.publisher")}
            />
          ),
          url: (
            <Input
              value={i.url}
              onChange={(e) => patch(item.id, { url: e.target.value })}
              placeholder={t("editor.link")}
            />
          ),
        }
      }
      case "courses": {
        const i = item as { name: string; provider: string; description: string }
        return {
          name: (
            <Input
              value={i.name}
              onChange={(e) => patch(item.id, { name: e.target.value })}
              placeholder={t("editor.courseName")}
            />
          ),
          provider: (
            <Input
              value={i.provider}
              onChange={(e) => patch(item.id, { provider: e.target.value })}
              placeholder={t("editor.provider")}
            />
          ),
          description: (
            <AutoTextarea
              value={i.description}
              minRows={2}
              onChange={(v) => patch(item.id, { description: v })}
              placeholder={t("editor.courseDescription")}
            />
          ),
        }
      }
      default:
        return {}
    }
  }

  const labelFor = (key: string): string => {
    const labels: Record<string, string> = {
      role: t("editor.role"),
      company: t("editor.company"),
      location: t("editor.location"),
      degree: t("editor.degree"),
      institution: t("editor.institution"),
      name: t("editor.projectName"),
      description: t("editor.projectDescription"),
      link: t("editor.link"),
      issuer: t("editor.issuer"),
      title: t("editor.awardTitle"),
      organization: t("editor.organization"),
      publisher: t("editor.publisher"),
      provider: t("editor.provider"),
      level: t("editor.languageLevel"),
    }
    return labels[key] ?? key
  }

  const extraFields = (item: CvItem): React.ReactNode => {
    const nodes: React.ReactNode[] = []
    if ("startDate" in item) {
      nodes.push(
        <DateRangeFields
          key="dates"
          sectionId={section.id}
          item={item as Extract<CvItem, { startDate: string; endDate: string; current: boolean }>}
          store={store}
        />,
      )
    }
    if ("date" in item) {
      const i = item as { date: string }
      nodes.push(
        <Field key="single-date" label={t("editor.date")}>
          <MonthYearPicker value={i.date} onChange={(v) => patch(item.id, { date: v })} />
        </Field>,
      )
    }
    if ("bullets" in item) {
      const i = item as { bullets: string[] }
      nodes.push(
        <Field key="bullets" label={t("editor.bullets")}>
          <LinesInput
            value={i.bullets}
            onChange={(v) => patch(item.id, { bullets: v })}
            placeholder={t("editor.bulletsHint")}
          />
        </Field>,
      )
    }
    if ("details" in item) {
      const i = item as { details: string }
      nodes.push(
        <Field key="details" label={t("editor.details")}>
          <AutoTextarea
            value={i.details}
            minRows={2}
            onChange={(v) => patch(item.id, { details: v })}
            placeholder={t("editor.detailsHint")}
          />
        </Field>,
      )
    }
    return nodes
  }

  return (
    <div className="flex flex-col gap-3">
      {section.items.length === 0 && (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          {t("editor.emptySection")}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleItemDragEnd}
        >
          <SortableContext
            items={section.items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.items.map((item) => (
              <ItemCard
                key={item.id}
                type={type}
                sectionId={section.id}
                item={item}
                store={store}
                open={openItems.has(item.id)}
                onOpenChange={(next) => (next ? openItem(item.id) : closeItem(item.id))}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.entries(itemFields(item)).map(([key, el]) => (
                    <Field key={key} label={labelFor(key)}>
                      {el}
                    </Field>
                  ))}
                </div>
                {extraFields(item)}
              </ItemCard>
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <Button
        variant="outline"
        className="justify-start"
        onClick={() => {
          const item = createItem(type)
          store.mutate((d) => addItem(d, section.id, item))
          openItem(item.id)
        }}
      >
        <PlusIcon aria-hidden="true" />
        {t("editor.addEntry")}
      </Button>
    </div>
  )
}

function SkillsEditor({ section, store }: { section: CvSection; store: CvEditorStore }) {
  const { t } = useTranslation()
  const names = section.items.map((i) => (i as { name: string }).name)

  const onChange = (next: string[]) => {
    store.mutate((d) => {
      const sec = d.sections.find((s) => s.id === section.id)!
      const existing = new Map(sec.items.map((i) => [(i as { name: string }).name, i]))
      return {
        ...d,
        sections: d.sections.map((s) =>
          s.id === section.id
            ? {
                ...s,
                items: next.map((name) => {
                  const found = existing.get(name)
                  return found ? found : { ...createItem("skills"), name }
                }),
              }
            : s,
        ),
      }
    })
  }

  const setCategory = (itemId: string, category: string) => {
    store.mutate((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === section.id
          ? {
              ...s,
              items: s.items.map((i) =>
                i.id === itemId ? { ...i, category: category.trim() || undefined } : i,
              ),
            }
          : s,
      ),
    }))
  }

  const knownCategories = [
    ...new Set(
      section.items
        .map((i) => (i as { category?: string }).category?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  ]

  return (
    <div className="flex flex-col gap-3">
      <TagsInput value={names} onChange={onChange} placeholder={t("editor.skillsHint")} />
      {section.items.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{t("editor.skillCategory")}</span>
          {section.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm">
                {(item as { name: string }).name}
              </span>
              <Input
                list={`skill-categories-${section.id}`}
                value={(item as { category?: string }).category ?? ""}
                onChange={(e) => setCategory(item.id, e.target.value)}
                placeholder={t("editor.skillCategoryHint")}
                className="h-8 w-40 text-xs"
                aria-label={`${t("editor.skillCategory")} - ${(item as { name: string }).name}`}
              />
            </div>
          ))}
          <datalist id={`skill-categories-${section.id}`}>
            {knownCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      )}
    </div>
  )
}

/**
 * Soft skills are plain tags ("Communication", "Teamwork"): no category, no
 * level. Same tag-list behaviour as SkillsEditor, keeping existing items (and
 * their ids) when the list is edited.
 */
function SoftSkillsEditor({ section, store }: { section: CvSection; store: CvEditorStore }) {
  const { t } = useTranslation()
  const names = section.items.map((i) => (i as { name: string }).name)

  const onChange = (next: string[]) => {
    store.mutate((d) => ({
      ...d,
      sections: d.sections.map((s) => {
        if (s.id !== section.id) return s
        const existing = new Map(s.items.map((i) => [(i as { name: string }).name, i]))
        return {
          ...s,
          items: next.map((name) => existing.get(name) ?? { ...createItem("softSkills"), name }),
        }
      }),
    }))
  }

  return <TagsInput value={names} onChange={onChange} placeholder={t("editor.softSkillsHint")} />
}

export function SectionEditor({ section, store }: { section: CvSection; store: CvEditorStore }) {
  const { t } = useTranslation()

  if (section.type === "summary") {
    const text = section.items[0] ? (section.items[0] as { text: string }).text : ""
    return (
      <div className="flex flex-col gap-2">
        <Field label={t("editor.summaryLabel")}>
          <AutoTextarea
            value={text}
            minRows={5}
            onChange={(v) => store.mutate((d) => setSummaryText(d, v), "text")}
            placeholder={t("editor.summaryHint")}
          />
        </Field>
        <p className="text-xs text-muted-foreground">{t("editor.summaryGuidance")}</p>
      </div>
    )
  }

  if (section.type === "skills") {
    return <SkillsEditor section={section} store={store} />
  }

  if (section.type === "softSkills") {
    return <SoftSkillsEditor section={section} store={store} />
  }

  return <RepeatableSectionEditor section={section} store={store} />
}
