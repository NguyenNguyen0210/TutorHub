# Rà soát lại toàn bộ code — TutorHub @ HEAD `65ac2bc`

**Phạm vi:** `src/backend` (.NET 8, 837 file `.cs`), `src/frontend` (React 18 + Vite, 69 file trong `src/`), `src/test` (572 test), Docker/config, git history, tài liệu.
**Phương pháp:** chạy thật (build, test, lint, mô phỏng Docker build, probe .NET runtime, `git show` history) + đọc code + grep đối chiếu chéo frontend ↔ backend.

**Quy ước độ tin cậy**
- ✅ = tôi **đã tự chạy hoặc tự đọc** và xác minh trực tiếp (có trích code/dòng).
- 🔎 = phân tích tĩnh, chưa tự chạy.

---

## 0. ĐÍNH CHÍNH: hai báo cáo cũ không còn dùng được làm mốc

`PROJECT-REVIEW.md` và `UI-AUDIT.md` được commit ở `a69d281` — **trước toàn bộ commit sửa lỗi**. Kể từ đó `src/frontend` đổi **63 file**, `src/backend`+`src/test` đổi 13 file.

Nghiêm trọng hơn: báo cáo cũ **sai ngay tại commit của chính nó**:

- Nó khẳng định *"Grep toàn backend: `AddCors|UseCors|WithOrigins|AllowAnyOrigin` → 0 match"*. Nhưng `git show a69d281:src/backend/TutorHub.Api/Program.cs` cho thấy **đã có** `builder.Services.AddCors(...)` và `app.UseCors()`. ⇒ **Sai**.
- Nó nghi ngờ `app.UseExceptionHandler(_ => { })` khiến `GlobalExceptionHandler` **không bao giờ chạy**. Tôi đã kiểm chứng bằng thực nghiệm — xem §2.1. ⇒ **Sai**.

> **Hệ quả:** mọi kết luận dưới đây được xác minh lại từ code hiện tại, không kế thừa báo cáo cũ.

---

## 1. Số liệu thật đo được

| Hạng mục | Kết quả |
| :--- | :--- |
| `dotnet build src/backend/TutorHub.sln` (mặc định) | ❌ **FAIL** — in ra `0 Warning(s), 0 Error(s)` nhưng `Build FAILED` (§6) |
| `dotnet build ... -m:1` | ✅ **succeeded, 0 Warning, 0 Error** |
| `dotnet build` + `global.json` ghim SDK 9.0.318 | ✅ **succeeded, 0 Warning, 0 Error** (18s) |
| `dotnet test` **từng project** | ✅ **572 pass / 0 fail** — Domain **196**, Application **283**, Infrastructure **21**, Api.Integration **72** |
| `dotnet test src/backend/TutorHub.sln` (một lệnh) | ❌ **crash** — mọi test DLL *"exited with error: Unhandled exception"* |
| Frontend `npm run lint` | ✅ exit 0 |
| Frontend `npm run build` | ✅ 3195 modules, 23.19s |
| `docker-compose up -d --build` | ❌ **chắc chắn fail** — mô phỏng chính xác chuỗi `COPY` của Dockerfile ⇒ **MSB3202 ×4** (§4.1) |
| Docker daemon | Không chạy trên máy này ⇒ không chạy container thật được |

**Tài liệu lệch thực tế:** `CLAUDE.md` ghi 398/406 test, `PROJECT-REVIEW.md` ghi 449 — thực tế **572**.

---

## 2. P0 — Nghiêm trọng nhất

### 2.1. ✅ Kết luận về `UseExceptionHandler(_ => { })`: **KHÔNG phải lỗi** (đã test thực nghiệm)
`Program.cs:252` dùng overload `Action<IApplicationBuilder>`. Tôi dựng một app .NET 8 tối giản (ngoài repo, runtime `Microsoft.AspNetCore.App 8.0.23` — đúng bản repo target), đăng ký `AddExceptionHandler<MyHandler>()` + `AddProblemDetails()`, và so sánh 2 overload bằng cách chạy thật + `curl`:

| Overload | `/boom` (exception thường) | `/app` (exception mang `StatusCode = 409`) |
| :--- | :--- | :--- |
| `UseExceptionHandler(_ => { })` (như repo) | `500` + body handler | **`409`** + body handler |
| `UseExceptionHandler()` (parameterless) | `500` + body handler | **`409`** + body handler |

⇒ Trên .NET 8 **cả hai overload đều gọi `IExceptionHandler` từ DI**. `GlobalExceptionHandler` chạy bình thường.
**Củng cố thêm:** repo **đã có** test HTTP thật cho việc này — `src/test/TutorHub.Api.IntegrationTests/SessionReadAccessTests.cs:65-95` dùng `Factory.CreateClient()` + `HttpRequestMessage`, assert `HttpStatusCode.Forbidden` **và** đọc envelope `success` (thuộc tính chỉ `GlobalExceptionHandler` mới ghi).
**Khuyến nghị duy nhất (P2):** đổi thành `app.UseExceptionHandler()` cho rõ nghĩa — đây **không phải** lỗ hổng.

### 2.2. 🔴 Secret thật nằm trong **lịch sử git** và **vẫn khớp `.env` đang dùng** ✅
Commit `be9c612` (*"security(config): sanitize credentials from appsettings.Development.json…"*) là commit **xoá** secret — và nó **là ancestor của HEAD** (đã kiểm `git merge-base --is-ancestor be9c612 HEAD` → exit 0). Nội dung trước đó:

```
$ git show be9c612^:backend/src/TutorHub.Api/appsettings.Development.json
"DefaultConnection": "Host=localhost;Port=5432;Database=tutorhub;Username=tutorhub;Password=123456"
"Secret":          "super_secret_jwt_key_tutorhub_platform_minimum_32_characters_long_2026!"
"HashSecret":      "RAOCTALYCPWNZGUPWSLTSOBNYMNYIDJA"
"AccountId":       "a723aecd2d08dcca2efc3a66d27e16db"
"AccessKeyId":     "0b9cb1f3daeb2808451dd2c03aa9b87f"
"SecretAccessKey": "443778f48446753997677d6f59725b4f5eb49e73e3206cb07c3cfe98e0406f51"
```

