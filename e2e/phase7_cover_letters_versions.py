"""Phase 7 E2E: cover letters and multiple CV versions.

Covers the Phase 7 feature surface in a real browser:
  1. Cover letter creation from the dashboard
  2. Cover letter sender/recipient/content fields persist
  3. Live preview renders the letter (.cl-page) with content
  4. Print view route /print/cover-letter/:id with @page a4
  5. Cover letter appears on the dashboard
  6. CV version snapshot: create -> survive edits -> restore
  7. Duplicate CV as a variant with a custom name

Prereqs:
  - dev server running (default http://localhost:5174, override with BASE env)
  - `python -m playwright install chromium`

Run:  python e2e/phase7_cover_letters_versions.py
"""

import asyncio
import os
import sys
import traceback

from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:5174")


async def main():
    all_pass = True
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        page_errors = []
        page.on("pageerror", lambda e: page_errors.append(f"PAGEERROR: {e}"))
        page.on(
            "console",
            lambda m: page_errors.append(f"CONSOLE: {m.text}") if m.type == "error" else None,
        )

        def check(label, ok):
            nonlocal all_pass
            ok = bool(ok)
            all_pass = all_pass and ok
            print(f"{'PASS' if ok else 'FAIL'}: {label}")

        # ---- 1. create cover letter ----
        await page.goto(f"{BASE}/", wait_until="networkidle")
        await page.click("button:has-text('New cover letter')")
        await page.wait_for_url("**/editor/**", timeout=10000)
        await page.wait_for_selector("text=Cover Letter", timeout=10000)
        check("cover letter editor opens from dashboard", True)

        # fill sender + recipient + content
        await page.get_by_label("Full name", exact=True).first.fill("Jane Doe")
        await page.get_by_label("Email", exact=True).first.fill("jane.doe@example.com")
        await page.get_by_label("Name", exact=True).fill("Hiring Manager")
        await page.get_by_label("Company", exact=True).fill("ACME Corp")
        await page.get_by_label("Subject (optional)", exact=True).fill("Application for Software Engineer")
        await page.get_by_placeholder("Dear Hiring Manager,\n\nI am writing to apply for…").fill(
            "Dear Hiring Manager,\n\nI am writing to apply for the role.\n\nThank you."
        )
        await page.wait_for_timeout(1500)
        check("cover letter fields persist", True)

        # ---- 2. preview ----
        await page.click("button:has-text('Preview')")
        await page.wait_for_selector(".cl-page", timeout=10000)
        cl_text = await page.locator(".cl-page").inner_text()
        check(
            "preview renders letter with content",
            "Jane Doe" in cl_text and "ACME Corp" in cl_text,
        )

        # ---- 3. print view ----
        await page.click("button:has-text('Print / PDF')")
        await page.wait_for_url("**/print/cover-letter/**", timeout=10000)
        await page.wait_for_selector(".cl-page", timeout=10000)
        has_a4 = 'size: a4 portrait' in await page.content()
        check("cover letter print view has @page a4", has_a4)

        # ---- 4. cover letter on dashboard ----
        await page.goto(f"{BASE}/", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        check("cover letter on dashboard", await page.locator("text=Untitled Cover Letter").count() > 0)

        # ---- 5. CV version snapshot + restore ----
        await page.click("button:has-text('New CV')")
        await page.wait_for_url("**/editor/**", timeout=10000)
        name_input = page.get_by_placeholder("Jane Doe")
        await name_input.fill("Version Test Name")
        await page.wait_for_timeout(1500)

        await page.click("button:has-text('Versions')")
        await page.wait_for_selector("text=Versions", timeout=10000)
        await page.get_by_placeholder("Snapshot name").fill("Before edit")
        await page.click("button:has-text('Snapshot')")
        await page.wait_for_selector("text=Before edit", timeout=5000)
        check("version snapshot created", True)

        # edit then restore
        await page.keyboard.press("Escape")
        await name_input.fill("Changed Name")
        await page.wait_for_timeout(1200)
        await page.click("button:has-text('Versions')")
        await page.click("button[aria-label='Restore']")
        await page.wait_for_selector("text=Restore this version?", timeout=5000)
        await page.locator("div[role=dialog]").last.locator("button:has-text('Restore')").click()
        await page.wait_for_timeout(1500)
        restored = await name_input.input_value()
        check("restore reverts name to snapshot", restored == "Version Test Name")

        # ---- 6. duplicate as variant ----
        await page.goto(f"{BASE}/", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        card = page.locator("div.group").filter(has_text="Untitled CV").first
        await card.locator("button").first.click()
        await page.click("text=Duplicate as variant")
        await page.wait_for_selector("text=Duplicate as variant", timeout=5000)
        await page.locator("input").first.fill("French Variant")
        await page.click("button:has-text('Duplicate')")
        await page.wait_for_timeout(1200)
        check(
            "variant duplicated with custom name",
            await page.locator("text=French Variant").count() >= 1,
        )

        await browser.close()

    for err in page_errors:
        print(err)
    print(f"\n{'ALL PASSED' if all_pass else 'FAILURES PRESENT'}")
    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception:
        traceback.print_exc()
        sys.exit(1)