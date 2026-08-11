# API Endpoints Design — Nền tảng Tìm Gia Sư

**Stack:** ASP.NET Core Web API (REST)
**Auth:** JWT Bearer Token (Access Token + Refresh Token)
**Quy ước:**
- Prefix chung: `/api/v1`
- Response lỗi theo format chuẩn: `{ "error": { "code": "...", "message": "..." } }`
- Các endpoint có 🔒 = yêu cầu đăng nhập, kèm role cụ thể trong ngoặc

---

## 1. Auth

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/auth/register` | Đăng ký (body có `role`: Student/Tutor) | Public |
| POST | `/auth/login` | Đăng nhập, trả về access + refresh token | Public |
| POST | `/auth/refresh` | Làm mới access token | Public (cần refresh token hợp lệ) |
| POST | `/auth/logout` | Thu hồi refresh token | 🔒 Any |
| POST | `/auth/change-password` | Đổi mật khẩu | 🔒 Any |
| GET | `/auth/me` | Lấy thông tin user hiện tại (kèm role, tutor profile nếu có) | 🔒 Any |

**Request mẫu — Register:**
```json
POST /auth/register
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "phone": "string",
  "role": "Student" // hoặc "Tutor"
}
```

> Nếu `role = Tutor`, sau khi tạo `User` thành công, backend tự tạo `TutorProfile` rỗng với `Status = PendingReview`, redirect FE sang bước hoàn thiện hồ sơ.

---

## 2. Subjects (danh mục môn học — dùng chung, do admin quản lý)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/subjects` | Danh sách môn học (dùng cho filter/dropdown) | Public |
| POST | `/subjects` | Tạo môn học mới | 🔒 Admin |
| PUT | `/subjects/{id}` | Sửa môn học | 🔒 Admin |
| DELETE | `/subjects/{id}` | Xóa môn học (chỉ khi không có tutor nào đang dùng) | 🔒 Admin |

---

## 3. Tutor Profile

### 3.1 Gia sư tự quản lý hồ sơ

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/tutors/me` | Xem hồ sơ của chính mình | 🔒 Tutor |
| PUT | `/tutors/me` | Cập nhật hồ sơ (bio, kinh nghiệm, giá, hình thức dạy...) | 🔒 Tutor |
| POST | `/tutors/me/submit-review` | Nộp hồ sơ để admin duyệt (chuyển status → `PendingReview`) | 🔒 Tutor |
| PUT | `/tutors/me/subjects` | Cập nhật danh sách môn dạy + giá riêng từng môn | 🔒 Tutor |

**Request mẫu — Cập nhật hồ sơ:**
```json
PUT /tutors/me
{
  "bio": "string",
  "education": "string",
  "experienceYears": 5,
  "hourlyRate": 200000,
  "teachingMode": "Both",
  "address": "string",
  "latitude": 10.762622,
  "longitude": 106.660172
}
```

**Request mẫu — Cập nhật môn dạy:**
```json
PUT /tutors/me/subjects
{
  "subjects": [
    { "subjectId": "guid", "overridePrice": 250000 },
    { "subjectId": "guid", "overridePrice": null }
  ]
}
```

### 3.2 Tìm kiếm gia sư (public, học viên dùng)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/tutors` | Tìm kiếm/lọc gia sư (chỉ trả về `Verified` + còn slot trống) | Public |
| GET | `/tutors/{id}` | Xem chi tiết hồ sơ 1 gia sư (kèm rating, review công khai) | Public |
| GET | `/tutors/{id}/availability?fromDate=&toDate=` | Xem lịch trống của gia sư trong khoảng ngày | Public |

**Query params cho `GET /tutors`:**
```
subjectId, minPrice, maxPrice, teachingMode, minRating,
latitude, longitude, radiusKm,
sortBy=price_asc|price_desc|rating_desc|experience_desc,
page, pageSize
```

**Response mẫu — `/tutors/{id}/availability`:**
```json
{
  "tutorProfileId": "guid",
  "availableSlots": [
    { "date": "2026-08-17", "startTime": "18:00", "endTime": "19:00" },
    { "date": "2026-08-17", "startTime": "19:00", "endTime": "20:00" }
  ]
}
```
> Backend tự tính từ `AvailabilitySlot` (theo `DayOfWeek`) trừ đi `Booking` đã có và `BlockedDate`, trả về danh sách slot rời rạc theo từng ngày cụ thể trong khoảng `fromDate`–`toDate`.

---

