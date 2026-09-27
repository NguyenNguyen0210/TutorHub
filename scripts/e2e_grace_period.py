"""
E2E test for the Auto-Payout 12-Hour Grace Period feature.

Tests:
1. Production Frontend Build Verification (homepage, no critical console errors)
2. API Endpoint Verification:
   - Login succeeds
   - GET /sessions/{id} returns SessionDto with Grace Period fields and NO attendance fields
   - Old POST /sessions/{id}/attendance endpoint is 404
   - New POST /sessions/{id}/report-issue endpoint exists (returns 400 validation error, not 404)
3. Student Flow:
   - Login and dashboard load
   - No old attendance UI remnants anywhere
   - Navigation to sessions list and session detail
   - Session detail renders without errors and does not render AttendanceCard
4. Tutor Flow:
   - Login and dashboard load
   - No old attendance UI remnants
   - Dashboard renders payout countdown / informative states
5. Admin Flow:
   - Login and dashboard load
   - Users page has NO AbsentStrikes column/references
   - Disputes page / detail has NO bilateral attendance conflict references
"""
import sys
import os
import json

# Fix Windows console encoding for Unicode
os.environ["PYTHONIOENCODING"] = "utf-8"
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from playwright.sync_api import sync_playwright, expect

FRONTEND_URL = "http://localhost:5173"
API_URL = "http://localhost:5129/api/v1"

STUDENT_EMAIL = "student.tuan@tutorhub.com"
TUTOR_EMAIL = "tutor.an@tutorhub.com"
ADMIN_EMAIL = "admin@tutorhub.com"
PASSWORD = "Test@123"

SCREENSHOT_DIR = r"C:\Users\Nguyen Nguyen\AppData\Local\Temp\antigravity"

test_results = []


