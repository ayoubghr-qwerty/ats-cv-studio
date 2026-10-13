import { Component, ErrorInfo, ReactNode } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { AlertTriangleIcon, RefreshCwIcon, XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

function ErrorDialog({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <Dialog.Root open onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-lg">
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </Dialog.Close>
          <div className="flex flex-col gap-2 text-center">
            <AlertTriangleIcon className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
            <Dialog.Title className="text-lg font-semibold">
              {t("errorBoundary.title")}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {t("errorBoundary.description", { message: error?.message ?? "" })}
            </Dialog.Description>
          </div>
          <div className="flex justify-center pt-4">
            <button
              onClick={onRetry}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
              {t("errorBoundary.retry")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorDialog error={this.state.error} onRetry={this.reset} />
    }

    return this.props.children
  }
}