Và `.env` (không được git track, nhưng **đang dùng thật**) khớp **chính xác** các giá trị đó — tôi đã tự so khớp:
```
POSTGRES_PASSWORD=123456
VnPay__HashSecret      khớp "RAOCTALYCPWNZGUPWSLTSOBNYMNYIDJA"  → True
CloudflareR2__AccessKeyId   khớp "0b9cb1f3daeb2808451dd2c03aa9b87f" → True
CloudflareR2__SecretAccessKey khớp "443778f4…406f51"            → True
Jwt__Secret còn là "super_secret_…"  → False  (khoá JWT ĐÃ rotate — tốt)
```
**Vì sao là P0:** R2 `AccessKeyId` + `SecretAccessKey` = toàn quyền đọc/ghi/xoá bucket media; VnPay `HashSecret` = **ký được IPN giả** ⇒ cộng tiền vào ví. Đây là **thông tin xác thực còn sống**, không phải giá trị đã hết hiệu lực.
**Sửa:** rotate R2 keys + VnPay HashSecret + `POSTGRES_PASSWORD` **ngay**; purge history (`git filter-repo`/BFG) rồi force-push; coi như đã bị xâm nhập và soát `AuditLog`.
**Ghi nhận tích cực:** ở HEAD, `appsettings.Development.json` để **rỗng** và `docker-compose.yml:36` là `${Jwt__Secret}` **không có default** ⇒ không còn lỗ hổng "default value trùng secret đã commit" (khác mô tả trong báo cáo cũ).

### 2.3. ✅💥 Chuỗi bằng chứng tranh chấp bị đứt ⇒ **không tranh chấp nào được phân xử tài chính**
Bốn mắt xích, mỗi mắt đã kiểm riêng:

1. `DisputeNew.jsx:31-36` gửi `evidenceUrl` (một URL ảnh stock Unsplash).
2. `services/dispute.service.js:28-30` **chỉ nhận 3 field** ⇒ `evidenceUrl` bị **vứt bỏ im lặng**:
```js
async createDispute({ sessionId, reason, description }) {
  const res = await api.post('/disputes', { sessionId, reason, description });
```
3. `DisputesController.cs:84-88` — `CreateDisputeRequest(Guid SessionId, DisputeReason Reason, string Description)` **không có** `evidenceUrl`; và grep toàn `src/frontend/src` cho `/evidence` → **0 kết quả** ⇒ frontend **chưa bao giờ** gọi `POST /disputes/{id}/evidence` (`DisputesController.cs:50`).
4. `AdminResolveDisputeCommandHandler.cs:66-70` **bắt buộc** ≥1 bằng chứng:
```csharp
if (request.Decision != DisputeResolutionDecision.DismissedNoFinancialChange &&
    (dispute.Evidences == null || dispute.Evidences.Count == 0))
    throw new ConflictException("Cannot resolve a dispute with financial consequences before at least one evidence is uploaded.");
```

**⇒ Mọi tranh chấp mở từ UI đều 0 bằng chứng ⇒ Admin không thể hoàn tiền (mọi quyết định tài chính đều 409).** Lối duy nhất còn lại là `DismissedNoFinancialChange` — tức **giải phóng tiền về cho gia sư**. Toàn bộ Dispute Engine không dùng được từ UI.
Thêm: `AdminDisputeDetail.jsx` **không hiển thị bằng chứng** (grep `evidences|fileUrl|evidenceUrl` trong `pages/admin` → 0 kết quả).
**Sửa:** gọi `POST /disputes/{id}/evidence` sau khi tạo dispute (kèm input file thật) + hiển thị bằng chứng cho admin.

### 2.4. ✅ Admin phân xử dựa trên **số liệu bịa** rồi ghi tiền thật
`AdminDisputeDetail.jsx:10-19` (đã tự đọc):
```jsx
const caseId = id || 'ba07ba07-0001';
const [refundAmount, setRefundAmount] = useState(200000);
const [adminNote, setAdminNote] = useState('Qua kiểm tra log Google Meet, gia sư không tham gia phòng học. Chấp thuận hoàn 100% học phí buổi cho học viên.');
const originalSessionFee = 200000;
const platformFeeRate = 0.10; // 10%
const tutorReceivedOriginal = originalSessionFee * (1 - platformFeeRate);
```
Backend **có sẵn** dữ liệu thật: `[HttpGet("{id:guid}/investigation")]` → `DisputeInvestigationDto.FinancialSummary`, và `admin.service.js:298 getDisputeDetail(id)` **đã viết nhưng không page nào gọi**.
⇒ Admin đọc 200.000 ₫ / 10% / 180.000 ₫ **bịa** rồi gửi phán quyết tiền thật qua `applyDisputeVerdict` (`admin.service.js:390-391`).

### 2.5. ✅ Bảng điều khiển Admin đọc 8 field **không tồn tại** ⇒ doanh thu `0 ₫`, tỷ lệ phí `NaN%`
DTO thật `AdminDashboardStatsDto.cs:34-46`:
```csharp
public record FinancialStatsDto(decimal TotalGmv, decimal NetGmv, decimal TotalPlatformRevenue, decimal TotalTutorPayouts, decimal TotalRefundedAmount);
public record ActionQueueDto(int PendingTutorsCount, int PendingWithdrawalsCount, int OpenReportsCount);
```
`normalizeAdminStats` (`admin.service.js:155-191`) xuất **đúng** camelCase của các tên đó, nhưng `AdminDashboard.jsx` đọc:
```jsx
65:  `${actionQueue.openDisputes} vụ việc`              // không tồn tại
77:  `${actionQueue.pendingWithdrawals} lệnh`           // thật: pendingWithdrawalsCount
89:  `${actionQueue.pendingTutorApplications} hồ sơ`    // thật: pendingTutorsCount
143: {formatCurrency(financials.totalRevenue)}          // thật: totalPlatformRevenue ⇒ "0 ₫"
146: (financials.platformCommissionRate * 100).toFixed(0) // không tồn tại ⇒ "NaN%"
176: {tutors.activeTutors} / {tutors.totalTutors}       // không tồn tại
179: {tutors.pendingApplications} hồ sơ                // thật: pendingReviewTutors
```

