# TutorHub — Nền Tảng Công Nghệ Kết Nối Gia Sư & Học Viên Trực Tuyến

<p align="center">
  <img src="src/frontend/public/logo.png" alt="TutorHub Logo" width="160" />
</p>

<p align="center">
  <b>Hệ thống EdTech Marketplace định hướng dịch vụ (Service & Package-Based Learning), ứng dụng kiến trúc Clean Architecture, CQRS, cơ chế ký quỹ bảo chứng Escrow, giải ngân tự động 12 giờ (Grace Period) và phân giải tranh chấp tài chính 2 giai đoạn.</b>
</p>

<p align="center">
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 8.0" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 5" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend%20Tests-733%20Passed-success?style=flat-square&logo=xunit" alt="Backend Tests: 733 Passed" />
  <img src="https://img.shields.io/badge/Playwright%20E2E-22%20Passed-success?style=flat-square&logo=playwright" alt="Playwright E2E: 22 Passed" />
  <img src="https://img.shields.io/badge/Architecture-Clean%20%2B%20CQRS-blueviolet?style=flat-square" alt="Clean Architecture + CQRS" />
  <img src="https://img.shields.io/badge/Security-OAuth2%20PKCE%20%7C%20JWT%20Rotation-green?style=flat-square" alt="Security" />
  <img src="https://img.shields.io/badge/Database-Append--Only%20Ledger-orange?style=flat-square" alt="Append-Only Ledger" />
</p>

---

## 📌 Mục Lục

