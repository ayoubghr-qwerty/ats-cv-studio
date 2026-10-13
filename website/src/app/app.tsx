import { RouterProvider } from "react-router-dom"
import { IndexedDbStorage } from "../web"

import { Providers, router } from "@ats/app-shell"

export function App() {
  return (
    <Providers adapter={new IndexedDbStorage()}>
      <RouterProvider router={router} />
    </Providers>
  )
}
