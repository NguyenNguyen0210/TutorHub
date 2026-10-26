# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **TutorHub** là nền tảng marketplace kết nối Gia Sư (Tutor) và Học Viên (Student) trực tuyến theo mô hình **Service / Package-based Learning**.  
> Hệ thống hỗ trợ đặt mua gói dịch vụ (15 phút checkout hold), phân rã hợp đồng học tập (**Enrollment**) thành các buổi học (**Sessions**), cơ chế giải ngân tự động 12 giờ (**Auto-Payout Grace Period**), giải ngân từng buổi vào ví bảo chứng (**Escrow Wallet**), thanh toán thực tế **VNPay 2.1.0**, Realtime **SignalR**, **Transactional Outbox**, công cụ giải quyết tranh chấp 2 giai đoạn (**Dispute Engine**), và nhật ký kiểm toán hệ thống (**Audit Log**).
>
> **Auth policy:** Access token có thời hạn 15 phút kết hợp Refresh Token (7 ngày). Khi Ban/Suspend/ChangePassword, refresh tokens bị thu hồi ngay lập tức để chặn cấp mới token khi access token hiện tại hết hạn.

---

## 💻 Tech Stack & Core Versions

* **Backend Runtime & Framework:** .NET 8.0 SDK (`LangVersion = 12.0`), ASP.NET Core Web API (.NET 8)
* **Database & ORM:** PostgreSQL 16 (`Npgsql.EntityFrameworkCore.PostgreSQL 8.0.11`), EF Core 8.0.11
* **Backend Patterns & Libraries:** Clean Architecture + CQRS + Vertical Slice Architecture, MediatR 12.4.1, FluentValidation 11.11.0, BCrypt.Net-Next 4.0.3, System.IdentityModel.Tokens.Jwt 8.0.1, Swashbuckle.AspNetCore 6.6.2, AWSSDK.S3 3.7.400 (Cloudflare R2), MailKit 4.18.1 (SMTP Email)
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

# Run Entire Test Suite (640 Executed Tests - 100% Deterministic Pass)
dotnet test src/backend/TutorHub.sln

# Run Specific Test Projects
dotnet test src/test/TutorHub.Domain.UnitTests/TutorHub.Domain.UnitTests.csproj
dotnet test src/test/TutorHub.Application.UnitTests/TutorHub.Application.UnitTests.csproj
dotnet test src/test/TutorHub.Infrastructure.UnitTests/TutorHub.Infrastructure.UnitTests.csproj
dotnet test src/test/TutorHub.Api.IntegrationTests/TutorHub.Api.IntegrationTests.csproj

# Run a Single Test / Filter by Class or Test Name
dotnet test src/backend/TutorHub.sln --filter "FullyQualifiedName~EnrollmentSessionAllocatorTests"
dotnet test src/backend/TutorHub.sln --filter "Name=DebitAvailableForWithdrawal_WhenSufficient_Decrements"

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
Enrollment (Hợp đồng học tập trung tâm - Snapshot PlatformFeeRate)
       ↓ (EnrollmentSessionAllocator tự động sinh N Sessions)
Sessions (Unscheduled → Scheduled trong AvailabilitySlots của Tutor)
       ↓ (Học xong: Kích hoạt Grace Period 12 giờ — Session chuyển sang AwaitingPayout)
Auto-Payout Grace Period (12 giờ phản hồi — Nếu không có báo cáo sự cố ReportSessionIssue → Tự động giải ngân)
       ↓ (AutoPayoutJob: Quét các buổi AwaitingPayout hết hạn 12h và giải ngân tự động)
Wallet Payout Release (Giải ngân SessionPayoutCredit cho từng buổi hoàn thành)
       ↓ (Nếu có khiếu nại / ReportSessionIssue trong 12h grace)
Dispute Engine (pre-release Escrow hold — quá 12h không report = chấp nhận, khỏi kiện)
       ↓ (Admin phân xử bằng công thức cân đối phí sàn bất biến: DisputeFinancialCalculator)