## 4. Availability & Blocked Dates (gia sư tự quản lý)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/tutors/me/availability-slots` | Xem lịch tuần cố định của mình | 🔒 Tutor |
| POST | `/tutors/me/availability-slots` | Thêm 1 khung giờ rảnh (dayOfWeek, startTime, endTime) | 🔒 Tutor |
| DELETE | `/tutors/me/availability-slots/{id}` | Xóa 1 khung giờ | 🔒 Tutor |
| GET | `/tutors/me/blocked-dates` | Xem danh sách ngày đã block | 🔒 Tutor |
| POST | `/tutors/me/blocked-dates` | Block 1 ngày cụ thể (kèm lý do) | 🔒 Tutor |
| DELETE | `/tutors/me/blocked-dates/{id}` | Bỏ block 1 ngày | 🔒 Tutor |

---

## 5. Booking — luồng đặt lịch (trọng tâm hệ thống)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/bookings` | Tạo booking mới (giữ chỗ tạm 15 phút, status = `Holding`) | 🔒 Student |
| POST | `/bookings/{id}/pay` | Xác nhận thanh toán → status `Holding` → `Pending` | 🔒 Student |
| POST | `/bookings/{id}/confirm` | Gia sư xác nhận booking → `Pending` → `Confirmed` | 🔒 Tutor |
| POST | `/bookings/{id}/reject` | Gia sư từ chối → `Cancelled` + hoàn tiền 100% | 🔒 Tutor |
| POST | `/bookings/{id}/cancel` | Học viên/gia sư hủy booking (áp dụng chính sách hoàn tiền theo role) | 🔒 Student/Tutor |
| POST | `/bookings/{id}/complete` | Xác nhận buổi học đã diễn ra (1 trong 2 bên gọi) | 🔒 Student/Tutor |
| GET | `/bookings/{id}` | Xem chi tiết 1 booking | 🔒 Student/Tutor liên quan, hoặc Admin |
| GET | `/bookings/me?status=&role=` | Danh sách booking của chính mình (học viên hoặc gia sư) | 🔒 Student/Tutor |

**Request mẫu — Tạo booking:**
```json
POST /bookings
{
  "tutorProfileId": "guid",
  "subjectId": "guid",
  "startTime": "2026-08-17T18:00:00Z",
  "endTime": "2026-08-17T19:00:00Z"
}
```
> Backend kiểm tra conflict (mục 6.2 trong tài liệu schema) trong transaction, trả lỗi `409 Conflict` nếu slot đã bị đặt. Nếu thành công, trả về `bookingId` + `holdExpiresAt` để FE đếm ngược 15 phút.

**Response mẫu — lỗi conflict:**
```json
409 Conflict
{
  "error": { "code": "SLOT_CONFLICT", "message": "Khung giờ đã có người đặt" }
}
```

**Request mẫu — Hủy booking:**
```json
POST /bookings/{id}/cancel
{
  "reason": "string"
}
```
> Backend tự xác định `CancelledBy` dựa theo role của người gọi API, tự tính % hoàn tiền theo chính sách (100%/50%/100%) và tạo `Transaction` type `Refund` tương ứng — không cần FE truyền số tiền hoàn.

---

## 6. Payment & Wallet

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/bookings/{id}/transaction` | Xem trạng thái giao dịch của 1 booking | 🔒 Student/Tutor liên quan |
| GET | `/tutors/me/wallet` | Xem số dư ví (pending/available) | 🔒 Tutor |
| GET | `/tutors/me/wallet/transactions` | Lịch sử giao dịch của gia sư | 🔒 Tutor |
| POST | `/tutors/me/wallet/withdraw` | Yêu cầu rút tiền (tạo request, admin xử lý thủ công) | 🔒 Tutor |

> Endpoint `/bookings/{id}/pay` ở mục 5 là nơi thực sự tích hợp cổng thanh toán (Stripe/VNPay) — trả về `paymentUrl` hoặc `clientSecret` tùy cổng thanh toán bạn chọn sau này. Webhook từ cổng thanh toán sẽ gọi vào 1 endpoint nội bộ riêng (mục 9) để cập nhật trạng thái.

---

## 7. Review

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/bookings/{id}/review` | Tạo đánh giá (chỉ khi booking đã `Completed`) | 🔒 Student/Tutor liên quan |
| GET | `/tutors/{id}/reviews` | Danh sách review công khai của 1 gia sư | Public |

**Request mẫu:**
```json
POST /bookings/{id}/review
{
  "rating": 5,
  "comment": "string"
}
```
> Backend tự xác định đây là review chiều nào (student→tutor hay tutor→student) dựa vào role người gọi, ghi vào đúng field tương ứng trong bảng `Review`. Nếu là student→tutor, sau khi lưu, backend tự cập nhật lại `RatingAvg`/`TotalReviews` của `TutorProfile`.

---

