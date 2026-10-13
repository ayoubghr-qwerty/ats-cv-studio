import type { CvDocument, CvItem, CvSection, SectionType } from "../schema"
import { newId } from "../utils"
import type { HistoryOptions } from "./history"
import { History } from "./history"

export type ItemPatch = Partial<Omit<CvItem, "id">>

export function setDocumentLocale(doc: CvDocument, locale: CvDocument["locale"]): CvDocument {
  if (doc.locale === locale) return doc
  return { ...doc, locale, direction: locale === "ar" ? "rtl" : "ltr" }
}

export function setContactField(
  doc: CvDocument,
  field: keyof CvDocument["contact"],
  value: string,
): CvDocument {
  return { ...doc, contact: { ...doc.contact, [field]: value } }
}

export function setTemplateId(doc: CvDocument, templateId: string): CvDocument {
  if (doc.templateId === templateId) return doc
  return { ...doc, templateId }
}

export function setTemplateSettingsField<K extends keyof CvDocument["templateSettings"]>(
  doc: CvDocument,
  field: K,
  value: CvDocument["templateSettings"][K],
): CvDocument {
  if (doc.templateSettings[field] === value) return doc
  return { ...doc, templateSettings: { ...doc.templateSettings, [field]: value } }
}

export function setSummaryText(doc: CvDocument, text: string): CvDocument {
  return {
    ...doc,
    sections: doc.sections.map((section) => {
      if (section.type !== "summary") return section
      if (section.items.length === 0) {
        return { ...section, items: [{ id: newId("item"), text }] }
      }
      const [first, ...rest] = section.items
      return { ...section, items: [{ ...(first as { id: string }), text }, ...rest] }
    }),
  }
}

export function setSectionTitle(doc: CvDocument, sectionId: string, title: string): CvDocument {
  return updateSection(doc, sectionId, (section) => ({ ...section, title }))
}

export function toggleSection(doc: CvDocument, sectionId: string): CvDocument {
  return updateSection(doc, sectionId, (section) => ({ ...section, enabled: !section.enabled }))
}

export function updateItem(
  doc: CvDocument,
  sectionId: string,
  itemId: string,
  patch: ItemPatch,
): CvDocument {
  return updateSection(doc, sectionId, (section) => ({
    ...section,
    items: section.items.map((item) =>
      item.id === itemId ? ({ ...item, ...patch } as CvItem) : item,
    ),
  }))
}

export function addItem(doc: CvDocument, sectionId: string, item: CvItem): CvDocument {
  return updateSection(doc, sectionId, (section) => ({
    ...section,
    items: [...section.items, item],
  }))
}

export function removeItem(doc: CvDocument, sectionId: string, itemId: string): CvDocument {
  return updateSection(doc, sectionId, (section) => ({
    ...section,
    items: section.items.filter((item) => item.id !== itemId),
  }))
}

export function moveItem(doc: CvDocument, sectionId: string, from: number, to: number): CvDocument {
  return updateSection(doc, sectionId, (section) => {
    const items = [...section.items]
    if (from < 0 || from >= items.length || to < 0 || to >= items.length) return section
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    return { ...section, items }
  })
}

export function moveItemById(
  doc: CvDocument,
  sectionId: string,
  itemId: string,
  toIndex: number,
): CvDocument {
  return updateSection(doc, sectionId, (section) => {
    const from = section.items.findIndex((item) => item.id === itemId)
    if (from < 0 || toIndex < 0 || toIndex >= section.items.length) return section
    const items = [...section.items]
    const [moved] = items.splice(from, 1)
    items.splice(toIndex, 0, moved)
    return { ...section, items }
  })
}

export function reorderSections(doc: CvDocument, orderedIds: string[]): CvDocument {
  const byId = new Map(doc.sections.map((section) => [section.id, section]))
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((section): section is CvSection => !!section)
  return {
    ...doc,
    sections: ordered.map((section, index) => ({ ...section, order: index })),
  }
}

export function reorderSectionsByIndex(doc: CvDocument, from: number, to: number): CvDocument {
  const sections = [...doc.sections]
  if (from < 0 || from >= sections.length || to < 0 || to >= sections.length) return doc
  const [moved] = sections.splice(from, 1)
  sections.splice(to, 0, moved)
  return {
    ...doc,
    sections: sections.map((section, index) => ({ ...section, order: index })),
  }
}

export function enableSectionType(doc: CvDocument, type: SectionType): CvDocument {
  if (doc.sections.some((section) => section.type === type)) return doc
  return {
    ...doc,
    sections: [
      ...doc.sections,
      {
        id: newId("section"),
        type,
        title: type,
        enabled: true,
        order: doc.sections.length,
        items: [],
      },
    ],
  }
}

function updateSection(
  doc: CvDocument,
  sectionId: string,
  updater: (section: CvSection) => CvSection,
): CvDocument {
  return {
    ...doc,
    sections: doc.sections.map((section) =>
      section.id === sectionId ? updater(section) : section,
    ),
  }
}

export type CvEditorOptions = HistoryOptions

export class CvEditorStore {
  private history: History<CvDocument>
  private listeners = new Set<() => void>()
  private group: string | undefined

  constructor(doc: CvDocument, opts: CvEditorOptions = {}) {
    this.history = new History(doc, { mergeWindowMs: 800, ...opts })
  }

  getState(): CvDocument {
    return this.history.current
  }

  get canUndo(): boolean {
    return this.history.canUndo
  }

  get canRedo(): boolean {
    return this.history.canRedo
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  mutate(mutator: (doc: CvDocument) => CvDocument, group?: string): void {
    const next = mutator(this.getState())
    if (next === this.getState()) return
    this.history.commit(next, group ?? this.group)
    this.emit()
  }

  beginGroup(label: string): void {
    this.group = label
  }

  endGroup(): void {
    this.group = undefined
  }

  undo(): void {
    if (this.history.undo()) this.emit()
  }

  redo(): void {
    if (this.history.redo()) this.emit()
  }

  reset(doc: CvDocument): void {
    this.history.reset(doc)
    this.group = undefined
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

export function createItem(type: SectionType): CvItem {
  const id = newId("item")
  switch (type) {
    case "experience":
      return {
        id,
        role: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [],
      }
    case "education":
      return {
        id,
        degree: "",
        institution: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        details: "",
      }
    case "skills":
      return { id, name: "", category: undefined }
    case "softSkills":
      return { id, name: "" }
    case "projects":
      return {
        id,
        name: "",
        description: "",
        link: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [],
      }
    case "certifications":
      return { id, name: "", issuer: "", date: "", link: "" }
    case "languages":
      return { id, name: "", level: "intermediate" }
    case "awards":
      return { id, title: "", issuer: "", date: "", description: "" }
    case "volunteering":
      return {
        id,
        role: "",
        organization: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      }
    case "publications":
      return { id, title: "", publisher: "", date: "", url: "" }
    case "courses":
      return { id, name: "", provider: "", date: "", description: "" }
    case "summary":
      return { id, text: "" }
    default:
      throw new Error(`Unknown section type: ${type}`)
  }
}