1. [Tổng Quan Dự Án](#-tổng-quan-dự-án)
2. [Kiến Trúc Kỹ Thuật (Architecture)](#-kiến-trúc-kỹ-thuật-architecture)
3. [Các Tính Năng & Nghiệp Vụ Cốt Lõi](#-các-tính-năng--nghiệp-vụ-cốt-lõi)
4. [Ngăn Xếp Công Nghệ (Technology Stack)](#-ngăn-xếp-công-nghệ-technology-stack)
5. [Cấu Trúc Thư Mục Repository](#-cấu-trúc-thư-mục-repository)
6. [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
7. [Kiểm Thử Tự Động (Automated Testing)](#-kiểm-thử-tự-động-automated-testing)

---

## 🎯 Tổng Quan Dự Án

**TutorHub** là giải pháp sàn thương mại điện tử giáo dục trực tuyến toàn diện, kết nối học viên có nhu cầu học tập chất lượng cao với đội ngũ gia sư được kiểm định chặt chẽ. Hệ thống giải quyết triệt để các bài toán hóc búa của mô hình gia sư truyền thống:
* **Xung đột & Bùng lịch:** Tự động hóa giữ chỗ thanh toán 15 phút (Booking Hold), chính sách dời lịch báo trước tối thiểu 2 giờ (`MIN_NOTICE_HOURS = 2`).
* **Gian lận xác nhận & Chậm trễ giải ngân:** Cơ chế **12-Hour Passive Approval Grace Period** tự động giải ngân thù lao buổi học khi hết hạn chờ mà không phát sinh khiếu nại.
* **Chiếm dụng vốn & Bất đối xứng quyền lợi:** Hệ thống Ví bảo chứng ký quỹ (Escrow Wallet), Ví học viên (Student Wallet), nạp tiền tự động qua VNPay và đối soát ngân hàng minh bạch.
* **Tranh chấp khóa học:** Khiếu nại chỉ tồn tại trong 12 giờ grace trước giải ngân (tiền giữ trong Escrow chờ Admin phân xử); quá hạn không báo cáo = mặc nhiên chấp nhận, khỏi kiện.

---

## 🏛️ Kiến Trúc Kỹ Thuật (Architecture)

Hệ thống được thiết kế theo nguyên lý **Clean Architecture** kết hợp mô hình **CQRS (Command Query Responsibility Segregation)** thông qua thư viện MediatR, phân tách rành mạch giữa nghiệp vụ miền (Domain), xử lý ứng dụng (Application), giao tiếp hạ tầng (Infrastructure) và giao diện lập trình (API / Web Client).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          React 18 Client                               │
│  Vite 5 ── Tailwind CSS ── Ant Design ── Zustand ── SignalR Client     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST / WSS WebSockets
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           TutorHub.Api                                 │
│  Thin REST Controllers ── JWT / Refresh Middleware ── SignalR Hubs     │
│  Rate Limiting ── StartupSecretGuard ── Global Error Handling          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌───────────────────────────────────────┐┌───────────────────────────────┐
│         TutorHub.Application          ││    TutorHub.Infrastructure    │
│  - CQRS Commands & Queries (MediatR)  ││  - PostgreSQL 16 (EF Core 8)  │
│  - FluentValidation Pipeline          ││  - VNPay SHA-512 Integration  │
│  - Domain Event Handlers              ││  - S3 / Cloudflare R2 Storage │
│  - Transactional Outbox Pattern       ││  - 6 Background Workers       │
└───────────────────┬───────────────────┘└───────────────┬───────────────┘
                    │                                    │
                    └─────────────────┬──────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          TutorHub.Domain                               │
│  Aggregates: User, Service, Booking, Enrollment, Session, Wallet,      │
│              Transaction, Dispute, AuditLog                            │
│  Policies: SessionSchedulePolicy, BookingPolicy, FeeCalculator         │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       PostgreSQL 16 Database                           │
│  Append-Only Triggers ── Strict Foreign Keys ── Composite Indexes      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Các Tính Năng & Nghiệp Vụ Cốt Lõi

### 1. Quản Lý Gói Dịch Vụ & Showcase Khóa Học
* Gia sư chủ động tạo và quản lý các gói dịch vụ học tập với thông tin chi tiết: số buổi, thời lượng, hình thức (Online/Offline), đối tượng học viên, điều kiện tiên quyết, câu hỏi thường gặp (FAQs) và lộ trình giáo trình chi tiết (Curriculum).
* Vòng đời dịch vụ linh hoạt: `Draft` (Bản nháp), `Published` (Đang mở bán), `Paused` (Tạm ngưng nhận học viên mới nhưng vẫn phục vụ học viên đang học), `Unpublished` (Đóng gói).

### 2. Đặt Lịch & Giữ Chỗ Thanh Toán 15 Phút (Booking TTL Hold)
* Khi học viên tiến hành đặt lịch, hệ thống tạo khóa giữ chỗ 15 phút (`PendingPayment`).
* Tích hợp thanh toán trực tuyến kép: Cổng thanh toán quốc gia **VNPay** (thẻ ATM, QR Code, thẻ quốc tế) và **Ví học viên nội bộ**.
* Tự động giải phóng trạng thái khi học viên hủy hoặc hết thời gian 15 phút.

### 3. Quy Chế Dời Lịch Tối Thiểu 2 Giờ (2-Hour Notice Policy)
* Cả học viên và gia sư được phép dời lịch học sang khung giờ khác, với điều kiện bắt buộc: **Thời điểm dời lịch phải cách giờ bắt đầu buổi học tối thiểu 2 giờ** (`SessionSchedulePolicy.MinRescheduleNoticeHours = 2`).
* Ngăn chặn hành vi bùng lịch sát giờ, bảo vệ kế hoạch làm việc của cả hai bên.

### 4. Cơ Chế Giải Ngân Tự Động 12 Giờ (12-Hour Passive Approval Grace Period)
* Thay thế quy trình xác nhận chấm công 2 đầu phức tạp bằng cơ chế thụ động thông minh:
  * Sau khi buổi học kết thúc (`SessionStatus.Completed`), kích hoạt cửa sổ chờ 12 giờ (`GracePeriodExpiresAt = CompletedAt + 12h`).
  * Trong 12 giờ này, học viên có quyền báo cáo sự cố hoặc mở khiếu nại tranh chấp nếu buổi học có vấn đề.
  * Nếu học viên báo cáo sự cố, lệnh giải ngân bị đóng băng ngay lập tức, chuyển sang trạng thái tranh chấp.
  * Nếu không phát sinh sự cố, khi đồng hồ điểm hết 12 giờ, hệ thống sẽ tự động giải ngân thù lao buổi học vào Ví gia sư.

### 5. Hệ Thống Ví & Ký Quỹ Độc Lập (Escrow & Double-Entry Ledger)
* **Ví gia sư (Tutor Wallet):** Ký quỹ thù lao theo từng buổi học. Toàn bộ tiền học được giữ an toàn trong Escrow và chỉ giải ngân từng buổi khi hoàn thành.
* **Ví học viên (Student Wallet):** Nạp tiền tự động 24/7 qua cổng VNPay, thanh toán khóa học nhanh không cần nhập lại thông tin thẻ, nhận tiền hoàn trả tranh chấp tức thì và đặt lệnh rút tiền về tài khoản ngân hàng.

### 6. Động Cơ Phân Giải Tranh Chấp Trong Grace 12 Giờ (Dispute Arbitration Engine)
* Khiếu nại chỉ tồn tại trước giải ngân (pre-release): trong 12 giờ Grace Period, học viên báo cáo sự cố → tiền giữ trong Escrow, không chuyển cho gia sư, chờ Admin phân xử.
* Quá 12 giờ không báo cáo = mặc nhiên chấp nhận: hệ thống tự động giải ngân, buổi học không thể khiếu nại nữa (khỏi kiện).
* Quản trị viên (Admin) xem xét bằng chứng 2 bên và ra quyết định: Hoàn trả 100% học viên, Chia tỷ lệ phần trăm (Partial Split), Giải ngân cho gia sư, hoặc Bác đơn không thay đổi tài chính.

### 7. Giao Tiếp Thời Gian Thực (SignalR WebSockets)
* Nhắn tin trực tiếp 1-1 giữa học viên và gia sư (`/hubs/chat`) với lưu vết hội thoại và trạng thái đã đọc.
* Trung tâm thông báo đẩy thời gian thực (`/hubs/notifications`) cập nhật tức thì biến động số dư, xác nhận lịch học, nhắc nhở buổi học và kết quả phê duyệt hồ sơ.

### 8. Kiểm Toán Bất Biến (Immutable Central Audit Log)
* Mọi giao dịch tài chính (`Transactions`) và nhật ký kiểm toán (`AuditLogs`) được bảo vệ bởi trigger cấp cơ sở dữ liệu: **Append-Only, nghiêm cấm UPDATE và DELETE**.

---

## 💻 Ngăn Xếp Công Nghệ (Technology Stack)

| Lớp (Layer) | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Backend Framework** | .NET 8.0 (C# 12) | ASP.NET Core Web API, RESTful Endpoints |
| **Architectural Patterns** | MediatR 12, FluentValidation 11 | CQRS, Pipeline Behaviors, Request Validation |
| **ORM & Database** | Entity Framework Core 8, Npgsql 8 | PostgreSQL 16 Provider, Code-First Migrations, Triggers |
| **Authentication & Security** | JWT Bearer, PBKDF2/BCrypt, OAuth 2.0 PKCE | Xác thực người dùng, Refresh Token Rotation, Google/Facebook Login |
| **Realtime Engine** | ASP.NET Core SignalR | WebSockets Hubs cho Trò chuyện và Thông báo |
| **Payment Gateway** | VNPay SDK (HMAC-SHA512) | Thanh toán trực tuyến, IPN Webhook, Đối soát giao dịch |
| **Object Storage** | AWS S3 SDK / Cloudflare R2 | Lưu trữ tài liệu, ảnh đại diện, chứng chỉ gia sư qua Presigned URL |
| **Email Service** | Amazon Simple Email Service (SES) | Gửi email giao dịch, xác nhận lịch học và thông báo bảo mật |
| **Frontend Framework** | React 18.3, Vite 5.4 | Client SPA, Fast HMR, Rollup Production Bundler |
| **Styling & Components** | TailwindCSS 3.4, Ant Design 5.20 | Giao diện doanh nghiệp, thiết kế thích ứng (Responsive UI) |
| **State Management** | Zustand 4.5, TanStack Query 5 | Global Client State & Server Cache Synchronization |
| **Client HTTP** | Axios 1.7 | HTTP Client với Interceptors tự động Refresh Token |
| **End-to-End Testing** | Playwright (Python / Node) | Kiểm thử tự động giao diện và luồng người dùng đa vai trò |
| **Containerization** | Docker, Docker Compose | Đóng gói môi trường đồng nhất (Postgres, API, Seeder) |

---

## 📂 Cấu Trúc Thư Mục Repository

```text
TutorHub/
├── src/
│   ├── backend/                              # Mã nguồn Backend (.NET 8 Web API)
│   │   ├── TutorHub.Domain/                  # Core Domain Entities, Enums, Invariants & Policies
│   │   ├── TutorHub.Application/             # Features (CQRS Command/Query Slices), DTOs, Validators
│   │   ├── TutorHub.Infrastructure/          # EF Core Persistence, Background Jobs, VNPay, S3, SignalR
│   │   ├── TutorHub.Api/                     # Controllers, Middlewares, Hubs, Dependency Injections
│   │   ├── TutorHub.sln                      # Solution chính
│   │   └── seedData.sql                      # Dữ liệu mẫu khởi tạo toàn diện
│   │
│   ├── frontend/                             # Mã nguồn Frontend (React 18 + Vite)
│   │   ├── src/
│   │   │   ├── components/                   # UI components phân loại theo miền (admin, tutor, student...)
│   │   │   ├── layouts/                      # Layout khung ứng dụng (Admin, Tutor, Student, Public)
│   │   │   ├── pages/                        # Các trang màn hình chức năng
│   │   │   ├── services/                     # Lớp gọi REST API và SignalR kết nối Backend
│   │   │   ├── store/                        # Quản lý trạng thái xác thực và phiên làm việc (Zustand)
│   │   │   └── utils/                        # Hàm định dạng tiền tệ, xử lý ngày giờ, kiểm tra dời lịch
│   │   ├── package.json                      # Cấu hình thư viện Frontend
│   │   └── vite.config.js                    # Cấu hình Vite & loại bỏ console/debugger trong Production
│   │
│   └── test/                                 # Bộ kiểm thử tự động Backend (733 Tests)
│       ├── TutorHub.Domain.UnitTests/        # 225 tests: Logic thực thể, Session Allocation, Policies
│       ├── TutorHub.Application.UnitTests/   # 420 tests: CQRS Handlers, Validation, Security rules
│       ├── TutorHub.Infrastructure.UnitTests/# 21 tests: VNPay HMAC, Password Hasher, S3 options
│       └── TutorHub.Api.IntegrationTests/    # 67 tests: Tích hợp cơ sở dữ liệu thật, API contract, Ledgers
│
├── docs/                                     # Toàn bộ tài liệu phân tích, kiến trúc & thiết kế
│   ├── openapi.json                          # Đặc tả OpenAPI v3
│   ├── prd.md                                # Product Requirements Document
│   └── plans/                                # Các tài liệu kế hoạch kỹ thuật & giải pháp
│
├── scripts/                                  # Kịch bản kiểm thử & vận hành tự động
│   ├── e2e_grace_period.py                   # Bộ test E2E Playwright kiểm thử luồng 12h Auto-Payout
│   └── collect_ui_audit.py                   # Script tự động audit tràn màn hình mobile (Responsive)
│
├── docker-compose.yml                        # File triển khai cụm Container
├── .env.example                              # File mẫu cấu hình biến môi trường
└── README.md                                 # Tài liệu dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Môi Trường
* **.NET 8.0 SDK** ([Tải về tại đây](https://dotnet.microsoft.com/download/dotnet/8.0))
* **Node.js 18+ & npm** ([Tải về tại đây](https://nodejs.org/))
* **Docker Desktop** ([Tải về tại đây](https://www.docker.com/products/docker-desktop/)) hoặc **PostgreSQL 16**

---

### 2. Khởi Chạy Nhanh Bằng Docker Compose (Khuyến Nghị)

Phương pháp nhanh nhất để chạy toàn bộ hệ thống kèm dữ liệu mẫu sẵn có:

```bash
# 1. Sao chép biến môi trường mẫu
cp .env.example .env

# 2. Khởi động cụm dịch vụ (PostgreSQL, Backend API, Database Seeder)
docker-compose up -d --build
```

Sau khi khởi chạy thành công:
* **Backend API:** `http://localhost:8080`
* **Swagger Documentation:** `http://localhost:8080/swagger`
* **Cơ sở dữ liệu PostgreSQL:** `localhost:5433` (Database: `tutorhub`, User: `tutorhub`, Password: `tutorhub`)

---

### 3. Khởi Chạy Môi Trường Phát Triển Cục Bộ (Local Development)

#### Bước 3.1: Cơ sở dữ liệu PostgreSQL
Khởi chạy container PostgreSQL chuyên dụng:
```bash
docker run -d --name tutorhub-postgres -p 5433:5432 -e POSTGRES_DB=tutorhub -e POSTGRES_USER=tutorhub -e POSTGRES_PASSWORD=tutorhub postgres:16-alpine
```

Áp dụng Migration và nạp dữ liệu mẫu:
```bash
# Cập nhật schema database qua EF Core
dotnet ef database update --project src/backend/TutorHub.Infrastructure --startup-project src/backend/TutorHub.Api

# Nạp dữ liệu mẫu
docker exec -i tutorhub-postgres psql -U tutorhub -d tutorhub < src/backend/seedData.sql
```

#### Bước 3.2: Khởi chạy Backend API (.NET 8)
```bash
cd src/backend/TutorHub.Api
dotnet run
```
* **API Endpoint:** `http://localhost:5129`
* **Swagger UI:** `http://localhost:5129/swagger`

#### Bước 3.3: Khởi chạy Frontend Client (React + Vite)
```bash
cd src/frontend
npm install
npm run dev
```
* **Web App URL:** `http://localhost:5173`

---

## 🧪 Kiểm Thử Tự Động (Automated Testing)

TutorHub áp dụng văn hóa kiểm thử chất lượng cao với độ phủ kiểm thử dày đặc ở mọi tầng ứng dụng:

```text
733 Backend Tests (100% Passed)
├── Domain Tests:         225 passed
├── Application Tests:    420 passed
├── Infrastructure Tests:  21 passed
└── Integration Tests:     67 passed

22 Playwright E2E Tests (100% Passed)
└── Full Grace Period, Dispute, Wallet & Checkout lifecycle
```

### Chạy Toàn Bộ Test Suite Backend
```bash
# Chạy toàn bộ 733 tests trong solution
dotnet test src/backend/TutorHub.sln --logger "console;verbosity=normal"
```

### Chạy Kiểm Thử Từng Dự Án
```bash
# Domain Unit Tests (Invariants & Nghiệp vụ cốt lõi)
dotnet test src/test/TutorHub.Domain.UnitTests

# Application Unit Tests (CQRS Handlers & Validators)
dotnet test src/test/TutorHub.Application.UnitTests

# Infrastructure Unit Tests (Hashing & Gateway)
dotnet test src/test/TutorHub.Infrastructure.UnitTests

# API Integration Tests (PostgreSQL & Database Triggers)
dotnet test src/test/TutorHub.Api.IntegrationTests
```

### Chạy Kiểm Thử Giao Diện Đầu-Cuối (Playwright E2E)
```bash
# Cài đặt dependency kịch bản test
pip install playwright pytest
playwright install chromium

# Thực thi bộ test kịch bản tự động giải ngân và khiếu nại
python scripts/e2e_grace_period.py
```

---

<p align="center">
  <b>TutorHub Project © 2026 — Xây dựng với tinh thần kỷ luật kỹ thuật và tiêu chuẩn doanh nghiệp.</b>
</p>
