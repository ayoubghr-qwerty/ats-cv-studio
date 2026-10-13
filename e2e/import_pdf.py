"""Phase 6 E2E: round-trip through the print view into a PDF, then import the PDF.

The PDF is generated on the fly via the browser print view (page.pdf), so no
fixture is needed. PDF extraction is best-effort, so only contact + entry text
presence is asserted (not bullet markers).

Prereqs:
  - dev server running (default http://localhost:5174, override with BASE env)
  - `python -m playwright install chromium`

Run:  python e2e/import_pdf.py
"""

import asyncio
import os
import sys
import tempfile
import traceback
from pathlib import Path

from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:5174")
DOCX = Path(__file__).parent / "fixtures" / "jane-doe.docx"


async def main():
    results = []
    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = os.path.join(tmp, "jane-doe.pdf")
        async with async_playwright() as pw:
            browser = await pw.chromium.launch()
            page = await browser.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(f"PAGEERROR: {e}"))
            page.on("console", lambda m: errors.append(f"CONSOLE: {m.text}") if m.type == "error" else None)

            # seed a populated CV via DOCX import
            await page.goto(f"{BASE}/", wait_until="networkidle")
            await page.click("button:has-text('Import')")
            await page.wait_for_selector("text=Import CV", timeout=10000)
            await page.click("button:has-text('Import DOCX')")
            fi = page.locator('input[type="file"]')
            await fi.wait_for(state="attached", timeout=5000)
            await fi.set_input_files(str(DOCX))
            await page.wait_for_selector("text=Work Experience", timeout=30000)
            await page.click("button:has-text('Import CV')")
            await page.wait_for_url("**/editor/**", timeout=15000)
            doc_id = page.url.rstrip("/").split("/")[-1]
            results.append("PASS: seeded a CV via DOCX import")

            # print view -> PDF
            await page.goto(f"{BASE}/print/cv/{doc_id}", wait_until="networkidle")
            await page.wait_for_selector(".cv-page", timeout=15000)
            await page.pdf(path=pdf_path, format="A4")
            results.append("PASS: generated PDF from print view")

            # import the PDF
            await page.goto(f"{BASE}/", wait_until="networkidle")
            await page.click("button:has-text('Import')")
            await page.click("button:has-text('Import PDF')")
            fi = page.locator('input[type="file"]')
            await fi.wait_for(state="attached", timeout=5000)
            await fi.set_input_files(pdf_path)
            await page.wait_for_selector("text=Work Experience", timeout=30000)
            results.append("PASS: PDF parsed to review screen")

            values = await page.locator("input").evaluate_all("els => els.map(e => e.value)")
            joined = " | ".join(values)
            textareas = await page.locator("textarea").evaluate_all("els => els.map(e => e.value)")
            joined += " | " + " | ".join(textareas)
            results.append("PASS: full name detected" if "Jane Doe" in joined else "FAIL: full name missing")
            results.append("PASS: email detected" if "jane.doe@example.com" in joined else "FAIL: email missing")
            results.append("PASS: experience entry detected" if "Senior Developer" in joined else "FAIL: no experience entry")
            results.append("PASS: detail text detected" if "Led a team" in joined else "FAIL: no detail text")

            await page.click("button:has-text('Import CV')")
            await page.wait_for_url("**/editor/**", timeout=15000)
            await page.wait_for_selector("button:has-text('Preview')", timeout=10000)
            results.append("PASS: PDF import created a CV in the editor")

            await browser.close()

    for r in results:
        print(r, flush=True)
    if errors:
        print("page errors:", " | ".join(errors[:10]))
    failed = [r for r in results if r.startswith("FAIL")] or errors
    return 1 if failed else 0


try:
    sys.exit(asyncio.run(main()))
except Exception:
    traceback.print_exc()
    sys.exit(1)