Hoàn tiền & Quyết toán (Refund Pending/Succeeded/Failed + PlatformFeeReversal + AuditLog)
```

### 2. Codebase Structure
* `src/backend/TutorHub.Domain/`: **Domain Cốt Lõi Độc Lập**. Entities (`User`, `TutorProfile`, `StudentProfile`, `Service`, `Booking`, `Enrollment`, `Session`, `Wallet`, `WalletTransaction`, `Withdrawal`, `TopUpRequest`, `Transaction`, `Dispute`, `AuditLog`), Enums, Allocators (`EnrollmentSessionAllocator`), Domain Services (`SessionSchedulingRules`, `DisputeFinancialCalculator`), và Domain Invariants. Tuyệt đối không phụ thuộc vào hạ tầng hay UI.
* `src/backend/TutorHub.Application/`: **Nghiệp Vụ Ứng Dụng (Vertical Slice / CQRS)**. Chia theo feature (`Features/{Module}/{FeatureName}/`). Chứa `Command/Query`, `Validator`, `Handler`, `DTOs`, Business Events, Policies (`ISessionSchedulePolicy` / `SessionSchedulePolicy`), và Abstractions (`IAppDbContext`, `IAuditLogService`, `IStudentWalletService`, `IPaymentGateway`, `IObjectStorageService`, `IJwtService`).
* `src/backend/TutorHub.Infrastructure/`: **Hạ Tầng Kỹ Thuật**. `AppDbContext` (bảo đảm tính toàn vẹn dữ liệu giao dịch), 5 Background Jobs (`BookingTimeoutBackgroundService`, `OutboxDispatcherJob`, `EmailDeliveryJob`, `AutoPayoutJob`, `IdempotencyCleanupJob`). Khóa phân tán đa node `IRedisDistributedLock` (`SET NX PX` + Lua script atomic compare-and-delete). Hệ thống Cache phân tán Read-Through / Fail-Open (`IServiceDetailCacheService`, `ITutorProfileCacheService`) với `SemaphoreSlim` chống Cache Stampede. Lớp bảo vệ Idempotency (`DbIdempotencyStore` + `IdempotencyRecord`). Session Reminders và Grace Period Reminders được xử lý theo Delayed Outbox Pattern (`SessionReminderDueEvent`, `GracePeriodClosingSoonEvent`). VNPay SHA512, Cloudflare R2, và SignalR hubs (`/hubs/chat`, `/hubs/notifications`).
* `src/backend/TutorHub.Api/`: **Giao Tiếp Ngoại Vi & Host (Thin Controllers + Background Jobs)**. Controller chỉ dispatch MediatR, Middlewares (`CorrelationIdMiddleware`, `GlobalExceptionHandler`), Action Filters (`[Idempotent]` filter chống xử lý lặp lại với SHA-256 fingerprint), và trực tiếp host 5 background hosted services.
* `src/frontend/`: **Giao Diện Người Dùng (React 18 + Vite + Tailwind)**:
  - `src/styles/tokens.css`: **Nguồn sự thật duy nhất** về Design Tokens (Brand Style Guide v2).
  - `src/services/api.js`: Axios instance với token refresh rotation, correlation headers, và API client modules (`booking`, `enrollment`, `session`, `wallet`, `studentWallet`, `dispute`, `admin`, etc.).
  - `src/store/authStore.js`: Zustand store quản lý trạng thái đăng nhập, user profile, vai trò và token.
  - `src/routes/RouteGuards.jsx`: Protected routes phân quyền theo vai trò (`Student`, `Tutor`, `Admin`).
  - `src/components/`, `src/pages/`, `src/layouts/`: Giao diện chia theo vai trò (Admin, Student, Tutor, Discovery, Checkout, Shared).
* `src/test/`: **Kiểm Thử Tự Động** (828 test cases - 100% Deterministic Pass): `Domain.UnitTests` (239), `Application.UnitTests` (469), `Infrastructure.UnitTests` (50), `Api.IntegrationTests` (70, Postgres).
* `docs/`: **Baseline Nghiệp Vụ Chuẩn**: `prd.md`, `functional-requirements.md`, `user-stories.md`, `openapi.json`.
* `scripts/` *(untracked local tooling)*: CI contract verification, dev bootstrap, secret scanning.

---

## 🎨 UI/UX & Design System Invariants (DESIGN.md v2)

* **Design Identity:** Minimal SaaS sáng — Primary Blue (`#2563EB`), Secondary Orange (`#F59E0B`), neutral slate canvas (`#F8FAFC`), dark navy sidebar/chrome (`#0F172A`).
* **Không Hardcode Hex:** Mọi màu sắc phải dùng qua Tailwind tokens trỏ tới `src/frontend/src/styles/tokens.css` (e.g. `bg-brand-primary-600`, `text-neutral-900`).
* **Semantic Status Invariants:**
  - `--semantic-success` (`#10B981`): `AvailableBalance`, `SessionPayoutCredit`, `Paid`, `Completed`.
  - `--semantic-holding` (`#D97706`): `HoldingExpiresAt` (15m checkout), `PendingBalance`, `Proposed`, `AwaitingPayout` (12h Grace Period). *Cố ý tách biệt với Secondary Orange (`#F59E0B`)*.
  - `--semantic-danger` (`#EF4444`): `DisputeActive`, `Banned`.
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
* ⛔ **2. Mô hình Booking là Package-based (Service-only):** `Booking` bắt buộc tham chiếu `ServiceId` (required). Thanh toán thành công kích hoạt `Enrollment` (qua `Pending → Active`) và sinh $N$ `Session`. Tuyệt đối không tạo booking đơn lẻ ngoài gói dịch vụ. Custom Agreement đã bị xóa hẳn (v1.3).
* ⛔ **3. Bảo đảm tính toàn vẹn Giao dịch & Audit Log (Append-Only):** `AppDbContext.SaveChangesAsync` chặn đứng mọi hành vi `Modified` hoặc `Deleted` đối với `AuditLog` và các giao dịch đã quyết toán (`Transaction.Status == Released || Succeeded`). Mọi điều chỉnh tài chính phải là transaction mới (`StudentRefund`, `PlatformFeeReversal`).
* ⛔ **4. Cấm Chaining Transaction:** Mọi giao dịch điều chỉnh (`StudentRefund`, `PlatformFeeReversal`) phải trỏ trực tiếp về giao dịch giải ngân gốc (`RelatedTransaction.Type == SessionPayoutCredit`), cấm trỏ bắc cầu vào một adjustment khác.
* ⛔ **5. Rút Tiền Khả Dụng:** Gia sư chỉ được rút tiền tối đa bằng `WithdrawableBalance = AvailableBalance - HeldBalance`. Không được rút vào phần tiền đang bị giữ (`HeldBalance`). (v1.4: dispute không còn tạo hold mới; rule giữ nguyên ở tầng ví.)
* ⛔ **6. ~~Tranh Chấp Không Giữ Tiền Một Phần~~ — RETIRED (v1.4):** post-release disputes đã bị xóa nên trường hợp giữ tiền một phần không còn xảy ra. `HeldBalance`/`RequiresAdminFinancialIntervention` chỉ còn ý nghĩa lịch sử.
* ⛔ **7. Công Thức Cân Đối Phí Sàn Chuẩn — chỉ còn ý nghĩa lịch sử (v1.4):**
  $$\text{StudentRefund} \equiv \text{TutorNetRecovery} + \text{PlatformFeeReversal}$$
  Pre-release resolve hiện chia trực tiếp `tutorGrossRelease` theo snapshot fee, không clawback. Không tạo `PlatformFeeReversal` mới.
