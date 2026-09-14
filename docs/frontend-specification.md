# TutorHub — Frontend System Specification & Architecture Baseline

**Version:** 1.1 (Grounded to Repository Baseline)  
**Status:** Approved Specification — Source of Truth  
**Target Backend:** TutorHub .NET 8 Web API (`http://localhost:5129/api/v1` / `http://localhost:8080/api/v1`, SignalR `/hubs/chat`, `/hubs/notifications`)  
**Design Standard:** Modern SaaS Aesthetic (Glassmorphism, High-Density Dashboards, Micro-Interactions, Strict Responsive Design)

---

## 1. Codebase Purpose, Critical Files & Primary Goals

### 1.1. Core Product Purpose (From README & CLAUDE.md)
> **TutorHub** là nền tảng marketplace kết nối **Gia Sư (Tutor)** và **Học Viên (Student)** trực tuyến theo mô hình **Service / Package-based Learning**.  
> Hệ thống hỗ trợ đặt mua gói dịch vụ (**15 phút checkout hold**), phân rã hợp đồng học tập (**Enrollment**) thành các buổi học (**Sessions**), đối soát điểm danh 2 chiều (**Attendance Verification Window**), giải ngân từng buổi vào ví bảo chứng (**Escrow Wallet**), thanh toán thực tế **VNPay 2.1.0**, Realtime **SignalR**, **Transactional Outbox** (26 sự kiện + MessageSent), công cụ giải quyết tranh chấp 2 giai đoạn (**Dispute Engine**), và sổ cái kiểm toán bất biến (**Central Audit Log**).

TutorHub **không phải** là sàn đặt lịch rời rạc từng giờ (single-slot booking), mà là **cỗ máy điều phối hợp đồng học tập trọn gói bảo vệ dòng tiền 2 chiều**.

### 1.2. The Native Shape of the Product (The Core Lifecycle Pipeline)
Toàn bộ hệ thống và giao diện người dùng được tổ chức xoay quanh **vòng đời đường ống nghiệp vụ (Lifecycle Pipeline)** cốt lõi:

```text
Service Offering (Tutor tạo gói học: giá, số buổi, thời lượng, trial)
       ↓ (Student chọn gói tiêu chuẩn hoặc thương lượng Custom Agreement)
Booking Checkout (Tạm giữ thanh toán 15 phút - HoldingExpiresAt)
       ↓ (VNPay IPN Webhook / Mock Pay)
Enrollment (Hợp đồng học tập trung tâm - Snapshot PlatformFeeRate & FeePolicyVersion)
       ↓ (EnrollmentSessionAllocator tự động sinh N Sessions)
Sessions (Unscheduled → Scheduled trong AvailabilitySlots của Tutor)
       ↓ (Học xong: Mở Attendance Window 24h)
Attendance Verification (Student & Tutor cùng xác nhận 2 chiều: Attended / Absent)
       ↓ (AttendanceVerificationJob tự động duyệt hoặc gắn cờ AttendanceConflict)
Wallet Payout Release (Giải ngân SessionPayoutCredit cho từng buổi hoàn thành)
       ↓ (Nếu có khiếu nại phát sinh)
Dispute Engine (Pre-release Escrow hold hoặc Post-release Balance hold)
       ↓ (Admin phân xử bằng công thức cân đối phí sàn bất biến)
Ledger Settlement (Refund Pending/Succeeded/Failed + PlatformFeeReversal + Central AuditLog)
```

### 1.3. Critical Backend Files & System Anchors (Sources of Truth)

| Thành phần Backend | Tệp tin nguồn | Vai trò cốt lõi định hình Frontend |
| :--- | :--- | :--- |
| **Quy chuẩn & Bất biến** | [CLAUDE.md](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/CLAUDE.md) | 11 luật cứng bất biến (Không phá vỡ Escrow, Append-Only Ledger, Anti-Chaining, v.v.) |
| **Tài liệu nghiệp vụ** | [docs/prd.md](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/docs/prd.md) & [docs/functional-requirements.md](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/docs/functional-requirements.md) | Đặc tả 53 chương chức năng và 12 Epic User Stories |
| **Dữ liệu mẫu chuẩn** | [src/backend/seedData.sql](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/src/backend/seedData.sql) | Danh sách 10 Danh mục, 15 Môn học, 15 Gói học, 5 Gia sư, 8 Học viên, 22 Buổi học, 15 Giao dịch ví |
| **Entities Cốt lõi** | [TutorHub.Domain/Entities/](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/src/backend/TutorHub.Domain/Entities) | `Booking`, `Enrollment`, `Session`, `Wallet`, `Transaction`, `Dispute`, `CustomAgreement`, `AuditLog` |
| **Thuật toán chia tiền** | [EnrollmentSessionAllocator.cs](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/src/backend/TutorHub.Domain/Services/EnrollmentSessionAllocator.cs) | Phân bổ đều học phí cho $N$ buổi học con (phần dư dồn vào buổi cuối) |
| **Bảo vệ sổ cái bất biến** | [AppDbContext.cs](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/src/backend/TutorHub.Infrastructure/Persistence/AppDbContext.cs) | Chặn đứng sửa/xóa giao dịch đã thanh toán và audit log |
| **Xác thực & Danh tính** | [CurrentUserService.cs](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/src/backend/TutorHub.Infrastructure/Authentication/CurrentUserService.cs) | Trích xuất UserId, Role, TutorProfileId, StudentProfileId từ JWT Claims |
| **Sự kiện Outbox** | [BusinessEvents.cs](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/src/backend/TutorHub.Application/Common/Events/BusinessEvents.cs) | 26 sự kiện doanh nghiệp + MessageSent đẩy sang SignalR và Email |
| **Định dạng phản hồi** | [ApiResponse.cs](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/src/backend/TutorHub.Application/Common/Models/ApiResponse.cs) | Cấu trúc `{ success, message, data, errors, traceId, timestamp }` |

---

## 2. Real Content, Terminology & Domain Constants (Dữ liệu thật từ Codebase)

