# TutorHub Backend — Nền Tảng Kết Nối Gia Sư & Học Viên Trực Tuyến

[![.NET 8.0](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![EF Core](https://img.shields.io/badge/EF%20Core-8.0-512BD4?style=flat)](https://learn.microsoft.com/ef/core/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/OpenAPI-Swagger-85EA2D?style=flat&logo=swagger)](http://localhost:5129/swagger)
[![Tests](https://img.shields.io/badge/Tests-571%20Passed%20(100%25)-success?style=flat&logo=xunit)](http://localhost:5129)

**TutorHub** là hệ thống backend RESTful API chuyên nghiệp cho nền tảng marketplace kết nối Gia Sư (Tutor) và Học Viên (Student). Hệ thống được thiết kế theo kiến trúc **Clean Architecture kết hợp Vertical Slice Architecture và CQRS (MediatR)**, vận hành trên mô hình **Service / Package-based Learning**, tích hợp cơ chế giữ chỗ checkout 15 phút, kích hoạt hợp đồng học tập (**Enrollment**), phân rã buổi học (**Sessions**), đối soát điểm danh 2 chiều (**Attendance Verification Window**), giải ngân theo từng buổi vào ví bảo chứng (**Escrow Wallet**), thanh toán thực tế **VNPay 2.1.0**, trao đổi thời gian thực **SignalR**, **Transactional Outbox** (26 sự kiện + MessageSent), công cụ phân xử tranh chấp 2 giai đoạn (**Dispute Engine**), và sổ cái kiểm toán bất biến (**Central Audit Log**).

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
    - Transactional Outbox xử lý tin cậy 26 loại sự kiện doanh nghiệp + MessageSent với cơ chế lease claim và dead-letter.
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
│   └── test/                           # Kiểm thử tự động (196 + 283 + 21 + 71 = 571 executed cases)
│       ├── TutorHub.Domain.UnitTests/          # 196 cases (Domain invariants, allocators, lockout state machine)
│       ├── TutorHub.Application.UnitTests/     # 283 cases (CQRS handlers, background jobs, audit integrity)
│       ├── TutorHub.Infrastructure.UnitTests/  # 21 cases (VNPay wire format, refresh-token hashing, email wiring)
│       └── TutorHub.Api.IntegrationTests/      # 71 cases (Postgres: payments, disputes, append-only triggers, CORS/health)
│
├── scripts/
│   └── dev-bootstrap.ps1               # Dựng môi trường dev một lệnh (migrate + seed + health)
│
├── docs/                               # Bộ tài liệu kỹ thuật chuẩn
│   ├── prd.md                          # Product Requirements Document v1.1 (changelog đầu file)
│   ├── functional-requirements.md      # Functional Requirements v1.0 (53 Chương)
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
- Swagger UI: `http://localhost:8080/swagger` — **chỉ có khi container chạy Development**. Container mặc định là Production nên Swagger bị tắt và API yêu cầu cấu hình đầy đủ (SES, CORS) mới khởi động; đặt `ASPNETCORE_ENVIRONMENT=Development` trong `.env` nếu muốn dùng Swagger trong container.
- Migration **không** tự chạy khi khởi động — dùng `scripts/dev-bootstrap.ps1` hoặc `dotnet ef database update` trước.

---

### 3. Khởi Chạy Trực Tiếp Bằng .NET CLI (Local Development)

#### Bước 1: Build toàn bộ Backend Solution
```bash
dotnet build src/backend/TutorHub.sln
```

#### Bước 2: Chạy bộ kiểm thử (Test Suite — 571 Passed: 196 Domain + 283 Application + 21 Infrastructure + 71 Integration)
```bash
dotnet test src/backend/TutorHub.sln
```
> Integration test cần PostgreSQL đang chạy ở `localhost:5432` (DB `tutorhub_integration` được tạo tự động).

#### Bước 3: Chuẩn bị database (migration + dữ liệu mẫu)
```powershell
scripts\dev-bootstrap.cmd          # wrapper; hoặc:
powershell -ExecutionPolicy Bypass -File scripts/dev-bootstrap.ps1
```
Script kiểm tra `.env`, PostgreSQL, áp migration còn thiếu, nạp `src/backend/seedData.sql` (chỉ khi DB chưa có user; thêm `-Force` để nạp lại — **sẽ xoá dữ liệu nghiệp vụ hiện có**) rồi gọi `/health`.

#### Bước 4: Chạy API Server
```bash
dotnet run --project src/backend/TutorHub.Api
```
Truy cập Swagger UI tại: `http://localhost:5129/swagger` (hoặc `https://localhost:7200/swagger`) theo `launchSettings.json`.

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

## 🔌 Tích Hợp Frontend (Frontend Integration Contract)

### Base URL & OpenAPI
- Local (`dotnet run`): `http://localhost:5129/api/v1` — Swagger UI: `http://localhost:5129/swagger`
- Docker: `http://localhost:8080/api/v1`
- Đặc tả commit sẵn: [`docs/openapi.json`](docs/openapi.json) — sinh từ môi trường Development nên **có cả route dev-only** (route này không tồn tại ở Production).
- Sinh lại đặc tả khi API thay đổi:
  ```bash
  dotnet run --project src/backend/TutorHub.Api     # cửa sổ khác
  curl -s http://localhost:5129/swagger/v1/swagger.json -o docs/openapi.json
  ```

### Hợp đồng phản hồi (áp dụng cho mọi endpoint)
```json
// Thành công
{ "success": true, "message": "…", "data": { }, "errors": null, "traceId": null, "timestamp": "…" }
// Lỗi (kể cả 400/401/403/404/409/429/500 — không dùng ProblemDetails)
{ "success": false, "message": "…", "data": null, "errors": ["chi tiết"], "traceId": "…" }
```
- camelCase; enum serialize dạng **chuỗi** (`"Attended"`, `"Released"`, `"Holding"`).
- Danh sách dùng `PagedResult<T>` với thứ tự xác định (`CreatedAt` giảm dần, rồi `Id`).

### Xác thực & giới hạn tần suất
- `POST /api/v1/auth/login` → `accessToken` (15 phút) + `refreshToken` (7 ngày); khi 401 gọi `POST /api/v1/auth/refresh`.
- Refresh token lưu dạng hash; logout/đổi mật khẩu thu hồi toàn bộ token cũ.
- Sai mật khẩu **5 lần** → khoá tài khoản **15 phút** (`Auth:MaxFailedAttempts` / `Auth:LockoutMinutes`), message chung chung `"Invalid email or password."` (chống dò tài khoản).
- Rate limit theo IP: `auth-strict` **10 req/phút** (login/register/refresh), `payment` **60 req/phút** (VNPay), global **300 req/phút**. Vượt hạn mức → **429** kèm `Retry-After` và envelope lỗi.
- SignalR: `/hubs/chat` và `/hubs/notifications`; JWT truyền qua query `?access_token=<accessToken>`.

### Giả lập thanh toán tại local (dev-only)
VNPay gọi IPN từ server của họ nên không thể tới máy local, còn Return URL là read-only (`CLAUDE.md` luật #11). Vì vậy ở **Development** có endpoint chạy đúng handler IPN production, cho phép đi hết luồng checkout → enrollment → session:
```bash
# 1) POST /api/v1/payments/vnpay/create-url  (lấy merchantRef cho booking)
# 2) Giả lập IPN thành công:
curl -X POST http://localhost:5129/api/v1/dev/payments/simulate-ipn \
  -H "Content-Type: application/json" \
  -d '{ "bookingId": "<booking-guid>", "success": true }'
```
- `success: false` để kiểm thử nhánh thanh toán thất bại (booking vẫn `Holding`).
- Gọi lại lần hai trả `ackCode = "02"` (duplicate) và không kích hoạt trùng.
- Endpoint bị **loại bỏ khỏi controller discovery** ngoài Development (404), không phải chỉ chặn bằng attribute.

### Tài khoản seed (mật khẩu chung `Test@123`)
| Email | Role |
|---|---|
| `admin@tutorhub.com` | Admin |
| `tutor.an@tutorhub.com` | Tutor |
| `student.lan@tutorhub.com` | Student |

Dữ liệu mẫu: 10 danh mục, 15 môn, 15 gói học, ví/đơn/tranh chấp mẫu (xem `src/backend/seedData.sql`).

---

## 🧰 Troubleshooting

### API không khởi động
Options có `ValidateOnStart` nên API **từ chối chạy** khi thiếu cấu hình. Kiểm tra `.env` có đủ: `Jwt__Secret`, `RefreshToken__Pepper`, `VnPay__HashSecret`, `CloudflareR2__*`; ngoài Development cần thêm `Ses__FromAddress` và `Cors__AllowedOrigins`. Giá trị còn là placeholder (`change_me`, `your_`, `super_secret`) cũng bị chặn.

### `/health` trả 503
Readiness gồm 2 check: `database` (kết nối PostgreSQL) và `platform-fee-setting` (bản ghi `PlatformFeeRate` trong `PlatformSettings`). Thiếu setting nghĩa là chưa seed hoặc chưa cấu hình qua `PUT /api/v1/admin/platform-settings/fee-rate`.

### `dotnet ef database update` báo `42701: column … already exists`
Schema đã bị sửa **ngoài EF** (thêm cột bằng tay) nhưng migration chưa được ghi vào `__EFMigrationsHistory`. Cách xử lý: đối chiếu cột/constraint thực tế rồi ghi lại migration, ví dụ với `20260914142220_AddAccountLockout`:
```sql
-- Chỉ chạy sau khi đã xác nhận cột tồn tại và constraint còn thiếu
ALTER TABLE "Users" ADD CONSTRAINT "CK_User_NonNegativeFailedLogins" CHECK ("AccessFailedCount" >= 0);
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260914142220_AddAccountLockout', '8.0.11');
```
Kiểm tra lại bằng `dotnet ef migrations list --project src/backend/TutorHub.Infrastructure --startup-project src/backend/TutorHub.Api --no-build` (không còn dòng `(Pending)`).

### Build báo `MSB3021/MSB3027: file is locked by "TutorHub.Api"`
Tiến trình API đang chạy giữ file trong `bin`. Dừng rồi build lại:
```powershell
Stop-Process -Name "TutorHub.Api" -Force -ErrorAction SilentlyContinue
```

---

## 📜 Quy Ước Đóng Góp & Git Workflow

- Dự án tuân thủ nghiêm ngặt quy chuẩn **Conventional Commits**:
  - `feat(...)`: Phát triển tính năng mới
  - `fix(...)`: Sửa lỗi
  - `refactor(...)`: Tái cấu trúc mã nguồn
  - `docs(...)`: Cập nhật tài liệu
- Chế độ biên dịch nghiêm ngặt: Mọi thay đổi phải đảm bảo **0 Warning(s), 0 Error(s)** dưới cờ `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.
- Bộ kiểm thử tự động luôn phải đạt **100% tỉ lệ vượt qua** trước khi tạo pull request.