### 2.6. ✅ `authStore` nuốt `IdProfile` ⇒ 2 trang Gia sư gọi sai ID (**404**)
`authStore.js:57-65` map user **thiếu** `idProfile`; `UserDto.cs:3-10` có `Guid? IdProfile`.
`TutorServices.jsx:12` và `TutorAvailability.jsx:15`: `const tutorId = user?.tutorProfileId || user?.id;`
⇒ gọi `GET /tutors/{userId}/services|availability`, nhưng handler tra theo **TutorProfile.Id** — `GetTutorAvailabilityQueryHandler.cs:25`:
```csharp
.FirstOrDefaultAsync(t => t.Id == request.TutorProfileId, cancellationToken);   // :29 → NotFoundException
```
**Sửa:** map `idProfile`, hoặc dùng endpoint self có sẵn (`TutorsController.cs:390 GET me/services`, `:285 GET me/availability-slots`).

### 2.7. ✅ Checkout hiển thị đơn hàng bịa (`BookingCheckout.jsx:10,21-31`)
```jsx
const currentBookingId = id || paramBookingId || 'BK-2026-9021';
const orderData = { bookingId: currentBookingId, tutorName: 'ThS. Nguyễn Văn An',
  packageName: 'Gói Luyện Thi THPT Toán 10 Buổi…', sessionCount: 10,
  pricePerSession: 200000, totalAmount: 2000000 };
```
`bookingService.getBookingById` tồn tại (`booking.service.js:38`) nhưng **không được gọi** ⇒ nút "Thanh Toán 2.000.000 ₫" hiển thị số không liên quan booking thật; fallback `'BK-2026-9021'` không phải GUID.

### 2.8. ✅ Ngưỡng rút tối thiểu 50.000 ₫ **không được enforce ở server**
`grep MinWithdrawalAmount`: **chỉ** có `src/backend/seedData.sql:498`. Không code nào đọc.
`CreateWithdrawalCommandValidator.cs:9-10` chỉ `RuleFor(x => x.Amount).GreaterThan(0)`.
Frontend chặn bằng **literal hardcode** (`TutorWithdraw.jsx:59,150,194`, `TutorWallet.jsx:65`), còn `constants.js:64 MIN_WITHDRAWAL_AMOUNT: 50000` **không được import ở đâu**.
⇒ **Gọi API trực tiếp rút được 1 VNĐ.**

---

## 3. P1 — Tính đúng đắn tài chính backend

### 3.1. ✅ GMV / "In Escrow" **đếm trùng** (giao dịch `BookingPayment` kẹt ở `Held` vĩnh viễn)
`GetAdminDashboardStatsQueryHandler.cs:104-119`:
```csharp
var heldTx = transactionGroup.FirstOrDefault(g => g.Status == TransactionStatus.Held);
decimal heldAmount = heldTx?.TotalAmount ?? 0;
decimal releasedAmount = releasedTx?.TotalAmount ?? 0;
decimal totalGmv = heldAmount + releasedAmount + refundedAmount;
```
Kiểm chứng vòng đời: `BookingPayment` sinh ra ở `Status = Held` (`InitiatePaymentCommandHandler.cs:77`) và sau khi thanh toán **vẫn** `Held` (`HandlePaymentWebhookCommandHandler.cs:108`). Grep toàn backend cho thấy **nơi duy nhất** từng đưa `BookingPayment` về trạng thái cuối là `CancelBookingCommandHandler.cs:86` (`Failed`); `Transaction.cs:79 Released` nằm trong `CreatePayout` (`SessionPayoutCredit`).
⇒ Khi N buổi được giải ngân hết, `releasedAmount` == đúng `TotalPrice` của booking nhưng `heldAmount` **vẫn còn nguyên** `TotalPrice` ⇒ **cùng một đồng tiền bị tính 2 lần** vào GMV. Nhãn `// Held = In Escrow` (dòng 91) cũng sai với enrollment đã giải ngân hết.

### 3.2. ✅ Doanh thu phí sàn trên Dashboard **không trừ `PlatformFeeReversal`**
`GetAdminDashboardStatsQueryHandler.cs:120`:
```csharp
decimal totalPlatformRevenue = releasedTx?.TotalPlatformFee ?? 0;
```
Phí hoàn nằm ở `Status = Succeeded` với `CommissionAmount = feeReversalAmount` (`Transaction.cs:145-151`) nên **nằm ngoài** nhóm `Released`, không bao giờ bị trừ — trong khi `AdminGetPlatformRevenueAnalyticsQueryHandler` lại trừ đúng. **Hai màn hình admin báo hai con số doanh thu khác nhau.**
*(Liên quan: `Transaction.CreateFeeReversal` đặt `Amount = 0`, giá trị thật ở `CommissionAmount` — mọi `Sum(t => t.Amount)` bỏ sót hoàn phí.)*

### 3.3. ✅ Checkout hết hạn để lại giao dịch `Held` **rác vĩnh viễn**
`ProcessBookingTimeoutsCommandHandler.cs:40-46` hủy booking nhưng **không** đụng tới transaction:
```csharp
booking.Status = BookingStatus.Cancelled;
booking.CancelledBy = CancelledBy.System;
booking.CancellationReason = "HoldingExpired";
booking.CancelledAt = now;
```
Trong khi luồng hủy thủ công **có** (`CancelBookingCommandHandler.cs:84-87`: `paymentTx.Status = TransactionStatus.Failed`).
⇒ Mọi booking hết hạn 15 phút (rất phổ biến) để lại `Transaction` `Held` vĩnh viễn ⇒ phình `heldAmount`/GMV và **khuếch đại lỗi 3.1**.

