# E2E suites (Playwright)

Browser-driven end-to-end suites for the Phase 6 import feature, the
Phase 5 audit gap fixes, and the Phase 7 cover letters + versions feature.
These complement the unit suites (vitest) with real-browser flows against
the running web app.

## Prereqs

```bash
python -m pip install playwright
python -m playwright install chromium
```

Start the web dev server:

```bash
pnpm --filter website dev
```

## Running

The scripts default to `http://localhost:5174`; override with the `BASE` env
var. Each suite exits non-zero on failure.

```bash
# Phase 6 import flows
python e2e/import_docx.py      # DOCX -> wizard -> review -> editor -> dashboard
python e2e/import_pdf.py       # print view -> PDF -> import (best-effort checks)
python e2e/import_json.py      # export JSON -> re-import (id-collision re-id)
python e2e/import_rtl.py       # Arabic RTL wizard run-through (audit gap c)

# Phase 7 cover letters + versions
python e2e/phase7_cover_letters_versions.py   # cover letter CRUD, version snapshot/restore, variant

# Phase 5 audit gap regressions
python e2e/verify_gaps.py      # undo/redo shell buttons + A4 page size
```

Notes:

- Playwright launches a fresh browser profile, so IndexedDB is empty on every
  run. The import suites seed their own CV via the DOCX fixture; `verify_gaps`
  creates one via "New CV".
- `import_pdf.py` generates its PDF on the fly through the print view, so PDF
  extraction variance is tolerated (contact + entry text presence only).
- Set `PYTHONIOENCODING=utf-8` on Windows consoles if printing Arabic output
  from `import_rtl.py` fails.
- `fixtures/jane-doe.docx` is produced by this app's own DOCX exporter
  (see `packages/exporters`), keeping the parser round-trip self-contained.
