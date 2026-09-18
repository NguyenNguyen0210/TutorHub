# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **TutorHub** là nền tảng marketplace kết nối Gia Sư (Tutor) và Học Viên (Student) trực tuyến theo mô hình **Service / Package-based Learning**.  
> Hệ thống hỗ trợ đặt mua gói dịch vụ (15 phút checkout hold), phân rã hợp đồng học tập (**Enrollment**) thành các buổi học (**Sessions**), đối soát điểm danh 2 chiều (**Attendance Verification Window**), giải ngân từng buổi vào ví bảo chứng (**Escrow Wallet**), thanh toán thực tế **VNPay 2.1.0**, Realtime **SignalR**, **Transactional Outbox** (26 sự kiện + MessageSent), công cụ giải quyết tranh chấp 2 giai đoạn (**Dispute Engine**), và sổ cái kiểm toán bất biến (**Central Audit Log**).
>
> **Auth policy (F-08, owner-accepted):** Suspended/Banned được chặn ở login/refresh; access token đang bay được tôn trọng tới hết hạn (tối đa 15 phút).

---

## 💻 Tech Stack & Core Versions

* **Backend Runtime & Framework:** .NET 8.0 SDK (`LangVersion = 12.0`), ASP.NET Core Web API (.NET 8)
* **Database & ORM:** PostgreSQL 16 (`Npgsql.EntityFrameworkCore.PostgreSQL 8.0.11`), EF Core 8.0.11
* **Backend Patterns & Libraries:** Clean Architecture + CQRS + Vertical Slice Architecture, MediatR 12.4.1, FluentValidation 11.11.0, BCrypt.Net-Next 4.0.3, System.IdentityModel.Tokens.Jwt 8.0.1, Swashbuckle.AspNetCore 6.6.2, AWSSDK.S3 3.7.400 (Cloudflare R2), AWSSDK.SimpleEmail 3.7.400 (Amazon SES)
* **Realtime & Messaging:** ASP.NET Core SignalR (`/hubs/chat`, `/hubs/notifications`), Transactional Outbox Pattern
* **Frontend:** React 18.3.1 (Pure JavaScript `.jsx`), Vite 5.4.3, Tailwind CSS 3.4.11, Lucide React, Zustand 4.5.5, TanStack React Query 5.56.2, Axios, Dayjs
* **DevOps:** Docker, Docker Compose

---

## ⚡ Essential Commands

### Backend (.NET 8)
```bash
# Build Solution (Strict Zero Warning Policy: TreatWarningsAsErrors=true)
dotnet build src/backend/TutorHub.sln

# Run API Server locally (http://localhost:5129 | Swagger: http://localhost:5129/swagger)
dotnet run --project src/backend/TutorHub.Api

# Run Entire Test Suite (588 Executed Tests - 100% Deterministic Pass)
dotnet test src/backend/TutorHub.sln

# Run Specific Test Projects
dotnet test src/test/TutorHub.Domain.UnitTests/TutorHub.Domain.UnitTests.csproj
dotnet test src/test/TutorHub.Application.UnitTests/TutorHub.Application.UnitTests.csproj
dotnet test src/test/TutorHub.Infrastructure.UnitTests/TutorHub.Infrastructure.UnitTests.csproj
dotnet test src/test/TutorHub.Api.IntegrationTests/TutorHub.Api.IntegrationTests.csproj

# Run a Single Test / Filter by Class or Test Name
dotnet test src/backend/TutorHub.sln --filter "FullyQualifiedName~EnrollmentSessionAllocatorTests"
dotnet test src/backend/TutorHub.sln --filter "Name=CalculateWithdrawableBalance_WithHeldBalance_ReturnsCorrectAmount"

# Stop locked API process on Windows
Stop-Process -Name "TutorHub.Api" -Force -ErrorAction SilentlyContinue
```

### Frontend (React 18 + Vite)
```bash
# Install dependencies
cd src/frontend && npm ci

# Run development server (http://localhost:5173)
cd src/frontend && npm run dev

# Lint Frontend (Strict 0 Warnings Allowed)
cd src/frontend && npm run lint

# Lint and auto-fix
cd src/frontend && npm run lint:fix

# Build Frontend for Production
cd src/frontend && npm run build
```

### Verification, Guardrails & Environment
```bash
# API Contract & Zero-Mock CI Guardrail
node scripts/verify-frontend-api-contract.mjs

# Secrets & Credentials Guard Scanner
pwsh ./scripts/scan-secrets.ps1

# Run Docker Environment (PostgreSQL 16 on port 5433, Backend API on port 8080, Auto-seed)
docker-compose up -d --build
```

---

## 🏛️ System Architecture