### 3.4. ✅ Tranh chấp thứ 2 sau khi hoàn tiền pre-release ⇒ **hoàn tiền 2 lần**
- `CreateDisputeCommandHandler.cs:55-58` chỉ chặn `Unscheduled`/`Cancelled`.
- `AdminResolveDisputeCommandHandler.cs:163` đã tiêu escrow: `tutorWallet.DebitPending(gross, now);`
- Nhưng `AdminResolveDisputeCommandHandler.cs:221` truyền `releasePayout: tutorGrossRelease > 0`; khi hoàn **100%** thì `tutorGrossRelease = 0` ⇒ `Session.cs:245-247` **không** set `IsPayoutReleased = true`:
```csharp
if (releasePayout)
{
    IsPayoutReleased = true;
}
```
- Nên `session.IsPayoutReleased` **vẫn false** ⇒ `CreateDisputeCommandHandler.cs:92` lại chọn **Stage A** cho tranh chấp thứ hai ⇒ `DebitPending(gross)` lần nữa ⇒ **hoàn tiền lần 2**, lấy từ escrow của enrollment khác; nếu không đủ thì ném `InvalidOperationException` → 500.
**Sửa:** cờ terminal ở cấp Session (hoặc set `IsPayoutReleased = true` khi escrow đã bị tiêu bởi refund) và chặn tạo dispute mới khi đã có kết quả tài chính.

### 3.5. ✅ Trần thu hồi fallback về **GROSS** (vượt tiền gia sư thực nhận)
`CreateDisputeCommandHandler.cs:107`:
```csharp
var maxTutorRecovery = originalTx?.PayoutAmount ?? session.EarningAmount;
```
Đã chứng minh `EarningAmount` = **GROSS**, `PayoutAmount` = **NET**:
- `SubmitAttendanceCommandHandler.cs:124-127`: `var gross = session.EarningAmount; … SplitGross(gross, commissionRate)` → `(commissionAmount, netPayout)`
- `Transaction.CreatePayout` (`Transaction.cs:74,77`): `Amount = gross`, `PayoutAmount = netPayout`
- `AdminResolveDisputeCommandHandler.cs:131`: `var gross = session.EarningAmount;`
**Sửa:** thiếu giao dịch gốc ⇒ coi như 0 và chuyển `RequiresAdminFinancialIntervention`.

### 3.6. ✅ Guard "đủ tiền thu hồi" (Stage B) dùng `AvailableBalance` ⇒ có thể phá `HeldBalance ≤ AvailableBalance`
`AdminResolveDisputeCommandHandler.cs:302-330`:
```csharp
// Note: HeldBalance already includes this dispute's reserved hold, so the
// check is against AvailableBalance (which contains the hold), not WithdrawableBalance
if (tutorWallet.AvailableBalance < tutorNetRecovery) { /* RequiresAdminFinancialIntervention */ }
...
if (dispute.HeldAmount > 0) { tutorWallet.ReleaseHold(dispute.HeldAmount, now); }
tutorWallet.DebitAvailable(tutorNetRecovery, now);
```
`Wallet.cs`: `Hold` **chỉ tăng** `HeldBalance` (`:64-73`); `ReleaseHold` **chỉ giảm** `HeldBalance` (`:75-83`); `DebitAvailable` chỉ kiểm `AvailableBalance` (`:85-93`).
⇒ Khi một ví có **nhiều tranh chấp cùng giữ tiền**, khoản thu hồi có thể ăn vào tiền đang giữ cho tranh chấp **khác** ⇒ `WithdrawableBalance = Available − Held` **âm**, tức `HeldBalance > AvailableBalance`.
**Bất biến này không được chặn ở tầng nào:**
- Domain `Wallet.cs` không assert.
- `AppDbContext.EnforceLedgerImmutability` chỉ lo Transaction/AuditLog.
- DB check constraint `WalletConfiguration.cs:15` **thiếu**:
```csharp
t.HasCheckConstraint("CK_Wallet_NonNegativeBalances", "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0");
```
Không ràng buộc `HeldBalance >= 0`, **không** ràng buộc `HeldBalance <= AvailableBalance`.
**Sửa:** sửa guard (so với `WithdrawableBalance` **sau khi** nhả hold của chính dispute) + thêm check constraint.

### 3.7. ✅ Nhánh thiếu `else` khi không tìm thấy ví ⇒ tranh chấp không hold, không cờ admin
`CreateDisputeCommandHandler.cs:110-146`: `if (tutorWallet != null) { … }` **không có `else`** ⇒ không tìm thấy ví thì dispute post-release được tạo với `HeldAmount = 0`, `HoldType = None`, status `Open` — tiền không bị giữ mà hệ thống không báo.

### 3.8. ✅ 7 handler phân trang thiếu tiebreaker (gồm **sổ cái kiểm toán**)
`CLAUDE.md` quy ước 7: `.OrderByDescending(...).ThenBy(x => x.Id)`. Đo chính xác (`.Skip(` + `.OrderByDescending(` và **không** có `ThenBy`/`ThenByDescending`) = **7 file**; 20 file khác làm đúng:

| # | File | dòng |
| :--- | :--- | :--- |
| 1 | `Admin/AuditLogs/GetAdminAuditLogs/AdminGetAuditLogsQueryHandler.cs` | 60 |
| 2 | `Admin/TutorApplications/GetAdminTutorApplications/…QueryHandler.cs` | 41 |
| 3 | `Admin/Withdrawals/GetAdminWithdrawals/…QueryHandler.cs` | 38 |
| 4 | `Agreements/Queries/GetMyAgreements/…QueryHandler.cs` | 44 |
| 5 | `Disputes/Queries/AdminGetDisputes/…QueryHandler.cs` | 38 |
| 6 | `Enrollments/GetMyEnrollments/…QueryHandler.cs` | 47 |
| 7 | `Wallets/GetMyWithdrawals/…QueryHandler.cs` | 52 |

Nghiêm trọng nhất là #1 — `AdminGetAuditLogsQueryHandler.cs:60-62`:
```csharp
.OrderByDescending(a => a.CreatedAt)
.Skip((page - 1) * size)
.Take(size)
```
Audit log ghi theo lô nên `CreatedAt` trùng nhau ⇒ **dòng lặp hoặc mất khi lật trang**. *(Đây đúng là danh sách 7 mà `PROJECT-REVIEW.md` đã nêu — mục đó chính xác và **vẫn chưa sửa**.)*

