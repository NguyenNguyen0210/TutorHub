# CLAUDE.md — TutorHub Developer Guide & Repository Invariants

> **TutorHub** là nền tảng marketplace kết nối Gia Sư và Học Viên trực tuyến.  
> Hệ thống hỗ trợ đặt lịch giữ chỗ 15 phút, thanh toán bảo chứng (Escrow Wallet), tích hợp cổng thực tế **VNPay 2.1.0** và quản trị Admin toàn diện.

---

## 💻 Tech Stack & Core Versions

* **Runtime:** .NET 8.0 SDK (`LangVersion = 12.0`)
* **Framework:** ASP.NET Core Web API (.NET 8)
* **Database & ORM:** PostgreSQL 16 (`Npgsql.EntityFrameworkCore.PostgreSQL 8.0.11`), EF Core 8.0.11
* **Architecture Patterns:** Clean Architecture + CQRS + Vertical Slice Architecture
* **Libraries:** MediatR 12.4.1, FluentValidation 11.11.0, BCrypt.Net-Next 4.0.3, System.IdentityModel.Tokens.Jwt 8.0.1, Swashbuckle.AspNetCore 6.6.2
* **DevOps:** Docker, Docker Compose

---

## ⚡ Commands

```bash
# Development
dotnet run --project src/backend/TutorHub.Api

# Build Solution (Strict Zero Warning Policy)
dotnet build src/backend/TutorHub.sln

# Run Test Suite (Unit Tests & Integration Tests)
dotnet test src/backend/TutorHub.sln

# Run Docker Environment (Postgres + API Container)
docker-compose up -d --build

# Dừng process API bị lock trên Windows (nếu có)
Stop-Process -Name "TutorHub.Api" -Force -ErrorAction SilentlyContinue
```

---

## 🏛️ Kiến Trúc Hệ Thống (Thứ gì nằm ở đâu và vì sao)

* `src/backend/TutorHub.Domain/`: **Cốt lõi độc lập**. Chứa Entities (`User`, `TutorProfile`, `Booking`, `Transaction`, `Wallet`...), Enums, và Business Policies. Tuyệt đối không phụ thuộc vào bất kỳ layer hay thư viện bên ngoài nào.
* `src/backend/TutorHub.Application/`: **Nghiệp vụ ứng dụng**. Tổ chức theo **Vertical Slice Architecture** (`Features/{Module}/{FeatureName}/`). Mỗi slice chứa `Command/Query`, `Validator`, `Handler`, và `DTOs`. Chứa Abstractions (`IAppDbContext`, `IVnPayService`, `IObjectStorageService`, `IJwtService`).
* `src/backend/TutorHub.Infrastructure/`: **Triển khai kỹ thuật**. Chứa `AppDbContext`, `JwtService`, `BcryptPasswordHasher`, `VnPayService` (HMAC SHA512), `CloudflareR2ObjectStorageService`, và `BookingTimeoutBackgroundService`.
* `src/backend/TutorHub.Api/`: **Giao tiếp ngoại vi (Thin Controllers)**. Tiếp nhận HTTP request, trích xuất Claims, dispatch qua `ISender.Send()`, và trả về `ApiResponse<T>`.
* `src/frontend/`: **Giao diện người dùng Client**. Nơi chứa ứng dụng Frontend kết nối tới Backend API.
* `src/test/`: **Kiểm thử tự động**. Chứa `TutorHub.Domain.UnitTests`, `TutorHub.Application.UnitTests`, v.v.

---

## 📐 Code Conventions Thực Tế Trong Codebase

1. **Envelope Response:** Mọi endpoint thành công phải trả về `ApiResponse<T>.SuccessResult(data, message)`.
2. **Exception Handling:** Không bắt exception trong Controller. Ném các domain exception có cấu trúc (`NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`, `UnauthorizedException`), `GlobalExceptionHandler` sẽ tự động map ra HTTP status code và JSON chuẩn.
3. **DTOs:** Sử dụng C# positional `record` bất biến (Immutable).
4. **Validation:** Viết class kế thừa `AbstractValidator<TCommand/Query>` trong cùng thư mục slice. Pipeline Behavior sẽ tự động validate trước khi vào Handler.
5. **Timezone Rule:** Toàn bộ dữ liệu ngày giờ lưu trong DB là **Strict UTC** (`DateTime.UtcNow`). Chỉ chuyển đổi UTC+7 khi giao tiếp với định dạng ngày của VNPay.
6. **Pagination:** Sử dụng `PagedResult<T>` với sắp xếp deterministic bắt buộc: `.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)`.