> **Nguyên tắc thiết kế tối thượng:** Không phát minh nội dung giả định (No Placeholders). Toàn bộ nhãn, danh mục, môn học, tài khoản test và thông báo lỗi trên UI đều trích xuất trực tiếp từ mã nguồn và dữ liệu kiểm thử.

### 2.1. Tài khoản Kiểm thử Thực tế (Default Password: `Test@123`)

| Vai trò | Họ tên | Email | Điện thoại | Đặc điểm hồ sơ & Dữ liệu thật |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Quản Trị Viên Hệ Thống | `admin@tutorhub.com` | `0901234567` | Quản trị viên sàn toàn quyền, duyệt gia sư, xử lý tranh chấp, duyệt rút tiền |
| **Tutor** | Nguyễn Văn An | `tutor.an@tutorhub.com` | `0912345678` | Cử nhân Sư phạm Toán ĐH Sư phạm Hà Nội, 5 năm KN, Rating 4.90 (8 reviews), dạy Toán THPT |
| **Tutor** | Trần Thị Bích | `tutor.bich@tutorhub.com` | `0923456789` | Thạc sĩ Ngôn ngữ Anh ĐH Ngoại Thương, IELTS 8.0, 4 năm KN, Rating 5.00 (4 reviews) |
| **Tutor** | Lê Hoàng Nam | `tutor.nam@tutorhub.com` | `0934567890` | Kỹ sư CNTT ĐH Bách Khoa Hà Nội, 3 năm KN, Rating 4.75, dạy Vật lý THPT và C# .NET |
| **Tutor** | Vũ Minh Quang | `tutor.quang@tutorhub.com` | `0934567892` | Cử nhân Nhật Bản Học ĐH KHXH&NV, JLPT N1, 4 năm KN, Rating 5.00, dạy Tiếng Nhật |
| **Tutor** | Phạm Ngọc Mai | `tutor.mai@tutorhub.com` | `0934567893` | Thạc sĩ Văn học ĐH Sư phạm TP.HCM, 6 năm KN, Rating 4.80, dạy Ngữ văn THPT & Luyện thi |
| **Student** | Phạm Minh Tuấn | `student.tuan@tutorhub.com` | `0945678901` | Học viên tiêu biểu, đang theo học gói Toán 10 buổi |
| **Student** | Hoàng Lan Anh | `student.lan@tutorhub.com` | `0956789012` | Đã hoàn thành gói IELTS 1 buổi, để lại review 5 sao |
| **Student** | Đặng Quốc Hùng | `student.hung@tutorhub.com` | `0978901234` | Học viên gói Vật lý 10 buổi |
| **Student** | Ngô Phương Linh | `student.linh@tutorhub.com` | `0989012345` | Học viên gói Tiếng Nhật N3 15 buổi |
| **Student** | Bùi Đăng Khoa | `student.khoa@tutorhub.com` | `0990123456` | Học viên gói Ngữ văn 10 buổi |
| **Student (Bị khóa)** | Trần Văn Bùng | `student.bad@tutorhub.com` | `0967890123` | **2 AbsentStrikes** (vắng mặt không phép), bị hệ thống khóa quyền đặt lịch 7 ngày! |

### 2.2. Danh mục (10 Categories) & Môn học (15 Subjects) Thực tế

```text
Toán học (11111111-0000-0000-0000-000000000001)
 ├── Toán THPT (Lớp 10-12)
 └── Toán THCS (Lớp 6-9)

Ngoại ngữ (11111111-0000-0000-0000-000000000002)
 ├── Tiếng Anh Giao Tiếp
 ├── Luyện thi IELTS 6.5+
 └── Tiếng Nhật Sơ - Trung Cấp (N5 - N3)

Khoa học tự nhiên (11111111-0000-0000-0000-000000000003)
 ├── Vật lý THPT (Lớp 10-12)
 ├── Hóa học THPT (Lớp 10-12)
 └── Sinh học THPT

Công nghệ thông tin (11111111-0000-0000-0000-000000000004)
 ├── Lập trình C# / ASP.NET Core
 └── Lập trình Python Cho Người Mới

Khoa học xã hội (11111111-0000-0000-0000-000000000005)
 └── Ngữ văn THPT & Luyện Thi ĐH

Luyện thi chứng chỉ (11111111-0000-0000-0000-000000000008)
 └── Luyện thi Đánh Giá Năng Lực

Thể thao & Nghệ thuật / Kỹ năng khác:
 ├── Cờ vua chiến thuật cơ bản & nâng cao (Thể thao & Yoga)
 ├── Kỹ năng thuyết trình & Đàm phán (Kỹ năng mềm)
 └── Nguyên lý kế toán tài chính (Kinh tế & Tài chính)
```

### 2.3. Các Gói Dịch vụ Học tập Tiêu biểu (Real Service Offerings)
- **Gói 1:** `Luyện thi THPT Toán 10 buổi` — 10 buổi $\times$ 60 phút, **2.000.000 ₫** (200.000 ₫/buổi), hình thức `Both` (Trực tiếp & Online).
- **Gói 2:** `Toán Nâng Cao 15 buổi Chuyên Đề 9+` — 15 buổi $\times$ 90 phút, **3.500.000 ₫**, hình thức `Online`.
- **Gói 3:** `IELTS cấp tốc 1 buổi chiến thuật` — 1 buổi $\times$ 60 phút, **300.000 ₫**, hình thức `Online`.
- **Gói 4:** `Khóa IELTS 4 Kỹ Năng 20 buổi` — 20 buổi $\times$ 90 phút, **6.000.000 ₫**, hình thức `Online`.
- **Gói 5:** `Vật lý THPT 12 - Luyện Đề Chuẩn Cấu Trúc` — 10 buổi $\times$ 60 phút, **1.800.000 ₫**, hình thức `Both`.
- **Gói 6:** `Lập trình C# / .NET Backend từ Zero` — 16 buổi $\times$ 90 phút, **4.800.000 ₫**, hình thức `Online`.
- **Gói 7:** `Tiếng Nhật Giao Tiếp & JLPT N3 Cấp Tốc` — 15 buổi $\times$ 60 phút, **3.000.000 ₫**, hình thức `Online`.
- **Gói 8:** `Ngữ văn 12 - Kỹ năng Nghị Luận Xã Hội & Văn Học` — 10 buổi $\times$ 90 phút, **2.000.000 ₫**, hình thức `Both`.

