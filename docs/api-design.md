# API Endpoints Specification — Nền tảng TutorHub (Production-Ready)

**Tech Stack:** ASP.NET Core 8.0 Web API (Clean Architecture + Vertical Slice + MediatR CQRS)  
**Authentication:** JWT Bearer Token (Access Token 15m + Refresh Token 7d Rotation)  
**Base URL:** `/api/v1`  
**Response Envelope Format:**
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... },
  "errors": null
}
```

---

## 1. 🔐 Authentication & Session Management (`/api/v1/auth`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản (`Student` hoặc `Tutor`). Tự động khởi tạo `TutorProfile` hoặc `StudentProfile`. |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập bằng Email + Mật khẩu. Trả về Access Token, Refresh Token và thông tin User. |
| `POST` | `/api/v1/auth/refresh` | Public | Làm mới Access Token thông qua Refresh Token Rotation. |
| `POST` | `/api/v1/auth/logout` | 🔒 Authenticated | Đăng xuất và thu hồi Refresh Token hiện tại. |
| `POST` | `/api/v1/auth/change-password` | 🔒 Authenticated | Đổi mật khẩu tài khoản (yêu cầu mật khẩu cũ). |
| `GET` | `/api/v1/auth/me` | 🔒 Authenticated | Kiểm tra phiên làm việc và lấy thông tin User đang đăng nhập (Bootstrap Auth). |

---

## 2. 👤 Hồ Sơ Cá Nhân (`/api/v1/users`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | 🔒 Authenticated | Xem thông tin hồ sơ tài khoản cá nhân. |
| `PUT` | `/api/v1/users/me` | 🔒 Authenticated | Cập nhật Họ tên, Số điện thoại (chuẩn hóa di động VN), Avatar URL. |

---

## 3. 📚 Danh Mục & Môn Học Master Data (`/api/v1/categories`, `/api/v1/subjects`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/categories` | Public | Cây danh mục phân cấp cha/con lồng danh sách môn học. |
| `GET` | `/api/v1/categories/{id}` | Public | Chi tiết danh mục kèm danh sách môn học con. |
| `GET` | `/api/v1/subjects` | Public | Tìm kiếm môn học, phân trang, lọc theo `categoryId`. |
| `GET` | `/api/v1/subjects/{id}` | Public | Chi tiết môn học. |

---

## 4. 👨‍🏫 Gia Sư & Khung Giờ Rảnh (`/api/v1/tutors`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/tutors` | Public | Tìm kiếm gia sư công khai (lọc môn, giá, địa chỉ, hình thức dạy, phân trang). |
| `GET` | `/api/v1/tutors/{id}` | Public | Xem chi tiết hồ sơ công khai của gia sư. |
| `GET` | `/api/v1/tutors/{id}/reviews` | Public | Xem danh sách đánh giá của gia sư. |
| `GET` | `/api/v1/tutors/me` | 🔒 Tutor | Gia sư xem hồ sơ chuyên môn của mình. |
| `PUT` | `/api/v1/tutors/me` | 🔒 Tutor | Cập nhật Bio, kinh nghiệm, học vấn, giá mặc định, địa chỉ. |
| `PUT` | `/api/v1/tutors/me/subjects` | 🔒 Tutor | Cập nhật danh sách môn dạy kèm giá riêng từng môn (`overridePrice`). |
| `PUT` | `/api/v1/tutors/me/availabilities` | 🔒 Tutor | Cấu hình các khung giờ rảnh trong tuần (`dayOfWeek`, `startTime`, `endTime`). |

---

## 5. 📅 Đặt Lịch Học & Đánh Giá (`/api/v1/bookings`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/bookings` | 🔒 Student | Tạo đặt lịch mới (giữ chỗ 15 phút, status = `Holding`). |
| `POST` | `/api/v1/bookings/{id}/pay` | 🔒 Student | Thanh toán giả lập (Mock Payment) → `Holding` ➔ `Pending`. |
| `GET` | `/api/v1/bookings/me` | 🔒 Authenticated | Danh sách lịch học cá nhân (phân trang, lọc status, role). |
| `GET` | `/api/v1/bookings/{id}` | 🔒 Authenticated | Xem chi tiết 1 buổi học. |
| `POST` | `/api/v1/bookings/{id}/confirm` | 🔒 Tutor | Gia sư xác nhận nhận lớp → `Pending` ➔ `Confirmed`. |
| `POST` | `/api/v1/bookings/{id}/reject` | 🔒 Tutor | Gia sư từ chối → `Cancelled` + hoàn tiền. |
| `POST` | `/api/v1/bookings/{id}/cancel` | 🔒 Authenticated | Hủy buổi học kèm chính sách hoàn tiền theo mốc thời gian. |
| `POST` | `/api/v1/bookings/{id}/complete` | 🔒 Authenticated | Xác nhận hoàn thành buổi học & giải ngân tiền vào ví gia sư. |
| `POST` | `/api/v1/bookings/{id}/reviews` | 🔒 Student | Đánh giá sau buổi học hoàn thành (Rating 1-5 sao). |
| `GET` | `/api/v1/bookings/{id}/reviews` | 🔒 Authenticated | Xem đánh giá của buổi học. |

