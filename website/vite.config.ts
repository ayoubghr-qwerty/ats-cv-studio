import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Vendor code gets stable chunks; workspace modules split naturally
        // per lazy route. If a chunk-level import cycle ever reappears
        // ("__exportAll is not a function" at runtime), fall back to grouping
        // all packages/* modules into a single "ats-workspace" chunk.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined
          if (id.includes("react-router")) return "react-router"
          if (id.includes("pdfjs-dist")) return "pdfjs"
          if (id.includes("docx")) return "docx"
          if (id.includes("i18next")) return "i18next"
          if (id.includes("react-dom") || id.includes("scheduler")) return "react-dom"
          return undefined
        },
      },
    },
  },
});
