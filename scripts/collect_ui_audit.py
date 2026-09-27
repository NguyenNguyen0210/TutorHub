import os, sys, json
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = r"C:\Users\Nguyen Nguyen\AppData\Local\Temp\antigravity\ui_audit"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

URL = "http://localhost:5173"
API_URL = "http://localhost:5129/api/v1"

audit_data = {}

def audit_page(page, name, url_path):
    print(f"\nAuditing: {name} ({url_path})")
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(f"{URL}{url_path}")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    
    # Desktop screenshot
    desktop_shot = os.path.join(SCREENSHOT_DIR, f"{name}_desktop.png")
    page.screenshot(path=desktop_shot, full_page=True)
    
    # Check horizontal overflow desktop
    overflow_desktop = page.evaluate("""() => [...document.querySelectorAll('*')]
        .filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 5).map(e => e.tagName + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ').slice(0, 3).join('.') : ''))""")
    
    # Distinct values
    metrics = {}
    for prop in ["font-size", "font-family", "border-radius", "box-shadow", "color"]:
        vals = page.evaluate("""(p) => [...new Set([...document.querySelectorAll('*')]
            .map(e => getComputedStyle(e)[p]))].filter(v => v && v!=='none' && v!=='0px')""", prop)
        metrics[prop] = {"count": len(vals), "sample": vals[:8]}
        
    # Mobile pass
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(500)
    mobile_shot = os.path.join(SCREENSHOT_DIR, f"{name}_mobile.png")
    page.screenshot(path=mobile_shot, full_page=True)
    
    overflow_mobile = page.evaluate("""() => [...document.querySelectorAll('*')]
        .filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 5).map(e => e.tagName + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ').slice(0, 3).join('.') : ''))""")
    
    audit_data[name] = {
        "overflow_desktop": overflow_desktop,
        "overflow_mobile": overflow_mobile,
        "metrics": metrics
    }
    print(f"  Desktop overflow: {len(overflow_desktop)}")
    print(f"  Mobile overflow: {len(overflow_mobile)}")
    print(f"  Font-sizes: {metrics['font-size']['count']} distinct")
    print(f"  Border-radii: {metrics['border-radius']['count']} distinct")
    print(f"  Colors: {metrics['color']['count']} distinct")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # 1. Homepage (public)
    page = browser.new_page()
    audit_page(page, "01_homepage", "/")
    
    # 2. Login page
    audit_page(page, "02_login", "/login")
    
    # 3. Student flow
    page.locator('input[placeholder*="email" i]').fill("student.tuan@tutorhub.com")
    page.locator('input[type="password"]').fill("Test@123")
    with page.expect_response("**/api/v1/auth/login"):
        page.locator('button[type="submit"]').click()
    page.wait_for_timeout(2000)
    audit_page(page, "03_student_dashboard", "/student/dashboard")
    audit_page(page, "04_student_sessions", "/student/sessions")
    
    # Look for session detail
    session_link = page.locator('a[href*="/sessions/"]').first
    if session_link.count() > 0:
        href = session_link.get_attribute("href")
        audit_page(page, "05_session_detail", href)
    
    page.close()
    
    # 4. Tutor flow
    page_tutor = browser.new_page()
    page_tutor.goto(f"{URL}/login")
    page_tutor.wait_for_load_state("networkidle")
    page_tutor.locator('input[placeholder*="email" i]').fill("tutor.an@tutorhub.com")
    page_tutor.locator('input[type="password"]').fill("Test@123")
    with page_tutor.expect_response("**/api/v1/auth/login"):
        page_tutor.locator('button[type="submit"]').click()
    page_tutor.wait_for_timeout(2000)
    audit_page(page_tutor, "06_tutor_dashboard", "/tutor/dashboard")
    page_tutor.close()
    
    # 5. Admin flow
    page_admin = browser.new_page()
    page_admin.goto(f"{URL}/login")
    page_admin.wait_for_load_state("networkidle")
    page_admin.locator('input[placeholder*="email" i]').fill("admin@tutorhub.com")
    page_admin.locator('input[type="password"]').fill("Test@123")
    with page_admin.expect_response("**/api/v1/auth/login"):
        page_admin.locator('button[type="submit"]').click()
    page_admin.wait_for_timeout(2000)
    audit_page(page_admin, "07_admin_dashboard", "/admin/dashboard")
    audit_page(page_admin, "08_admin_users", "/admin/users")
    audit_page(page_admin, "09_admin_disputes", "/admin/disputes")
    page_admin.close()
    
    browser.close()

with open(os.path.join(SCREENSHOT_DIR, "audit_summary.json"), "w", encoding="utf-8") as f:
    json.dump(audit_data, f, indent=2, ensure_ascii=False)
print("\nAudit evidence collection completed!")