* ⛔ **8. Vòng Đời Hoàn Tiền Ngoại Vi:** Khi Admin phân xử hoàn tiền cho học viên, `StudentRefund` bắt đầu ở trạng thái `Pending`. Chỉ chuyển sang `Succeeded` khi cổng thanh toán xác nhận thành công. Nếu cổng thất bại (`Failed`), nghĩa vụ tài chính nội bộ vẫn giữ nguyên (`SettlementRequired = true`) để Admin xử lý offline, không được rollback tiền ví gia sư.
* ⛔ **9. Snapshot Phí Sàn (Không hồi tố):** `Enrollment` snapshot cố định `PlatformFeeRate` và `FeePolicyVersion` tại thời điểm tạo. Việc Admin thay đổi phí sàn toàn hệ thống (`PlatformSetting`) chỉ áp dụng cho các hợp đồng tạo mới sau đó, không hồi tố hợp đồng cũ.
* ⛔ **10. Khóa Tài Nguyên Có Thứ Tự Tránh Deadlock:** Mọi nghiệp vụ có tranh chấp và ví phải khóa tài nguyên theo thứ tự: $\text{Dispute} \prec \text{Wallet (FOR UPDATE)} \prec \text{Transaction}$.
* ⛔ **11. VNPay Return URL là Read-Only:** Tuyệt đối không cập nhật trạng thái đơn hàng hay cộng tiền ví trong Return URL. Mọi mutation tài chính bắt buộc phải nằm trong **IPN Webhook** và bọc trong **Database Transaction**.
* ⛔ **12. Hệ Thống Ví Người Dùng Hợp Nhất (Unified Wallet System) & Toàn Vẹn Sổ Cái:**
  - Hợp nhất TutorWallet và StudentWallet thành thực thể `Wallet` duy nhất gắn trực tiếp với `UserId` (quan hệ 1:1 `User - Wallet`).
  - Mô hình 3 xô số dư: `AvailableBalance`, `PendingBalance` (tiền Escrow đang giữ chờ giải ngân), `WithdrawingBalance` (tiền phong tỏa chờ Admin duyệt rút). Ràng buộc toàn vẹn DB: `CK_Wallet_NonNegativeBalances`.
  - Thanh toán khóa học bắt buộc qua ví (`Wallet.AvailableBalance`) với khóa dòng bi quan (`SELECT ... FOR UPDATE`).
  - Sổ cái tài chính `WalletTransactions` là append-only (chỉ thêm mới, cấm sửa/xóa giao dịch đã ghi).
  - Toàn bộ hoàn tiền (hủy khóa, hủy buổi, phán quyết tranh chấp) định tuyến trực tiếp vào ví người dùng (`AvailableBalance`).
  - Hạn mức rút tiền tối thiểu 50.000 VNĐ cho cả gia sư và học viên qua `Withdrawals`.
  - Tương thích ngược thông qua route aliasing: `/api/v1/wallets/me`, `/api/v1/tutors/me/wallet`, `/api/v1/students/me/wallet`.

---

## ⚠️ Các Bẫy Kỹ Thuật Thường Gặp Cần Tránh

1. **Bẫy lọc ngày (Date Filtering Bug):** Khi lọc `fromDate` đến `toDate`, luôn dùng khoảng nửa mở (Half-Open Interval): `CreatedAt >= fromDate.Date && CreatedAt < toDate.Date.AddDays(1)`.
2. **Bẫy đơn vị tiền VNPay (* 100):** VNPay yêu cầu số tiền nhân 100 (`Amount * 100`). Khi nhận IPN về, phải chia 100 (`vnp_Amount / 100`) trước khi so sánh với `Transaction.Amount`.
3. **Bẫy kiểm tra giờ rảnh Gia sư:** Giờ bắt đầu và kết thúc của Session lưu ở UTC. Phải convert sang `Asia/Ho_Chi_Minh` trước khi kiểm tra `DayOfWeek`, `StartTime`, `EndTime` trong bảng `AvailabilitySlots`.
4. **Bẫy kiểm tra file đính kèm & bằng chứng:** Dung lượng tối đa 10MB và bắt buộc kiểm tra MIME Type whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `text/plain`).

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
