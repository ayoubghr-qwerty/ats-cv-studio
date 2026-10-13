import "@fontsource-variable/inter"
import "@fontsource-variable/source-sans-3"
import "@fontsource-variable/lora"
import "@fontsource-variable/montserrat"
import "@ats/i18n"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { App } from "./app/app"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