### 3.9. ✅ Upload bằng chứng tranh chấp: bất biến 10MB/MIME **không được thực thi**
`DisputesController.cs:52-63,90-95` — `[FromBody] UploadEvidenceRequest(FileName, FileUrl, ContentType, FileSizeBytes)`, **không có `IFormFile`**, không byte nào đi qua server.
`UploadDisputeEvidenceCommandValidator.cs:16-23` chỉ kiểm **giá trị client khai**:
```csharp
RuleFor(x => x.FileSizeBytes).GreaterThan(0)…LessThanOrEqualTo(UploadLimits.EvidenceMaxBytes);
RuleFor(x => x.ContentType).NotEmpty().Must(mime => AllowedMimeTypes.Contains(mime));
```
⇒ (a) `CLAUDE.md` trap #4 **không được enforce thật**; (b) `FileUrl` là chuỗi tuỳ ý (`MaximumLength(1024)`, không kiểm host/sở hữu).
Đối chiếu: `UploadMediaCommandHandler` **đã làm đúng** (magic bytes qua `FileSignatureValidator`).

### 3.10. ✅ Chat attachment: tin `Content-Type` client + extension lấy từ tên file người dùng
`ConversationsController.cs:155-161` kiểm độ lớn thật nhưng `contentType = file.ContentType` (header client gửi, không sniff magic bytes).
`LocalFileStorage.cs:21-22`:
```csharp
var extension = Path.GetExtension(fileName);
var uniqueKey = $"{Guid.NewGuid():N}{extension}";
```
⇒ `evil.html` + `Content-Type: image/png` **lọt whitelist** và lưu thành `<guid>.html`.
**Đánh giá chính xác:** hiện **chưa khai thác được ngay** — `Program.cs` không dùng `UseStaticFiles`, và endpoint tải về ép `application/octet-stream`. Đây là **kiểm soát bị suy yếu**, thành stored-XSS ngay khi ai bật static hosting.
Kèm: `UploadLimits.ChatAttachmentMimeTypes` = `{jpeg, png, **gif**, pdf}` — **nhận `gif` trái phép**, **thiếu `webp`/`text/plain`** so với chuẩn (và `EvidenceMimeTypes` bên cạnh lại đúng chuẩn).

### 3.11. ✅ Presigned/`CompleteUpload`: `ObjectKey` tuỳ ý, thiếu check vai trò
`CompleteUploadCommandHandler.cs:33-55` (đã tự đọc): chỉ `ExistsAsync(request.ObjectKey)`, rồi lưu `ObjectKey`/`ContentType`/`FileSize` **thẳng từ request** với `UploadedByUserId = userId` (chính người gọi).
`GetMediaUrlQueryHandler.cs:38-47` chỉ kiểm `media.UploadedByUserId == userId` ⇒ user tự tạo row Media trỏ tới **ObjectKey bất kỳ** (kể cả file private của người khác) rồi mint presigned GET 15 phút. Khai thác cần biết ObjectKey (GUID 128-bit, khó đoán) — nhưng key lộ qua `DisputeEvidence.FileUrl`/`Message.AttachmentKey`.
**Thiếu nhất quán vai trò:** `UploadMediaCommandHandler.cs:38` và `GenerateUploadUrlCommandHandler.cs:27` đều chặn `MediaType.Certificate` cho non-Tutor/Admin, nhưng `CompleteUploadCommandHandler` **không** có check này.
**Thiếu hạn mức thật:** `EstimatedSize` là optional, presigned PUT không có `content-length-range`.
**Sửa:** validate `ObjectKey` khớp prefix `{…}/{userId}/…`; thêm check vai trò; bắt buộc `EstimatedSize`.

### 3.12. ✅ NRE ở endpoint Nhật ký buổi học
`GetLearningRecordQueryHandler.cs:24-27` chỉ `.Include(s => s.Enrollment)`, rồi dòng 35-36 đọc navigation bậc 2:
```csharp
if (session.Enrollment.StudentProfile.UserId != userId &&
    session.Enrollment.TutorProfile.UserId != userId)
```
Grep `AutoInclude|UseLazyLoadingProxies` toàn backend → **0 match** ⇒ `StudentProfile`/`TutorProfile` là `null` ⇒ **NullReferenceException (500)**, và check phân quyền không bao giờ chạy. **Fail-closed** (không rò rỉ dữ liệu) nhưng endpoint hỏng.
**Sửa:** thêm `.ThenInclude(e => e.StudentProfile)` + `.ThenInclude(e => e.TutorProfile)` (như `GetSessionByIdQueryHandler`).

### 3.13. ✅ Guard chống dispatch trùng của Outbox là **code chết**
`OutboxDispatcherJob.cs:173-182` set `Status`/`LockedBy` rồi `SaveChangesAsync` và bắt `DbUpdateConcurrencyException`; nhưng `OutboxMessageConfiguration.cs` (đã đọc hết) **không có** `IsConcurrencyToken`/`IsRowVersion`/`xmin` ⇒ không có predicate ⇒ hai worker cùng thành công, **cùng dispatch**. Guard chỉ bảo vệ `BusinessEventNotificationHandler`, không bảo vệ subscriber khác.

### 3.14. ✅ `formatDateTime` nói dối về timezone (vi phạm trap #3)
`utils/formatters.js:19-25`:
```js
/** Format date & time in Vietnam timezone (UTC+7) */
export function formatDateTime(date, format = 'DD/MM/YYYY HH:mm') {
  if (!date) return '';
  return dayjs(date).format(format);      // không nạp plugin utc/timezone
}
```
⇒ format theo **giờ local của trình duyệt**, không phải `Asia/Ho_Chi_Minh`. Comment khẳng định điều sai.

---

## 4. P0/P1 — Docker & vận hành

### 4.1. ✅ Docker build hỏng — `MSB3202 ×4`
`Dockerfile:6,12` chạy `COPY TutorHub.sln .` + `RUN dotnet restore TutorHub.sln`, nhưng `TutorHub.sln:14-19` tham chiếu 4 project **ngoài** build context (`context: ./src/backend`):
```
"..\test\TutorHub.Domain.UnitTests\…"      "..\test\TutorHub.Application.UnitTests\…"
"..\test\TutorHub.Api.IntegrationTests\…"  "..\test\TutorHub.Infrastructure.UnitTests\…"
```
**Bằng chứng:** tôi dựng lại đúng thư mục context theo chuỗi `COPY` của Dockerfile rồi chạy restore:
```
error MSB3202: The project file "…\test\TutorHub.Domain.UnitTests\…csproj" was not found.   (×4)
→ EXIT=1
```
**Sửa:** trong Dockerfile restore `TutorHub.Api/TutorHub.Api.csproj` thay vì `.sln`; hoặc dùng `.slnf` chỉ chứa 4 project `src/`.

