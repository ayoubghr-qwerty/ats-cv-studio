# Changelog

All notable changes to ATS CV Studio are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] — 2026-10-04

### Changed

- **Two columns now apply everywhere** (preview, PDF and Word), at the user's
  request and accepting that some ATS read multi-column text out of order. The
  option's label says so. This reverses the earlier rule that kept PDF output
  single-column. Default stays one column. `atsViolations` still reports the
  construct unless called with `{ allowColumns: true }`. Compact skills,
  languages and soft skills lines never use columns.

### Removed

- **The Banner template style** (`ats-banner-01`, `ats-banner-02`). With an accent
  colour its band was the same colour as the candidate's name, which made the
  name invisible. Documents that used it open on Classic and keep their own
  font and colour settings. The registry now requires at least 16 templates
  (it was 17).

### Added

- **Separator option (Design → "Separator for one-line lists").** Comma (default)
  or bullet between the items of inline skills and soft skills, in the preview,
  the PDF and Word. Before, skills used a comma and soft skills a bullet.
  New `inlineSeparator` template setting; existing documents get the default.
- Languages on one line are now separated by a vertical bar
  (`French: Advanced  |  Arabic: Fluent`). The old separator was plain spaces,
  which HTML collapses, so the entries looked glued together. Separators use
  non-breaking spaces before the mark so a wrapped line never starts with it.


- **Compact skills layout (Design panel → "Skills layout").** New
  `skillsLayout` template setting with two values: `list` (default, one bullet
  per skill under its category heading — unchanged behaviour) and `inline`
  (one dense `Category: a, b, c` line per category, matching the single-line
  convention of classic resumes). `inline` is plain linear text — no list, no
  columns — so it is ATS-safe in every mode, and it shortens a typical Skills
  section from ~16 lines to ~4, which helps a dense CV stay on one page.
  Implemented for on-screen preview, print/PDF and DOCX export, with EN/FR/AR
  labels. Existing documents keep `list` (the schema default), so no migration
  is needed.

- **"Professional" template (ready-made look).** A new template (the
  gallery has 16 once Banner is removed) that reproduces the classic one-page ATS resume style: candidate name in caps,
  grey job title, thin rule under the header, navy caps section headings with
  a rule, `Role — Company, City` with the date in italics flush right, and
  skills as one `Category: a, b, c` line each. Single column, plain text and
  native bullets, so it passes the same ATS checks as every other template.
  Unlike the other templates, applying it adopts its whole look (font, accent,
  headings, skills layout, date placement) instead of keeping the document's
  own settings (`applyLook`). Word export matches: caps name and headings,
  heading rules, and dates behind a right tab stop (no table, no text box).
- **Date placement setting (`datePlacement`).** Item dates can be placed inline
  or right-aligned on the title line for experience, education, projects and
  volunteering. Unset means the template family's own default (Headline
  right-aligns, all others stay inline), so existing documents are unchanged.
- Item punctuation (title separator, meta separator, date-range separator) is now
  a per-family token; defaults are the previous ` - `, ` · ` and ` - `.

- **Compact languages layout (`languagesLayout`).** Same idea as the skills
  layout: `list` (default, unchanged — one line per language) or `inline`
  (one dense `Name: Level   Name: Level` paragraph), matching the reference
  resume's `Arabic: Bilingual  Tamazight: Native` convention. Implemented for
  preview, print/PDF and DOCX. The Professional template enables it by
  default; other templates keep `list`.
- **Date placement is now user-choosable in the Design panel**
  (Automatic / Inline / Right-aligned), not just settable programmatically.

- **"Bilingual" language level.** New level between Fluent and Native
  ("Bilingue" / "ثنائي اللغة"), selectable in the editor and shown in the
  preview, PDF and Word export. Existing languages are unchanged.
- **Import understands "Category: a, b, c" skills.** Each technical skill now
  keeps its category ("Programming Languages", "Web Development"...) instead of
  the whole line becoming one skill; a category list that wraps onto a second
  line stays in its category.
