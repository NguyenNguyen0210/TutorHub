# PRD: Xác Thực & Quản Lý Phiên Đăng Nhập (Auth & Identity Management)

* **Tính năng:** Xác thực người dùng, đăng ký, đăng nhập, làm mới Access Token và quản lý phiên làm việc đa vai trò.
* **Người dùng:** Học Viên (Student), Gia Sư (Tutor), Quản Trị Viên (Admin).
* **Stack:** .NET 8 Web API, EF Core 8, PostgreSQL, JWT Bearer Token, BCrypt.Net-Next.

---

## 1. Vấn Đề Cần Giải Quyết & Success Metrics
* **Vấn đề:** Cần hệ thống xác thực bảo mật phân quyền Role-based, cơ chế cấp phát token an toàn chống tấn công đánh cắp phiên (Token Replay Attack), và hỗ trợ tự động khởi tạo hồ sơ chuyên môn theo vai trò.
* **Success Metrics:**
  - 100% mật khẩu được mã hóa an toàn với BCrypt.
  - Thời gian xử lý đăng nhập / refresh token < 100ms.
  - 0 trường hợp Refresh Token bị tái sử dụng sau khi đã quay vòng (Token Rotation) hoặc thu hồi (Revocation).

---

## 2. User Stories & Acceptance Criteria

### US-01: Đăng ký tài khoản (Register)
* **User Story:** Là người dùng mới, tôi muốn đăng ký tài khoản với vai trò Học viên hoặc Gia sư để bắt đầu sử dụng sàn.
* **Acceptance Criteria:**
  - Email phải là định dạng hợp lệ và là duy nhất trong hệ thống (`409 Conflict` nếu trùng).
  - Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.
  - Tự động tạo `StudentProfile` (nếu `role = Student`) hoặc `TutorProfile` với status `Draft` (nếu `role = Tutor`).

### US-02: Đăng nhập & Cấp phát JWT (Login)
* **User Story:** Là người dùng, tôi muốn đăng nhập bằng Email và Password để nhận Access Token.
* **Acceptance Criteria:**
  - Trả về `accessToken` (thời hạn 15 phút) và `refreshToken` (thời hạn 7 ngày, lưu trong DB).
  - Nếu tài khoản bị khóa (`IsActive = false`), từ chối đăng nhập với `403 Forbidden`.

### US-03: Làm mới Token & Đăng xuất (Token Rotation & Logout)
* **User Story:** Là người dùng, tôi muốn tự động làm mới phiên làm việc mà không cần nhập lại mật khẩu.
* **Acceptance Criteria:**
  - Khi refresh token hợp lệ, cấp phát cặp token mới và đánh dấu `RevokedAt` cho token cũ.
  - Khi đăng xuất hoặc tài khoản bị Admin vô hiệu hóa, toàn bộ Refresh Tokens của user bị thu hồi ngay lập tức.

---

## 3. Scope Ranh Giới Tính Năng
* **Có trong v1:**
  - Đăng ký, Đăng nhập, Refresh Token Rotation, Đăng xuất, Đổi mật khẩu, Bootstrap Auth (`GET /auth/me`).
  - Phân quyền theo Roles: `Student`, `Tutor`, `Admin`.
* **Chưa có trong v1 (Dời sang v2):**
  - Đăng nhập mạng xã hội (Google OAuth2 / Facebook Login).
  - Xác thực 2 bước (2FA / OTP SMS).

---

## 4. Data Model
* **`User`:** `Id (PK, Guid)`, `Email (Unique, string)`, `PasswordHash (string)`, `FullName (string)`, `Phone (string?)`, `AvatarUrl (string?)`, `Role (UserRole enum: Student, Tutor, Admin)`, `IsActive (bool)`, `CreatedAt (DateTime)`.
* **`RefreshToken`:** `Id (PK, Guid)`, `UserId (FK, Guid)`, `Token (string)`, `ExpiresAt (DateTime)`, `RevokedAt (DateTime?)`, `ReplacedByToken (string?)`.

---

## 5. Edge Cases & Xử Lý Lỗi
* **Replay Attack:** Nếu một Refresh Token đã bị thu hồi (`RevokedAt != null`) được gửi lên lại ➔ Thu hồi toàn bộ Refresh Tokens của User đó để bảo vệ an toàn tài khoản (`401 Unauthorized`).
* **Đổi mật khẩu:** Khi đổi mật khẩu thành công ➔ Thu hồi tất cả Refresh Token đang active trên các thiết bị.

---

## 6. Câu Hỏi Mở & Khóa Nghiệp Vụ
* *Tài khoản Admin được tạo như thế nào?* ➔ Tạo qua `seedData.sql` hoặc DB Migration nội bộ, API Public không cho phép đăng ký trực tiếp vai trò Admin.
