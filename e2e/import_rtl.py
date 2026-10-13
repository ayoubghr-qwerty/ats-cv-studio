"""Phase 6 E2E: import wizard in Arabic (RTL) — audit gap (c).

Switches the app to Arabic, imports the DOCX fixture, and verifies the review
screen renders with RTL direction and localized labels end to end.

Prereqs:
  - dev server running (default http://localhost:5174, override with BASE env)
  - `python -m playwright install chromium`
  - set PYTHONIOENCODING=utf-8 if the console cannot print Arabic

Run:  python e2e/import_rtl.py
"""

import asyncio
import os
import sys
import traceback
from pathlib import Path

from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:5174")
DOCX = Path(__file__).parent / "fixtures" / "jane-doe.docx"


async def main():
    results = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        # switch to Arabic
        await page.goto(f"{BASE}/", wait_until="networkidle")
        await page.click('button[aria-label="Language"]')
        await page.click("text=العربية")
        await page.wait_for_function("document.documentElement.lang === 'ar'", timeout=10000)
        results.append("PASS: document dir flipped to rtl" if await page.evaluate("document.documentElement.dir") == "rtl" else "FAIL: dir not rtl")

        import_btn = await page.locator("button:has-text('استيراد')").count()
        results.append("PASS: Arabic dashboard import button" if import_btn >= 1 else "FAIL: no Arabic import button")

        # open wizard in Arabic
        await page.click("button:has-text('استيراد')")
        await page.wait_for_selector("text=استيراد سيرة ذاتية", timeout=10000)
        docx_btn = await page.locator("button:has-text('استيراد DOCX')").count()
        results.append("PASS: Arabic DOCX button" if docx_btn >= 1 else "FAIL: no Arabic DOCX button")

        # import DOCX -> Arabic review
        await page.click("button:has-text('استيراد DOCX')")
        fi = page.locator('input[type="file"]')
        await fi.wait_for(state="attached", timeout=5000)
        await fi.set_input_files(str(DOCX))
        await page.wait_for_selector("text=الخبرة العملية", timeout=30000)
        results.append("PASS: review renders in Arabic (Work Experience heading)")

        name_value = await page.locator("input").first.input_value()
        results.append("PASS: name field populated" if "Jane" in name_value else "FAIL: name field empty")

        wizard_dir = await page.evaluate("document.documentElement.dir")
        results.append("PASS: rtl active during review" if wizard_dir == "rtl" else "FAIL: rtl lost during review")

        # confirm -> editor in Arabic
        await page.click("button:has-text('استيراد السيرة')")
        await page.wait_for_url("**/editor/**", timeout=15000)
        await page.wait_for_selector("button:has-text('معاينة')", timeout=10000)
        results.append("PASS: confirm opened the editor (Arabic UI)")

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