- **Import understands languages with levels.** "Arabic: Bilingual  Tamazight:
  Native language", "English - Fluent", "Spanish (B2)" and French/Arabic
  equivalents become one language each with the right level (CEFR A1–C2 too),
  including when a PDF has collapsed the spacing between languages. A line that
  is not fully understood is kept as-is rather than half-parsed. The category
  or level shows in the import review, where it can be corrected.
- **Soft Skills section (`softSkills`).** New optional section for transversal
  skills (`Communication • Teamwork • Adaptability`), edited as tags and rendered
  as one bullet-separated line: plain text, ATS-safe in every template, in the
  preview, PDF and Word export. Titled "Soft Skills" / "Compétences
  transversales" / "المهارات الشخصية". Import recognises the heading in EN/FR/AR
  (including "Savoir-être"), keeps "Technical Skills" / "Compétences
  techniques" on the technical skills, and now splits skills on a mid-line `•`.
- **Existing documents can use it.** `ensureAllSections` adds any section type a
  saved or imported CV lacks, disabled and empty, right after its neighbour
  (Soft Skills lands after Skills). It runs when a document is opened, in memory
  only: nothing is rewritten until the user edits the document. Needed because
  the editor toggles sections but has no "add section" control.
- Professional template: Word export now draws the thin rule under the contact
  line and bolds language names, like the preview.

### Release tooling

- `pnpm check:versions` verifies that the version is identical in the root and
  desktop and website `package.json`, `tauri.conf.json`, `Cargo.toml` and
  `Cargo.lock`, and that `CHANGELOG.md` has a dated section for it. It runs in CI.
  `--expect <version>` also checks a release tag.
- GitHub Actions workflow `release.yml` builds the MSI, the NSIS installer and the
  portable ZIP on a Windows runner, with SHA-256 checksums.
- `docs/RELEASE-CHECKLIST.md`: manual test checklist for the three deliverables.
- `Cargo.toml` and `Cargo.lock` were still at `0.1.0`; they now follow the app version.

### Fixed

- **Design panel showed `editor.accent.none`** instead of the accent colour names
  (the panel looked in `editor.accent.*`; the labels are in `editor.accentColor.*`).
  A new test checks that every Design panel option has a label in EN, FR and AR.
- **Word repeated the job title** when the headline had the same text (the PDF
  already showed it once). It is now written once; a different headline is kept.


- **Multi-page PDFs had no margin on pages 2 and up.** The page margin was
  padding on one 297 mm block, so it only existed at the very start and end of
  the CV: the second page started ~0.6 mm from the top edge of the paper and
  page 1 could run to the bottom edge. The margin is now a real page margin
  (`@page`, from the margin preset) applied on every page. Measured with the
  desktop app's exact print settings in Chromium on 80 PDFs: top of pages 2+
  went from 0.6 mm (median) to 16.8 mm; page bottoms from 9.7 mm to 26.7 mm.
  The web build's print uses the same rule. Cover letters are unchanged.
- **Compact header overflowed the right margin.** The contact line was a single
  unbreakable run, so a full set of details ran to the paper edge (and, in
  Arabic, off the left edge, which dropped the job title from the extracted
  text). Each item stays whole but the line now wraps between items.
- **Word export ignored four design options.** Spacing density, heading style,
  separator style and contact alignment now apply to the Word file like they do
  to the preview and PDF (0% to 100% of tested combinations). Section headings
  in Word are now bold dark ink (or the accent colour) with the chosen rule,
  instead of Word's thin default blue with no rule.
- **Separator style did nothing in the Headline and Functional families.** Their
  heading rule was hard-coded; it now follows the setting.
- **Functional follows the document's own section order** in the PDF, like the
  Word export (it used to move Skills ahead of Experience in the PDF only). Its
  description no longer promises a skills-first reading order.
