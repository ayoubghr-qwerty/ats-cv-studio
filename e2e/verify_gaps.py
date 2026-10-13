"""Regression E2E: Phase 5 audit gap fixes (undo/redo shell buttons, A4/Letter page size).

Covers:
  - shell undo/redo buttons render and start disabled
  - undo reverts an edit, redo restores it
  - preview pane renders the page at A4 width (794px)
  - print view injects an @page size rule (a4)

Prereqs:
  - dev server running (default http://localhost:5174, override with BASE env)
  - `python -m playwright install chromium`

Run:  python e2e/verify_gaps.py
"""

import asyncio
import os
import re
import sys
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:5174")
results = []


async def check(name, fn):
    try:
        await fn()
        results.append(f"PASS: {name}")
    except Exception as e:
        results.append(f"FAIL: {name} -> {type(e).__name__}: {str(e)[:200]}")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        # fresh IndexedDB: creating a CV navigates straight into the editor
        await page.goto(BASE, wait_until="networkidle")
        await page.get_by_role("button", name=re.compile("^new cv$", re.IGNORECASE)).first.click()
        await page.wait_for_timeout(1200)
        assert "/editor/" in page.url, f"expected editor, got {page.url}"

        # --- 1. shell undo/redo buttons exist and start disabled ---
        async def undo_buttons():
            undo = page.get_by_role("button", name=re.compile("^undo$", re.IGNORECASE))
            redo = page.get_by_role("button", name=re.compile("^redo$", re.IGNORECASE))
            await undo.first.wait_for(timeout=8000)
            await redo.first.wait_for(timeout=8000)
            assert await undo.first.is_disabled(), "undo should be disabled initially"
            assert await redo.first.is_disabled(), "redo should be disabled initially"

        await check("shell undo/redo buttons render, disabled initially", undo_buttons)

        # --- 2. type text then undo via button ---
        async def undo_via_button():
            undo = page.get_by_role("button", name=re.compile("^undo$", re.IGNORECASE))
            await page.get_by_placeholder("Jane Doe").fill("UndoTestName")
            await page.wait_for_timeout(400)
            assert not await undo.first.is_disabled(), "undo should enable after edit"
            await undo.first.click()
            await page.wait_for_timeout(400)
            value = await page.get_by_placeholder("Jane Doe").input_value()
            assert value == "", f"undo did not revert text, got: {value!r}"

        await check("undo button reverts an edit", undo_via_button)

        # --- 3. redo via button ---
        async def redo_via_button():
            redo = page.get_by_role("button", name=re.compile("^redo$", re.IGNORECASE))
            await redo.first.click()
            await page.wait_for_timeout(400)
            value = await page.get_by_placeholder("Jane Doe").input_value()
            assert value == "UndoTestName", f"redo did not restore text, got: {value!r}"

        await check("redo button restores edit", redo_via_button)

        # --- 4. preview pane renders A4 width (794px, offsetWidth ignores scale) ---
        async def preview_a4_width():
            btn = page.get_by_role("button", name=re.compile("^preview$", re.IGNORECASE)).first
            await btn.wait_for(timeout=8000)
            await btn.click()
            await page.wait_for_timeout(700)
            width = await page.evaluate(
                """() => {
                    const el = document.querySelector('.cv-page');
                    return el ? el.offsetWidth : null;
                }"""
            )
            assert width is not None and abs(width - 794) < 6, f"A4 preview width wrong: {width}"

        await check("preview pane renders A4 width (794px)", preview_a4_width)

        # --- 5. print view injects @page size ---
        async def print_style_tag():
            doc_id = await page.evaluate(
                """async () => {
                    const db = await new Promise((res, rej) => { const r = indexedDB.open('ats-cv-studio'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
                    const keys = await new Promise((res, rej) => { const k = db.transaction('documents').objectStore('documents').getAllKeys(); k.onsuccess = () => res(k.result); k.onerror = () => rej(k.error); });
                    return keys[0];
                }"""
            )
            assert doc_id, "no document in IndexedDB"
            await page.goto(f"{BASE}/print/cv/{doc_id}", wait_until="networkidle")
            await page.wait_for_timeout(600)
            styles = await page.evaluate("() => Array.from(document.querySelectorAll('style')).map(s => s.textContent)")
            page_style = next((s for s in styles if "@page" in s), "")
            assert page_style, "print view missing @page style"
            assert "a4" in page_style.lower(), f"@page size not a4: {page_style[:100]}"
            width = await page.evaluate(
                "() => { const el = document.querySelector('.cv-page'); return el ? el.offsetWidth : null; }"
            )
            assert width is not None and abs(width - 794) < 6, f"print page width wrong: {width}"

        await check("print view injects @page size (A4, 794px)", print_style_tag)

        await browser.close()
        for r in results:
            print(r, flush=True)
        if errors:
            print("CONSOLE ERRORS:")
            for e in errors[:5]:
                print(" ", e)
        failed = [r for r in results if r.startswith("FAIL")]
        print(f"\n{len(results) - len(failed)}/{len(results)} passed")
        return 1 if failed else 0


try:
    sys.exit(asyncio.run(main()))
except Exception:
    import traceback

    traceback.print_exc()
    sys.exit(1)
