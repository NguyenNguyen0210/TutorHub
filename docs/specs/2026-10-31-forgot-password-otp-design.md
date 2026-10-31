# Đặc Tả Kỹ Thuật: Tính Năng Quên Mật Khẩu & Xác Thực OTP (Forgot Password Flow)

- **Ngày tạo:** 2026-10-31
- **Trạng thái:** Đã phê duyệt (Approved)
- **Phạm vi:** Backend (.NET 8 Clean Architecture) & Frontend (React 18 + Vite)

---

## 1. Mục tiêu & Nghiệp vụ

Cung cấp tính năng tự phục hồi tài khoản cho người dùng (Học viên, Gia sư) khi quên mật khẩu qua quy trình 3 bước chuẩn:
1. Người dùng nhập Email tài khoản để nhận mã OTP 6 số.
2. Xác thực mã OTP trong thời hạn hiệu lực (5 phút) và giới hạn nhập sai (tối đa 5 lần).
3. Đặt mật khẩu mới, mã hóa mật khẩu, cập nhật cơ sở dữ liệu và vô hiệu hóa toàn bộ phiên đăng nhập cũ trên các thiết bị.

---

## 2. Kiến Trúc Backend (.NET 8)

### 2.1. Quản lý Vòng Đời OTP & Reset Token (Redis)
Hệ thống sử dụng Redis hiện có (`ConnectionStrings:Redis`) để quản lý trạng thái ngắn hạn:

- **Key OTP:** `auth:otp:forgot-password:{email}`
  - **Giá trị lưu:** JSON `{ "otp": "123456", "attempts": 0 }`
  - **TTL:** 5 phút (300 giây).
  - Khi người dùng nhập sai, tăng `attempts += 1`. Nếu `attempts >= 5`, xóa key để hủy mã ngay lập tức.
- **Key Reset Token:** `auth:token:reset-password:{email}`
  - **Giá trị lưu:** Chuỗi GUID bí mật ngẫu nhiên (chứng minh đã qua bước OTP).
  - **TTL:** 10 phút (600 giây).
  - Bị xóa ngay sau khi đặt mật khẩu mới thành công.

### 2.2. Danh sách Endpoints RESTful (`TutorHub.Api.Controllers.AuthController`)

#### 1. `POST /api/v1/auth/forgot-password`
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Xử lý:**
  - Kiểm tra Email hợp lệ qua FluentValidation.
  - Tìm User theo Email trong `AppDbContext`.
  - Nếu User không tồn tại hoặc bị khóa/bị xóa: Vẫn trả về HTTP 200 kèm thông báo thành công chung (chống rò rỉ thông tin người dùng - User Enumeration).
  - Nếu User hợp lệ:
    - Sinh mã OTP ngẫu nhiên 6 chữ số: `RandomNumberGenerator.GetInt32(100000, 1000000)`.
    - Lưu vào Redis (TTL 5 phút).
    - Gửi email mẫu HTML thương hiệu TutorHub qua `IEmailSender` (MailKit / SMTP Gmail).
    - Đồng thời ghi log mã OTP ra terminal backend: `Log.Information("[DEV AUTH] Password reset OTP for {Email}: {Otp}", email, otp)`.
- **Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Nếu email tồn tại trong hệ thống, mã xác nhận OTP đã được gửi đến hộp thư của bạn."
  }
  ```

#### 2. `POST /api/v1/auth/verify-reset-otp`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Xử lý:**
  - Đọc dữ liệu từ Redis theo key `auth:otp:forgot-password:{email}`.
  - Nếu key không tồn tại / hết hạn: Báo lỗi `400 BadRequest` ("Mã OTP đã hết hạn hoặc không tồn tại.").
  - Nếu OTP không khớp: Tăng `attempts++`. Nếu `>= 5`, xóa key và báo lỗi ("Bạn đã nhập sai quá số lần quy định. Vui lòng yêu cầu mã mới.").
  - Nếu khớp:
    - Xóa key OTP.
    - Tạo `resetToken = Guid.NewGuid().ToString("N")`.
    - Lưu `auth:token:reset-password:{email} = resetToken` vào Redis (TTL 10 phút).
- **Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Xác thực mã OTP thành công.",
    "data": {
      "resetToken": "8f8b8cf8d2b7405fa03c7e48b39d48b1"
    }
  }
  ```

#### 3. `POST /api/v1/auth/reset-password`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "resetToken": "8f8b8cf8d2b7405fa03c7e48b39d48b1",
    "newPassword": "NewSecurePassword@123"
  }
  ```
- **Xử lý:**
  - Kiểm tra `resetToken` trong Redis. Nếu không khớp hoặc hết hạn, trả về `400 BadRequest`.
  - Validate mật khẩu mới (tối thiểu 8 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số/ký tự đặc biệt).
  - Tìm User theo Email trong `AppDbContext`.
  - Cập nhật:
    - `user.PasswordHash = PasswordHasher.Hash(newPassword)` (sử dụng tiện ích băm mật khẩu hiện tại của hệ thống).
    - `user.TokenVersion++` (thu hồi toàn bộ RefreshToken và phiên đăng nhập hiện tại trên các thiết bị).
  - Lưu vào Database.
  - Xóa `resetToken` trong Redis.
- **Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới."
  }
  ```

---

## 3. Kiến Trúc Frontend (React 18 + Vite)

### 3.1. Route & Layout
- Route mới: `/auth/forgot-password` (bọc trong `GuestGuard`).
- Layout: Tái sử dụng cấu trúc `AuthHeader` và khung 2 cột như trang Login/Register.

### 3.2. Cấu trúc Component & State Machine (3 Bước)
- **Step 1: Request OTP (`step === 1`)**
  - Input Email có validation regex.
  - Nút "Gửi mã xác nhận" (kèm loading spinner).
  - Nút quay lại "/auth/login".
- **Step 2: Verify OTP (`step === 2`)**
  - Hiển thị email đích.
  - 6 ô nhập mã OTP tách rời:
    - Auto-focus vào ô kế tiếp khi gõ số.
    - Xử lý Backspace nhảy lùi lại ô trước.
    - Xử lý sự kiện `onPaste` cho phép dán nguyên chuỗi 6 ký tự.
  - Bộ đếm ngược gửi lại mã (Countdown 60 giây). Khi hết giờ cho phép bấm "Gửi lại mã OTP".
  - Nút "Thay đổi email" quay về Step 1.
- **Step 3: New Password (`step === 3`)**
  - Input "Mật khẩu mới" và "Xác nhận mật khẩu mới" (nút toggle ẩn/hiện mắt).
  - Hiển thị thanh đo độ mạnh mật khẩu và checklist điều kiện (độ dài, chữ hoa, số).
  - Nút submit "Đặt lại mật khẩu".
  - Khi hoàn thành: Bắn `toast.success(...)` và tự động điều hướng sang `/auth/login`.

---

## 4. Bảo Mật & An Toàn Dữ Liệu
1. **Chống brute-force OTP:** Tối đa 5 lần thử sai cho mỗi mã; sau 5 lần mã bị hủy lập tức.
2. **Chống vượt cấp (Bypass):** Bước đổi mật khẩu bắt buộc phải có `resetToken` được ký bởi backend và lưu ngắn hạn trong Redis, không chấp nhận việc gửi thẳng mật khẩu mới kèm email.
3. **Thu hồi phiên cũ (Session Invalidation):** Sau khi đổi mật khẩu, `TokenVersion` của User được tăng thêm 1, khiến toàn bộ Access Token và Refresh Token trước đó bị vô hiệu hóa.
