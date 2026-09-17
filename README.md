# TutorHub — Nền Tảng Kết Nối Gia Sư & Học Viên Trực Tuyến

[![.NET 8.0](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![EF Core](https://img.shields.io/badge/EF%20Core-8.0-512BD4?style=flat)](https://learn.microsoft.com/ef/core/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-573%20Passed%20(100%25)-success?style=flat&logo=xunit)](http://localhost:5129)
[![API Contract](https://img.shields.io/badge/API%20Contract-60%2F60%20Verified-success?style=flat)](docs/openapi.json)
[![Zero--Mock](https://img.shields.io/badge/Zero--Mock-Policy%20Passed-success?style=flat)](scripts/verify-frontend-api-contract.mjs)

**TutorHub** là hệ thống nền tảng marketplace kết nối Gia Sư (Tutor) và Học Viên (Student) trực tuyến chuyên nghiệp. Hệ thống được xây dựng với kiến trúc **Clean Architecture kết hợp Vertical Slice Architecture và CQRS (MediatR)** ở tầng Backend, cùng giao diện **React 18 + Vite + Ant Design + TailwindCSS** ở tầng Frontend. Vận hành theo mô hình **Service / Package-based Learning**, tích hợp cơ chế giữ chỗ thanh toán 15 phút, kích hoạt hợp đồng học tập (**Enrollment**), phân rã buổi học (**Sessions**), đối soát điểm danh 2 chiều (**Attendance Verification Window**), giải ngân theo từng buổi vào ví bảo chứng (**Escrow Wallet**), thanh toán thực tế **VNPay 2.1.0**, trao đổi thời gian thực qua **SignalR**, **Transactional Outbox** (26 sự kiện + MessageSent), công cụ giải quyết tranh chấp 2 giai đoạn (**Dispute Engine**), và sổ cái kiểm toán bất biến (**Central Audit Log**).

---

## 🏛️ Kiến Trúc Hệ Thống (System Architecture)

```text
                                ┌─────────────────────────┐
                                │   TutorHub Frontend     │ ➔ React 18, Vite, Ant Design, TailwindCSS, Zustand
                                └────────────┬────────────┘
                                             │ HTTP REST / SignalR
                                             ▼
                                ┌─────────────────────────┐
                                │       TutorHub.Api      │ ➔ Controllers, Middlewares, SignalR Hubs, Swagger
                                └────────────┬────────────┘
                                             │
                         ┌───────────────────┴───────────────────┐
                         ▼                                       ▼
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
                                             ▼
                                ┌─────────────────────────┐
                                │      TutorHub.Domain    │ ➔ Entities, Enums, Allocators, Policies
                                └─────────────────────────┘
                                             │
                                             ▼
                                ┌─────────────────────────┐
                                │      PostgreSQL 16      │ ➔ Database, Append-Only Triggers, Escrow Ledgers
                                └─────────────────────────┘
```

---

## 🚀 Tính Năng & Vòng Đời Nghiệp Vụ Cốt Lõi

1. **Xác thực & Danh tính (Auth & Identity):**
   - JWT Bearer Token (15 phút), Refresh Token Rotation (7 ngày), BCrypt password hashing.
   - Kiểm soát trạng thái tài khoản (`Active`, `Suspended`, `Banned`) và phân quyền phân cấp (`Student`, `Tutor`, `Admin`).
   - Khóa tài khoản chống brute-force sau 5 lần đăng nhập sai (15 phút).
2. **Gói dịch vụ học tập (Service Offerings):**
   - Gia sư thiết lập các gói dịch vụ học tập với các điều khoản thương mại minh bạch (`TotalPrice`, `TotalSessions`, `SessionDurationMinutes`, `TeachingMode`, `TrialLessonUrl`).
3. **Đặt mua & Giữ chỗ checkout (Booking Checkout & Holding):**
   - Cơ chế tạm giữ thanh toán 15 phút (`Holding`), background worker tự động giải phóng đơn quá hạn, ngăn chặn xung đột lịch và giữ chỗ an toàn.
4. **Hợp đồng học tập & Phân rã buổi học (Enrollment & Session Allocation):**
   - Kích hoạt hợp đồng `Enrollment` và snapshot cố định tỷ lệ phí sàn `PlatformFeeRate` (`DEC-S8-020`).
   - Tự động sinh $N$ `Session` con với số tiền earning được chia đều và lưu bất biến qua `EnrollmentSessionAllocator`.
   - Tiền thanh toán được đưa vào `PendingBalance` (Escrow) của ví gia sư.
5. **Xếp lịch & Đối soát điểm danh 2 chiều (Attendance Verification Window):**
   - Xếp lịch buổi học (`ScheduleSession`) bám sát khung giờ rảnh của gia sư (`AvailabilitySlots`) theo múi giờ chuẩn UTC và giờ hiển thị `Asia/Ho_Chi_Minh`.
   - Sau khi buổi học kết thúc, mở cửa sổ xác nhận điểm danh 24h (`AttendanceWindow`).
   - Cả Student và Tutor cùng gửi xác nhận (`StudentAttended`, `TutorAttended`).
   - Background Job `AttendanceVerificationJob` tự động giải ngân khi cả 2 xác nhận tham gia, hoặc gắn cờ xung đột (`AttendanceConflict`) khi có bất đồng.
6. **Ví tiền & Giải ngân từng buổi (Escrow Wallet & Payout Release):**
   - Tiền chỉ được giải ngân theo từng buổi học đã hoàn thành (`SessionPayoutCredit`), chuyển từ `PendingBalance` sang `AvailableBalance` sau khi trừ phí hoa hồng sàn.
   - Quản lý hạn mức rút tiền khả dụng nghiêm ngặt:
     $$\text{WithdrawableBalance} \equiv \text{AvailableBalance} - \text{HeldBalance}$$
   - Quy trình yêu cầu rút tiền về tài khoản ngân hàng và đối soát đa cấp.
7. **Hệ thống xử lý tranh chấp 2 giai đoạn (Dispute Engine):**
   - Cơ chế bảo vệ tiền tranh chấp: **Pre-release Escrow hold** (cho buổi chưa giải ngân) và **Post-release Balance hold** (cho buổi đã giải ngân).
   - Bất biến giữ tiền: Nếu số dư khả dụng không đủ thu hồi tối đa, hệ thống giữ 0 đồng (`HeldAmount = 0`) và gắn cờ `RequiresAdminFinancialIntervention` (`DEC-S8-028`).
   - Công thức cân đối phí sàn chuẩn:
     $$\text{StudentRefund} \equiv \text{TutorNetRecovery} + \text{PlatformFeeReversal}$$
   - Máy trạng thái hoàn tiền ngoại vi (`Pending` $\rightarrow$ `Succeeded` | `Failed`).
8. **Nhắn tin & Thông báo thời gian thực (Messaging, Outbox & SignalR):**
   - Hội thoại 1-1 chính danh kèm file đính kèm (giới hạn 10MB, kiểm tra whitelist định dạng an toàn).
   - Transactional Outbox xử lý tin cậy 26 loại sự kiện doanh nghiệp + MessageSent với cơ chế lease claim và dead-letter.
   - Trung tâm thông báo đa kênh (In-App và Email Background Job với retry exponential backoff).
   - SignalR realtime hub cho tin nhắn chat (`/hubs/chat`) và thông báo đẩy tức thời (`/hubs/notifications`).
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
│   ├── backend/                        # Backend .NET 8 Web API & Kiến trúc đa tầng
│   │   ├── TutorHub.Domain/            # Domain Entities, Enums, Invariants, Allocators
│   │   ├── TutorHub.Application/       # Vertical Slices (CQRS), MediatR, FluentValidation, DTOs
│   │   ├── TutorHub.Infrastructure/    # PostgreSQL EF Core, JWT, VNPay, AWS S3, SignalR, Jobs
│   │   ├── TutorHub.Api/               # Thin Controllers, Middlewares, SignalR Hubs, Filters
│   │   ├── TutorHub.sln                # Visual Studio Solution
│   │   ├── Directory.Build.props       # Cấu hình biên dịch nghiêm ngặt (<TreatWarningsAsErrors>true</TreatWarningsAsErrors>)
│   │   ├── Dockerfile                  # Multi-stage Docker build cho backend API
│   │   └── seedData.sql                # Tập dữ liệu mẫu khởi tạo quy mô lớn (Volume Seed Data)
│   │
│   ├── frontend/                       # Client Frontend React 18 & Vite
│   │   ├── src/                        # Components, Pages, Services, Hooks, Stores, Types
│   │   ├── public/                     # Assets tĩnh
│   │   ├── package.json                # Quản lý thư viện frontend
│   │   ├── vite.config.js              # Cấu hình Vite bundler & Dev Server proxy
│   │   └── tailwind.config.js          # Cấu hình TailwindCSS
│   │
│   └── test/                           # Kiểm thử tự động (573 test cases deterministics)
│       ├── TutorHub.Domain.UnitTests/          # 196 cases (Domain invariants, allocators, balance rules)
│       ├── TutorHub.Application.UnitTests/     # 283 cases (CQRS handlers, background jobs, validators)
│       ├── TutorHub.Infrastructure.UnitTests/  # 21 cases (VNPay wire format, token hashing, email)
│       └── TutorHub.Api.IntegrationTests/      # 73 cases (Postgres: payments, disputes, audit triggers)
│
├── docs/                               # Bộ tài liệu kỹ thuật chuẩn & OpenAPI spec
│   ├── openapi.json                    # OpenAPI v3 spec đầy đủ cho toàn bộ API endpoints
│   ├── prd.md                          # Product Requirements Document (PRD v1.1)
│   ├── functional-requirements.md      # Yêu cầu chức năng chi tiết (53 Chương)
│   └── user-stories.md                 # User Stories và tiêu chí nghiệm thu
│
├── scripts/                            # Bộ công cụ tự động hóa & kiểm thử chất lượng
│   ├── verify-seed.sql                 # Kịch bản SQL kiểm tra tính toàn vẹn tài chính & số dư ví
│   ├── verify-frontend-api-contract.mjs # Đối soát 60 API contracts và kiểm tra chính sách Zero-Mock
│   ├── scan-secrets.ps1                # Quét phát hiện lộ lọt thông tin nhạy cảm/credentials
│   └── dev-bootstrap.ps1               # Bootstrap môi trường phát triển tự động
│
├── docker-compose.yml                  # Cấu hình khởi chạy Docker (Postgres, API, Seed container)
├── .env.example                        # File mẫu biến môi trường cấu hình hệ thống
├── README.md                           # Tài liệu tổng quan dự án
└── CLAUDE.md                           # Cẩm nang phát triển và các luật cứng bất biến
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start)

### 1. Yêu Cầu Môi Trường (Prerequisites)
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) & [npm](https://www.npmjs.com/)
- [PostgreSQL 16+](https://www.postgresql.org/) hoặc [Docker Desktop](https://www.docker.com/)

---

### 2. Khởi Chạy Bằng Docker Compose (Khuyến nghị toàn bộ hệ thống)

Hệ thống cung cấp sẵn `docker-compose.yml` gồm 3 containers:
* `tutorhub-postgres`: PostgreSQL 16 Alpine (Port `5433:5432`).
* `tutorhub-api`: .NET 8 Web API Container (Port `8080:8080`).
* `tutorhub-seed`: One-shot container tự động nạp `seedData.sql` khi phát hiện database mới.

```bash
# Khởi chạy Docker containers
docker-compose up -d --build

# Theo dõi tiến trình khởi động & seed dữ liệu
docker-compose logs -f tutorhub-seed
```

- **Backend API Endpoint:** `http://localhost:8080`
- **PostgreSQL Database:** `localhost:5433` (`User=tutorhub`, `Password=123456`, `Database=tutorhub`)
- **Swagger UI (Development container):** `http://localhost:8080/swagger`

---

### 3. Khởi Chạy Thủ Công (Local Development)

#### Bước 1: Khởi chạy Backend .NET 8
```bash
# 1. Build Solution (Zero Warning Policy)
dotnet build src/backend/TutorHub.sln

# 2. Chạy toàn bộ 573 automated tests
dotnet test src/backend/TutorHub.sln

# 3. Chạy API Server
dotnet run --project src/backend/TutorHub.Api
```
- Local API Endpoint: `http://localhost:5129` (hoặc `https://localhost:7200`)
- Swagger UI: `http://localhost:5129/swagger`

#### Bước 2: Khởi chạy Frontend Client (React 18 + Vite)
```bash
cd src/frontend

# Cài đặt dependencies
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
- Frontend Web App: `http://localhost:5173` (hoặc cổng hiển thị trong terminal)

---

## 📊 Bộ Dữ Liệu Khởi Tạo (Volume Seed Data Specification)

Tệp dữ liệu mẫu `src/backend/seedData.sql` được thiết kế theo tiêu chuẩn thực tế production, đầy đủ quan hệ dữ liệu liên kết chuẩn xác và 100% chuẩn tiếng Việt UTF-8:

| Thực thể / Bảng | Số lượng | Mô tả chi tiết |
| :--- | :--- | :--- |
| **`Users`** | **265** | 1 Admin, 3 System Users, **50 Gia sư chuyên môn cao**, **200 Học viên** phân bố trên toàn quốc, 11 Nhân viên kiểm toán. |
| **`TutorProfiles`** | **55** | Đầy đủ tiểu sử, bằng cấp thực tế (Thạc sĩ, Tiến sĩ, Cử nhân Sư phạm), số năm kinh nghiệm, tài khoản ngân hàng và đánh giá sao thực tế. |
| **`StudentProfiles`** | **208** | Hồ sơ học viên liên kết trực tiếp với tài khoản người dùng tương ứng. |
| **`Services`** | **165** | Gói học chuyên sâu 1 kèm 1 theo 15 môn học (Toán THPT, Toán THCS, IELTS, Tiếng Anh Giao Tiếp, C# .NET, Python, Vật lý, Hóa học, Sinh học, Ngữ văn, ĐGNL, Cờ vua, Thuyết trình, Kế toán, Tiếng Nhật). |
| **`Bookings`** | **515** | Đơn đặt chỗ đa dạng trạng thái: 400 `Paid`, 50 `Holding` (15 phút checkout), 30 `Cancelled` (với 8 lý do thực tế), 35 `Expired`. |
| **`Enrollments`** | **412** | Hợp đồng học tập: 220 `Active`, 150 `Completed`, 42 `Cancelled`. |
| **`Sessions`** | **4.019** | Phân rã từ hợp đồng, tuân thủ nghiêm ngặt bất biến tài chính $\sum(\text{Session.EarningAmount}) \equiv \text{Enrollment.TotalPrice}$. |
| **`Transactions`** | **3.115** | Sổ cái bất biến: `BookingPayment` qua cổng VNPay, `SessionPayoutCredit` giải ngân theo buổi ($\text{Gross} - \text{Fee} \equiv \text{Net}$). |
| **`Wallets`** | **55** | Ví bảo chứng của gia sư với số dư luôn được đối soát chính xác: $\text{PendingBalance} \ge 0$, $\text{AvailableBalance} \ge 0$, $\text{HeldBalance} \ge 0$. |
| **`WalletTransactions`** | **2.732** | Lịch sử biến động số dư ví minh bạch (`SessionPayoutCredit`, `WithdrawalDebit`). |
| **`Withdrawals`** | **90** | Yêu cầu rút tiền về tài khoản ngân hàng với đầy đủ trạng thái (`Completed`, `Processing`, `Pending`, `Failed`). |
| **`Disputes`** | **54** | Tranh chấp 2 giai đoạn đi kèm 56 chứng cứ ảnh và ghi chú phân xử của Admin theo quy chế sàn. |
| **`LearningRecords`** | **160** | Sổ theo dõi học tập chi tiết, giáo án bài học độc lập theo từng môn học và từng buổi học. |
| **`Reviews`** | **160** | Đánh giá 4-5 sao chân thực đi kèm phản hồi cá nhân hóa từ gia sư (`TutorReply`). |
| **`Conversations` & `Messages`** | **108 / 215** | Hội thoại đối thoại 2 chiều giữa Học viên và Gia sư xoay quanh việc xin tài liệu, hỏi bài tập, đổi lịch học. |
| **`Notifications`** | **315** | Thông báo hệ thống phong phú theo thời gian thực cho học viên và gia sư. |
| **`AuditLogs`** | **72** | Nhật ký kiểm toán hành động quản trị hệ thống với Correlation ID và JSON diff trước/sau. |

### Tài khoản đăng nhập mẫu (Mật khẩu chung: `Test@123`)
* **Quản trị viên (Admin):** `admin@tutorhub.com`
* **Gia sư mẫu (Tutor):**
  * `tutor.an@tutorhub.com` (Toán & Khoa học)
  * `thutrang.math@tutorhub.vn` (Toán THPT & THCS)
  * `khoa.dang.ielts@tutorhub.vn` (IELTS 8.5)
  * `long.vu.dev@tutorhub.vn` (Lập trình .NET 8 & Clean Architecture)
  * `hoaian.python@tutorhub.vn` (Lập trình Python & Data Science)
* **Học viên mẫu (Student):**
  * `student.lan@tutorhub.com`
  * `nguyen.hoang.nam.1@gmail.com`
  * `tran.khanh.huyen.2@gmail.com`

---

## 🔍 Kiểm Chuẩn Chất Lượng & Bất Biến Tự Động (Quality Guardrails)

Dự án thiết lập các công cụ kiểm tra tự động chạy trước mỗi đợt phát hành:

```bash
# 1. Kiểm tra chính sách Zero-Mock và đối soát 60/60 API Contracts
node scripts/verify-frontend-api-contract.mjs

# 2. Quét kiểm tra bảo mật lộ mật khẩu / credentials
powershell -ExecutionPolicy Bypass -File scripts/scan-secrets.ps1

# 3. Kiểm tra tính toàn vẹn dữ liệu tài chính & số dư ví trên PostgreSQL
psql -h localhost -p 5433 -U tutorhub -d tutorhub -f scripts/verify-seed.sql
```

---

## 📜 Quy Ước Đóng Góp & Git Workflow

- Dự án tuân thủ nghiêm ngặt chuẩn **Conventional Commits**:
  - `feat(...)`: Phát triển tính năng mới
  - `fix(...)`: Sửa lỗi kỹ thuật, logic hoặc dữ liệu
  - `refactor(...)`: Tái cấu trúc mã nguồn
  - `docs(...)`: Cập nhật tài liệu kỹ thuật
- **Zero-Warning Policy:** Mọi bản build phải đạt `0 Warning(s), 0 Error(s)` dưới cờ `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.
- **Zero-Mock Policy:** Toàn bộ dịch vụ Frontend kết nối 100% với API backend thực tế, không dùng biến mock.
- **Append-Only Ledger Policy:** Không bao giờ cập nhật hay xóa các giao dịch tài chính đã giải ngân và nhật ký kiểm toán.
