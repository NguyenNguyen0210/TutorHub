# TutorHub — Nền Tảng Kết Nối Gia Sư & Học Viên Trực Tuyến

[![.NET 8.0](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![EF Core](https://img.shields.io/badge/EF%20Core-8.0-512BD4?style=flat)](https://learn.microsoft.com/ef/core/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-636%20Passed-success?style=flat&logo=xunit)](http://localhost:5129)
[![API Contract](https://img.shields.io/badge/API%20Contract-Verified-success?style=flat)](docs/openapi.json)

**TutorHub** là nền tảng trực tuyến kết nối Gia Sư (Tutor) và Học Viên (Student) theo mô hình **Service / Package-based Learning**. Hệ thống gồm tầng **Backend ASP.NET Core Web API (.NET 8)** kiến trúc Clean Architecture + CQRS (MediatR), và tầng **Frontend React 18 + Vite + Ant Design + TailwindCSS**.

---

## 🏛️ Kiến Trúc Hệ Thống (Architecture)

```text
┌───────────────────────────────────────────────────────────┐
│                    TutorHub Frontend                      │ ➔ React 18, Vite, Ant Design, TailwindCSS, Zustand
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP REST / SignalR
                              ▼
┌───────────────────────────────────────────────────────────┐
│                      TutorHub.Api                         │ ➔ REST Controllers, Middlewares, SignalR Hubs
└──────────────┬─────────────────────────────┬──────────────┘
               │                             │
               ▼                             ▼
┌─────────────────────────────┐┌────────────────────────────┐
│    TutorHub.Application     ││  TutorHub.Infrastructure   │
│  - Vertical Slices / CQRS   ││  - PostgreSQL (EF Core 8)  │
│  - MediatR Handlers         ││  - JWT & Refresh Rotation  │
│  - FluentValidation Rules   ││  - VNPay SHA512 & S3/R2    │
│  - Outbox Pattern (Events)  ││  - Background Jobs (6)     │
└──────────────┬──────────────┘└─────────────┬──────────────┘
               │                             │
               └──────────────┬──────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    TutorHub.Domain                        │ ➔ Entities, Invariants, Allocators, Policies
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    PostgreSQL 16                          │ ➔ Append-Only Triggers, Financial Ledgers
└───────────────────────────────────────────────────────────┘
```

---

## 🚀 Tính Năng Nghiệp Vụ Cốt Lõi

* **Quản lý gói dịch vụ (Package-based Learning):** Gia sư đăng tải gói học với số buổi, thời lượng, học phí và mục tiêu rõ ràng.
* **Đặt mua & Giữ chỗ checkout (Booking 15-min Hold):** Cơ chế tạm giữ chỗ thanh toán 15 phút, tự động hủy khi quá hạn nhằm tránh xung đột lịch.
* **Hợp đồng & Phân rã buổi học (Enrollment & Session Allocator):** Tự động phân bổ lịch học và chia đều doanh thu từng buổi học với công thức tài chính bảo chứng bất biến.
* **Điểm danh 2 chiều (Attendance Window):** Mở cửa sổ 24 giờ sau mỗi buổi học để cả gia sư và học viên cùng xác nhận trước khi giải ngân.
* **Ví bảo chứng & Giải ngân từng buổi (Escrow Wallet):** Thù lao giải ngân theo từng buổi học hoàn thành sau khi trừ phí hoa hồng sàn. Hạn mức rút tiền bảo vệ số dư tranh chấp:
  $$\text{WithdrawableBalance} \equiv \text{AvailableBalance} - \text{HeldBalance}$$
* **Ví học viên & Thanh toán nội bộ (Student Wallet):** Học viên sở hữu ví tài khoản riêng để nạp tiền qua ngân hàng/VietQR, thanh toán khóa học 100% từ ví, nhận tiền hoàn trả tức thì và rút tiền về tài khoản ngân hàng.
* **Cơ chế xử lý tranh chấp 2 giai đoạn (Dispute Engine):** Pre-release Escrow hold và Post-release Balance hold với thuật toán cân đối tài chính minh bạch:
  $$\text{StudentRefund} \equiv \text{TutorNetRecovery} + \text{PlatformFeeReversal}$$
* **Hội thoại & Thông báo thời gian thực:** Nhắn tin trực tiếp 1-1 qua SignalR (`/hubs/chat`), thông báo tức thời (`/hubs/notifications`) và Transactional Outbox.
* **Sổ cái tài chính & Kiểm toán bất biến (Central Audit Log):** Mọi giao dịch đã quyết toán và nhật ký kiểm toán là Append-Only, nghiêm cấm chỉnh sửa hoặc xóa trực tiếp trong cơ sở dữ liệu.

---

## 📁 Cấu Trúc Thư Mục

```text
TutorHub/
├── src/
│   ├── backend/                        # Mã nguồn Backend .NET 8 Web API
│   │   ├── TutorHub.Domain/            # Entities, Enums, Allocators, Domain Invariants
│   │   ├── TutorHub.Application/       # Features (CQRS Slices), MediatR Handlers, DTOs
│   │   ├── TutorHub.Infrastructure/    # EF Core, PostgreSQL, VNPay, AWS S3, SignalR, Jobs
│   │   ├── TutorHub.Api/               # Thin Controllers, Middlewares, SignalR Hubs
│   │   ├── TutorHub.sln                # Solution biên dịch chính
│   │   └── seedData.sql                # Dữ liệu khởi tạo mẫu
│   │
│   ├── frontend/                       # Ứng dụng Client Frontend (React 18 + Vite)
│   │   ├── src/                        # Components, Pages, Services, Zustand Stores
│   │   ├── package.json                # Dependencies & scripts
│   │   └── vite.config.js              # Cấu hình Vite & Proxy
│   │
│   └── test/                           # Kiểm thử tự động (640 test cases)
│       ├── TutorHub.Domain.UnitTests/          # 226 cases (Invariants & Allocators)
│       ├── TutorHub.Application.UnitTests/     # 319 cases (CQRS Handlers & Validators)
│       ├── TutorHub.Infrastructure.UnitTests/  # 21 cases (VNPay, Security, Integrations)
│       └── TutorHub.Api.IntegrationTests/      # 74 cases (Postgres, Payments, Ledgers)
│
├── docs/                               # Tài liệu thiết kế & đặc tả API
│   ├── openapi.json                    # OpenAPI v3 spec
│   ├── prd.md                          # Product Requirements Document v1.2
│   ├── functional-requirements.md      # Đặc tả yêu cầu chức năng (FRD)
│   ├── user-stories.md                 # Bộ User Stories & Acceptance Criteria
│   ├── frontend-roadmap.md             # Lộ trình & danh mục 24 màn hình
│   └── frontend-specification.md       # Đặc tả UI/UX & hợp đồng API Frontend
│
├── docker-compose.yml                  # Khởi chạy cụm PostgreSQL, API, Seed Container
├── .env.example                        # Cấu hình mẫu biến môi trường
└── README.md                           # Tài liệu tổng quan dự án
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu hệ thống
* [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js 18+](https://nodejs.org/) & npm
* [Docker Desktop](https://www.docker.com/) hoặc [PostgreSQL 16+](https://www.postgresql.org/)

---

### 2. Khởi chạy bằng Docker Compose (Khuyến nghị)

```bash
# Khởi chạy cụm containers (Postgres, Backend API, Auto-seed)
docker-compose up -d --build
```

* **Backend API:** `http://localhost:8080`
* **Swagger UI (Dev mode):** `http://localhost:8080/swagger`
* **PostgreSQL:** `localhost:5433` (User: `tutorhub`, Password: `123456`, Database: `tutorhub`)

---

### 3. Khởi chạy từng dịch vụ (Local Development)

#### Backend (.NET 8):
```bash
# 1. Build Solution
dotnet build src/backend/TutorHub.sln

# 2. Chạy toàn bộ automated tests
dotnet test src/backend/TutorHub.sln

# 3. Chạy API Server
dotnet run --project src/backend/TutorHub.Api
```
* Local API: `http://localhost:5129` | Swagger UI: `http://localhost:5129/swagger`

#### Frontend (React 18 + Vite):
```bash
cd src/frontend
npm install
npm run dev
```
* Local Web App: `http://localhost:5173`

---

## 🔑 Tài Khoản Thử Nghiệm (Seed Accounts)

Mật khẩu dùng chung cho tất cả tài khoản seed: `Test@123`

| Vai trò (Role) | Email đăng nhập | Mô tả vai trò |
| :--- | :--- | :--- |
| **Admin** | `admin@tutorhub.com` | Quản trị viên hệ thống, duyệt hồ sơ, đối soát tranh chấp & tài chính |
| **Tutor** | `thutrang.math@tutorhub.vn` | Gia sư Toán THPT & THCS |
| **Tutor** | `khoa.dang.ielts@tutorhub.vn` | Gia sư chuyên sâu IELTS |
| **Tutor** | `long.vu.dev@tutorhub.vn` | Gia sư Lập trình C# .NET & Clean Architecture |
| **Student** | `student.lan@tutorhub.com` | Học viên mẫu (đã có hợp đồng học tập) |
| **Student** | `nguyen.hoang.nam.1@gmail.com` | Học viên mẫu |