### 4.2. ✅ `.dockerignore` đặt **sai chỗ**
Chỉ có **một** `.dockerignore` ở **repo root**; `Test-Path src/backend/.dockerignore` = **False**. Docker chỉ đọc `.dockerignore` tại **root của build context** (`./src/backend`) ⇒ `bin/`/`obj/` của host lọt vào image, và `Dockerfile:14 COPY . .` chạy **sau** `dotnet restore` (`:12`) ⇒ `project.assets.json` của Windows ghi đè bản restore trong container → `dotnet publish --no-restore` (`:15`) lỗi.
**Sửa:** tạo `src/backend/.dockerignore` (copy nội dung root) hoặc nâng context lên repo root.

### 4.3. ✅ Container không có cơ chế tạo schema/seed
`grep \.Migrate\(\)|EnsureCreated` toàn `src/backend/**/*.cs` → **0 kết quả**. `docker-compose.yml` không mount `seedData.sql`, không có bước migrate.
Dev đã có đường khác (`README.md:130,147-152` → `scripts/dev-bootstrap.ps1`) ⇒ **đây là lỗ hổng riêng của đường Docker**: sau khi sửa 4.1, `docker-compose up` vẫn cho Postgres **rỗng** và `/health` trả 503.

### 4.4. 🔎 Healthcheck dùng `curl` nhưng image không có `curl`
`docker-compose.yml` healthcheck: `curl -f http://localhost:8080/health || exit 1`; `Dockerfile:18` `FROM mcr.microsoft.com/dotnet/aspnet:8.0` (Debian bookworm-slim, không cài `curl`/`wget`) ⇒ exit 127 ⇒ container API **luôn unhealthy**. *(Phân tích tĩnh + manifest image; không chạy Docker được ở đây.)*
**Sửa:** cài `curl` trong runtime stage, hoặc healthcheck bằng `bash -c '</dev/tcp/…'`.

### 4.5. 🔎 Không có HSTS; `UseHttpsRedirection` vô hiệu trong container
`Program.cs:262 app.UseHttpsRedirection();` — grep toàn repo **không** có `UseHsts`. Container chạy `ASPNETCORE_URLS=http://+:8080`, không có `HttpsPort` ⇒ middleware chỉ log warning rồi bỏ qua.

---

## 5. P1 — Frontend (đã tự xác minh)

| # | Vị trí | Vấn đề |
| :--- | :--- | :--- |
| F1 | `AttendanceCard.jsx:74,164,180` | `session.payoutAmount` **không tồn tại** trong `SessionDto` (field thật `EarningAmount`, `SessionDto.cs:9`) ⇒ **luôn** hiện `200.000 ₫`; dòng 164/180 còn **khẳng định** "đã giải ngân"/"đã phong tỏa" |
| F2 | `AttendanceCard.jsx:68,146` | Hạn chót đối soát hardcode "19:00 ngày mai"; tên gia sư hardcode "ThS. Nguyễn Văn An" — trong khi `SessionDto` **có** `AttendanceVerificationDueAt` (`:20`) và `SessionDetail.jsx:121` đã hiển thị đúng |
| F3 | `AttendanceCard.jsx:188` | CTA xung đột `href="/student/disputes/new"` **thiếu `?sessionId=`** ⇒ `DisputeNew.jsx:9` rơi về `'s3s3s3s3-0003'` (không phải GUID) ⇒ `POST /disputes` bind `Guid` **400** |
| F4 | `DisputeNew.jsx:127` | Khẳng định "Đã đính kèm tệp: screenshot-google-meet-waiting-18h25.png (854 KB)" — **không có `<input type="file">`** nào trong file |
| F5 | `DisputeNew.jsx:11-12` | Prefill sẵn lý do + **nguyên văn lời khai bịa** ("Em đã vào phòng học Google Meet lúc 18:00…") ⇒ nộp được khiếu nại không cần gõ chữ nào |
| F6 | `DisputeNew.jsx:64-67` | Snapshot buổi học bịa: "Buổi #3: Môn Toán THPT (10/09/2026)", "200.000 ₫" |
| F7 | `AdminDisputeDetail.jsx:32-34` | UI **không có đường chọn `TutorWinsReleaseEarning`** (chỉ 3/4 giá trị của `DisputeResolutionDecision.cs`) ⇒ ở tranh chấp pre-release **không cách nào giải ngân tiền cho gia sư** |
| F8 | `Messages.jsx:292-314` | Thẻ "Đề Xuất Hợp Đồng" hardcode `formatCurrency(1000000)` + nút sang `/tutors`, render cho **mọi** hội thoại đang mở |
| F9 | `AdminTutorApplications.jsx:189-232` | Panel duyệt đọc `education/bio/experienceYears/teachingMode/address` — `AdminTutorApplicationListItemDto.cs:3-13` **không có** field nào trong đó ⇒ admin "Phê Duyệt" mà chỉ thấy "Chưa cập nhật học vấn"/"0 năm"/"Online" |
| F10 | `EnrollmentDetail.jsx:132,171` | Đọc `enrollment.tutorName` + `enrollment.platformFeeRate` — `EnrollmentDto.cs:5-23` **không có** cả hai ⇒ luôn ra `0.1` và hiển thị **"10% (Snapshot)"** như số bất biến của hợp đồng, kể cả khi Admin đã đổi phí sàn |
| F11 | `TutorAvailability.jsx:60-65` | Nút "Tạm Dừng Tuyển Sinh" chỉ `setAcceptingStudents` + `message.info` — **không gọi API nào**; `UpdateMyProfileRequest` không có field này ⇒ gia sư tin đã dừng tuyển sinh nhưng hệ thống không biết |
| F12 | `routes/index.jsx:79` | `/tutor/application` nằm ngoài mọi guard, nhưng API yêu cầu `[Authorize(Roles="Tutor")]` ⇒ khách điền xong mới nhận 401/403 |
| F13 | `store/authStore.js:5-6,17-19` | `refreshToken` (hạn **7 ngày**) lưu `localStorage` ⇒ XSS lấy được. Sửa: cookie `HttpOnly; Secure; SameSite` |
| F14 | `config/constants.js:64` | `MIN_WITHDRAWAL_AMOUNT` không được import ở đâu (dead config); `BOOKING_STATUS` (`:21`) **thiếu `Expired`**; `DISPUTE_STATUS` (`:54`) thiếu `RequiresAdminFinancialIntervention`/`RequiresAdminRefundSettlement`; `:34/:41` trùng lặp `enums.js` |
| F15 | `components/**` | **8 component dead 100%** (grep: 0 tham chiếu ngoài chính nó): `ServiceCard`, `TutorCard`, `ReviewsList`, `AvailabilityMatrix`, `ProRataRefundModal`, `VnPayCardInfo`, `PlaceholderScreen`, `AsyncBoundary` |
| F16 | `PaymentReturn.jsx:214` | `result?.bookingId &&` — `Guid` non-nullable ⇒ rỗng là `"00000000-…"` (truthy) ⇒ vẫn hiện link "Thử Thanh Toán Lại" 🔎 |
| F17 | `Notifications.jsx` | `'SessionPayoutReleased'` chứa `'session'` ⇒ thông báo **tiền** bị xếp vào tab "Điểm Danh 24H" 🔎 |
| F18 | `Marketplace.jsx` | Filter thiếu `Offline`; `sortBy='rating_desc'` không thuộc whitelist (no-op); số liệu marketing bịa ("99.8% Buổi học được giải ngân suôn sẻ") 🔎 |

