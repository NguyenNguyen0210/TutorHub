# TutorHub — Nền Tảng Công Nghệ Kết Nối Gia Sư & Học Viên Trực Tuyến

<p align="center">
  <img src="src/frontend/public/logo.png" alt="TutorHub Logo" width="160" />
</p>

<p align="center">
  <b>Hệ thống EdTech Marketplace định hướng dịch vụ (Service & Package-Based Learning), ứng dụng kiến trúc Clean Architecture, CQRS, cơ chế ký quỹ bảo chứng Escrow, giải ngân tự động 12 giờ (Grace Period) và phân giải tranh chấp tài chính pre-release trong cửa sổ grace.</b>
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
7. [Mở Rộng Quy Mô (Scale-Out với Redis)](#-mở-rộng-quy-mô-scale-out-với-redis)
8. [Kiểm Thử Tự Động (Automated Testing)](#-kiểm-thử-tự-động-automated-testing)

---

## 🎯 Tổng Quan Dự Án

**TutorHub** là giải pháp sàn thương mại điện tử giáo dục trực tuyến toàn diện, kết nối học viên có nhu cầu học tập chất lượng cao với đội ngũ gia sư được kiểm định chặt chẽ. Hệ thống giải quyết triệt để các bài toán hóc búa của mô hình gia sư truyền thống:
* **Xung đột & Bùng lịch:** Tự động hóa giữ chỗ thanh toán 15 phút (Booking Hold), chính sách dời lịch báo trước tối thiểu 2 giờ (`MIN_NOTICE_HOURS = 2`).
* **Gian lận xác nhận & Chậm trễ giải ngân:** Cơ chế **12-Hour Passive Approval Grace Period** tự động giải ngân thù lao buổi học khi hết hạn chờ mà không phát sinh khiếu nại.
* **Chiếm dụng vốn & Bất đối xứng quyền lợi:** Hệ thống Ví bảo chứng ký quỹ (Escrow Wallet), Ví học viên (Student Wallet), nạp tiền tự động qua VNPay và đối soát ngân hàng minh bạch.
* **Tranh chấp khóa học:** Khiếu nại chỉ tồn tại trong 12 giờ grace trước giải ngân (tiền giữ trong Escrow chờ Admin phân xử); quá hạn không báo cáo = mặc nhiên chấp nhận, khỏi kiện.

---

## 🏛️ Kiến Trúc Kỹ Thuật (Architecture)

> Reviewer/nhà tuyển dụng có thể xem [Portfolio Technical Guide](docs/portfolio/README.md) để đọc sơ đồ kiến trúc, ERD, sequence diagram, tài khoản demo và các quyết định kỹ thuật.

Hệ thống được thiết kế theo nguyên lý **Clean Architecture** kết hợp mô hình **CQRS (Command Query Responsibility Segregation)** thông qua thư viện MediatR, phân tách rành mạch giữa nghiệp vụ miền (Domain), xử lý ứng dụng (Application), giao tiếp hạ tầng (Infrastructure) và giao diện lập trình (API / Web Client).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          React 18 Client                               │
│  Vite 5 ── Tailwind CSS ── Lucide React ── Zustand ── SignalR Client   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST / WSS WebSockets
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           TutorHub.Api                                 │
│  Thin REST Controllers ── JWT / Refresh Middleware ── SignalR Hubs     │
│  StartupSecretGuard ── Global Error Handling ── Correlation Tracking   │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌───────────────────────────────────────┐┌───────────────────────────────┐
│         TutorHub.Application          ││    TutorHub.Infrastructure    │
│  - CQRS Commands & Queries (MediatR)  ││  - PostgreSQL 16 (EF Core 8)  │
│  - FluentValidation Pipeline          ││  - VNPay SHA-512 Integration  │
│  - Domain Event Handlers              ││  - S3 / Cloudflare R2 Storage │
│  - Transactional Outbox Pattern       ││  - 5 Background Jobs          │
└───────────────────┬───────────────────┘└───────────────┬───────────────┘
                    │                                    │
                    └─────────────────┬──────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          TutorHub.Domain                               │
│  Aggregates: User, Service, Booking, Enrollment, Session, Wallet,      │
│              Transaction, Dispute, AuditLog                            │
│  Domain Services: SessionSchedulingRules, DisputeFinancialCalculator   │
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
* Gia sư chủ động tạo và quản lý các gói học trực tuyến với thông tin chi tiết: số buổi, thời lượng, đối tượng học viên, điều kiện tiên quyết, câu hỏi thường gặp (FAQs) và lộ trình giáo trình chi tiết (Curriculum).
* Vòng đời dịch vụ linh hoạt: `Draft` (Bản nháp), `Published` (Đang mở bán), `Paused` (Tạm ngưng nhận học viên mới nhưng vẫn phục vụ học viên đang học), `Unpublished` (Đóng gói).

### 2. Đặt Lịch & Giữ Chỗ Thanh Toán 15 Phút (Booking TTL Hold)
* Khi học viên tiến hành đặt lịch, hệ thống tạo Booking ở trạng thái `Holding` (khóa giữ chỗ 15 phút); thanh toán thành công chuyển sang `Paid`, hết hạn chuyển `Expired`.
* Tích hợp thanh toán trực tuyến kép: Cổng thanh toán quốc gia **VNPay** (thẻ ATM, QR Code, thẻ quốc tế) và **Ví học viên nội bộ**.
* Tự động giải phóng trạng thái khi học viên hủy hoặc hết thời gian 15 phút.

### 3. Quy Chế Dời Lịch Tối Thiểu 2 Giờ (2-Hour Notice Policy)
* **Gia sư** xếp/dời lịch trực tiếp; học viên không tự chọn slot. Cả hai bên có thể hủy một buổi `Unscheduled` hoặc `Scheduled` tương lai; hủy buổi `Scheduled` phải cách thời điểm bắt đầu tối thiểu **2 giờ** (`ISessionSchedulePolicy` / `SessionSchedulingRules`, cấu hình `Scheduling:MinimumNoticeHours`, default 2).
* Ngăn chặn hành vi bùng lịch sát giờ, bảo vệ kế hoạch làm việc của cả hai bên.

### 4. Cơ Chế Giải Ngân Tự Động 12 Giờ (12-Hour Passive Approval Grace Period)
* Thay thế quy trình xác nhận chấm công 2 đầu phức tạp bằng cơ chế thụ động thông minh:
  * Khi buổi học kết thúc (`EndAt <= now`), `AutoPayoutJob` chuyển Session sang `AwaitingPayout` và mở cửa sổ chờ 12 giờ (`GracePeriodEndsAt = now + 12h`); payout chưa được giải ngân trong thời gian này.
  * Trong 12 giờ này, học viên có quyền báo cáo sự cố hoặc mở khiếu nại tranh chấp nếu buổi học có vấn đề.
  * Nếu học viên báo cáo sự cố, lệnh giải ngân bị đóng băng ngay lập tức, chuyển sang trạng thái tranh chấp.
  * Nếu không phát sinh sự cố, khi đồng hồ điểm hết 12 giờ, hệ thống sẽ tự động giải ngân thù lao buổi học vào Ví gia sư.

### 5. Hệ Thống Ví Người Dùng Hợp Nhất & Ký Quỹ Độc Lập (Unified Wallet & Escrow Ledger)
* **Ví Hợp Nhất (User 1:1 Wallet):** Hợp nhất kiến trúc ví giữa Gia sư và Học viên, gắn trực tiếp với tài khoản người dùng (`User`).
* **Mô hình 3 xô số dư minh bạch:**
  - `AvailableBalance`: Số dư khả dụng dùng để thanh toán đặt lịch học, rút tiền về tài khoản ngân hàng hoặc nhận tiền giải ngân/hoàn trả.
  - `PendingBalance`: Tiền ký quỹ Escrow đang giữ chờ giải ngân từng buổi học qua cửa sổ 12h Grace Period.
  - `WithdrawingBalance`: Số dư phong tỏa tạm thời khi người dùng gửi yêu cầu rút tiền chờ Admin duyệt.
* **Sổ cái tài chính chuẩn xác:** Toàn bộ biến động số dư được ghi nhận bất biến trong `WalletTransactions`, hỗ trợ nạp tiền VNPay tự động 24/7 và rút tiền nội địa an toàn.

### 6. Động Cơ Phân Giải Tranh Chấp Trong Grace 12 Giờ (Dispute Arbitration Engine)
* Khiếu nại chỉ tồn tại trước giải ngân (pre-release): trong 12 giờ Grace Period, học viên báo cáo sự cố → tiền giữ trong Escrow, không chuyển cho gia sư, chờ Admin phân xử.
* Quá 12 giờ không báo cáo = mặc nhiên chấp nhận: hệ thống tự động giải ngân, buổi học không thể khiếu nại nữa (khỏi kiện).
* Quản trị viên (Admin) xem xét bằng chứng 2 bên và ra quyết định: Hoàn trả 100% học viên, Chia tỷ lệ phần trăm (Partial Split), Giải ngân cho gia sư, hoặc Bác đơn không thay đổi tài chính.

### 7. Giao Tiếp Thời Gian Thực (SignalR WebSockets)
* Nhắn tin trực tiếp 1-1 giữa học viên và gia sư (`/hubs/chat`) với lưu vết hội thoại và trạng thái đã đọc.
* Trung tâm thông báo đẩy thời gian thực (`/hubs/notifications`) cập nhật tức thì biến động số dư, xác nhận lịch học, nhắc nhở buổi học và kết quả phê duyệt hồ sơ.

### 8. Kiểm Toán Bất Biến (Immutable Central Audit Log)
* Mọi giao dịch tài chính (`Transactions`) và nhật ký kiểm toán (`AuditLogs`) được bảo vệ bởi trigger cấp cơ sở dữ liệu: **Append-Only, nghiêm cấm UPDATE và DELETE**.

### 9. Mô Hình Xóa Mềm & Thùng Rác Quản Trị (Soft Delete Pattern & Admin Trash)
* Áp dụng xóa mềm trực tiếp trên cấu trúc bảng (`IsDeleted`, `DeletedAt`, `DeletedByUserId`) cho Master Data (`Category`, `Subject`) và Gói dịch vụ (`Service`), tự động ẩn khỏi luồng nghiệp vụ thông qua EF Core Global Query Filter (`!IsDeleted`).
* Tránh xung đột tên trùng lặp khi tạo mới bằng **PostgreSQL Filtered Partial Unique Index** (`WHERE "IsDeleted" = false`), cho phép tái sử dụng tên sau khi bản ghi cũ đã xóa mềm.
* Cung cấp API Quản trị Thùng rác & Khôi phục chuyên biệt:
  * `GET /api/v1/admin/categories/trash` & `POST /api/v1/admin/categories/{id}/restore`
  * `GET /api/v1/admin/subjects/trash` & `POST /api/v1/admin/subjects/{id}/restore`
* Bảo đảm tính toàn vẹn quan hệ phân cấp: Không thể xóa Danh mục nếu còn Môn học đang hoạt động; không thể khôi phục Môn học nếu Danh mục cha đang bị xóa. Sổ cái tài chính tuyệt đối bất biến và cấm xóa.

---

## 💻 Ngăn Xếp Công Nghệ (Technology Stack)

| Lớp (Layer) | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Backend Framework** | .NET 8.0 (C# 12) | ASP.NET Core Web API, RESTful Endpoints |
| **Architectural Patterns** | MediatR 12, FluentValidation 11 | CQRS, Pipeline Behaviors, Request Validation |
| **ORM & Database** | Entity Framework Core 8, Npgsql 8 | PostgreSQL 16 Provider, Code-First Migrations, Triggers |
| **Authentication & Security** | JWT Bearer, PBKDF2/BCrypt, OpenID Connect + PKCE | Xác thực người dùng, Refresh Token Rotation, Google Sign-In |
| **Realtime Engine** | ASP.NET Core SignalR | WebSockets Hubs cho Trò chuyện và Thông báo |
| **Payment Gateway** | VNPay SDK (HMAC-SHA512) | Thanh toán trực tuyến, IPN Webhook, Đối soát giao dịch |
| **Object Storage** | AWS S3 SDK / Cloudflare R2 | Lưu trữ tài liệu, ảnh đại diện, chứng chỉ gia sư qua Presigned URL |
| **Email Service** | MailKit 4 (SMTP) | Gửi email giao dịch, chào mừng đăng ký và thông báo bảo mật |
| **Frontend Framework** | React 18.3, Vite 5.4 | Client SPA, Fast HMR, Rollup Production Bundler |
| **Styling & Components** | TailwindCSS 3.4, Lucide React, component nội bộ | Giao diện thích ứng (Responsive UI) |
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
│   │   ├── TutorHub.Domain/                  # Core Domain Entities, Enums, Domain Services (Scheduling, Dispute)
│   │   ├── TutorHub.Application/             # Features (CQRS Command/Query Slices), Policies DI, Validators
│   │   ├── TutorHub.Infrastructure/          # EF Core Persistence, 4 Background Jobs, VNPay, S3, SignalR
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
│   └── test/                                 # Bộ kiểm thử tự động Backend
│       ├── TutorHub.Domain.UnitTests/        # Logic thực thể và quy tắc nghiệp vụ
│       ├── TutorHub.Application.UnitTests/   # CQRS handlers và validation
│       ├── TutorHub.Infrastructure.UnitTests/# Tích hợp hạ tầng ở mức unit
│       └── TutorHub.Api.IntegrationTests/    # API và PostgreSQL
│
├── scripts/                                  # Kịch bản kiểm thử & vận hành tự động
│   └── e2e_grace_period.py                   # Bộ test E2E Playwright kiểm thử luồng 12h Auto-Payout
│
├── docker-compose.yml                        # Cấu hình cụm Docker Container phát triển (Dev)
├── docker-compose.prod.yml                   # Cấu hình cụm Docker Container Production
├── .env.example                              # File mẫu cấu hình biến môi trường Development
├── .env.production.example                   # File mẫu cấu hình biến môi trường Production
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

Phương pháp nhanh nhất để chạy các dịch vụ; dữ liệu mẫu được nạp riêng ở bước cuối:

```bash
# 1. Sao chép biến môi trường mẫu
cp .env.example .env

# 2. Thay toàn bộ secret mẫu `change_me` trong .env bằng giá trị thật.
#    API từ chối khởi động nếu vẫn dùng secret mẫu.
#    API chỉ cần ConnectionStrings__DefaultConnection để kết nối PostgreSQL.

# 3. Để dùng Swagger và cấu hình dev, đặt ASPNETCORE_ENVIRONMENT=Development trong .env.
#    Nếu để trống, Compose mặc định chạy Production và không phục vụ Swagger.

# 4. Khởi động cụm dịch vụ (PostgreSQL, Redis, Backend API)
docker compose up -d --build

# 5. Tiện ích nạp dữ liệu cục bộ (nếu đã có scripts/ trên máy).
# scripts/ không được đưa vào Git; bản clone mới có thể nạp Data.sql bằng psql như hướng dẫn bên dưới.
# Script sẽ TRUNCATE dữ liệu hiện có và yêu cầu xác nhận.
./scripts/seed-data.sh     # Linux/macOS/Git Bash
# hoặc trên Windows PowerShell:
.\scripts\seed-data.ps1
```

Docker Compose vẫn phải cung cấp `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
để **khởi tạo container PostgreSQL**. Các biến này không cần nằm trong `.env`
của ứng dụng: Compose mặc định tạo database `tutorhub`, user `tutorhub`, password
`tutorhub` tại cổng máy host `5433`. Nếu PostgreSQL local đã được khởi tạo với
mật khẩu khác, hãy tạo file `docker-compose.override.yml` (đã được Git ignore)
để giữ thông tin container hiện có, ví dụ:

```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: tutorhub
      POSTGRES_PASSWORD: your_existing_local_postgres_password
      POSTGRES_DB: tutorhub
  api:
    environment:
      ConnectionStrings__DefaultConnection: Host=postgres;Port=5432;Database=tutorhub;Username=tutorhub;Password=your_existing_local_postgres_password
```

Trong `.env`, dùng `Host=localhost;Port=5433` khi chạy .NET API trực tiếp trên máy.
Trong container API, `Host=postgres;Port=5432` là địa chỉ nội bộ Docker. Mật khẩu
trong hai connection string phải khớp với database local đã tạo. Đối với Render,
chỉ đặt `ConnectionStrings__DefaultConnection` trỏ tới Neon trong trang Environment;
không cần biến `POSTGRES_*` của Docker.

Seed hiện có 12 gia sư đã duyệt, 24 học viên, 15 gói học, 12 hợp đồng và
9 đánh giá gắn với hợp đồng đã hoàn thành. Nhân vật, văn bằng, chia sẻ và giao dịch
đều là dữ liệu **minh họa**, không phải thông tin người thật hay thanh toán thật.
Mật khẩu tài khoản demo là `Test@123`; ví dụ `admin@tutorhub.vn`,
`hocvien.thaovy@tutorhub.vn`. Đồng bộ không đổi mật khẩu các tài khoản có sẵn.

`Data.sql` đã chứa toàn bộ các câu `INSERT` và có thể chép riêng
sang máy khác để nạp; máy đích chỉ cần PostgreSQL với schema đã áp dụng đủ EF migrations.
Không cần Python hay script generator khi nạp dữ liệu. Ví dụ nạp trực tiếp bằng `psql`
(thay tên user/database theo máy đích):

```bash
psql -U tutorhub -d tutorhub -v ON_ERROR_STOP=1 -f Data.sql
```

Lệnh nạp sẽ thay thế toàn bộ dữ liệu nghiệp vụ hiện có trong database đích.

Để cập nhật nội dung demo trên DB đang sử dụng, áp dụng migrations rồi dùng
`Data.sync.sql`. Bản này không TRUNCATE, không sửa tài khoản, ví, đơn hàng hay
giao dịch đã có; nó cập nhật nội dung hồ sơ/gói học, bổ sung dữ liệu demo còn thiếu
và tính lại số sao từ Reviews. Các đánh giá bổ sung dùng tài khoản demo riêng.

```powershell
dotnet ef database update --project src/backend/TutorHub.Infrastructure --startup-project src/backend/TutorHub.Api
python scripts/generate-data-sql.py
python scripts/generate-data-sql.py --sync
.\scripts\seed-data.ps1 -SyncContent
# Linux/macOS/Git Bash: ./scripts/seed-data.sh --sync-content
```

Các tiện ích generator và `scripts/seed-content.json` chỉ lưu trên máy phát triển, không nằm trong Git. `Data.sql` và `Data.sync.sql` là đầu ra để chia sẻ và nạp dữ liệu trên máy khác.
FAQ chính sách chung và chia sẻ trên trang giới thiệu là nội dung tĩnh trong
`src/frontend/src/content`, không cần bảng hay API riêng. FAQ riêng từng gói,
giáo trình và đánh giá vẫn lấy từ API; không tự sinh đánh giá khi API rỗng hoặc lỗi.
Văn bằng công khai lấy từ học vấn/chứng chỉ trong hồ sơ đã được admin duyệt.
Trường học, chuyên ngành, chứng chỉ, phương pháp và thành tích được gửi riêng
trong API nộp/gửi lại hồ sơ. Tệp chứng chỉ tải qua Media API; hồ sơ chỉ lưu mã
và metadata tài liệu, không lưu URL tải tạm thời. API kiểm tra người sở hữu tệp;
admin lấy URL mới khi mở tài liệu. Nhãn “Đã duyệt hồ sơ” phản ánh việc xét duyệt,
không khẳng định một quy trình xác minh văn bằng độc lập.
Sau khi đồng bộ lúc API đang chạy, đợi cache hồ sơ/gói học hết hạn (tối đa 15 phút)
hoặc xóa đúng các key `tutor:profile:v3:*` và `service:detail:v3:*` trong Redis.

Sau khi khởi chạy thành công:
* **Backend API:** `http://localhost:8080`
* **Swagger Documentation (chỉ khi `ASPNETCORE_ENVIRONMENT=Development`):** `http://localhost:8080/swagger`
* **Cơ sở dữ liệu PostgreSQL:** `localhost:5433` (thông tin ứng dụng lấy từ `ConnectionStrings__DefaultConnection` trong `.env`)

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

# Nạp dữ liệu mẫu (script kiểm tra migration và hỏi trước khi thay dữ liệu cũ)
./scripts/seed-data.sh
```

> **Database đã tồn tại:** `20261028125846_InitialBaseline` là baseline dành cho
> database trống. Migration sẽ dừng nếu phát hiện bảng ứng dụng đã tồn tại.
> Trước khi nâng cấp, sao lưu database, kiểm tra `__EFMigrationsHistory` và
> đối chiếu schema hiện tại với baseline trên một bản sao. Không xóa lịch sử
> migration, không đánh dấu baseline là đã chạy, và không chạy seed trên dữ liệu
> cần giữ cho đến khi có kế hoạch nâng cấp được kiểm chứng riêng cho database đó.

Khi chạy API sau reverse proxy, khai báo từng địa chỉ IP proxy tin cậy trong
`ReverseProxy__KnownProxies__0`, `ReverseProxy__KnownProxies__1`, ... . Nếu không
khai báo, API dùng địa chỉ kết nối trực tiếp và bỏ qua các header IP do client gửi.

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

## 🔀 Mở Rộng Quy Mô (Scale-Out với Redis)

* **Redis bắt buộc:** Tất cả môi trường cần Redis hoạt động, dùng cho distributed lock, cache, SignalR backplane và OAuth state. Cấu hình địa chỉ bằng `ConnectionStrings__Redis`; Docker Compose chạy kèm container Redis.
* **Redis mất kết nối:** `/health` trả về trạng thái `Unhealthy` để hệ thống triển khai ngừng chuyển yêu cầu tới instance chưa sẵn sàng. `/health/live` vẫn kiểm tra liveness độc lập với Redis và PostgreSQL.
* **Background Jobs (Hợp nhất vào API host):**
  - Cả môi trường Dev (`docker-compose.yml`) và Production (`docker-compose.prod.yml`) luôn chạy cả 5 hosted background jobs trong tiến trình `api`, không cần biến bật/tắt.
  - **5 Background Jobs gồm có:** `BookingTimeoutBackgroundService` (hủy giữ chỗ quá hạn 15 phút), `OutboxDispatcherJob` (quét và bắn sự kiện Transactional Outbox), `EmailDeliveryJob` (gửi email bất đồng bộ dự phòng), `AutoPayoutJob` (quét buổi học quá hạn 12h Grace Period để tự động giải ngân), `IdempotencyCleanupJob` (quét và dọn dẹp các bản ghi idempotency đã hết hạn).
  - **Khóa phân tán (Redis Distributed Cron Lock):** Các cron job chạy đa node được điều phối bởi `IRedisDistributedLock` (`SET NX PX` kết hợp script Lua Compare-and-Delete) để đảm bảo tại một thời điểm chỉ có 1 node thực thi task, an toàn khi scale ngang.
  - **Bộ đệm phân tán (Read-Through Caching):** Cung cấp `IServiceDetailCacheService` và `ITutorProfileCacheService` kết hợp `SemaphoreSlim` per-key chống Cache Stampede. Các danh mục (Categories) và môn học (Subjects) truy vấn trực tiếp DB qua index tối ưu.
  - **Lớp bảo vệ Idempotency Outer Shield:** Bộ lọc `[Idempotent]` kết hợp băm SHA-256 fingerprint trên body request và `DbIdempotencyStore` chống thanh toán/tạo đơn/rút tiền trùng lặp khi mạng lag.
  - **Nhắc lịch (Reminders):** Session Reminder và Grace Period Reminder không sử dụng cron job định kỳ quét toàn bộ database mà chuyển sang kiến trúc **Delayed Outbox Pattern** (`SessionReminderDueEvent`, `GracePeriodClosingSoonEvent`), tối ưu hiệu năng và tránh rủi ro lock bảng.
* **Tìm kiếm tiếng Việt:** `unaccent` (wrapper immutable `unaccent_immutable`) + trigram `pg_trgm` với GIN index trên `Services(Title, Description)`, `Subjects(Name)`, `Users(FullName, Email)`… — `toan` ra `toán`, `nguyen` ra `Nguyễn`, giữ nguyên sort/paging cũ. `EXPLAIN` xác nhận dùng index + timing trước/sau là follow-up staging (sandbox nghiệm thu không có PG nên chưa đo).
* **Ghi log ứng dụng:** Serilog ghi ra console (JSON trong production), bổ sung `CorrelationId`, lọc log `/health*` và không ghi secret/PII.

---

## 🧪 Kiểm Thử Tự Động (Automated Testing)

Project có unit test cho Domain, Application và Infrastructure, integration test cho API và kịch bản Playwright E2E. Số lượng và kết quả test cần lấy từ lần chạy hiện tại; tài liệu không giữ số đếm cố định. Integration test đọc `ConnectionStrings__DefaultConnection` từ môi trường hoặc `.env`; CI vẫn hỗ trợ các biến PostgreSQL riêng để khởi tạo database test. Test từ chối host không phải localhost và mỗi test process chỉ được phép xóa/tạo lại database có tên bắt đầu bằng `tutorhub_integration`, vì vậy dữ liệu development không bị đụng tới.

### Chạy Toàn Bộ Test Suite Backend
```powershell
# Windows: build và chạy toàn bộ unit + integration test bằng Release
# Đảm bảo .env chứa ConnectionStrings__DefaultConnection trỏ về Docker local.
dotnet test src/backend/TutorHub.sln --configuration Release
```

```bash
# Linux/macOS/CI
dotnet test src/backend/TutorHub.sln --configuration Release
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

Toàn bộ thư mục `scripts/` chỉ dùng cục bộ và không được đưa vào Git. Các regression test trong `src/test` và `src/frontend/test` vẫn được quản lý phiên bản; CI gọi `dotnet test` trực tiếp.

```bash
# Chuẩn bị trình duyệt khi cần chạy kịch bản Playwright cục bộ
python -m pip install playwright
python -m playwright install chromium
```

Lưu plan tại `C:\Users\Nguyen Nguyen\Documents\TutorHub-local\plans` và báo cáo, ảnh chụp, trace, trạng thái kiểm thử tại `C:\Users\Nguyen Nguyen\Documents\TutorHub-local\testing`, bên ngoài project. Không dùng database development cho kịch bản có thao tác thanh toán, hủy hoặc hoàn tiền.

### Cập nhật bản OpenAPI

`docs/openapi.json` là bản xuất từ API đang chạy ở môi trường Development. Sau khi thay đổi controller hoặc DTO, chạy API với cấu hình Development hợp lệ và xuất lại từ `http://localhost:5129/swagger/v1/swagger.json`. Không sửa tay schema đã sinh.

---

<p align="center">
  <b>TutorHub Project © 2026 — Xây dựng với tinh thần kỷ luật kỹ thuật và tiêu chuẩn doanh nghiệp.</b>
</p>