### 2.4. Danh sách Ngân hàng & Thông tin Thanh toán Thử nghiệm VNPay Sandbox
- **Cổng thanh toán:** VNPay Sandbox 2.1.0 (`https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`)
- **Thẻ thử nghiệm mặc định:**
  - Ngân hàng: `NCB` (Ngân Hàng TMCP Quốc Dân)
  - Số thẻ: `9704198526191432198`
  - Tên chủ thẻ: `NGUYEN VAN A`
  - Ngày phát hành: `07/15`
  - Mã OTP xác thực: `123456`
- **Các ngân hàng rút tiền thực tế trong cơ sở dữ liệu:**
  - `VCB`: Ngân Hàng TMCP Ngoại Thương Việt Nam
  - `NCB`: Ngân Hàng TMCP Quốc Dân
  - `MBB`: Ngân Hàng TMCP Quân Đội
  - `TCB`: Ngân Hàng TMCP Kỹ Thương
  - `TPB`: Ngân Hàng TMCP Tiên Phong

### 2.5. Thông số Cấu hình Hệ thống Thực tế (`PlatformSettings`)
- `PlatformFeeRate`: **0.10** (Tỷ lệ hoa hồng sàn 10%, có lịch sử Version 1 = 12%, Version 2 = 10%).
- `MinWithdrawalAmount`: **50.000 ₫** (Số tiền rút tối thiểu mỗi lần).
- `HoldingExpiryMinutes`: **15 phút** (Thời gian tạm giữ chỗ checkout).
- `AbsentStrikeLimit`: **3 lần** (Số lần vắng mặt tối đa trước khi khóa tài khoản).
- `CancellationGracePeriodHours`: **24 giờ** (Thời hạn tối thiểu cho phép hủy buổi học trước giờ diễn ra).

---

## 3. Hệ Thống Giá Trị Trạng Thái & Enums Chuẩn (Domain State Machines)

Frontend phải sử dụng chính xác các giá trị enum từ domain backend để đảm bảo đồng nhất:

