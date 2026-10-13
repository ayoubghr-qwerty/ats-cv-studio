"""Phase 6 E2E: export a CV as JSON, then re-import it via the wizard.

A fresh browser context has empty storage, so the test first seeds a CV by
importing the DOCX fixture, then round-trips it through JSON export/import.

Prereqs:
  - dev server running (default http://localhost:5174, override with BASE env)
  - `python -m playwright install chromium`

Run:  python e2e/import_json.py
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
        json_path = os.path.join(tmp, "jane-doe.json")
        async with async_playwright() as pw:
            browser = await pw.chromium.launch()
            page = await browser.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

            # seed a CV
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
            results.append("PASS: seeded CV")

            # export via dashboard menu
            await page.goto(f"{BASE}/", wait_until="networkidle")
            await page.wait_for_timeout(1200)
            card = page.locator("div.group").first
            await card.locator("button").first.click()
            await page.wait_for_selector("[role=menuitem]:has-text('Export JSON')", timeout=5000)
            async with page.expect_download(timeout=10000) as dl:
                await page.click("text=Export JSON")
            download = await dl.value
            await download.save_as(json_path)
            results.append("PASS: exported CV as JSON")

            # re-import the JSON -> lands directly in editor
            await page.click("button:has-text('Import')")
            await page.wait_for_selector("text=Import CV", timeout=10000)
            await page.click("button:has-text('Import JSON')")
            fi = page.locator('input[type="file"]')
            await fi.wait_for(state="attached", timeout=5000)
            await fi.set_input_files(json_path)
            await page.wait_for_url("**/editor/**", timeout=15000)
            await page.wait_for_selector("button:has-text('Preview')", timeout=10000)
            results.append("PASS: JSON import landed in editor")

            # dashboard has both documents (id-collision was re-idded)
            await page.goto(f"{BASE}/", wait_until="networkidle")
            await page.wait_for_timeout(1200)
            cards = await page.locator("div.group").count()
            results.append(f"PASS: dashboard has {cards} documents" if cards >= 2 else f"FAIL: expected >=2 docs, got {cards}")

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
