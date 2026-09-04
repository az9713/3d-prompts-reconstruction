import os
from pathlib import Path
from playwright.sync_api import sync_playwright


app_url = os.environ.get("APP_URL", "http://127.0.0.1:4184")
output_dir = Path("artifacts")
output_dir.mkdir(exist_ok=True)
console_errors: list[str] = []
console_warnings: list[str] = []
page_errors: list[str] = []


def settle(page, milliseconds: int = 1300) -> None:
    page.wait_for_timeout(milliseconds)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else console_warnings.append(message.text) if message.type == "warning" else None)
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    response = page.goto(app_url, wait_until="networkidle", timeout=30000)
    assert response and response.status == 200
    assert page.title() == "Cappadocia · First Ascent"
    page.locator("#status").wait_for(state="hidden", timeout=30000)
    settle(page, 1800)

    canvas_box = page.locator("canvas#world").bounding_box()
    assert canvas_box and canvas_box["width"] == 1440 and canvas_box["height"] == 900
    assert page.locator("#viewSelect option").count() == 5
    assert page.locator("#renderSelect option").count() == 4
    assert page.locator("#balloonReadout").inner_text() == "42"
    assert page.evaluate("document.querySelector('#world').getContext('webgl2') !== null || document.querySelector('#world').getContext('webgl') !== null")
    page.screenshot(path=str(output_dir / "hero.png"), full_page=True)
    print("captured hero", flush=True)
    page.locator("#pauseButton").click()
    page.locator("#qualitySelect").select_option("quiet")

    page.locator("#viewSelect").select_option("close")
    settle(page)
    page.screenshot(path=str(output_dir / "close-up.png"), full_page=True)
    print("captured close", flush=True)

    page.locator("#renderSelect").select_option("clay")
    settle(page, 500)
    assert not page.locator("#debugLegend").is_hidden()
    page.screenshot(path=str(output_dir / "clay.png"), full_page=True)
    print("captured clay", flush=True)

    page.locator("#renderSelect").select_option("material")
    settle(page, 500)
    assert page.locator("#modeReadout").inner_text() == "Normal"
    page.screenshot(path=str(output_dir / "material-debug.png"), full_page=True)
    print("captured material", flush=True)

    page.locator("#renderSelect").select_option("shadow")
    settle(page, 500)
    page.screenshot(path=str(output_dir / "shadow.png"), full_page=True)
    print("captured shadow", flush=True)

    page.locator("#renderSelect").select_option("pbr")
    page.locator("#viewSelect").select_option("ground")
    settle(page, 400)
    page.locator("#viewSelect").select_option("settlement")
    settle(page, 400)
    page.locator("#qualitySelect").select_option("field")
    page.locator("#viewSelect").select_option("wide")
    settle(page)
    page.screenshot(path=str(output_dir / "wide.png"), full_page=True)
    print("captured wide", flush=True)

    page.locator("#qualitySelect").select_option("quiet")
    assert page.locator("#balloonReadout").inner_text() == "24"
    page.locator("#pauseButton").click()
    page.locator("#pauseButton").click()
    assert page.locator("#pauseButton").get_attribute("aria-pressed") == "true"
    page.locator("#methodButton").click()
    assert page.locator("#methodPanel").is_visible()
    page.locator("#closeMethod").click()
    assert page.locator("#methodPanel").is_hidden()

    page.locator("#resetButton").click()
    settle(page)
    assert page.locator("#viewSelect").input_value() == "hero"
    assert page.locator("#renderSelect").input_value() == "pbr"
    assert page.locator("#qualitySelect").input_value() == "field"
    assert page.locator("#balloonReadout").inner_text() == "42"

    page.set_viewport_size({"width": 390, "height": 844})
    settle(page, 700)
    assert page.locator("#resetButton").is_visible()
    assert page.locator("#viewSelect").is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    page.screenshot(path=str(output_dir / "narrow.png"), full_page=True)
    print("captured narrow", flush=True)
    browser.close()

if console_errors or page_errors:
    raise AssertionError(f"console_errors={console_errors}; page_errors={page_errors}")

print(f"PASS url={app_url} hero/close/clay/material/shadow/wide/narrow captured; warnings={console_warnings}")
