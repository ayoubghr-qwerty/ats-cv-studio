import { describe, expect, it, vi } from "vitest"

import { createCvDocument } from "../src/factories"
import {
  addItem,
  createItem,
  CvEditorStore,
  moveItemById,
  removeItem,
  reorderSectionsByIndex,
  setContactField,
  setSectionTitle,
  setSummaryText,
  toggleSection,
  updateItem,
} from "../src/store/cv-store"

function doc() {
  return createCvDocument({ locale: "en" })
}

describe("CvEditorStore", () => {
  it("mutates state immutably and notifies listeners", () => {
    const store = new CvEditorStore(doc())
    let calls = 0
    const off = store.subscribe(() => calls++)
    store.mutate((d) => setContactField(d, "fullName", "Ada Lovelace"))
    expect(store.getState().contact.fullName).toBe("Ada Lovelace")
    expect(calls).toBe(1)
    off()
    store.mutate((d) => setContactField(d, "email", "ada@example.com"))
    expect(calls).toBe(1)
  })

  it("undo restores prior state and groups text edits", () => {
    vi.useFakeTimers()
    try {
      const store = new CvEditorStore(doc())
      store.mutate((d) => setContactField(d, "fullName", "A"), "contact")
      vi.advanceTimersByTime(100)
      store.mutate((d) => setContactField(d, "fullName", "Ada"), "contact")
      store.undo()
      expect(store.getState().contact.fullName).toBe("")
      store.redo()
      expect(store.getState().contact.fullName).toBe("Ada")
    } finally {
      vi.useRealTimers()
    }
  })

  it("section ops are undoable one at a time", () => {
    const store = new CvEditorStore(doc())
    const exp = store.getState().sections.find((s) => s.type === "experience")!
    store.mutate((d) => addItem(d, exp.id, createItem("experience")))
    const withItem = store.getState()
    expect(withItem.sections.find((s) => s.id === exp.id)!.items).toHaveLength(1)

    store.undo()
    expect(store.getState().sections.find((s) => s.id === exp.id)!.items).toHaveLength(0)
    store.redo()
    expect(store.getState().sections.find((s) => s.id === exp.id)!.items).toHaveLength(1)
  })

  it("reorders sections", () => {
    const store = new CvEditorStore(doc())
    const ids = store.getState().sections.map((s) => s.id)
    store.mutate((d) => reorderSectionsByIndex(d, 0, ids.length - 1))
    const after = store.getState().sections.map((s) => s.id)
    expect(after).toEqual([...ids.slice(1), ids[0]])
    expect(store.getState().sections.map((s) => s.order)).toEqual(after.map((_, i) => i))
    store.mutate((d) => reorderSectionsByIndex(d, after.length - 1, 0))
    expect(store.getState().sections.map((s) => s.id)).toEqual(ids)
  })

  it("summary text creates and updates its single item", () => {
    const store = new CvEditorStore(doc())
    store.mutate((d) => setSummaryText(d, "Hello world"))
    const summary = store.getState().sections.find((s) => s.type === "summary")!
    expect(summary.items).toHaveLength(1)
    store.mutate((d) => setSummaryText(d, "Hello world again"))
    const summary2 = store.getState().sections.find((s) => s.type === "summary")!
    expect(summary2.items).toHaveLength(1)
    expect((summary2.items[0] as { text: string }).text).toBe("Hello world again")
  })

  it("updateItem patches fields and removeItem deletes", () => {
    const store = new CvEditorStore(doc())
    const exp = store.getState().sections.find((s) => s.type === "experience")!
    const item = createItem("experience")
    store.mutate((d) => addItem(d, exp.id, item))
    store.mutate((d) => updateItem(d, exp.id, item.id, { role: "Engineer", company: "Acme" }))
    let items = store.getState().sections.find((s) => s.id === exp.id)!.items
    expect((items[0] as { role: string }).role).toBe("Engineer")
    store.mutate((d) => removeItem(d, exp.id, item.id))
    items = store.getState().sections.find((s) => s.id === exp.id)!.items
    expect(items).toHaveLength(0)
  })

  it("toggleSection flips enabled", () => {
    const store = new CvEditorStore(doc())
    const awards = store.getState().sections.find((s) => s.type === "awards")!
    store.mutate((d) => toggleSection(d, awards.id))
    expect(store.getState().sections.find((s) => s.id === awards.id)!.enabled).toBe(true)
  })

  it("setSectionTitle renames a section", () => {
    const store = new CvEditorStore(doc())
    const exp = store.getState().sections.find((s) => s.type === "experience")!
    store.mutate((d) => setSectionTitle(d, exp.id, "Career"))
    expect(store.getState().sections.find((s) => s.id === exp.id)!.title).toBe("Career")
  })

  it("moveItemById moves items within a section", () => {
    const store = new CvEditorStore(doc())
    const exp = store.getState().sections.find((s) => s.type === "experience")!
    const a = createItem("experience")
    const b = createItem("experience")
    store.mutate((d) => addItem(d, exp.id, a))
    store.mutate((d) => addItem(d, exp.id, b))
    store.mutate((d) => moveItemById(d, exp.id, b.id, 0))
    const items = store.getState().sections.find((s) => s.id === exp.id)!.items
    expect(items.map((i) => i.id)).toEqual([b.id, a.id])
  })
})