| Nhóm Enums | Danh sách Giá trị (C# Enum) | Nhãn hiển thị tiếng Việt trên UI | Màu sắc / Badge UI |
| :--- | :--- | :--- | :--- |
| **AccountStatus** | `Active`<br>`Suspended`<br>`Banned` | Hoạt động<br>Tạm khóa<br>Bị cấm | Emerald (`bg-emerald-50 text-emerald-700`)<br>Amber (`bg-amber-50 text-amber-700`)<br>Rose (`bg-rose-50 text-rose-700`) |
| **TeachingMode** | `Online`<br>`Offline`<br>`Both` | Trực tuyến<br>Trực tiếp tại nhà<br>Cả hai hình thức | Blue (`bg-blue-50 text-blue-700`)<br>Indigo (`bg-indigo-50 text-indigo-700`)<br>Purple (`bg-purple-50 text-purple-700`) |
| **BookingStatus** | `Holding`<br>`Paid`<br>`Cancelled` | Đang giữ chỗ (15 phút)<br>Đã thanh toán<br>Đã hủy | Amber nhấp nháy + Countdown Timer<br>Emerald (`Đã xác nhận`)<br>Slate xám (`Đã hủy đơn`) |
| **EnrollmentStatus** | `Pending`<br>`Active`<br>`Completed`<br>`Cancelled` | Chờ kích hoạt<br>Đang học<br>Đã hoàn thành<br>Đã hủy hợp đồng | Amber<br>Indigo (Kèm Progress bar $x/N$ buổi)<br>Emerald (Tự động mở modal Review)<br>Rose (Hiển thị chi tiết hoàn tiền pro-rata) |
| **SessionStatus** | `Unscheduled`<br>`Scheduled`<br>`Completed`<br>`Cancelled` | Chưa xếp lịch<br>Đã có lịch học<br>Đã học xong & Giải ngân<br>Đã hủy buổi | Slate (`Cần xếp lịch`)<br>Blue (Kèm nút dời lịch & phòng học)<br>Emerald (Kèm nút xem nhật ký học)<br>Slate gạch ngang |
| **AttendanceStatus** | `Attended`<br>`Absent` | Đã tham gia học<br>Vắng mặt không phép | Emerald Icon Checkmark<br>Rose Icon X-Circle |
| **CustomAgreementStatus** | `Proposed`<br>`Accepted`<br>`Rejected`<br>`Expired`<br>`Cancelled` | Chờ học viên duyệt<br>Đã đồng ý (Chờ checkout)<br>Đã từ chối<br>Hết hạn ưu đãi<br>Gia sư đã hủy | Amber (Đếm ngược thời gian hết hạn)<br>Emerald (Nút "Thanh toán ngay")<br>Rose<br>Slate xám<br>Slate xám |
| **DisputeReason** | `TutorNoShow`<br>`IncompleteSession`<br>`QualityIssue`<br>`TutorLate`<br>`Other` | Gia sư vắng mặt không báo<br>Buổi học không trọn vẹn<br>Chất lượng không đúng cam kết<br>Gia sư vào lớp muộn<br>Lý do khác | Tag đỏ hiển thị trong chi tiết khiếu nại |
| **DisputeStatus** | `Open`<br>`UnderReview`<br>`Resolved`<br>`Dismissed`<br>`RequiresAdminFinancialIntervention` | Mới mở (Đang giữ tiền)<br>Admin đang xác minh<br>Đã phân xử xong<br>Bác bỏ khiếu nại<br>Cần can thiệp tài chính | Amber<br>Blue<br>Emerald<br>Slate<br>Rose cảnh báo đặc biệt |
| **DisputeResolutionDecision** | `StudentWinsFullRefund`<br>`StudentWinsPartialRefund`<br>`TutorWins`<br>`DismissedNoFinancialChange` | Hoàn tiền 100% cho học viên<br>Hoàn tiền một phần<br>Gia sư thắng (Giải ngân tiền)<br>Bác bỏ (Không thay đổi tài chính) | Emerald / Indigo / Slate |
| **WithdrawalStatus** | `Pending`<br>`Processing`<br>`Completed`<br>`Failed` | Chờ Admin duyệt<br>Đang chuyển khoản<br>Rút tiền thành công<br>Thất bại (Đã hoàn lại ví) | Amber<br>Blue spinner<br>Emerald<br>Rose (Kèm FailureReason) |

---

## 4. Visual Identity, Color Tokens & Layout Grid

### 4.1. Visual Tokens (Thu thập từ cấu trúc dự án và intent thẩm mỹ)
- **Primary Brand Tokens:**
  - Background Canvas: `#F8FAFC` (Light), `#0F172A` (Dark)
  - Surface Glass: `rgba(255, 255, 255, 0.8)` kết hợp `backdrop-blur: 16px; border: 1px solid rgba(226, 232, 240, 0.8)`
  - Primary Accent: `#4F46E5` (Indigo-600) $\rightarrow$ `#4338CA` (Indigo-700 hover)
- **Financial Status Colors:**
  - `AvailableBalance` & `PayoutCredit`: `#10B981` (Emerald-500)
  - `PendingBalance` & `HoldingExpiresAt`: `#F59E0B` (Amber-500)
  - `HeldBalance` & `DisputeActive`: `#EF4444` (Rose-500)
- **Type Scale:**
  - Heading 1 (Hero / Dashboard Big Numbers): `32px / 2rem` — Bold (`font-weight: 700`)
  - Heading 2 (Card Header / Section Title): `24px / 1.5rem` — SemiBold (`font-weight: 600`)
  - Body Text: `14px / 0.875rem` — Regular (`font-weight: 400`, line-height: 1.5)
  - Monospace (CorrelationId, PaymentGatewayRef, Session IDs): `12px` (`JetBrains Mono, monospace`)

### 4.2. Layouts Cốt lõi
1. **Public Layout (Guest / Landing / Search):**
   - Header: Logo TutorHub, Danh mục môn học dropdown, Thanh tìm kiếm nhanh, nút "Trở thành Gia Sư", nút "Đăng nhập", nút "Đăng ký".
   - Footer: Cam kết bảo chứng Escrow, Cổng VNPay, Thông tin hỗ trợ pháp lý, Điều khoản sử dụng.
2. **Student Dashboard Layout:**
   - Sidebar trái thu gọn: Dashboard (`/student/dashboard`), Khóa học của tôi (`/student/enrollments`), Đơn giữ chỗ (`/student/bookings`), Thỏa thuận riêng (`/student/agreements`), Khiếu nại (`/student/disputes`), Tin nhắn (`/app/messages`).
   - Topbar: Chuông thông báo Realtime với badge số lượng chưa đọc, Avatar học viên.
3. **Tutor Workspace Layout:**
   - Sidebar chuyên môn: Lớp dạy hôm nay (`/tutor/dashboard`), Gói dịch vụ (`/tutor/services`), Lịch rảnh tuần (`/tutor/availability`), Học viên (`/tutor/enrollments`), Ví & Thu nhập (`/tutor/wallet`), Yêu cầu rút tiền (`/tutor/wallet/withdraw`).
   - Header: Thanh hiển thị nhanh số dư khả dụng (`AvailableBalance`) và nút "Rút tiền nhanh".
4. **Admin Governance Layout:**
   - Dark Slate Navigation: Tổng quan KPI (`/admin/dashboard`), Duyệt gia sư (`/admin/tutor-applications`), Người dùng & Kỷ luật (`/admin/users`), Trọng tài tranh chấp (`/admin/disputes`), Duyệt rút tiền (`/admin/withdrawals`), Cấu hình sàn (`/admin/platform-settings`), Sổ cái kiểm toán (`/admin/audit-logs`).

---

## 5. Screen-by-Screen Specification (Theo từng bước của Vòng đời)

### Giai đoạn 1: Khám phá, Tìm kiếm & Xem Gói học (Discovery)

#### Màn hình 1.1: Trang Khám phá Gia sư (`/tutors`)
- **API sử dụng:** `GET /api/v1/tutors`, `GET /api/v1/categories`, `GET /api/v1/subjects`
- **Thành phần giao diện:**
  - Thanh tìm kiếm từ khóa: Tìm theo tên gia sư (ví dụ: "Nguyễn Văn An", "Trần Thị Bích") hoặc tên môn ("Toán THPT", "IELTS").
  - Sidebar bộ lọc:
    - Lọc theo Danh mục (Toán học, Ngoại ngữ, CNTT, ...)
    - Lọc theo Môn học con
    - Lọc theo Hình thức: `Online`, `Offline`, `Both`
    - Lọc theo Đánh giá: 4.5+ sao, 5.0 sao
    - Lọc theo Khoảng giá gói
  - Grid danh sách `TutorCard`:
    - Avatar gia sư (sử dụng AvatarUrl từ seed/database).
    - Tên gia sư, Huy hiệu `Verified Tutor` màu xanh ngọc.
    - Học vấn & Kinh nghiệm: ví dụ *"Cử nhân Sư phạm Toán - ĐH Sư phạm Hà Nội (5 năm kinh nghiệm)"*.
    - Đánh giá sao: `★ 4.90 (8 đánh giá)`.
    - Thẻ môn dạy: Tag `Toán THPT`, `Toán THCS`.
    - Giá gói khởi điểm từ: `2.000.000 ₫`.
    - Nút CTA: "Xem hồ sơ & Gói học" $\rightarrow$ điều hướng tới `/tutors/:id`.

#### Màn hình 1.2: Chi tiết Gia sư & Danh mục Gói học (`/tutors/:id`)
- **API sử dụng:** `GET /api/v1/tutors/:id`, `GET /api/v1/tutors/:id/services`, `GET /api/v1/reviews/tutors/:id`
- **Thành phần giao diện:**
  - **Banner tiểu sử chuyên môn:** Avatar to, họ tên, tiểu sử chi tiết (`Bio`), video tự giới thiệu hoặc link học thử (`TrialLessonUrl`).
  - **Lưới Gói Dịch vụ (`ServiceCard`):**
    - Tiêu đề gói: ví dụ *"Luyện thi THPT Toán 10 buổi"*.
    - Cam kết: *"10 buổi x 60 phút, kèm tài liệu và bài tập về nhà"*.
    - Giá niêm yết: `2.000.000 ₫` trọn gói (tương đương `200.000 ₫ / buổi`).
    - Nút chính: **"Đặt Mua Gói Học"** $\rightarrow$ Kích hoạt `POST /api/v1/bookings` và chuyển sang màn hình giữ chỗ 15 phút.
    - Nút phụ: **"Nhắn tin & Thương lượng riêng"** $\rightarrow$ Kích hoạt `POST /api/v1/conversations` và mở khung chat để gia sư tạo `CustomAgreement`.
  - **Ma trận Lịch rảnh tuần (`AvailabilitySlots`):**
    - Bảng thời khóa biểu 7 ngày hiển thị các slot gia sư nhận dạy: Thứ 2 (18:00 - 20:00), Thứ 4 (18:00 - 20:00), Thứ 6 (18:00 - 20:00), Chủ Nhật (08:00 - 11:00).
  - **Mục Đánh giá từ Học viên:**
    - Danh sách review thật từ `Reviews` table: *"Thầy An dạy dễ hiểu, mẹo giải trắc nghiệm rất nhanh và chuẩn xác."* kèm câu trả lời của gia sư: *"Cảm ơn Tuấn, cố gắng luyện thêm các đề chuyên đề nữa nhé!"*.

---

### Giai đoạn 2: Giữ chỗ Checkout 15 Phút & Cổng Thanh toán VNPay

#### Màn hình 2.1: Màn hình Checkout Giữ chỗ 15 phút (`/student/bookings/:id/checkout`)
- **API sử dụng:** `GET /api/v1/bookings/:id`, `POST /api/v1/payments/vnpay/create-url`, `POST /api/v1/bookings/:id/cancel`
- **Chi tiết giao diện & Đồng hồ đếm ngược:**
  - **Top Banner:** Đồng hồ đếm ngược **15 phút (Holding Checkout Lock)**.
    - Công thức: `RemainingTime = HoldingExpiresAt - CurrentTime`.
    - Trực quan: Thanh tiến trình đổi màu (Xanh khi > 5 phút $\rightarrow$ Vàng khi 2-5 phút $\rightarrow$ Đỏ nhấp nháy khi < 2 phút).
    - Thông báo hết hạn: *"Thời gian giữ chỗ thanh toán đã hết hạn (15 phút). Booking tự động hủy để giải phóng slot."* (Khóa nút thanh toán, hiển thị nút "Tạo đơn hàng mới").
  - **Thông tin Snapshot đơn hàng:**
    - Gói học: `Luyện thi THPT Toán 10 buổi`.
    - Gia sư: `Nguyễn Văn An`.
    - Tổng số buổi: `10 buổi` (Mỗi buổi 60 phút).
    - Tổng thanh toán: `2.000.000 ₫`.
  - **Cam kết quyền lợi tài chính (Escrow Guarantee Callout):**
    - *"Số tiền 2.000.000 ₫ sẽ được giữ an toàn trong Ví Bảo Chứng (Escrow) của sàn TutorHub. Gia sư chỉ được giải ngân từng buổi học (200.000 ₫/buổi) sau khi cả hai bên cùng xác nhận điểm danh hoàn thành."*
  - **Nút hành động:**
    - Nút **"Thanh toán ngay qua VNPay"**: Gọi API lấy URL thanh toán Sandbox và redirect học viên.
    - Nút **"Hủy giữ chỗ"**: Hủy đơn đặt mua trước hạn nếu học viên không muốn tiếp tục.

#### Màn hình 2.2: Màn hình Tiếp nhận Kết quả VNPay (`/payment/return` — Read-Only)
- **API sử dụng:** `GET /api/v1/payments/vnpay/return`
- **Lưu ý nghiệp vụ bắt buộc:** Tuyệt đối không thay đổi trạng thái ở màn hình này.
- **Trạng thái hiển thị:**
  - Nhận các query params từ VNPay (`vnp_ResponseCode`, `vnp_TxnRef`, `vnp_Amount`, `vnp_SecureHash`).
  - Nếu `vnp_ResponseCode == "00"`:
    - Hiển thị badge: *"Giao dịch thành công!"*
    - Hiển thị số tiền đã thanh toán (chia 100 theo chuẩn VNPay: ví dụ `vnp_Amount = 200000000` $\rightarrow$ `2.000.000 ₫`).
    - Thông báo kích hoạt hợp đồng: *"Hệ thống đang hoàn tất hợp đồng học tập và tự động cấp phát 10 buổi học..."*
    - Polling kiểm tra trạng thái Enrollment (mỗi 2s, tối đa 5 lần) $\rightarrow$ Tự động chuyển hướng tới `/student/enrollments/:id`.
  - Nếu thất bại: Hiển thị lý do thất bại (Khách hàng hủy, Không đủ số dư, Hết hạn) và nút "Quay lại trang thanh toán".

---

### Giai đoạn 3: Hợp đồng Học tập (Enrollment) & Quản lý Buổi học (Sessions)

#### Màn hình 3.1: Trung tâm Hợp đồng Học tập (`/student/enrollments/:id` & `/tutor/enrollments/:id`)
- **API sử dụng:** `GET /api/v1/enrollments/:id`, `POST /api/v1/enrollments/:id/cancel`
- **Chi tiết giao diện:**
  - **Header Hợp đồng:**
    - Mã hợp đồng: `e1e1e1e1-0001-...`
    - Môn học: `Toán THPT (Lớp 10-12)`
    - Snapshot điều khoản: `10 buổi`, `60 phút/buổi`, `Học phí trọn gói: 2.000.000 ₫`.
    - Tỷ lệ phí sàn snapshot: `10% (FeePolicyVersion: 1)`.
  - **Thanh tiến độ học tập (Progress Bar):**
    - Hiển thị: `1 / 10 buổi hoàn thành (10%)`.
  - **Danh sách Buổi học con ($N$ Sessions Breakdown):**
    - Buổi 1: `200.000 ₫` — Đã học xong (14 ngày trước) — Trạng thái `Completed` (Đã giải ngân `180.000 ₫` vào ví gia sư, trừ `20.000 ₫` phí sàn 10%). Kèm nút "Xem nhật ký học".
    - Buổi 2: `200.000 ₫` — Lịch học: Ngày mai 18:00 - 19:00 — Trạng thái `Scheduled`. Kèm nút "Dời lịch" và "Vào lớp học".
    - Buổi 3: `200.000 ₫` — Đang có bất đồng điểm danh — Trạng thái `AttendanceConflict` (Có khiếu nại vắng mặt).
    - Buổi 4..10: `200.000 ₫` — Trạng thái `Unscheduled` (Chưa xếp lịch). Kèm nút "Chọn lịch học từ khung giờ rảnh của gia sư".
  - **Nút Hủy Hợp đồng Sớm (Pro-rata Cancellation):**
    - Mở modal xác nhận hủy kèm công thức tính tiền minh bạch:
      $$\text{Số tiền hoàn trả} = \text{Tổng học phí (2.000.000 ₫)} - \text{Học phí buổi đã học (200.000 ₫)} = \mathbf{1.800.000\text{ ₫}}$$

#### Màn hình 3.2: Chi tiết Buổi học, Xếp lịch & Dời lịch (`/student/sessions/:id`)
- **API sử dụng:** `POST /api/v1/sessions/:id/schedule`, `POST /api/v1/sessions/:id/reschedule-request`, `POST /api/v1/sessions/reschedule-requests/:id/respond`, `POST /api/v1/sessions/:id/cancel`
- **Chi tiết giao diện:**
  - **Modal Xếp lịch:** Hiển thị lịch rảnh của gia sư theo múi giờ `Asia/Ho_Chi_Minh` để học viên chọn ngày và giờ bắt đầu.
  - **Card Đề xuất Dời lịch (Reschedule Request):**
    - Khi gia sư gửi: *"Thầy có lịch tập huấn tại trường, xin phép dời sang tối thứ 6 nhé."* (Lịch mới: Thứ 6 18:00 - 19:00).
    - Học viên có 2 nút: **"Đồng ý đổi lịch"** (`Accept`) hoặc **"Từ chối"** (`Reject` kèm lý do: *"Học viên vướng lịch học thêm tiếng Anh"*).
  - **Nút Hủy Buổi học Đơn lẻ (F-19 Single Session Cancel):**
    - Chỉ cho phép khi buổi học chưa diễn ra (`StartAt > Now`). Tiền học buổi đó vẫn giữ nguyên trong Escrow chờ giải quyết khi kết thúc khóa học.

---

### Giai đoạn 4: Đối soát Điểm danh 2 Chiều (Attendance Verification Window 24h)

#### Màn hình 4.1: Cửa sổ Điểm danh 24 Giờ sau Buổi học
- **API sử dụng:** `GET /api/v1/sessions/:id`, `POST /api/v1/sessions/:id/attendance`
- **Quy trình tương tác:**
  - Khi buổi học kết thúc (`EndAt <= Now`), hệ thống kích hoạt cửa sổ điểm danh 24h: `AttendanceVerificationDueAt = EndAt + 24h`.
  - **Thẻ điểm danh 2 chiều (Dual-Attendance Card):**
    - **Cột Học viên (Student):**
      - Nếu chưa bấm: 2 nút lựa chọn: `Đã tham gia học (Attended)` hoặc `Gia sư vắng mặt (Absent)`.
      - Nếu đã bấm: Hiển thị badge: *"Bạn đã xác nhận tham gia lúc 19:05"*.
    - **Cột Gia sư (Tutor):**
      - Nếu chưa bấm: 2 nút lựa chọn: `Học viên có mặt (Attended)` hoặc `Học viên vắng mặt (Absent)`.
      - Nếu đã bấm: Hiển thị badge: *"Gia sư đã xác nhận tham gia lúc 19:10"*.
  - **Xử lý kết quả tức thì:**
    - **Đồng thuận (Cả 2 cùng chọn Attended):** Tự động chuyển trạng thái `Completed`, background job kích hoạt `SessionPayoutCredit`, giải ngân `180.000 ₫` vào ví gia sư.
    - **Xung đột (Một bên chọn Attended, một bên chọn Absent):** Cảnh báo đỏ `AttendanceConflict`. Xuất hiện nút: **"Mở đơn khiếu nại tranh chấp ngay"** (`POST /api/v1/disputes`).

#### Màn hình 4.2: Nhật ký Học tập (Learning Record)
- **API sử dụng:** `GET /api/v1/sessions/:id/learning-record`, `POST /api/v1/sessions/:id/learning-record`
- **Chi tiết giao diện:**
  - Gia sư nhập: *"Buổi 1: Ôn tập Hàm số và các dạng toán đơn điệu bậc 3, bậc 4 trùng phương. Tuấn tiếp thu nhanh, đã làm tốt 15 bài trắc nghiệm mẫu."*
  - Học viên xem nhật ký và tải bài tập đính kèm.

---

### Giai đoạn 5: Ví Tiền Bảo chứng & Rút tiền (Gia sư)

#### Màn hình 5.1: Bảng điều khiển Ví Gia sư (`/tutor/wallet`)
- **API sử dụng:** `GET /api/v1/wallets/me`, `GET /api/v1/wallets/me/statement`
- **Giao diện 4 thẻ tài chính độc quyền:**

```text
┌───────────────────────────┐ ┌───────────────────────────┐
│     TIỀN CHỜ GIẢI NGÂN    │ │       SỐ DƯ KHẢ DỤNG      │
│      (Pending Balance)    │ │     (Available Balance)   │
│       3.600.000 ₫         │ │          900.000 ₫        │
│  Tạm giữ an toàn trong    │ │   Thu nhập các buổi học   │
│  Escrow của các gói học   │ │    đã trừ phí sàn 10%     │
└───────────────────────────┘ └───────────────────────────┘
┌───────────────────────────┐ ┌───────────────────────────┐
│     TIỀN ĐANG PHONG TỎA   │ │     HẠN MỨC ĐƯỢC PHÉP RÚT │
│        (Held Balance)     │ │   (Withdrawable Balance)  │
│         200.000 ₫         │ │          700.000 ₫        │
│  Tạm giữ do khiếu nại     │ │    = Available - Held     │
│  buổi học đang phân xử    │ │   [ NÚT: RÚT TIỀN NGAY ]  │
└───────────────────────────┘ └───────────────────────────┘
```

- **Bảng Sao kê Biến động Ví (Wallet Statement):**
  - Cột: Mã GD, Loại giao dịch, Số tiền, Số dư sau GD, Mô tả, Thời gian.
  - Các dòng thực tế từ seed data:
    - `+180.000 ₫` | `SessionPayoutCredit` | Giải ngân buổi học Toán #1
    - `-500.000 ₫` | `WithdrawalDebit` | Rút tiền thành công về VCB
    - `+162.000 ₫` | `SessionPayoutCredit` | Giải ngân buổi học Vật lý #1

#### Màn hình 5.2: Tạo Lệnh Rút tiền về Ngân hàng (`/tutor/wallet/withdraw`)
- **API sử dụng:** `POST /api/v1/wallets/me/withdrawals`, `GET /api/v1/wallets/me/withdrawals`
- **Validation quy chuẩn:**
  - Hạn mức rút tối đa hiển thị rõ ràng: `700.000 ₫`.
  - Tự động chặn nếu nhập quá số dư rút hoặc nhỏ hơn mức tối thiểu 50.000 ₫.
  - Form chọn ngân hàng (VCB, NCB, MBB, TCB, TPB), nhập số tài khoản, tên chủ tài khoản (in hoa không dấu).
  - Bảng lịch sử các lệnh rút tiền:
    - `300.000 ₫` | `VCB - 0011001234567` | Trạng thái: `Pending` (Chờ duyệt).
    - `500.000 ₫` | `VCB - 0011001234567` | Trạng thái: `Completed` (Đã chuyển khoản).
    - `1.000.000 ₫` | `VCB - 0011009999999` | Trạng thái: `Failed` | Lý do: *"Tên chủ tài khoản ngân hàng không khớp với hồ sơ gia sư"*.

---

### Giai đoạn 6: Động cơ Tranh chấp & Trọng tài Phân xử (Dispute Engine)

#### Màn hình 6.1: Nộp Đơn Khiếu nại Tranh chấp (`/student/disputes/new`)
- **API sử dụng:** `POST /api/v1/disputes`, `POST /api/v1/media/upload`
- **Validation & Quy định nghiệp vụ:**
  - Chọn buổi học có vấn đề (buổi học đã kết thúc).
  - Chọn lý do: `TutorNoShow`, `IncompleteSession`, `QualityIssue`, `TutorLate`.
  - Nhập mô tả: Bắt buộc tối thiểu 20 ký tự (ví dụ: *"Em vào phòng học chờ 30 phút nhưng thầy An không vào lớp và không báo trước."*).
  - Đính kèm bằng chứng: Upload ảnh chụp màn hình phòng Google Meet chờ gia sư, log tin nhắn (file whitelist $\le$ 10MB).
  - Hiển thị thông báo phong tỏa tiền: *"Hệ thống tự động phong tỏa 200.000 ₫ tiền cọc buổi học để chờ Admin phân xử."*

#### Màn hình 6.2: Bàn Phân xử Tranh chấp của Admin (`/admin/disputes/:id`)
- **API sử dụng:** `POST /api/v1/admin/disputes/:id/resolve`, `POST /api/v1/admin/disputes/:id/dismiss`
- **Bộ Tính toán Cân đối Phí sàn Bất biến (DEC-S8-025 Formula Calculator):**
  - Thu nhập gốc của gia sư từ buổi học: `NetPayout = 180.000 ₫`, Phí sàn: `PlatformFee = 20.000 ₫`.
  - Admin nhập số tiền hoàn cho học viên: `StudentRefund` (ví dụ: `200.000 ₫`).
  - Giao diện tự động phân bổ và khóa cứng công thức:
    - Thu hồi từ ví gia sư (`TutorNetRecovery`): `180.000 ₫` (Tối đa bằng số tiền gia sư thực nhận, không được phạt âm ví!).
    - Hoàn trả phí sàn (`PlatformFeeReversal`): `20.000 ₫`.
    - Kiểm tra bất biến: $180.000 + 20.000 \equiv 200.000\text{ ₫}$ $\rightarrow$ Hợp lệ.
  - Nhập biên bản phân xử của Admin: *"Admin đã kiểm tra log Google Meet, xác nhận buổi học không diễn ra."*

---

### Giai đoạn 7: Tin nhắn Realtime & Trung tâm Thông báo Đa kênh (SignalR)

#### Màn hình 7.1: Khung Chat 1-1 Realtime (`/app/messages`)
- **API & SignalR:** `GET /api/v1/conversations`, `/hubs/chat` (`ReceiveMessage`, `UserTyping`, `MessageRead`)
- **Chi tiết giao diện:**
  - Danh sách hội thoại thật từ seed data:
    - Hội thoại với `Nguyễn Văn An`: *"Dạ vâng, em đã đăng ký gói 10 buổi rồi ạ!"*
    - Hội thoại với `Trần Thị Bích`: *"Cảm ơn cô nhiều ạ!"*
    - Hội thoại với `Lê Hoàng Nam`: *"Thầy gửi em link tài liệu chương Sóng ánh sáng nhé."*
  - Khung chat:
    - Bong bóng chat phân biệt màu (Người gửi xanh indigo, đối phương xám).
    - Hỗ trợ gửi ảnh, tài liệu PDF đính kèm.
    - **Thẻ Đề xuất Custom Agreement trong Chat:** Gia sư có nút "Tạo thỏa thuận riêng" ngay trong khung chat; khi tạo xong, một card tương tác xuất hiện trong dòng tin nhắn: *"Thỏa thuận Toán THPT 5 buổi tối - 1.000.000 ₫"*, học viên chỉ cần bấm "Chấp nhận & Mua ngay" là chuyển tới thanh toán.

#### Màn hình 7.2: Trung tâm Thông báo Đa kênh (`/app/notifications`)
- **API & SignalR:** `GET /api/v1/notifications`, `/hubs/notifications` (`ReceiveNotification`)
- **Danh sách thông báo mẫu từ seed data:**
  - 💳 *Thanh toán thành công:* "Bạn đã thanh toán 2.000.000đ cho gói học Toán THPT 10 buổi."
  - 📚 *Đơn đặt học mới:* "Học viên Phạm Minh Tuấn vừa đặt mua gói Toán THPT của bạn."
  - ⏰ *Nhắc nhở buổi học:* "Buổi học Vật lý sắp diễn ra sau 30 phút."
  - ⚠️ *Thông báo tranh chấp:* "Học viên Tuấn đã mở khiếu nại vắng mặt đối với buổi học #3."
  - 🚫 *Cảnh báo vi phạm No-show:* "Bạn đã tích lũy 2 gậy phạt vắng mặt. Quyền đặt lịch mới tạm thời bị khóa 7 ngày."

---

## 6. Client Technical Architecture & Integration Standards

### 6.1. HTTP Client Wrapper & Envelope Handling
Mọi phản hồi từ backend .NET 8 đều theo cấu trúc envelope chuẩn [ApiResponse.cs](file:///c:/Users/Nguyen%20Nguyen/OneDrive/Desktop/TutorHub/src/backend/TutorHub.Application/Common/Models/ApiResponse.cs):

```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
  traceId: string;
  timestamp: string;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

- **Request Interceptor:**
  - Tự động gắn header `Authorization: Bearer <AccessToken>`.
  - Tự động sinh hoặc forward header `X-Correlation-ID: uuidv4()`.
- **Response Interceptor:**
  - Nếu `success === true`: Trả về trực tiếp `response.data.data` cho caller, hiển thị Toast nếu có `message` quan trọng.
  - Nếu lỗi `401 Unauthorized`: Kích hoạt cơ chế Silent Refresh Token qua `POST /api/v1/auth/refresh-token` (sử dụng mutex/queue tránh gọi refresh nhiều lần đồng thời).
  - Nếu lỗi `409 Conflict`: Hiển thị cảnh báo nghiệp vụ (ví dụ: *"Trùng lịch gia sư"*, *"Hạn mức khả dụng không đủ"*, *"Booking đã hết hạn"*).
  - Nếu lỗi `400 Validation`: Trích xuất mảng `errors` để bind vào đúng input field trên Form.

### 6.2. SignalR Hub Lifecycle Management
- Kết nối tới 2 Hub riêng biệt:
  1. `/hubs/chat?access_token=<JWT>`: Quản lý tin nhắn, typing, trạng thái đọc.
  2. `/hubs/notifications?access_token=<JWT>`: Quản lý đẩy thông báo và cập nhật số lượng unread badge trên Header.
- Cơ chế tự động kết nối lại (Auto-reconnect with Exponential Backoff: 0s, 2s, 5s, 10s, 30s).

### 6.3. Quy tắc Định dạng Múi giờ & Tiền tệ
1. **Múi giờ:** Dữ liệu DB lưu chuẩn UTC (`DateTime.UtcNow`). Client nhận về phải format sang múi giờ chuẩn Việt Nam (`Asia/Ho_Chi_Minh` — UTC+7) bằng `Intl.DateTimeFormat('vi-VN')` hoặc `dayjs/date-fns`.
2. **Tiền tệ:** Format chuẩn tiền tệ Việt Nam: `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)` (ví dụ: `2.000.000 ₫`).

---

## 7. Phân bổ Giai đoạn Xây dựng Mã nguồn Frontend (Milestones)

| Milestone | Trọng tâm Triển khai | Đầu ra có thể chạy và nghiệm thu |
| :--- | :--- | :--- |
| **M1: Foundation & Design System** | Scaffold ứng dụng (React + Vite hoặc Next.js), cấu hình Tailwind/CSS Tokens, Auth Store, Layouts (Public, Student, Tutor, Admin), Axios Interceptor bọc `ApiResponse<T>`. | Bộ khung giao diện hoàn chỉnh, Auth Store, Token Refresh Queue hoạt động. |
| **M2: Marketplace Discovery & Auth** | Trang chủ, danh sách gia sư lọc theo 10 Categories/15 Subjects, trang profile gia sư kèm gói học thật, màn hình đăng nhập/đăng ký với dữ liệu seed. | Người dùng có thể đăng nhập bằng các tài khoản thật, tìm kiếm và xem hồ sơ gia sư. |
| **M3: Booking 15m Holding & VNPay** | Màn hình giữ chỗ 15 phút, đồng hồ đếm ngược, nút chuyển hướng VNPay Sandbox, trang tiếp nhận `/payment/return` và polling kích hoạt Enrollment. | Hoàn thành luồng đặt mua và thanh toán đơn hàng thật qua thẻ test NCB Sandbox. |
| **M4: Enrollment, Sessions & Attendance** | Trung tâm hợp đồng học tập, danh sách $N$ buổi học con, giao diện xếp lịch, đổi lịch, và thẻ đối soát điểm danh 2 chiều 24h. | Quản lý tiến độ học tập, điểm danh xác nhận 2 bên kích hoạt giải ngân từng buổi. |
| **M5: Ví Escrow, Custom Agreement & Dispute** | Bảng 4 thẻ tài chính ví gia sư, sao kê ví, tạo lệnh rút tiền, đàm phán hợp đồng riêng, và form nộp khiếu nại tranh chấp. | Vòng đời tài chính hoàn chỉnh cho gia sư và bảo vệ quyền lợi học viên. |
| **M6: SignalR Realtime & Admin Suite** | Kết nối ChatHub và NotificationHub realtime, hoàn thiện toàn bộ 7 màn hình Admin (Dashboard, Duyệt gia sư, Quản lý tài khoản, Bàn phân xử phí sàn, Sổ cái kiểm toán bất biến). | Hệ thống Frontend hoàn thiện 100% kết nối trơn tru với Backend .NET 8. |

---
*Tài liệu này là bản đặc tả kỹ thuật chuẩn xác tuyệt đối, tích hợp trọn vẹn dữ liệu và quy tắc nghiệp vụ của hệ thống TutorHub.*