- **Word fonts:** Inter, Source Sans, Lora and Montserrat are web fonts that Word
  does not have, so Word swapped them unpredictably. The Word file now uses the
  font that ends each one's CSS stack (Arial, Calibri, Georgia). The file also
  carries the candidate as author, a real title and its language, instead of
  "Un-named" and no language. The PDF title is the CV name, not "ATS CV Studio".
- **Import: contact details.** Contact lines separated by `|` (the most common
  separator, and the one in the reference CVs) lost the phone and location.
  `|`, `·` and `•` are now split; LinkedIn, GitHub and website links are
  recognised and imported; a job title may be up to 80 characters (60 cut off a
  real French title) and only counts on a line of its own, so a city is no
  longer mistaken for a title.
- **Import: "Skills: Java" or "Languages: Java, SQL" were read as section
  headings**, losing the list that followed. A line with text after a colon is
  now a category line, never a heading ("Skills :" alone still is one).
- **Word export: dates no longer split across two lines.** With right-aligned
  dates, a title too long to share the line with its date made the date
  word-wrap in the middle ("Sep 2022 – Jul" / "2024"). The exporter now
  estimates the width and, when it will not fit, moves the whole date to its
  own right-aligned line inside the same paragraph (reading order unchanged).
- **Race condition on `workspace.json` (desktop).** `FileSystemStorage`
  read-modified-wrote the whole workspace index file on every save/delete
  without any synchronization; two overlapping writes (e.g. an explicit
  `saveNow()` flush racing a pending debounced autosave) could interleave
  and silently drop a document's metadata entry. Introduced `SerialQueue`
  (`@ats/core`, unit-tested) to serialize all workspace.json read-modify-write
  cycles per storage instance.

## [1.2.0] — 2026-09-03

### Added

- **Three new template layouts** — the gallery grows from 11 to 17 distinct
  entries across 10 families, all single-column and ATS-safe:
  - **Focus ATS**: split header — name and headline on the left, contact
    right-aligned in the same band.
  - **Functional ATS**: skills-first reading order (summary, skills and
    projects lead; experience follows, education last) — the canonical
    format for career changers.
  - **Banner ATS**: subtle full-width band behind the name and contact.
- **Accent colors**: new Design-panel control (Ink / Navy / Teal / Burgundy /
  Forest) tinting the name, headline, section headings and rules — on every
  layout, including DOCX export.
- **Resume headline field** with the earlier Headline layout (shipped in
  this cycle): optional, bold under the name, boosts ATS job-title matching.

### Fixed

- **Elastic overscroll removed** from every pane: WebView2's native scroll
  animation and elastic overscroll disabled at the browser-args layer
  (CSS alone could not reach it); scroll now stops dead at pane edges.

## [1.1.0] — 2026-09-03

### Added

- **Cover-letter design drawer**: the cover-letter editor gains the same Design
  experience as the CV editor — visual template picker (Classic / Modern /
  Minimal), font, page margins and spacing controls in a resizable drawer
  (shares side/width preferences with the CV drawer). Letters gain a
  `templateSettings` block; existing letters migrate automatically via zod
  defaults. The old inline template dropdown is removed.
- **Single-instance lock** (desktop): launching a second instance focuses the
  existing window instead of spawning a competing process.
- **Window-state persistence** (desktop): size, position and maximized state
  are remembered across sessions (`.window-state.json`); the old hardcoded
  `maximized: true` now applies on first run only.

## [1.0.0] — 2026-09-03

First stable release.

### Added

- **Near-fullscreen preview modal** (95vw × 92vh): replaces the cramped preview
  sidebar. Fit-width zoom measures against the full modal (~119% vs ~55%
  before); zoom toolbar (fit-width / fit-page / ±) intact. Same treatment for
  the cover-letter preview, which now uses real fit-width scaling instead of a
  hardcoded 62%.
- **Resizable design drawer**: the Design panel moved out of the sidebar into
  a draggable sheet — opens from left or right via a new Design button,
  resizes by dragging its inner edge (288–560px), width persists across
  sessions.
- **Configurable drawer side**: Settings → Editor → Design panel side
  (left/right), persisted instantly (zustand + localStorage).