## 8. Report & Tranh chấp

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/bookings/{id}/reports` | Tạo report cho 1 booking | 🔒 Student/Tutor liên quan |
| GET | `/reports/me` | Xem các report mình đã gửi | 🔒 Student/Tutor |

**Request mẫu:**
```json
POST /bookings/{id}/reports
{
  "description": "string",
  "evidenceUrl": "string" // optional
}
```

---

## 9. Admin

### 9.1 Duyệt hồ sơ gia sư

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/tutors?status=PendingReview` | Danh sách hồ sơ chờ duyệt |
| GET | `/admin/tutors/{id}` | Xem chi tiết hồ sơ gia sư |
| POST | `/admin/tutors/{id}/approve` | Duyệt hồ sơ → `Verified` |
| POST | `/admin/tutors/{id}/reject` | Từ chối hồ sơ (kèm `rejectionReason`) → `Rejected` |
| POST | `/admin/tutors/{id}/suspend` | Khóa gia sư (do vi phạm/report) → `Suspended` |
| POST | `/admin/tutors/{id}/reinstate` | Mở khóa lại gia sư → `Verified` |

### 9.2 Quản lý người dùng

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/users?role=&search=` | Danh sách người dùng, tìm kiếm | 
| POST | `/admin/users/{id}/deactivate` | Khóa tài khoản (Student hoặc Tutor) |
| POST | `/admin/users/{id}/activate` | Mở khóa tài khoản |

### 9.3 Xử lý report/tranh chấp

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/reports?status=Open` | Danh sách report chờ xử lý |
| GET | `/admin/reports/{id}` | Chi tiết report (kèm thông tin booking liên quan) |
| POST | `/admin/reports/{id}/resolve` | Xử lý report (ghi note, quyết định hoàn tiền/suspend) |

**Request mẫu — Xử lý report:**
```json
POST /admin/reports/{id}/resolve
{
  "resolutionNote": "string",
  "refundBooking": true,
  "suspendUserId": "guid" // optional, null nếu không suspend ai
}
```

### 9.4 Giám sát booking & giao dịch (hỗ trợ tranh chấp)

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/bookings?status=&fromDate=&toDate=` | Xem toàn bộ booking trong hệ thống |
| GET | `/admin/transactions?status=&type=` | Xem toàn bộ giao dịch |
| GET | `/admin/wallets/withdraw-requests?status=Pending` | Danh sách yêu cầu rút tiền chờ xử lý |
| POST | `/admin/wallets/withdraw-requests/{id}/approve` | Duyệt yêu cầu rút tiền |

---

## 10. Background Jobs (không phải REST endpoint, nhưng cần thiết kế cùng)

Các job chạy nền (dùng Hangfire hoặc Quartz.NET trong .NET) để tự động xử lý theo thời gian:

| Job | Tần suất | Nghiệp vụ |
|---|---|---|
| `ReleaseExpiredHoldingSlots` | Mỗi 1 phút | Booking ở status `Holding` quá 15 phút chưa thanh toán → hủy, nhả slot |
| `AutoCancelUnconfirmedBookings` | Mỗi 5-10 phút | Booking `Pending` quá 24h gia sư không xác nhận → `Cancelled` + hoàn tiền 100% |
| `AutoCompleteBookings` | Mỗi giờ | Booking `Confirmed` đã qua `EndTime` + 48h, không ai xác nhận/report → tự chuyển `Completed`, giải ngân |

---

## 11. Tổng hợp theo Role — dễ hình dung khi phân quyền (Authorization Policy)

| Role | Nhóm endpoint chính |
|---|---|
| **Public** | Auth (register/login), Subjects (GET), Tutors search, Tutor detail, Reviews (GET) |
| **Student** | Bookings (tạo, pay, cancel, complete, review, report), xem profile gia sư |
| **Tutor** | Hồ sơ cá nhân, Availability/BlockedDates, Bookings (confirm, reject, complete), Wallet, Review, Report |
| **Admin** | Toàn bộ `/admin/*` — duyệt tutor, quản lý user, xử lý report, giám sát booking/transaction |

---

## 12. Bước tiếp theo đề xuất

- [ ] Định nghĩa DTO/Request-Response models chi tiết cho từng endpoint (validation rules)
- [ ] Thiết kế Authorization Policy trong .NET (`[Authorize(Roles = "Tutor")]` hoặc Policy-based cho các case phức tạp hơn như "chỉ chủ booking mới xem được")
- [ ] Chọn cổng thanh toán (Stripe/VNPay) và thiết kế webhook endpoint cụ thể
- [ ] Dựng khung project ASP.NET Core (Controllers/Services/Repositories hoặc CQRS với MediatR)