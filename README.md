# TutorHub Backend — Nền Tảng Kết Nối Gia Sư & Học Viên Trực Tuyến

[![.NET 8.0](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![EF Core](https://img.shields.io/badge/EF%20Core-8.0-512BD4?style=flat)](https://learn.microsoft.com/ef/core/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/OpenAPI-Swagger-85EA2D?style=flat&logo=swagger)](http://localhost:5000/swagger)

**TutorHub** là hệ thống backend RESTful API chuyên nghiệp cho nền tảng marketplace kết nối Gia Sư và Học Viên. Hệ thống được xây dựng theo chuẩn **Clean Architecture kết hợp Vertical Slice Architecture và CQRS (MediatR)**, tích hợp cơ chế đặt lịch giữ chỗ 15 phút, giải ngân bảo chứng (Escrow Wallet), thanh toán cổng thực tế **VNPay 2.1.0**, và phân hệ quản trị Admin toàn diện.

---

## 🏛️ Kiến Trúc Hệ Thống (Architecture Overview)

```
                    ┌─────────────────────────┐
                    │       TutorHub.Api      │ ➔ Controllers, Middlewares, Swagger, Filters
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             ↓                                       ↓
┌─────────────────────────┐             ┌─────────────────────────┐
│   TutorHub.Application  │             │ TutorHub.Infrastructure │
│  - Vertical Slices/CQRS │             │  - EF Core & Npgsql     │
│  - MediatR Handlers     │ ◄───────────┤  - JWT Token Services   │
│  - Fluent Validations   │  implements │  - VNPay SHA512 Service │
│  - DTOs & Abstractions  │             │  - Background Services  │
└────────────┬────────────┘             └────────────┬────────────┘
             │                                       │
             └───────────────────┬───────────────────┘
                                 ↓
                    ┌─────────────────────────┐
                    │      TutorHub.Domain    │ ➔ Entities, Enums, Business Rules & Policies
                    └─────────────────────────┘
```

---

## 🚀 Tính Năng Nổi Bật (Key Features)

1. **Xác thực & Bảo mật (Auth & Identity):** JWT Bearer Token (15 phút), Refresh Token Rotation (7 ngày), BCrypt password hashing, phân quyền Role-based (`Student`, `Tutor`, `Admin`).
2. **Đặt lịch học & Giữ chỗ (Booking & Escrow):** Cơ chế tạm giữ slot 15 phút (`Holding`), background job tự động hủy quá hạn, kiểm tra xung đột lịch rảnh và trùng giờ.
3. **Cổng thanh toán thực tế VNPay (Payment Gateway 2.1.0):** Sinh URL Sandbox có chữ ký bảo mật HMAC SHA512, Return URL (Read-Only) và Webhook IPN Server-to-Server ngầm bảo vệ bằng **Atomic DB Transaction** và **Idempotency Guard**.
4. **Ví tiền & Rút tiền (Wallets & Withdrawals):** Quản lý riêng biệt `PendingBalance` (tiền chờ dạy) và `AvailableBalance` (tiền khả dụng), quy trình rút tiền có phê duyệt của Admin.
5. **Đánh giá & Khiếu nại (Reviews & Reports):** Đánh giá 1-5 sao sau buổi học hoàn thành, cơ chế gửi báo cáo tranh chấp và Admin xử lý hoàn tiền / cảnh cáo / khóa tài khoản.
6. **Quản trị toàn sàn (Admin Dashboard & Management):** Thống kê snapshot thời gian thực, biểu đồ doanh thu theo tháng (Zero-fill đầy đủ), quản lý danh mục/môn học (Safe Deletion), quản lý người dùng (Self-lockout guard, thu hồi phiên đăng nhập), và tra cứu dòng tiền toàn hệ thống.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
TutorHub/
├── src/
│   ├── backend/                        # Toàn bộ mã nguồn & cấu hình Backend .NET 8
│   │   ├── TutorHub.Domain/            # Entities, Enums, Policies
│   │   ├── TutorHub.Application/       # Vertical Slices (Features), MediatR CQRS, DTOs, Validators
│   │   ├── TutorHub.Infrastructure/    # EF Core DbContext, PostgreSQL, JWT, VNPay, Cloudflare R2, Jobs
│   │   ├── TutorHub.Api/               # REST API Controllers, Middlewares, Configurations
│   │   ├── TutorHub.sln                # Visual Studio Solution chứa toàn bộ projects & tests
│   │   ├── Directory.Build.props       # Cấu hình biên dịch tập trung (TreatWarningsAsErrors=true)
│   │   ├── Dockerfile                  # Docker container build script cho backend
│   │   └── seedData.sql                # Dữ liệu mẫu khởi tạo hệ thống
│   │
│   ├── frontend/                       # Mã nguồn ứng dụng Client Frontend (React/Next.js/Vite)
│   │   └── README.md
│   │
│   └── test/                           # Kiểm thử tự động (Unit Tests & Integration Tests)
│       ├── TutorHub.Domain.UnitTests/
│       └── TutorHub.Application.UnitTests/
│
├── docs/                               # Toàn bộ tài liệu kỹ thuật & PRDs
│   ├── api-design.md
│   ├── database-schema.md
│   └── prd.md
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
Chỉ cần 1 câu lệnh để khởi chạy toàn bộ Database PostgreSQL và API Container:
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

#### Bước 2: Chạy bộ kiểm thử (Test Suite)
```bash
dotnet test src/backend/TutorHub.sln
```

#### Bước 3: Chạy API Server
```bash
dotnet run --project src/backend/TutorHub.Api
```
Truy cập Swagger UI tại: `http://localhost:5000/swagger` (hoặc `https://localhost:7000/swagger`).

---

## 💳 Kiểm Thử Cổng Thanh Toán VNPay Sandbox

1. Đăng nhập bằng tài khoản Student ➔ Bấm **Authorize** trên Swagger.
2. Gọi `POST /api/v1/bookings` để tạo booking giữ chỗ 15 phút.
3. Gọi `POST /api/v1/payments/vnpay/create-url` với `bookingId` để nhận `paymentUrl`.
4. Mở `paymentUrl` trên trình duyệt và dùng thông tin thẻ test của VNPay:
   - **Ngân hàng:** `NCB`
   - **Số thẻ:** `9704198526191432198`
   - **Tên chủ thẻ:** `NGUYEN VAN A`
   - **Ngày phát hành:** `07/15`
   - **Mã OTP:** `123456`
5. Trình duyệt tự động chuyển về `GET /api/v1/payments/vnpay/return` hiển thị kết quả thành công.
6. Webhook ngầm `GET /api/v1/payments/vnpay/ipn` tự động cập nhật `Booking = Pending`, `Transaction = Held` và cộng `PayoutAmount` vào ví Gia sư.

---

## 📜 Quy Ước Đóng Góp & Git Workflow

- Dự án tuân thủ nghiêm ngặt quy chuẩn **Conventional Commits**:
  - `feat(...)`: Phát triển tính năng mới
  - `fix(...)`: Sửa lỗi
  - `refactor(...)`: Tái cấu trúc mã nguồn
  - `docs(...)`: Cập nhật tài liệu
- Mỗi tính năng được phát triển trên nhánh riêng `feature/<tên-tính-năng>`.
- Chế độ biên dịch nghiêm ngặt: Mọi thay đổi phải đảm bảo **0 Warning(s), 0 Error(s)** dưới cờ `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.