---

## 6. 💳 Cổng Thanh Toán VNPay (`/api/v1/payments`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/payments/vnpay/create-url` | 🔒 Student | Sinh mã `MerchantReference` và URL thanh toán VNPay Sandbox có thời hạn 15 phút. |
| `GET` | `/api/v1/payments/vnpay/return` | Public | Tiếp nhận điều hướng từ trình duyệt sau thanh toán, xác thực SHA512 (Read-Only). |
| `GET` | `/api/v1/payments/vnpay/ipn` | Public | Webhook ngầm Server-to-Server từ VNPay: Atomic DB Transaction, Idempotent, cập nhật `Booking = Pending`, `Transaction = Held`, cộng `PayoutAmount` ví gia sư. |

---

## 7. ⚖️ Báo Cáo & Tranh Chấp Khiếu Nại (`/api/v1/reports`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/reports` | 🔒 Authenticated | Gửi báo cáo khiếu nại buổi học kèm lý do và chứng cứ. |
| `GET` | `/api/v1/reports/me` | 🔒 Authenticated | Xem danh sách khiếu nại do mình gửi. |

---

## 8. 💼 Ví Tiền & Rút Tiền Gia Sư (`/api/v1/tutors/me/wallet`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/tutors/me/wallet` | 🔒 Tutor | Xem số dư ví: `AvailableBalance` (khả dụng) và `PendingBalance` (đang giữ). |
| `POST` | `/api/v1/tutors/me/wallet/withdraw` | 🔒 Tutor | Tạo yêu cầu rút tiền về tài khoản ngân hàng (khóa số dư khả dụng). |
| `GET` | `/api/v1/tutors/me/wallet/withdrawals` | 🔒 Tutor | Xem lịch sử các yêu cầu rút tiền. |

---

## 9. 🧾 Lịch Sử Dòng Tiền Giao Dịch (`/api/v1/transactions`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/transactions/me` | 🔒 Student, Tutor | Lịch sử giao dịch cá nhân theo ngữ cảnh (Học viên xem tiền đã thanh toán/hoàn; Gia sư xem học phí, phí sàn và thực nhận). |

---

## 10. 🛡️ Quản Trị Hệ Thống Toàn Diện (`/api/v1/admin`)

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard/stats` | 🔒 Admin | Snapshot thời gian thực: Users, Tutors, Bookings, Financials GMV, Action Queue. |
| `GET` | `/api/v1/admin/dashboard/revenue-chart` | 🔒 Admin | Biểu đồ doanh thu/booking theo tháng (Zero-fill đầy đủ). |
| `GET` | `/api/v1/admin/tutors` | 🔒 Admin | Danh sách hồ sơ gia sư chờ duyệt. |
| `POST` | `/api/v1/admin/tutors/{id}/approve` | 🔒 Admin | Duyệt hồ sơ gia sư → `Verified`. |
| `POST` | `/api/v1/admin/tutors/{id}/reject` | 🔒 Admin | Từ chối hồ sơ gia sư kèm lý do. |
| `POST` | `/api/v1/admin/tutors/{id}/suspend` | 🔒 Admin | Khóa tài khoản gia sư vi phạm. |
| `GET` | `/api/v1/admin/withdrawals` | 🔒 Admin | Danh sách yêu cầu rút tiền chờ xử lý. |
| `POST` | `/api/v1/admin/withdrawals/{id}/approve` | 🔒 Admin | Duyệt chi trả rút tiền cho gia sư. |
| `POST` | `/api/v1/admin/withdrawals/{id}/reject` | 🔒 Admin | Từ chối rút tiền & hoàn lại ví khả dụng. |
| `GET` | `/api/v1/admin/reports` | 🔒 Admin | Danh sách khiếu nại toàn sàn. |
| `GET` | `/api/v1/admin/reports/{id}` | 🔒 Admin | Chi tiết khiếu nại, các bên liên quan và buổi học. |
| `POST` | `/api/v1/admin/reports/{id}/resolve` | 🔒 Admin | Xử lý khiếu nại: Hoàn tiền, Cảnh cáo, Khóa tài khoản, Hủy đơn. |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/admin/categories` | 🔒 Admin | Quản lý danh mục cha/con (Safe Deletion 409). |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/admin/subjects` | 🔒 Admin | Quản lý môn học (Safe Deletion 409). |
| `GET` | `/api/v1/admin/users` | 🔒 Admin | Danh sách người dùng toàn sàn (lọc role, isActive, search). |
| `GET` | `/api/v1/admin/users/{id}` | 🔒 Admin | Chi tiết tài khoản, thống kê dạy/học, 10 bookings gần nhất. |
| `PATCH` | `/api/v1/admin/users/{id}/status` | 🔒 Admin | Khóa/Mở khóa tài khoản kèm thu hồi Refresh Tokens (Chống self-lockout & bảo vệ admin cuối). |
| `GET` | `/api/v1/admin/transactions` | 🔒 Admin | Tra cứu toàn bộ dòng tiền, đối soát cổng thanh toán, lọc status, date range. |