### 1. High-Level Flow
```text
Service Offering (Tutor tạo gói học: giá, số buổi, thời lượng, trial)
       ↓ (Student chọn gói)
Booking Checkout (Tạm giữ thanh toán 15 phút - Holding)
       ↓ (VNPay IPN / Dev Simulator)
Enrollment (Hợp đồng học tập trung tâm - Snapshot PlatformFeeRate & FeePolicyVersion)
       ↓ (EnrollmentSessionAllocator tự động sinh N Sessions)
Sessions (Unscheduled → Scheduled trong AvailabilitySlots của Tutor)
       ↓ (Học xong: Mở Attendance Window 24h)
Attendance Verification (Student & Tutor cùng xác nhận 2 chiều)
       ↓ (AttendanceVerificationJob tự động duyệt hoặc gắn cờ Conflict)
Wallet Payout Release (Giải ngân SessionPayoutCredit cho từng buổi hoàn thành)
       ↓ (Nếu có khiếu nại)
Dispute Engine (Pre-release Escrow hold hoặc Post-release Balance hold)
       ↓ (Admin phân xử bằng công thức cân đối phí sàn bất biến)
Ledger Settlement (Refund Pending/Succeeded/Failed + PlatformFeeReversal + AuditLog)
```

### 2. Codebase Structure
* `src/backend/TutorHub.Domain/`: **Domain Cốt Lõi Độc Lập**. Entities (`User`, `TutorProfile`, `StudentProfile`, `Service`, `Booking`, `Enrollment`, `Session`, `Wallet`, `Transaction`, `Dispute`, `PlatformSetting`, `AuditLog`), Enums, Allocators (`EnrollmentSessionAllocator`), và Domain Invariants. Tuyệt đối không phụ thuộc vào hạ tầng hay UI.
* `src/backend/TutorHub.Application/`: **Nghiệp Vụ Ứng Dụng (Vertical Slice / CQRS)**. Chia theo feature (`Features/{Module}/{FeatureName}/`). Chứa `Command/Query`, `Validator`, `Handler`, `DTOs`, Business Events, và Abstractions (`IAppDbContext`, `IAuditLogService`, `IPaymentGateway`, `IObjectStorageService`, `IJwtService`).
* `src/backend/TutorHub.Infrastructure/`: **Hạ Tầng Kỹ Thuật**. `AppDbContext` (interceptor bảo vệ sổ cái bất biến), 6 Background Jobs (`BookingTimeoutBackgroundService`, `OutboxDispatcherJob`, `EmailDeliveryJob`, `SessionReminderJob`, `AttendanceReminderJob`, `AttendanceVerificationJob`), VNPay SHA512, Cloudflare R2, và SignalR hubs (`/hubs/chat`, `/hubs/notifications`).
* `src/backend/TutorHub.Api/`: **Giao Tiếp Ngoại Vi (Thin Controllers)**. Controller chỉ dispatch MediatR, Middlewares (`CorrelationIdMiddleware`, `GlobalExceptionHandler`).
* `src/frontend/`: **Giao Diện Người Dùng (React 18 + Vite + Tailwind)**:
  - `src/styles/tokens.css`: **Nguồn sự thật duy nhất** về Design Tokens (Brand Style Guide v2).
  - `src/services/api.js`: Axios instance với token refresh rotation, correlation headers, và API client modules (`booking`, `enrollment`, `session`, `wallet`, `dispute`, `admin`, etc.).
  - `src/store/authStore.js`: Zustand store quản lý trạng thái đăng nhập, user profile, vai trò và token.
  - `src/routes/RouteGuards.jsx`: Protected routes phân quyền theo vai trò (`Student`, `Tutor`, `Admin`).
  - `src/components/`, `src/pages/`, `src/layouts/`: Giao diện chia theo vai trò (Admin, Student, Tutor, Discovery, Checkout, Shared).
* `src/test/`: **Kiểm Thử Tự Động** (588 test cases - 100% Deterministic Pass): `Domain.UnitTests` (204), `Application.UnitTests` (290), `Infrastructure.UnitTests` (21), `Api.IntegrationTests` (73, Postgres).
* `docs/`: **Baseline Nghiệp Vụ Chuẩn**: `prd.md`, `functional-requirements.md`, `user-stories.md`, `openapi.json`.
* `scripts/`: CI contract verification, dev bootstrap, secret scanning.

---

## 🎨 UI/UX & Design System Invariants (DESIGN.md v2)