---

## 6. ✅ NGUYÊN NHÂN GỐC lỗi build — đã tìm ra và kiểm chứng hai chiều

`CLAUDE.md` ghi lệnh chuẩn `dotnet build src/backend/TutorHub.sln`. Trên máy này nó **fail** với `Build FAILED / 0 Warning(s) / 0 Error(s)` — không có thông báo lỗi. Log `-v diag`:
```
Done executing task "MSBuild" -- FAILED.
Done building target "_GenerateRestoreProjectPathWalk" in project "…TutorHub.Application.csproj" -- FAILED.
```
**Nguyên nhân:** SDK đang dùng là **10.0.112** (`dotnet --version`) trong khi solution target `net8.0` (`Directory.Build.props:3`); máy có runtime 8.0.23 nhưng **không có SDK 8** ⇒ restore đi theo đường song song của MSBuild và chết ở bước walk project graph.

| Cấu hình | `dotnet build TutorHub.sln` mặc định |
| :--- | :--- |
| SDK 10.0.112 (không `global.json`) | ❌ FAIL (`0 error`) |
| SDK 10.0.112 + `-m:1` | ✅ succeeded, 0/0 |
| `global.json` ghim `9.0.318` (rollForward latestFeature) | ✅ **succeeded, 0 Warning, 0 Error** |

Tôi đã tạo `src/backend/global.json` để test rồi **xoá lại** (đã xác nhận `git status` sạch).
**Sửa đề xuất:** thêm `global.json` ghim SDK 8.x (khớp `CLAUDE.md`) hoặc 9.x vào repo.
*Đáng chú ý:* `scripts/dev-bootstrap.ps1` **đã tự dùng `-m:1 -nodeReuse:false`** — maintainer đã gặp và lách vấn đề này nhưng chưa cố định nguyên nhân.

---

## 7. ✅ Những gì ĐANG TỐT (đã tự xác minh — đừng "sửa")

- **Build sạch**: 572 test pass, 0 warning dưới `TreatWarningsAsErrors=true`.
- **Bất biến sổ cái enforce 2 tầng**: `AppDbContext.cs:50-72` override **cả 4 overload** `SaveChanges`; **và** trigger DB thật `trg_transactions_append_only` / `trg_audit_logs_append_only` (`20260914115937_AddLedgerAppendOnlyTriggers.cs:45,61`).
- **`GlobalExceptionHandler` chạy thật** — đã test thực nghiệm (§2.1) + có test HTTP thật trong repo (`SessionReadAccessTests.cs`).
- **CORS đầy đủ**: `AddCors` + `UseCors` **trước** `UseRateLimiter`/`UseAuthentication` (`Program.cs:191-201,268-275`), có `WithExposedHeaders("X-Correlation-ID")`.
- **Secret fail-closed ở HEAD**: `appsettings.Development.json` rỗng; `docker-compose.yml:36` `${Jwt__Secret}` không default; `StartupSecretGuard` chặn placeholder **sau** khi đã nạp env (không bypass được).
- **Rate limiting + forwarded headers có gate** (`ReverseProxy:Enabled` mặc định false, `KnownProxies`) ⇒ chống spoof IP.
- **Luồng thanh toán frontend đã sửa đúng**: `BookingCheckout.jsx:42` gọi đúng `createVnPayUrl`, `:49-51` surface lỗi thật (không còn tự chế `vnp_ResponseCode=00`); `PaymentReturn.jsx:14,20-33,36` có guard `hasParams` → trạng thái "không tìm thấy giao dịch" + **verify với backend** (không còn mặc định thành công / 2.000.000 ₫).
- **`AttendanceCard` không còn tự bịa điểm danh gia sư**: `tutorChoice` chỉ đọc từ props (`:25`), `handleSubmit` gọi `onAttendanceSubmitted` + surface lỗi (`:39-52`).
- **Skeleton/empty/error state đã có và dùng rộng** (`Skeleton`/`EmptyState`/`ErrorState` được import bởi 9-13 page).
- **Mock chỉ bật khi opt-in**: `constants.js:13 USE_MOCK = VITE_USE_MOCK === 'true'` (mặc định false); service **ném lỗi thật** thay vì fallback im lặng.
- **Không double-unwrap**: interceptor `api.js:96-116` bóc envelope **một lần** (`:103 return resData.data;`).
- **`formatCurrency` chuẩn**; enum frontend ↔ `Domain/Enums` khớp (PascalCase nhờ `JsonStringEnumConverter`).
- **Bất biến rút tiền**: `Wallet.DebitAvailableForWithdrawal` kiểm `WithdrawableBalance` (`Wallet.cs:54-62`) + khoá `FOR UPDATE` trước khi đọc.
- **Vòng đời refund** đúng DEC-S8-032 (Pending → Succeeded chỉ khi cổng xác nhận; Failed giữ `SettlementRequired = true`, **không** rollback ví).
- **Không hồi tố phí sàn**: `PlatformFeeRate` bị loại khỏi `PlatformSettingKeys.All` nên endpoint upsert chung không ghi được; trần phí 0–50% được ép ở validator.
- **`DisputeSettlementCalculator`** (`:32-58`) dẫn xuất `TutorNetRecovery`/`PlatformFeeReversal` từ chính phép tính ⇒ hằng đẳng thức `StudentRefund ≡ TutorNetRecovery + PlatformFeeReversal` **đúng theo đại số** và trần thu hồi **được bảo đảm cấu trúc**. *(Khác báo cáo cũ khi gọi đây là lỗi.)*
- **Khoá tài nguyên đúng thứ tự**: `AdminResolveDisputeCommandHandler.cs:41` (Dispute) → `:78` (Wallet) → `:232` (Transaction).
- **IPN VNPay rất chắc**: `FOR UPDATE` + so khớp `Amount` sau khi `/100` + idempotent + commit/rollback đủ nhánh; Return URL read-only (`.AsNoTracking()`, không mutation).
- **Không SQL injection**: mọi raw SQL tham số hoá (`FromSqlInterpolated`/`ExecuteSqlInterpolatedAsync`), **0** `FromSqlRaw`/`ExecuteSqlRaw`.
- **Không có `catch {}` rỗng**; **không** log lộ dữ liệu nhạy cảm; **không** `DateTime.Now`/`Today` (Strict UTC).
- **Authorization phủ đầy đủ**; IDOR đã kiểm ở các handler trả dữ liệu theo id (session, enrollment, conversation, media, dispute evidence); wallet dùng route `/me` nên không có id từ client.
- **Keyset pagination** (notifications, messages) không off-by-one: `Take(pageSize + 1)` → `hasMore` → `Take(pageSize)`, có tiebreaker.
- **Dev payment simulator** fail-closed ngoài Development (loại khỏi MVC discovery + guard runtime).

