import type { StorageAdapter } from "@ats/core"
import { StorageProvider } from "@ats/features/persistence"
import { ThemeProvider } from "@ats/features/theme"
import { ErrorBoundary, Toaster, TooltipProvider } from "@ats/ui"
import type { ReactNode } from "react"

interface ProvidersProps {
  adapter: StorageAdapter
  children: ReactNode
}

export function Providers({ adapter, children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <StorageProvider adapter={adapter}>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </StorageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