---

## 🚫 LUẬT CỨNG [ĐIỀU KHÔNG ĐƯỢC PHÁ]

* ⛔ **1. Không bao giờ tắt `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`:** Mọi commit phải build thành công với **0 Warnings, 0 Errors**.
* ⛔ **2. Không viết business logic trong Controller:** Controller chỉ được làm 3 việc: Lấy input/claims ➔ Dispatch MediatR ➔ Trả `Ok(ApiResponse)`.
* ⛔ **3. Background Service không được bypass Application layer:** Background worker chỉ đóng vai trò timer scheduler kích hoạt `ISender.Send(new Command())`. Không thao tác Entity trực tiếp trong Worker.
* ⛔ **4. Không được dùng `BookingId` làm `vnp_TxnRef` trên cổng VNPay:** Phải luôn sinh mã `MerchantReference` độc lập (`THB...`) để cho phép học viên thanh toán lại nếu lần trước thất bại.
* ⛔ **5. VNPay Return URL là Read-Only:** Tuyệt đối không được thay đổi trạng thái database hay cộng tiền ví trong Return URL. Mọi mutation tài chính bắt buộc phải nằm trong **IPN Webhook** và bọc trong **Database Transaction**.
* ⛔ **6. Không bao giờ cộng `TotalAmount` thô vào ví Gia sư:** Tiền giải ngân cho gia sư bắt buộc phải là `PayoutAmount` (sau khi đã trừ hoa hồng sàn `CommissionAmount`). Thỏa mãn bất biến: `GrossAmount = CommissionAmount + PayoutAmount`.
* ⛔ **7. Bảo vệ an toàn Admin:** Không cho phép Admin tự vô hiệu hóa tài khoản của chính mình (`409 Conflict`), và không cho phép vô hiệu hóa Admin đang active cuối cùng.
* ⛔ **8. Không commit secret key thật lên Git:** Toàn bộ Secret/Password phải dùng Environment Variables hoặc `appsettings.Development.json` local.

---

## ⚠️ Các Bẫy Mà Engineer Mới Sẽ Dính Ngay Tuần Đầu

1. **Bẫy lọc ngày (Date Filtering Bug):** Khi lọc `fromDate` đến `toDate`, nếu viết `CreatedAt <= toDate` sẽ làm mất toàn bộ giao dịch phát sinh trong ngày `toDate` sau 00:00:00. **Luôn dùng Half-Open Interval:** `CreatedAt >= fromDate.Date && CreatedAt < toDate.Date.AddDays(1)`.
2. **Bẫy trạng thái Booking sau thanh toán:** Sau khi thanh toán thành công (Mock hoặc VNPay IPN), `Booking.Status` chuyển sang **`Pending`** (chờ gia sư bấm nhận lớp), **KHÔNG PHẢI** chuyển thẳng sang `Confirmed`.
3. **Bẫy nhân đôi SaveChanges khi tạo StudentProfile:** Trong `CreateBookingCommandHandler`, không gọi `SaveChangesAsync` tức thời khi vừa tạo mới `StudentProfile`. Hãy để EF Core tự tracking và commit chung trong 1 lần lưu duy nhất ở cuối handler.
4. **Bẫy đơn vị tiền VNPay (* 100):** VNPay yêu cầu số tiền nhân 100 (`Amount * 100`). Khi nhận IPN về, phải chia 100 (`vnp_Amount / 100`) trước khi so sánh với `Transaction.Amount`.
5. **Bẫy Swagger SchemaId Conflict:** Khi các DTO ở các slice khác nhau có cùng tên (vd: `UpdateProfileRequest`), không đổi tên bừa bãi. Hệ thống đã cấu hình `CustomSchemaIds(type => type.ToString().Replace("+", "."))` trong `Program.cs`.
