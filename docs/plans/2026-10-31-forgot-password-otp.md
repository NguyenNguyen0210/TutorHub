# Kế Hoạch Triển Khai: Quên Mật Khẩu & Xác Thực OTP (Forgot Password Flow)

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **LƯU Ý ĐẶC BIỆT:** Theo chỉ đạo của người dùng, KHÔNG chạy test frontend, test backend hoặc Playwright trong suốt quá trình triển khai. Chỉ kiểm tra linting (`npm run lint`) và build (`dotnet build`, `npm run build`).

**Goal:** Xây dựng hoàn chỉnh luồng Quên mật khẩu qua email OTP gồm 3 endpoint Backend (.NET 8 + Redis) và giao diện Wizard 3 bước Frontend (React 18 + Vite).

**Architecture:** Sử dụng Clean Architecture + MediatR cho backend; tách biệt `IPasswordResetOtpStore` vào Application layer và cài đặt qua Redis ở Infrastructure layer; frontend sử dụng React state machine 3 bước tại trang `/auth/forgot-password` với form validation và countdown timer.

**Tech Stack:** .NET 8 (C# 12), MediatR, FluentValidation, BCrypt.Net, StackExchange.Redis, React 18, React Router v7, Tailwind CSS, Lucide Icons.

---

### Danh sách các file liên quan

#### Backend:
- Tạo mới: `src/backend/TutorHub.Application/Common/Interfaces/IPasswordResetOtpStore.cs`
- Tạo mới: `src/backend/TutorHub.Infrastructure/Authentication/PasswordResetOtpStore.cs`
- Chỉnh sửa: `src/backend/TutorHub.Infrastructure/InfrastructureServiceCollectionExtensions.cs` (Đăng ký `IPasswordResetOtpStore`)
- Tạo mới: `src/backend/TutorHub.Application/Features/Auth/ForgotPassword/ForgotPasswordCommand.cs`
- Tạo mới: `src/backend/TutorHub.Application/Features/Auth/ForgotPassword/ForgotPasswordCommandValidator.cs`
- Tạo mới: `src/backend/TutorHub.Application/Features/Auth/ForgotPassword/ForgotPasswordCommandHandler.cs`
- Tạo mới: `src/backend/TutorHub.Application/Features/Auth/VerifyResetOtp/VerifyResetOtpCommand.cs`
- Tạo mới: `src/backend/TutorHub.Application/Features/Auth/VerifyResetOtp/VerifyResetOtpCommandValidator.cs`
- Tạo mới: `src/backend/TutorHub.Application/Features/Auth/VerifyResetOtp/VerifyResetOtpCommandHandler.cs`
- Tạo mới: `src/backend/TutorHub.Application/Features/Auth/ResetPassword/ResetPasswordCommand.cs`
- Tạo mới: `src/backend/TutorHub.Application/Features/Auth/ResetPassword/ResetPasswordCommandValidator.cs`
- Tạo mới: `src/backend/TutorHub.Application/Features/Auth/ResetPassword/ResetPasswordCommandHandler.cs`
- Chỉnh sửa: `src/backend/TutorHub.Api/Controllers/AuthController.cs` (Thêm 3 API endpoints)

#### Frontend:
- Tạo mới: `src/frontend/src/services/forgotPassword.service.js` (Gọi 3 API auth)
- Tạo mới: `src/frontend/src/pages/auth/ForgotPassword.jsx` (Giao diện 3 bước: Nhập Email -> OTP 6 số -> Đặt mật khẩu mới)
- Chỉnh sửa: `src/frontend/src/routes/index.jsx` (Đăng ký route `/auth/forgot-password` trong `GuestGuard`)

---

### Task 1: Xây dựng Seam lưu trữ OTP & Reset Token qua Redis (Backend Infrastructure)

**Files:**
- Create: `src/backend/TutorHub.Application/Common/Interfaces/IPasswordResetOtpStore.cs`
- Create: `src/backend/TutorHub.Infrastructure/Authentication/PasswordResetOtpStore.cs`
- Modify: `src/backend/TutorHub.Infrastructure/InfrastructureServiceCollectionExtensions.cs`

- [ ] **Step 1: Tạo interface `IPasswordResetOtpStore`**
  Định nghĩa các phương thức async:
  - `SetOtpAsync(string email, string otp, TimeSpan expiry, CancellationToken ct)`
  - `VerifyAndConsumeOtpAsync(string email, string otp, CancellationToken ct)` (trả về enum hoặc model: `Success`, `InvalidOtp`, `ExpiredOrNotFound`, `MaxAttemptsExceeded`)
  - `SetResetTokenAsync(string email, string resetToken, TimeSpan expiry, CancellationToken ct)`
  - `ValidateAndConsumeResetTokenAsync(string email, string resetToken, CancellationToken ct)`

- [ ] **Step 2: Cài đặt `PasswordResetOtpStore` sử dụng Redis**
  Thực thi giao diện trên thông qua `IConnectionMultiplexer` của StackExchange.Redis.
  Key định dạng:
  - OTP: `auth:otp:forgot-password:{email.ToLowerInvariant()}`
  - Token: `auth:token:reset-password:{email.ToLowerInvariant()}`
  Quản lý số lần nhập sai: `attempts` lưu trong JSON string `{ "otp": "...", "attempts": 0 }`.

- [ ] **Step 3: Đăng ký DI trong `InfrastructureServiceCollectionExtensions.cs`**
  Thêm `services.AddSingleton<IPasswordResetOtpStore, PasswordResetOtpStore>();`.

---

### Task 2: Triển khai 3 CQRS Slices trong Application Layer (Backend Application)

**Files:**
- Create: `src/backend/TutorHub.Application/Features/Auth/ForgotPassword/*`
- Create: `src/backend/TutorHub.Application/Features/Auth/VerifyResetOtp/*`
- Create: `src/backend/TutorHub.Application/Features/Auth/ResetPassword/*`

- [ ] **Step 1: Slice `ForgotPassword`**
  - Command: `ForgotPasswordCommand(string Email) : IRequest<bool>`
  - Validator: Email format kiểm tra bằng FluentValidation.
  - Handler:
    - Tìm User trong `AppDbContext`.
    - Nếu không tồn tại: Return true (giữ bảo mật, không báo lỗi user không tồn tại).
    - Nếu tồn tại: Tạo OTP 6 số ngẫu nhiên qua `RandomNumberGenerator.GetInt32(100000, 1000000).ToString()`.
    - Lưu vào `_otpStore.SetOtpAsync(email, otp, TimeSpan.FromMinutes(5))`.
    - Gửi email qua `_emailSender` (nếu có cấu hình).
    - Log trực tiếp ra console: `[DEV AUTH] OTP cho email {Email}: {Otp}`.

- [ ] **Step 2: Slice `VerifyResetOtp`**
  - Command: `VerifyResetOtpCommand(string Email, string Otp) : IRequest<string>` (trả về `resetToken`)
  - Validator: Email và Otp (6 chữ số).
  - Handler:
    - Gọi `_otpStore.VerifyAndConsumeOtpAsync(email, otp)`.
    - Nếu không hợp lệ / hết hạn / quá số lần: Ném `BadRequestException` với thông báo tương ứng.
    - Nếu thành công: Tạo `resetToken = Guid.NewGuid().ToString("N")`.
    - Lưu `_otpStore.SetResetTokenAsync(email, resetToken, TimeSpan.FromMinutes(10))`.
    - Trả về `resetToken`.

- [ ] **Step 3: Slice `ResetPassword`**
  - Command: `ResetPasswordCommand(string Email, string ResetToken, string NewPassword) : IRequest<bool>`
  - Validator: ResetToken không rỗng; NewPassword tuân thủ chính sách mật khẩu (tối thiểu 8 ký tự, hoa, thường, số/ký tự đặc biệt).
  - Handler:
    - Kiểm tra `_otpStore.ValidateAndConsumeResetTokenAsync(email, resetToken)`. Nếu sai ném `BadRequestException`.
    - Tìm User trong `AppDbContext`.
    - Băm mật khẩu mới bằng `_passwordHasher.HashPassword(request.NewPassword)`.
    - Tăng `user.TokenVersion++` để vô hiệu hóa tất cả phiên đăng nhập cũ.
    - Lưu `await _dbContext.SaveChangesAsync()`.

---

### Task 3: Thêm Controller Endpoints trong API Layer (Backend Api)

**Files:**
- Modify: `src/backend/TutorHub.Api/Controllers/AuthController.cs`

- [ ] **Step 1: Thêm 3 Action methods vào `AuthController`**
  - `POST /api/v1/auth/forgot-password` (gọi `ForgotPasswordCommand`)
  - `POST /api/v1/auth/verify-reset-otp` (gọi `VerifyResetOtpCommand`)
  - `POST /api/v1/auth/reset-password` (gọi `ResetPasswordCommand`)
- [ ] **Step 2: Kiểm tra biên dịch backend**
  Chạy `dotnet build src/backend/TutorHub.sln` để đảm bảo 0 lỗi.

---

### Task 4: Triển khai Service & Giao diện Quên mật khẩu Frontend

**Files:**
- Create: `src/frontend/src/services/forgotPassword.service.js`
- Create: `src/frontend/src/pages/auth/ForgotPassword.jsx`
- Modify: `src/frontend/src/routes/index.jsx`

- [ ] **Step 1: Tạo `forgotPassword.service.js`**
  Xuất 3 hàm:
  - `requestResetOtp(email)`
  - `verifyResetOtp(email, otp)`
  - `resetPassword(email, resetToken, newPassword)`
  Sử dụng `apiClient` hiện tại của hệ thống.

- [ ] **Step 2: Tạo màn hình `ForgotPassword.jsx`**
  Bố cục trang chia 2 cột đồng bộ với `Login.jsx` & `Register.jsx`:
  - Cột trái: Tiêu đề "Khôi phục mật khẩu an toàn", hình minh họa học viên + thẻ bảo chứng.
  - Cột phải: Thẻ form 3 bước (`step 1 | 2 | 3`):
    - **Bước 1 (Nhập Email):** Input email, nút "Gửi mã xác nhận", nút "← Quay lại đăng nhập".
    - **Bước 2 (Xác thực OTP):** 6 ô nhập OTP độc lập (hỗ trợ auto-next, backspace, paste chuỗi 6 ký tự), countdown 60s nút gửi lại mã, nút đổi email.
    - **Bước 3 (Đặt mật khẩu mới):** Input mật khẩu mới + xác nhận mật khẩu (mắt ẩn/hiện), checklist độ mạnh mật khẩu, nút "Cập nhật mật khẩu".
  - Hiển thị Toast thông báo trạng thái rõ ràng qua `useToast()`.

- [ ] **Step 3: Đăng ký route trong `src/frontend/src/routes/index.jsx`**
  Thêm:
  `<Route path="/auth/forgot-password" element={<GuestGuard><ForgotPassword /></GuestGuard>} />`
  `<Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />`

- [ ] **Step 4: Kiểm tra build & lint frontend**
  Chạy `npm --prefix src/frontend run lint` và `npm --prefix src/frontend run build`.
