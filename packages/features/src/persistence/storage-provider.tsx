import type { StorageAdapter } from "@ats/core"
import * as React from "react"

const StorageContext = React.createContext<StorageAdapter | null>(null)

export function StorageProvider({
  adapter,
  children,
}: {
  adapter: StorageAdapter
  children: React.ReactNode
}) {
  return <StorageContext.Provider value={adapter}>{children}</StorageContext.Provider>
}

export function useStorage(): StorageAdapter {
  const adapter = React.useContext(StorageContext)
  if (!adapter) {
    throw new Error("useStorage must be used within a StorageProvider")
  }
  return adapter
}