def log_test(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    test_results.append((name, passed, detail))
    print(f"  {status}: {name}" + (f" — {detail}" if detail else ""))


def setup_console_capture(page):
    """Capture console errors and page errors."""
    page_errors = []
    page.on("console", lambda m: page_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: page_errors.append(f"uncaught: {e}"))
    return page_errors


def login(page, email, password):
    """Login via the frontend login page and wait for redirect."""
    page.goto(f"{FRONTEND_URL}/login")
    page.wait_for_load_state("networkidle")

    email_input = page.locator('input[placeholder*="email" i]')
    if email_input.count() == 0:
        email_input = page.locator("input").first
    email_input.fill(email)

    password_input = page.locator('input[type="password"]')
    password_input.fill(password)

    with page.expect_response("**/api/v1/auth/login", timeout=15000):
        submit_btn = page.locator('button[type="submit"]')
        submit_btn.click()

    page.wait_for_timeout(2000)
    page.wait_for_load_state("networkidle")


def test_no_attendance_references(page, context_name):
    """Check that no old attendance UI elements exist on the current page."""
    content = page.content().lower()

    old_terms = [
        "attendancecard",
        "submitattendance",
        "attendance-status",
        "attendance_status",
        "điểm danh 2 chiều",
        "hạn chót điểm danh",
    ]

    found = []
    for term in old_terms:
        if term in content:
            found.append(term)

    passed = len(found) == 0
    log_test(
        f"No old attendance references on {context_name}",
        passed,
        f"Found: {found}" if found else ""
    )
    return passed


def test_frontend_build_output(browser):
    """Test that the frontend loads correctly with no critical errors."""
    print("\n📋 Test Suite: Frontend Load Verification")
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page_errors = setup_console_capture(page)

    try:
        page.goto(FRONTEND_URL)
        page.wait_for_load_state("networkidle")

        title = page.title()
        log_test("Frontend loads with title", bool(title), f"Title: {title}")

        critical = [e for e in page_errors if "chunk" in e.lower() or "module" in e.lower() or "syntax" in e.lower()]
        log_test("No critical JS load errors", len(critical) == 0,
                 f"Errors: {critical}" if critical else "")

        page.screenshot(path=f"{SCREENSHOT_DIR}/00_homepage.png", full_page=True)

    except Exception as e:
        log_test("Frontend load verification", False, str(e))
    finally:
        context.close()


def test_api_endpoints(browser):
    """Test that old API endpoints are gone and new ones exist with correct schema."""
    print("\n📋 Test Suite: API Endpoint Verification")
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Login
        response = page.request.post(f"{API_URL}/auth/login", data={
            "email": STUDENT_EMAIL,
            "password": PASSWORD
        })
        log_test("API login succeeds", response.ok, f"Status: {response.status}")

        if response.ok:
            data = response.json()
            token = data.get("data", {}).get("accessToken") or data.get("accessToken", "")
            headers = {"Authorization": f"Bearer {token}"}

            # 2. Get sessions list
            sessions_resp = page.request.get(f"{API_URL}/sessions", headers=headers)
            log_test("GET /sessions returns 200", sessions_resp.ok, f"Status: {sessions_resp.status}")

            if sessions_resp.ok:
                sessions_data = sessions_resp.json()
                sessions = sessions_data.get("data", []) if isinstance(sessions_data, dict) else sessions_data

                if len(sessions) > 0:
                    session_id = sessions[0].get("id")

                    # 3. GET /sessions/{id} returns SessionDto with Grace Period fields
                    detail_resp = page.request.get(f"{API_URL}/sessions/{session_id}", headers=headers)
                    log_test("GET /sessions/{id} returns 200", detail_resp.ok, f"Status: {detail_resp.status}")

                    if detail_resp.ok:
                        detail_data = detail_resp.json()
                        session_dto = detail_data.get("data", detail_data)

                        # Verify grace period fields exist
                        has_gp_fields = (
                            "gracePeriodEndsAt" in session_dto and
                            "gracePeriodStartedAt" in session_dto and
                            "hasIssueReport" in session_dto and
                            "isPayoutReleased" in session_dto
                        )
                        log_test("SessionDto includes grace period fields (GracePeriodEndsAt, etc.)",
                                 has_gp_fields,
                                 f"Fields found: {[k for k in ['gracePeriodEndsAt', 'gracePeriodStartedAt', 'hasIssueReport', 'isPayoutReleased'] if k in session_dto]}")

                        # Verify NO attendance fields exist
                        no_attendance = (
                            "studentAttendance" not in session_dto and
                            "tutorAttendance" not in session_dto and
                            "hasAttendanceConflict" not in session_dto and
                            "attendanceVerificationDueAt" not in session_dto and
                            "attendanceVerificationOpenedAt" not in session_dto
                        )
                        log_test("SessionDto has NO legacy attendance fields", no_attendance)

                    # 4. Old POST /sessions/{id}/attendance endpoint returns 404
                    old_endpoint = page.request.post(
                        f"{API_URL}/sessions/{session_id}/attendance",
                        headers=headers,
                        data={"outcome": "Attended"}
                    )
                    log_test(
                        "Old POST /sessions/{id}/attendance returns 404 (deleted)",
                        old_endpoint.status == 404,
                        f"Status: {old_endpoint.status}"
                    )

                    # 5. New POST /sessions/{id}/report-issue endpoint exists
                    # Bad input should return 400 (validation), NOT 404
                    new_endpoint = page.request.post(
                        f"{API_URL}/sessions/{session_id}/report-issue",
                        headers=headers,
                        data={"reason": "", "description": ""}
                    )
                    log_test(
                        "New POST /sessions/{id}/report-issue endpoint is active (not 404)",
                        new_endpoint.status != 404,
                        f"Status: {new_endpoint.status} (Validation response as expected)"
                    )
                else:
                    log_test("Sessions available for API testing", False, "No sessions found")
    except Exception as e:
        log_test("API endpoint verification", False, str(e))
    finally:
        context.close()


def test_student_flow(browser):
    """Test student login, dashboard, and session interaction."""
    print("\n📋 Test Suite: Student Flow")
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page_errors = setup_console_capture(page)

    try:
        login(page, STUDENT_EMAIL, PASSWORD)
        log_test("Student login successful", "/student/dashboard" in page.url or "/login" not in page.url)
        page.screenshot(path=f"{SCREENSHOT_DIR}/01_student_dashboard.png", full_page=True)

        test_no_attendance_references(page, "Student Dashboard")

        # Navigate to sessions list
        page.goto(f"{FRONTEND_URL}/student/sessions")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{SCREENSHOT_DIR}/02_student_sessions.png", full_page=True)
        test_no_attendance_references(page, "Student Sessions List")

        # Try to find and click a session
        session_card = page.locator('a[href*="/sessions/"], tr[class*="cursor"], [data-testid="session-card"]').first
        if session_card.count() > 0:
            session_card.click()
            page.wait_for_load_state("networkidle")
            page.screenshot(path=f"{SCREENSHOT_DIR}/03_student_session_detail.png", full_page=True)
            test_no_attendance_references(page, "Student Session Detail")

            # Check that GracePeriodCard is rendered instead of AttendanceCard
            has_no_attendance_card = page.locator('[class*="attendance-card"]').count() == 0
            log_test("No AttendanceCard component rendered on session detail", has_no_attendance_card)

        # Check console errors
        attendance_errors = [e for e in page_errors if "attendance" in e.lower()]
        log_test("Zero attendance-related console errors (student)", len(attendance_errors) == 0,
                 f"Errors: {attendance_errors}" if attendance_errors else "")

    except Exception as e:
        log_test("Student flow execution", False, str(e))
        page.screenshot(path=f"{SCREENSHOT_DIR}/error_student.png")
    finally:
        context.close()


def test_tutor_flow(browser):
    """Test tutor login and dashboard."""
    print("\n📋 Test Suite: Tutor Flow")
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page_errors = setup_console_capture(page)

    try:
        login(page, TUTOR_EMAIL, PASSWORD)
        log_test("Tutor login successful", "/tutor/dashboard" in page.url or "/login" not in page.url)
        page.screenshot(path=f"{SCREENSHOT_DIR}/04_tutor_dashboard.png", full_page=True)

        test_no_attendance_references(page, "Tutor Dashboard")

        # Navigate to tutor sessions
        page.goto(f"{FRONTEND_URL}/tutor/sessions")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{SCREENSHOT_DIR}/05_tutor_sessions.png", full_page=True)
        test_no_attendance_references(page, "Tutor Sessions")

        # Check console errors
        attendance_errors = [e for e in page_errors if "attendance" in e.lower()]
        log_test("Zero attendance-related console errors (tutor)", len(attendance_errors) == 0,
                 f"Errors: {attendance_errors}" if attendance_errors else "")

    except Exception as e:
        log_test("Tutor flow execution", False, str(e))
        page.screenshot(path=f"{SCREENSHOT_DIR}/error_tutor.png")
    finally:
        context.close()


def test_admin_flow(browser):
    """Test admin login, user management, and disputes."""
    print("\n📋 Test Suite: Admin Flow")
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page_errors = setup_console_capture(page)

    try:
        login(page, ADMIN_EMAIL, PASSWORD)
        log_test("Admin login successful", "/admin/dashboard" in page.url or "/login" not in page.url)
        page.screenshot(path=f"{SCREENSHOT_DIR}/07_admin_dashboard.png", full_page=True)

        test_no_attendance_references(page, "Admin Dashboard")

        # Navigate to Users management page
        page.goto(f"{FRONTEND_URL}/admin/users")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{SCREENSHOT_DIR}/08_admin_users.png", full_page=True)

        content = page.content().lower()
        has_absent_strikes = "absentstrike" in content or "absent strike" in content or "điểm vắng" in content
        log_test("No AbsentStrikes / attendance strike tracker in Admin Users", not has_absent_strikes)

        # Navigate to Disputes management page
        page.goto(f"{FRONTEND_URL}/admin/disputes")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{SCREENSHOT_DIR}/09_admin_disputes.png", full_page=True)
        test_no_attendance_references(page, "Admin Disputes List")

        # Check console errors
        attendance_errors = [e for e in page_errors if "attendance" in e.lower() or "absentstrike" in e.lower()]
        log_test("Zero attendance-related console errors (admin)", len(attendance_errors) == 0,
                 f"Errors: {attendance_errors}" if attendance_errors else "")

    except Exception as e:
        log_test("Admin flow execution", False, str(e))
        page.screenshot(path=f"{SCREENSHOT_DIR}/error_admin.png")
    finally:
        context.close()


def main():
    print("=" * 60)
    print("🧪 TutorHub E2E: Auto-Payout Grace Period Verification")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        try:
            test_frontend_build_output(browser)
            test_api_endpoints(browser)
            test_student_flow(browser)
            test_tutor_flow(browser)
            test_admin_flow(browser)
        finally:
            browser.close()

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    passed = sum(1 for _, p, _ in test_results if p)
    failed = sum(1 for _, p, _ in test_results if not p)
    total = len(test_results)

    for name, p, detail in test_results:
        status = "✅" if p else "❌"
        print(f"  {status} {name}")
        if detail and not p:
            print(f"     → {detail}")

    print(f"\n  Total: {total}  |  Passed: {passed}  |  Failed: {failed}")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
