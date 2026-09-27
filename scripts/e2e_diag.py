import os, sys
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = r"C:\Users\Nguyen Nguyen\AppData\Local\Temp\antigravity"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Test API login
    r = page.request.post(
        "http://localhost:5129/api/v1/auth/login",
        data={"email": "student.tuan@tutorhub.com", "password": "Test@123"},
    )
    print(f"Login status: {r.status}")
    print(f"Login body: {r.text()[:500]}")

    # Try other credentials
    r2 = page.request.post(
        "http://localhost:5129/api/v1/auth/login",
        data={"email": "admin@tutorhub.com", "password": "Test@123"},
    )
    print(f"\nAdmin login status: {r2.status}")
    print(f"Admin login body: {r2.text()[:500]}")

    # Check login page
    page.goto("http://localhost:5173/login")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "diag_login_page.png"))

    inputs = page.locator("input").all()
    print(f"\nInputs on login page: {len(inputs)}")
    for i, inp in enumerate(inputs):
        t = inp.get_attribute("type")
        n = inp.get_attribute("name")
        pl = inp.get_attribute("placeholder")
        print(f"  input[{i}]: type={t} name={n} placeholder={pl}")

    buttons = page.locator("button").all()
    for i, btn in enumerate(buttons):
        t = btn.get_attribute("type")
        txt = btn.text_content()[:50] if btn.text_content() else ""
        print(f"  button[{i}]: type={t} text={txt}")

    browser.close()
    print("\nDone.")