* **Design Identity:** Minimal SaaS sáng — Primary Blue (`#2563EB`), Secondary Orange (`#F59E0B`), neutral slate canvas (`#F8FAFC`), dark navy sidebar/chrome (`#0F172A`).
* **Không Hardcode Hex:** Mọi màu sắc phải dùng qua Tailwind tokens trỏ tới `src/frontend/src/styles/tokens.css` (e.g. `bg-brand-primary-600`, `text-neutral-900`).
* **Semantic Status Invariants:**
  - `--semantic-success` (`#10B981`): `AvailableBalance`, `SessionPayoutCredit`, `Paid`, `Attended`.
  - `--semantic-holding` (`#D97706`): `HoldingExpiresAt` (15m checkout), `PendingBalance`, `Proposed`. *Cố ý tách biệt với Secondary Orange (`#F59E0B`)*.
  - `--semantic-danger` (`#EF4444`): `HeldBalance`, `AttendanceConflict`, `DisputeActive`, `Banned`.
  - `--semantic-info` (`#3B82F6`): `EnrollmentActive`, `Scheduled`, `UnderReview`.
* **Currency Formatting:** Định dạng số tiền VND phân cách dấu chấm (e.g. `2.500.000 ₫`). Monospace font cho số liệu tài chính.
* **Pure JavaScript:** Frontend sử dụng JavaScript chuẩn (`.jsx`), không dùng TypeScript.

---

## 📐 Code Conventions & Best Practices

1. **Envelope Response:** Mọi endpoint API thành công phải trả về `ApiResponse<T>.SuccessResult(data, message)`.
2. **Exception Handling:** Không `try-catch` trong Controller. Ném các domain exception có cấu trúc (`NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`, `UnauthorizedException`). `GlobalExceptionHandler` tự động map ra HTTP status code và ProblemDetails JSON.
3. **DTOs:** Sử dụng C# positional `record` bất biến (Immutable).
4. **Validation:** Kế thừa `AbstractValidator<TCommand/Query>` trong cùng thư mục slice. MediatR Validation Pipeline Behavior tự động validate trước khi vào Handler.
5. **Timezone Rule:** Toàn bộ dữ liệu ngày giờ lưu trong DB là **Strict UTC** (`DateTime.UtcNow`). Chỉ chuyển đổi sang Timezone `Asia/Ho_Chi_Minh` khi hiển thị hoặc đối soát khung giờ `AvailabilitySlot` của gia sư.
6. **Correlation Tracing:** `CorrelationIdMiddleware` tự động sinh hoặc forward header `X-Correlation-ID`. Mọi thao tác quản trị tài chính, tranh chấp, cấu hình sàn đều ghi vào `AuditLog` kèm `CorrelationId`.
7. **Deterministic Pagination:** Sử dụng `PagedResult<T>` với sắp xếp deterministic: `.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)`.

---

## 🚫 LUẬT CỨNG BẤT BIẾN [ĐIỀU KHÔNG ĐƯỢC PHÁ]

* ⛔ **1. Không bao giờ tắt `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`:** Mọi commit phải build thành công với **0 Warnings, 0 Errors** trên cả Backend (`dotnet build`) và Frontend (`npm run lint`).
* ⛔ **2. Mô hình Booking là Package-based (Không quay lại Single-slot Booking):** `Booking` tham chiếu `ServiceId`, hoặc `CustomAgreementId` đi kèm hidden `Service (Unpublished)` snapshot (`DEC-S8-020`). Thanh toán thành công kích hoạt `Enrollment` (qua `Pending → Active`) và sinh $N$ `Session`. Tuyệt đối không tạo booking đơn lẻ ngoài gói dịch vụ.
* ⛔ **3. Sổ Cái Tài Chính & Audit Log là Append-Only (`INV-LEDGER-006`, `INV-LEDGER-007`):** `AppDbContext.SaveChangesAsync` chặn đứng mọi hành vi `Modified` hoặc `Deleted` đối với `AuditLog` và các giao dịch đã quyết toán (`Transaction.Status == Released || Succeeded`). Mọi điều chỉnh tài chính phải là transaction mới (`StudentRefund`, `PlatformFeeReversal`).
* ⛔ **4. Cấm Chaining Transaction (`DEC-S8-030`):** Mọi giao dịch điều chỉnh (`StudentRefund`, `PlatformFeeReversal`) phải trỏ trực tiếp về giao dịch giải ngân gốc (`RelatedTransaction.Type == SessionPayoutCredit`), cấm trỏ bắc cầu vào một adjustment khác.
* ⛔ **5. Bất Biến Rút Tiền Khả Dụng (`DEC-WD-001`, `DEC-S8-001`):** Gia sư chỉ được rút tiền tối đa bằng `WithdrawableBalance = AvailableBalance - HeldBalance`. Không được rút vào phần tiền đang bị giữ do tranh chấp (`HeldBalance`).
* ⛔ **6. Bất Biến Tranh Chấp Không Giữ Tiền Một Phần (`DEC-S8-028`, `INV-DISP-008`):** Trong tranh chấp sau giải ngân (Post-release), nếu `WithdrawableBalance < MaxTutorRecovery`, hệ thống **phải giữ 0 đồng** (`HeldAmount = 0`) và chuyển Dispute sang trạng thái `RequiresAdminFinancialIntervention`. Tuyệt đối không giữ một phần làm sai lệch hạn mức và phá vỡ tính sở hữu tiền ví.
* ⛔ **7. Công Thức Cân Đối Phí Sàn Chuẩn (`DEC-S8-025`, `Mandatory Patch B`):**
  $$\text{StudentRefund} \equiv \text{TutorNetRecovery} + \text{PlatformFeeReversal}$$
  Thu hồi từ ví gia sư không bao giờ được vượt quá số tiền gia sư thực nhận từ buổi học đó. Phí sàn được hoàn tương ứng theo tỷ lệ snapshot.
