"""Phase 6 E2E: import a DOCX through the wizard and verify the review + editor flow.

Prereqs:
  - dev server running (default http://localhost:5174, override with BASE env)
  - `python -m playwright install chromium`

Run:  python e2e/import_docx.py
"""

import asyncio
import os
import sys
import traceback
from pathlib import Path

from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:5174")
FIXTURE = Path(__file__).parent / "fixtures" / "jane-doe.docx"


async def main():
    results = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        await page.goto(f"{BASE}/", wait_until="networkidle")
        await page.click("button:has-text('Import')")
        await page.wait_for_selector("text=Import CV", timeout=10000)
        results.append("PASS: wizard opens from dashboard")

        await page.click("button:has-text('Import DOCX')")
        file_input = page.locator('input[type="file"]')
        await file_input.wait_for(state="attached", timeout=5000)
        await file_input.set_input_files(str(FIXTURE))
        await page.wait_for_selector("text=Work Experience", timeout=30000)
        results.append("PASS: DOCX parsed to review screen")

        values = await page.locator("input").evaluate_all("els => els.map(e => e.value)")
        joined = " | ".join(values)
        checks = [
            ("PASS: full name detected" if "Jane Doe" in joined else "FAIL: full name missing"),
            ("PASS: email detected" if "jane.doe@example.com" in joined else "FAIL: email missing"),
            ("PASS: phone detected" if "+1 555 123 4567" in joined else "FAIL: phone missing"),
            ("PASS: experience entry detected" if "Senior Developer" in joined else "FAIL: no experience entry"),
            ("PASS: dates detected" if "Jan 2020" in joined else "FAIL: no dates"),
        ]
        results.extend(checks)

        await page.click("button:has-text('Import CV')")
        await page.wait_for_selector("text=Jane Doe", timeout=15000)
        await page.wait_for_timeout(1500)
        await page.click("button:has-text('Preview')")
        await page.wait_for_selector(".cv-page", timeout=10000)
        results.append("PASS: navigated to editor after import")

        await page.goto(f"{BASE}/", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        cards = await page.locator("text=Jane Doe").count()
        results.append(f"PASS: imported CV on dashboard ({cards})" if cards >= 1 else "FAIL: imported CV missing from dashboard")

        await browser.close()

    for r in results:
        print(r, flush=True)
    if errors:
        print("page errors:", " | ".join(errors))
    failed = [r for r in results if r.startswith("FAIL")] or errors
    return 1 if failed else 0


try:
    sys.exit(asyncio.run(main()))
except Exception:
    traceback.print_exc()
    sys.exit(1)
