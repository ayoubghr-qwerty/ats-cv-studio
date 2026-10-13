# Settings Page

## Goal

Replace the phase-1 "coming soon" placeholder on the Settings page (both web and desktop) with a functional Settings page covering:

1. **Appearance** — theme (light / dark / system)
2. **Language** — UI locale (en / fr / ar)
3. **Data** — export workspace (JSON download), import workspace (JSON upload), clear all documents (destructive)

**Non-goals:** CV-specific defaults (template / page / default CV locale), auto-save policies, desktop-only native file locations. Those need new core settings-state infra; out of scope here.

## Users & roles

Single-user, offline-first app. No authentication. Settings apply per-device (localStorage / storage adapter).

## Data model

No new persisted entities. All settings reuse existing infra:

- **Theme** → `ThemeProvider` / `useTheme` (`packages/features/src/theme/theme-provider.tsx`), persisted in `localStorage["ats.theme"]`.
- **Language** → `i18n.changeLanguage` + `isSupportedLanguage` / `SUPPORTED_LANGUAGES` from `@ats/i18n`, persisted by `i18next-browser-languagedetector`.
- **Data ops** → `StorageAdapter` via `useDocuments` / `useStorage`:
  - `exportWorkspace(): Promise<string>` (JSON) + `downloadJson` helper
  - `importWorkspace(json): { imported, skipped }` + `pickJsonFile` helper
  - no `clearAll` on the adapter → clear = iterate `listDocuments()` and `deleteDocument(id)` (works on both web IndexedDB and desktop FileSystemStorage), then `docs.refresh()`.

## API / integration surface

None new. Consumes the existing UI primitives from `@ats/ui` (Button, Select, Dialog, etc.), following the same patterns as `DashboardPage`.

## UX flows

- **Appearance:** Segmented/select control showing current theme; switching updates `<html>` class + localStorage (same effect as topbar menu).
- **Language:** Select of EN/FR/AR with current-language check; switching re-renders page labels (RTL handled by `setDocumentLanguage`).
- **Export:** Button → `downloadJson("workspace.json", …)`; toast on failure.
- **Import:** Button → hidden file input → `importWorkspace(text)` → toast with imported count / skipped; failure toast.
- **Clear all:** Destructive button → confirmation dialog ("This deletes all documents", type-to-confirm or explicit confirm) → iterate delete → success toast. Only enabled when there is at least one document.

**Edge cases:**
- Import file rejected/empty → error toast, no state change.
- Clear-all with zero documents → button disabled.
- Import skipped entries (validation failures) → still succeeds with `skipped[]` surfaced.

## Implementation plan

1. Shared `packages/features/src/settings/SettingsPage.tsx` (page component) + re-export in `packages/features/src/pages.ts`.
2. i18n keys under `settings.*` in `en.json`, `fr.json`, `ar.json` (both web + desktop consume the same package).
3. `website/src/pages/SettingsPage.tsx` and `desktop/src/pages/SettingsPage.tsx` → re-export shared page (same pattern as `DashboardPage`).
4. Verify: typecheck, eslint, build web + desktop, dev smoke of `/settings`.

## Out of scope

- App-level default CV template / page settings
- Per-document locale default vs UI locale
- Settings sync between devices
- Desktop native file-location pickers

## Open questions

- None blocking. Verify whether `useDocuments` is available to the Settings page for the doc count/clear loop (yes — same provider tree as Dashboard).