---

## 8. Thứ tự sửa đề xuất

**Giai đoạn 0 — bảo mật (làm ngay, độc lập với mọi thứ khác)**
1. **Rotate** R2 AccessKey/SecretAccessKey + VnPay HashSecret + `POSTGRES_PASSWORD`; purge git history (`git filter-repo`/BFG) rồi force-push; soát `AuditLog` như thể đã bị xâm nhập (§2.2).

**Giai đoạn 1 — làm hệ thống chạy được thật**
2. Thêm `global.json` ghim SDK (§6) — biến lệnh build trong `CLAUDE.md` từ FAIL thành PASS.
3. Docker: restore `.csproj` thay vì `.sln` (§4.1), tạo `src/backend/.dockerignore` (§4.2), thêm bước migrate + seed (§4.3), sửa healthcheck `curl` (§4.4).
4. Nối `getDisputeDetail` vào `AdminDisputeDetail` + bỏ hằng số (§2.4); sửa 8 field sai ở `AdminDashboard` (§2.5).
5. Sửa field mismatch: `AttendanceCard` dùng `earningAmount`/`attendanceVerificationDueAt` (F1,F2), `EnrollmentDetail` (F10), `AdminTutorApplications` (F9), `TutorServices`/`TutorAvailability` dùng `idProfile` (§2.6), `BookingCheckout` fetch booking thật (§2.7).

**Giai đoạn 2 — nối lại nghiệp vụ trọng tài (§2.3)** — *không có bước này, Dispute Engine không dùng được từ UI*: upload bằng chứng + hiển thị cho admin + thêm đường `TutorWinsReleaseEarning` (F7).

**Giai đoạn 3 — siết tài chính backend**
6. `MinWithdrawalAmount` server-side (§2.8).
7. Sửa 3.1/3.2/3.3 (GMV đếm trùng, doanh thu không trừ hoàn phí, giao dịch `Held` rác) — đây là một cụm: chuẩn hoá vòng đời `BookingPayment`.
8. Sửa 3.4 (hoàn tiền 2 lần) + 3.5 (fallback gross→0) + 3.7 (thiếu `else`).
9. Sửa 3.6 (guard Stage B) + thêm check constraint `HeldBalance <= AvailableBalance`.
10. `.ThenBy` cho **7 handler** (§3.8) — 7 dòng, chặn mất/lặp dòng ở sổ cái kiểm toán.
11. `PlatformFeeReversal.Amount` (§3.2), NRE learning record (§3.12).

**Giai đoạn 4 — bảo mật tầng ứng dụng**
12. Upload: `FileSignatureValidator` + extension do server suy ra + whitelist MIME đúng (§3.9, §3.10); `CompleteUpload` ràng buộc `ObjectKey` theo prefix user + check vai trò (§3.11).
13. Outbox claim nguyên tử (§3.13). Refresh token → cookie `HttpOnly` (F13).
14. `formatDateTime` nạp plugin `timezone` + set `Asia/Ho_Chi_Minh` (§3.14).

**Giai đoạn 5 — vệ sinh**
15. Xoá 8 component dead + dead config (F14, F15); bỏ jargon khỏi copy người dùng; sửa số test trong `CLAUDE.md`/`README`; `UseExceptionHandler()` cho rõ nghĩa (§2.1).

---

## 9. Giới hạn của lần rà soát

- **Chưa chạy được Docker** (daemon không chạy) ⇒ §4.1 dựa trên **mô phỏng chính xác** chuỗi `COPY` + `dotnet restore`; §4.4 là phân tích tĩnh + manifest image.
- **Chưa xem UI render thật** (không có browser) ⇒ vấn đề thuần thị giác không được đánh giá.
- Mục 🔎 là phân tích tĩnh, chưa chạy runtime.
- Báo cáo tổng hợp từ 3 luồng điều tra song song (frontend, bất biến tài chính, bảo mật). Các mục ghi ✅ đã được **tôi tự đọc/ tự chạy lại**; các mục 🔎 chưa được kiểm lại độc lập.
