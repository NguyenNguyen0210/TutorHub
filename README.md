# TutorHub Backend — Nền Tảng Kết Nối Gia Sư & Học Viên Trực Tuyến

[![.NET 8.0](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![EF Core](https://img.shields.io/badge/EF%20Core-8.0-512BD4?style=flat)](https://learn.microsoft.com/ef/core/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/OpenAPI-Swagger-85EA2D?style=flat&logo=swagger)](http://localhost:5000/swagger)
[![Tests](https://img.shields.io/badge/Tests-398%20Passed%20(100%25)-success?style=flat&logo=xunit)](http://localhost:5000)

**TutorHub** là hệ thống backend RESTful API chuyên nghiệp cho nền tảng marketplace kết nối Gia Sư (Tutor) và Học Viên (Student). Hệ thống được thiết kế theo kiến trúc **Clean Architecture kết hợp Vertical Slice Architecture và CQRS (MediatR)**, vận hành trên mô hình **Service / Package-based Learning**, tích hợp cơ chế giữ chỗ checkout 15 phút, kích hoạt hợp đồng học tập (**Enrollment**), phân rã buổi học (**Sessions**), đối soát điểm danh 2 chiều (**Attendance Verification Window**), giải ngân theo từng buổi vào ví bảo chứng (**Escrow Wallet**), thanh toán thực tế **VNPay 2.1.0**, trao đổi thời gian thực **SignalR**, **Transactional Outbox** (24 sự kiện), công cụ phân xử tranh chấp 2 giai đoạn (**Dispute Engine**), và sổ cái kiểm toán bất biến (**Central Audit Log**).

---

## 🏛️ Kiến Trúc Hệ Thống (Architecture Overview)

```text
                    ┌─────────────────────────┐
                    │       TutorHub.Api      │ ➔ Controllers, Middlewares, SignalR Hubs, Swagger
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             ↓                                       ↓
┌─────────────────────────┐             ┌─────────────────────────┐
│   TutorHub.Application  │             │ TutorHub.Infrastructure │
│  - Vertical Slices/CQRS │             │  - EF Core & Npgsql     │
│  - MediatR Handlers     │ ◄───────────┤  - JWT Token Services   │
│  - Fluent Validations   │  implements │  - VNPay SHA512 Service │
│  - DTOs & Abstractions  │             │  - Cloudflare R2 AWS S3 │
│  - Outbox & Events      │             │  - Background Jobs (6)  │
└────────────┬────────────┘             └────────────┬────────────┘
             │                                       │
             └───────────────────┬───────────────────┘
                                 ↓
                    ┌─────────────────────────┐
                    │      TutorHub.Domain    │ ➔ Entities, Enums, Allocators, Policies
                    └─────────────────────────┘
```

---

## 🚀 Tính Năng & Vòng Đời Nghiệp Vụ Cốt Lõi

1. **Xác thực & Danh tính (Auth & Identity):** JWT Bearer Token (15 phút), Refresh Token Rotation (7 ngày), BCrypt password hashing, kiểm soát trạng thái tài khoản (`Active`, `Suspended`, `Banned`), và phân quyền Role-based (`Student`, `Tutor`, `Admin`).
2. **Gói dịch vụ học tập (Service Offerings):** Gia sư đăng tải các gói dịch vụ học tập với các điều khoản thương mại rõ ràng (`TotalPrice`, `TotalSessions`, `SessionDurationMinutes`, `TeachingMode`, `TrialLessonUrl`).
3. **Đặt mua & Giữ chỗ checkout (Booking Checkout & Holding):** Cơ chế tạm giữ thanh toán 15 phút (`Holding`), background worker tự động hủy đơn quá hạn, ngăn chặn double-payment và giữ chỗ an toàn.
4. **Hợp đồng học tập & Phân rã buổi học (Enrollment & Session Allocation):** Khi thanh toán thành công (VNPay IPN hoặc Mock Pay):
   - Kích hoạt hợp đồng `Enrollment` và snapshot cố định tỷ lệ phí sàn `PlatformFeeRate` (`DEC-S8-020`).
   - Tự động sinh $N$ `Session` con với số tiền earning được chia đều và lưu bất biến qua `EnrollmentSessionAllocator`.
   - Tiền thanh toán được đưa vào `PendingBalance` (Escrow) của ví gia sư.
5. **Xếp lịch & Đối soát điểm danh 2 chiều (Attendance Verification Window):**
   - Xếp lịch buổi học (`ScheduleSession`) bám sát lịch rảnh định kỳ của gia sư (`AvailabilitySlots`) và múi giờ chuẩn UTC/Việt Nam.
   - Sau khi buổi học kết thúc, mở cửa sổ xác nhận điểm danh 24h (`AttendanceWindow`).
   - Cả Student và Tutor cùng gửi xác nhận (`StudentAttended`, `TutorAttended`).
   - Job ngầm `AttendanceVerificationJob` tự động giải ngân khi cả 2 xác nhận tham gia, hoặc gắn cờ xung đột (`AttendanceConflict`) khi có bất đồng.
6. **Ví tiền & Giải ngân từng buổi (Escrow Wallet & Payout Release):**
   - Tiền chỉ được giải ngân theo từng buổi học đã hoàn thành (`SessionPayoutCredit`), chuyển từ `PendingBalance` sang `AvailableBalance` sau khi trừ phí hoa hồng sàn.
   - Quản lý hạn mức rút tiền khả dụng `WithdrawableBalance = AvailableBalance - HeldBalance`.
   - Quy trình rút tiền với đầy đủ thông tin ngân hàng và phê duyệt đa cấp của Admin.
7. **Hệ thống xử lý tranh chấp 2 giai đoạn (Dispute Engine - Sprint 8):**
   - Cơ chế bảo vệ tiền tranh chấp: **Pre-release Escrow hold** (đối với buổi chưa giải ngân) và **Post-release Balance hold** (đối với buổi đã giải ngân).
   - Bất biến giữ tiền: Nếu số dư khả dụng không đủ thu hồi tối đa, hệ thống giữ 0 đồng (`HeldAmount = 0`) và chuyển cờ `RequiresAdminFinancialIntervention` (`DEC-S8-028`).
   - Thuật toán cân đối phí sàn bất biến:
     $$\text{StudentRefund} \equiv \text{TutorNetRecovery} + \text{PlatformFeeReversal}$$
   - Máy trạng thái hoàn tiền ngoại vi (`Pending` $\rightarrow$ `Succeeded` | `Failed`).
8. **Nhắn tin & Thông báo thời gian thực (Messaging, Outbox & SignalR):**
   - Hội thoại 1-1 chính danh kèm file đính kèm (giới hạn 10MB, kiểm tra whitelist định dạng an toàn).
   - Transactional Outbox xử lý tin cậy 24 loại sự kiện doanh nghiệp với cơ chế lease claim và dead-letter.
   - Trung tâm thông báo đa kênh (In-App và Email Background Job với retry exponential backoff).
   - SignalR realtime hub cho tin nhắn chat và thông báo đẩy tức thời.
9. **Quản trị toàn diện & Sổ cái kiểm toán (Governance & Central Audit Log):**
   - Quản lý và snapshot lịch sử thay đổi phí sàn toàn hệ thống (`PlatformSetting`, `PlatformSettingVersion`).
   - Phân tích doanh thu sàn thực nhận (đối soát trừ đi các khoản hoàn phí do khiếu nại).
   - Sổ cái tài chính và nhật ký kiểm toán bất biến: `AppDbContext` chặn đứng mọi hành vi chỉnh sửa hoặc xóa giao dịch đã quyết toán (`INV-LEDGER-007`) và bản ghi kiểm toán (`INV-LEDGER-006`).
   - Truy vết xuyên suốt request với `X-Correlation-ID`.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
TutorHub/
├── src/
│   ├── backend/                        # Toàn bộ mã nguồn & cấu hình Backend .NET 8
│   │   ├── TutorHub.Domain/            # Entities, Enums, Allocators, Policies
│   │   ├── TutorHub.Application/       # Vertical Slices (Features), MediatR CQRS, DTOs, Events, Validators
│   │   ├── TutorHub.Infrastructure/    # EF Core DbContext, PostgreSQL, JWT, VNPay, Cloudflare R2, Jobs, SignalR
│   │   ├── TutorHub.Api/               # REST API Controllers, Middlewares, SignalR Hubs
│   │   ├── TutorHub.sln                # Visual Studio Solution chứa toàn bộ projects & tests
│   │   ├── Directory.Build.props       # Cấu hình biên dịch tập trung (TreatWarningsAsErrors=true)
│   │   ├── Dockerfile                  # Docker container build script cho backend
│   │   └── seedData.sql                # Dữ liệu mẫu khởi tạo hệ thống
│   │
│   ├── frontend/                       # Mã nguồn ứng dụng Client Frontend
│   │   └── README.md
│   │
│   └── test/                           # Kiểm thử tự động (Unit Tests & Integration Tests)
│       ├── TutorHub.Domain.UnitTests/      # 122 Tests (Domain invariants, allocators, entities)
│       └── TutorHub.Application.UnitTests/ # 276 Tests (CQRS handlers, background jobs, audit integrity)
│
├── docs/                               # Bộ tài liệu kỹ thuật chuẩn (Frozen Baseline)
│   ├── prd.md                          # Product Requirements Document v1.0
│   ├── functional-requirements.md      # Functional Requirements v1.0 (50 Chương)
│   └── user-stories.md                 # User Stories v1.0
│
├── docker-compose.yml                  # Cấu hình khởi chạy Docker PostgreSQL & Backend Container
├── .env.example                        # Template biến môi trường
├── README.md                           # Tài liệu tổng quan dự án
└── CLAUDE.md                           # Quy chuẩn phát triển và bất biến hệ thống
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start)

### 1. Yêu Cầu Môi Trường (Prerequisites)
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [PostgreSQL 16+](https://www.postgresql.org/) hoặc [Docker Desktop](https://www.docker.com/)

### 2. Khởi Chạy Bằng Docker Compose (Khuyến nghị)
```bash
docker-compose up -d --build
```
- API Endpoint: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger`

---

### 3. Khởi Chạy Trực Tiếp Bằng .NET CLI (Local Development)

#### Bước 1: Build toàn bộ Backend Solution
```bash
dotnet build src/backend/TutorHub.sln
```

#### Bước 2: Chạy bộ kiểm thử (Test Suite — 398/398 Passed)
```bash
dotnet test src/backend/TutorHub.sln
```

#### Bước 3: Chạy API Server
```bash
dotnet run --project src/backend/TutorHub.Api
```
Truy cập Swagger UI tại: `http://localhost:5000/swagger` (hoặc `https://localhost:7000/swagger`).

---

## 💳 Quy Trình Thanh Toán & Mua Gói Học

1. **Khám phá dịch vụ:** Học viên tra cứu danh sách gói học `GET /api/v1/tutors/{tutorId}/services`.
2. **Tạo Booking Checkout:** Gọi `POST /api/v1/bookings` truyền `serviceId` ➔ Nhận thông tin đơn đặt chỗ (15 phút).
3. **Thanh toán qua VNPay Sandbox:**
   - Gọi `POST /api/v1/payments/vnpay/create-url` với `bookingId` để nhận `paymentUrl`.
   - Dùng thẻ test VNPay Sandbox: Ngân hàng `NCB`, số thẻ `9704198526191432198`, tên `NGUYEN VAN A`, ngày `07/15`, OTP `123456`.
   - Webhook IPN ngầm kích hoạt: Chuyển `Booking = Paid`, sinh `Enrollment`, tự động cấp phát các `Session` con, và ghi nhận tiền cọc vào `PendingBalance` của ví gia sư.
4. **Học tập & Hoàn thành:**
   - Xếp lịch buổi học qua `POST /api/v1/sessions/{id}/schedule`.
   - Điểm danh 2 chiều qua `POST /api/v1/sessions/{id}/attendance`.
   - Hệ thống tự động giải ngân earning từng buổi vào `AvailableBalance` sau khi đối soát thành công.

---

## 📜 Quy Ước Đóng Góp & Git Workflow

- Dự án tuân thủ nghiêm ngặt quy chuẩn **Conventional Commits**:
  - `feat(...)`: Phát triển tính năng mới
  - `fix(...)`: Sửa lỗi
  - `refactor(...)`: Tái cấu trúc mã nguồn
  - `docs(...)`: Cập nhật tài liệu
- Chế độ biên dịch nghiêm ngặt: Mọi thay đổi phải đảm bảo **0 Warning(s), 0 Error(s)** dưới cờ `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.
- Bộ kiểm thử tự động luôn phải đạt **100% tỉ lệ vượt qua** trước khi tạo pull request.
