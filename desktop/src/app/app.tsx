import { RouterProvider } from "react-router-dom"
import { FileSystemStorage } from "../desktop"

import { Providers, router } from "@ats/app-shell"

export function App() {
  return (
    <Providers adapter={new FileSystemStorage()}>
      <RouterProvider router={router} />
    </Providers>
  )
}