- **Sticky sidebar**: with the Design panel relocated, the section list always
  fits the viewport — always visible while scrolling the form, no internal
  scrolling.
- New `Sheet` component family in `@ats/ui` (Radix Dialog-based, all four
  sides + `ResizableSheetContent` + `useResizableSheet`).

### Fixed

- Preview could not scroll when zoomed out: the scaled page kept its unscaled
  layout box and the modal's height chain did not clip. The layout box now
  matches the scaled dimensions and the scroll range is exact at every zoom.
- Arabic (RTL) documents rendered dragged to the right in the preview: the
  unscaled page overflowed its geometry box leftward under `direction: rtl`.
  The geometry wrapper is now direction-agnostic and centers via margins.
- Missing `preview.pageCount` translation key (en/fr/ar).

## [0.2.0] — 2026-09-03

### Added

- **Not-found page**: catch-all route renders a friendly 404 instead of a blank screen, with a back-to-dashboard button (en/fr/ar).
- **Global error boundary**: unexpected crashes now show a retry dialog instead of a white screen; mounted at the app root in both website and desktop.
- **Skill categories**: skills sections support category grouping with optional two-column layout, both in preview and DOCX export.
- **Bullet style choice**: disc or hyphen bullets in template settings; hyphens render as true list markers matching disc geometry.
- **New template fonts**: Cambria, Garamond, Candara, Aptos; subtle dashed separator option; true pt font sizes.
- **Desktop PDF export** via WebView2, dashboard click-to-open documents, and plain-hyphen separators.
- **CI workflow** (GitHub Actions): lint + typecheck + tests + web build on every push/PR.
- **Editor auto-naming**, date/locale fixes, and dashed separator support.

### Changed

- **Code splitting re-enabled**: fixed the chunk-level import cycle that previously forced a single 2 MB bundle. Routes now lazy-load as small chunks (1–107 KB); pdfjs/docx/react-dom load only when needed. Initial payload drops from ~2 MB to a fraction.
- **Shared app shell**: new `@ats/app-shell` package (Providers, router, layout) replaces duplicated scaffolding in website and desktop; 12 dead files removed.
- **Editor state via React context**: the `active-editor` singleton is replaced by `EditorProvider`/`useEditorContext` — safer, no global mutable state.
- **Autosave hardening**: pending edits flush on tab hide and window close (`visibilitychange`/`beforeunload`), closing the data-loss window.
- **Section titles translate** when switching document locale, including custom-titled sections (`resolveSectionTitle`).
- **Consistent kebab-case filenames** across all packages (22 renames, history preserved).
- **One-shot Prettier format** across the codebase; `pnpm format` / `format:check` scripts added.

### Fixed

- **Accessibility pass**: `aria-hidden` on ~50 decorative icons, visible focus styles (`focus-visible`) on menu items and dialogs, `type`/`name`/`autocomplete` on all contact and cover-letter inputs.
- **ErrorBoundary hooks-in-class bug** that would have crashed the crash handler itself.
- Preview fit-width centering at high zoom; native horizontal scroll.
- DOCX export dropping publication URLs; bullet marker geometry.
- Silent item-type shredding on document load; re-entry into previously shredded items.
- Debounced save race that could revert template apply and settings.
- Desktop fs permissions for app data directories.

### Security

- **Tauri CSP enabled** (was null): script-src self, blob workers for pdf.js, ipc connect-src. Default-deny otherwise.

## [0.1.0] — 2026-08

Initial release.

- Offline-first CV builder: Tauri desktop + web (IndexedDB)
- 20 ATS-safe templates across 5 families (Classic, Minimal, Modern, Executive, Technical)
- Core editor: section/item reordering, undo/redo, autosave
- Import from PDF, DOCX, JSON with review wizard
- Live preview, print view, DOCX export
- Cover letters and multiple CV versions (snapshots)
- RTL support (Arabic), en/fr/ar interface
- Packaging: MSI + NSIS installers, portable exe
