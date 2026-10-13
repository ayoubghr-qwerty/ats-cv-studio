import { createBrowserRouter } from "react-router-dom"
import { Suspense, lazy } from "react"

import { AppLayout } from "./app-layout"

const DashboardPage = lazy(() =>
  import("@ats/features/dashboard").then((m) => ({ default: m.DashboardPage })),
)
const EditorPage = lazy(() =>
  import("@ats/features/editor").then((m) => ({ default: m.EditorPage })),
)
const ImportPage = lazy(() =>
  import("@ats/features/import").then((m) => ({ default: m.ImportPage })),
)
const PrintView = lazy(() => import("@ats/features/print").then((m) => ({ default: m.PrintView })))
const SettingsPage = lazy(() =>
  import("@ats/features/settings").then((m) => ({ default: m.SettingsPage })),
)
const TemplatesPage = lazy(() =>
  import("@ats/features/templates-page").then((m) => ({ default: m.TemplatesPage })),
)
const NotFoundPage = lazy(() =>
  import("@ats/features/not-found").then((m) => ({ default: m.NotFoundPage })),
)

function Fallback() {
  return <div className="flex h-full items-center justify-center" />
}

const Dashboard = () => (
  <Suspense fallback={<Fallback />}>
    <DashboardPage />
  </Suspense>
)

const Editor = () => (
  <Suspense fallback={<Fallback />}>
    <EditorPage />
  </Suspense>
)

const Templates = () => (
  <Suspense fallback={<Fallback />}>
    <TemplatesPage />
  </Suspense>
)

const Import = () => (
  <Suspense fallback={<Fallback />}>
    <ImportPage />
  </Suspense>
)

const Settings = () => (
  <Suspense fallback={<Fallback />}>
    <SettingsPage />
  </Suspense>
)

const NotFound = () => (
  <Suspense fallback={<Fallback />}>
    <NotFoundPage />
  </Suspense>
)

const Print = () => (
  <Suspense fallback={<Fallback />}>
    <PrintView />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "editor", element: <Editor /> },
      { path: "editor/:docId", element: <Editor /> },
      { path: "templates", element: <Templates /> },
      { path: "import", element: <Import /> },
      { path: "settings", element: <Settings /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "print/cv/:documentId", element: <Print /> },
  { path: "print/cover-letter/:documentId", element: <Print /> },
])
