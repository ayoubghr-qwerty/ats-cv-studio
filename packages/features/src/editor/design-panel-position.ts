import { create } from "zustand"

export type DesignPanelSide = "left" | "right"

const STORAGE_KEY = "ats.design-panel.side"
const WIDTH_STORAGE_KEY = "ats.design-panel.width"

const DESIGN_PANEL_MIN_WIDTH = 288
const DESIGN_PANEL_MAX_WIDTH = 560
const DESIGN_PANEL_DEFAULT_WIDTH = 360

function readStoredSide(): DesignPanelSide {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "left" ? "left" : "right"
  } catch {
    return "right"
  }
}

function readStoredWidth(): number {
  try {
    const stored = Number(localStorage.getItem(WIDTH_STORAGE_KEY))
    if (Number.isFinite(stored) && stored > 0) {
      return Math.min(DESIGN_PANEL_MAX_WIDTH, Math.max(DESIGN_PANEL_MIN_WIDTH, stored))
    }
  } catch {
    // ignore
  }
  return DESIGN_PANEL_DEFAULT_WIDTH
}

interface DesignPanelState {
  side: DesignPanelSide
  width: number
  setSide: (side: DesignPanelSide) => void
  setWidth: (width: number) => void
}

export const useDesignPanelStore = create<DesignPanelState>((set) => ({
  side: readStoredSide(),
  width: readStoredWidth(),
  setSide: (side) => {
    try {
      localStorage.setItem(STORAGE_KEY, side)
    } catch {
      // ignore
    }
    set({ side })
  },
  setWidth: (width) => {
    const clamped = Math.min(DESIGN_PANEL_MAX_WIDTH, Math.max(DESIGN_PANEL_MIN_WIDTH, width))
    try {
      localStorage.setItem(WIDTH_STORAGE_KEY, String(clamped))
    } catch {
      // ignore
    }
    set({ width: clamped })
  },
}))

export const DESIGN_PANEL_WIDTH_BOUNDS = {
  min: DESIGN_PANEL_MIN_WIDTH,
  max: DESIGN_PANEL_MAX_WIDTH,
} as const