* ⛔ **8. Vòng Đời Hoàn Tiền Ngoại Vi (`DEC-S8-032`, `INV-REFUND-004`):** Khi Admin phân xử hoàn tiền cho học viên, `StudentRefund` bắt đầu ở trạng thái `Pending`. Chỉ chuyển sang `Succeeded` khi cổng thanh toán xác nhận thành công. Nếu cổng thất bại (`Failed`), nghĩa vụ tài chính nội bộ vẫn giữ nguyên (`SettlementRequired = true`) để Admin xử lý offline, không được rollback tiền ví gia sư.
* ⛔ **9. Snapshot Phí Sàn Bất Biến (`DEC-S8-020`):** `Enrollment` snapshot cố định `PlatformFeeRate` và `FeePolicyVersion` tại thời điểm tạo. Việc Admin thay đổi phí sàn toàn hệ thống (`PlatformSetting`) chỉ áp dụng cho các hợp đồng tạo mới sau đó, không hồi tố hợp đồng cũ.
* ⛔ **10. Khóa Tài Nguyên Có Thứ Tự Tránh Deadlock (`DEC-S8-027`):** Mọi nghiệp vụ có tranh chấp và ví phải khóa tài nguyên theo thứ tự: $\text{Dispute} \prec \text{Wallet (FOR UPDATE)} \prec \text{Transaction}$.
* ⛔ **11. VNPay Return URL là Read-Only:** Tuyệt đối không cập nhật trạng thái đơn hàng hay cộng tiền ví trong Return URL. Mọi mutation tài chính bắt buộc phải nằm trong **IPN Webhook** và bọc trong **Database Transaction**.

---

## ⚠️ Các Bẫy Kỹ Thuật Thường Gặp Cần Tránh

1. **Bẫy lọc ngày (Date Filtering Bug):** Khi lọc `fromDate` đến `toDate`, luôn dùng khoảng nửa mở (Half-Open Interval): `CreatedAt >= fromDate.Date && CreatedAt < toDate.Date.AddDays(1)`.
2. **Bẫy đơn vị tiền VNPay (* 100):** VNPay yêu cầu số tiền nhân 100 (`Amount * 100`). Khi nhận IPN về, phải chia 100 (`vnp_Amount / 100`) trước khi so sánh với `Transaction.Amount`.
3. **Bẫy kiểm tra giờ rảnh Gia sư:** Giờ bắt đầu và kết thúc của Session lưu ở UTC. Phải convert sang `Asia/Ho_Chi_Minh` trước khi kiểm tra `DayOfWeek`, `StartTime`, `EndTime` trong bảng `AvailabilitySlots`.
4. **Bẫy kiểm tra file đính kèm & bằng chứng (`DEC-S8-018`):** Dung lượng tối đa 10MB và bắt buộc kiểm tra MIME Type whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `text/plain`).

---

## 🔑 Seed Accounts & Environment Variables

* **Default Password (All Seed Accounts):** `Test@123`
* **Admin:** `admin@tutorhub.com`
* **Tutors:** `thutrang.math@tutorhub.vn`, `khoa.dang.ielts@tutorhub.vn`, `long.vu.dev@tutorhub.vn`
* **Students:** `student.lan@tutorhub.com`, `nguyen.hoang.nam.1@gmail.com`
* **Ports & Endpoints:**
  - Local Backend API: `http://localhost:5129` (Swagger UI: `http://localhost:5129/swagger`)
  - Docker Backend API: `http://localhost:8080` (PostgreSQL on port `5433`)
  - Frontend Client: `http://localhost:5173`
