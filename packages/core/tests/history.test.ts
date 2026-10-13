import { describe, expect, it, vi } from "vitest"

import { History } from "../src/store/history"

describe("History", () => {
  it("starts with the initial state and no undo/redo", () => {
    const h = new History({ n: 0 })
    expect(h.current).toEqual({ n: 0 })
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })

  it("undo/redo walks back and forward", () => {
    const h = new History({ n: 0 })
    h.commit({ n: 1 })
    h.commit({ n: 2 })
    expect(h.current).toEqual({ n: 2 })
    expect(h.undo()).toEqual({ n: 1 })
    expect(h.undo()).toEqual({ n: 0 })
    expect(h.canUndo).toBe(false)
    expect(h.redo()).toEqual({ n: 1 })
    expect(h.redo()).toEqual({ n: 2 })
    expect(h.canRedo).toBe(false)
  })

  it("committing after undo clears the future", () => {
    const h = new History({ n: 0 })
    h.commit({ n: 1 })
    h.commit({ n: 2 })
    h.undo()
    h.undo()
    h.commit({ n: 9 })
    expect(h.redo()).toBeNull()
    expect(h.current).toEqual({ n: 9 })
  })

  it("merges commits with the same group within the window", () => {
    vi.useFakeTimers()
    try {
      const h = new History({ n: 0 }, { mergeWindowMs: 800 })
      h.commit({ n: 1 }, "text")
      vi.advanceTimersByTime(100)
      h.commit({ n: 2 }, "text")
      vi.advanceTimersByTime(100)
      h.commit({ n: 3 }, "text")
      expect(h.depth).toBe(1)
      expect(h.undo()).toEqual({ n: 0 })
      expect(h.redo()).toEqual({ n: 3 })
    } finally {
      vi.useRealTimers()
    }
  })

  it("does not merge across groups or after the window", () => {
    vi.useFakeTimers()
    try {
      const h = new History({ n: 0 }, { mergeWindowMs: 800 })
      h.commit({ n: 1 }, "a")
      vi.advanceTimersByTime(100)
      h.commit({ n: 2 }, "b")
      expect(h.depth).toBe(2)
      vi.advanceTimersByTime(2000)
      h.commit({ n: 3 }, "b")
      expect(h.depth).toBe(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it("caps history depth", () => {
    const h = new History({ n: 0 }, { maxHistory: 3 })
    h.commit({ n: 1 })
    h.commit({ n: 2 })
    h.commit({ n: 3 })
    h.commit({ n: 4 })
    expect(h.depth).toBe(3)
    expect(h.undo()).toEqual({ n: 3 })
  })

  it("reset clears history", () => {
    const h = new History({ n: 0 })
    h.commit({ n: 1 })
    h.reset({ n: 5 })
    expect(h.current).toEqual({ n: 5 })
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })
})
