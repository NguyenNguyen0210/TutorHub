# Rà soát toàn bộ Project — TutorHub

**Nhánh:** `feature/frontend-client` · **Worktree:** `TutorHub-frontend`
**Phạm vi:** toàn repo — `src/backend` (.NET 8, ~800 file C#), `src/frontend` (React 18 + Vite, 23 page), `src/test` (449 test), `docs/`, Docker/config, git.
**Phương pháp:** build thật + chạy test thật + chạy `docker` thật + đọc code + grep xác minh chéo hai chiều (frontend ↔ backend).

**Quy ước mức độ tin cậy:** ✅ = đã tự chạy/đọc và xác minh trực tiếp · 🔎 = phân tích tĩnh, chưa chạy runtime.

> Báo cáo UI chi tiết ở `UI-AUDIT.md`. File này là bản rà soát **toàn dự án**.

---

## 0. Tóm tắt điều hành

| Hạng mục | Trạng thái đo được |
| :--- | :--- |
| Backend build | ✅ `0 Warning(s), 0 Error(s)` dưới `TreatWarningsAsErrors=true` |
| Unit test | ✅ 171 Domain + 252 Application — pass |
| Integration test | ✅ **26/26 pass** khi cấp 4 secret + Postgres local · ❌ fail mặc định |
| **Tổng test** | **449** (không phải 406 như tài liệu) |
| Frontend build | ✅ `vite build` pass, 3157 modules |
| `docker-compose up -d --build` | ❌ **build thất bại** (đã chạy thật) |
| Tạo schema DB | ❌ không có cơ chế nào apply migration/seed |
| Frontend ↔ Backend | ❌ **không có CORS** + **lỗi double-unwrap** ⇒ toàn bộ app hiển thị mock |
| CI / lint / test frontend | ❌ không tồn tại |

**Kết luận:** Backend là codebase **chất lượng tốt** — kiến trúc sạch, build 0 warning, 449 test, các bất biến tài chính (khoá ví, IPN, lock ordering) được enforce nghiêm túc và đúng thứ tự. Vấn đề **không nằm ở chất lượng code backend** mà ở 3 tầng:

1. **Không thể chạy từ clone sạch** theo tài liệu (Docker hỏng, DB rỗng, thiếu CORS, thiếu secret).
2. **Tầng tích hợp frontend ↔ backend chưa từng chạy thật** — và có 2 lỗi hệ thống (CORS + double-unwrap) đảm bảo nó không thể chạy.
3. **Frontend đang hiển thị sai sự thật về dòng tiền** ở 8 chỗ.

**Nguyên nhân gốc của tất cả:** repo tự đặt kỷ luật rất nghiêm ("0 warning", "100% test trước PR", bất biến bất khả xâm phạm) nhưng **không có gì cưỡng chế** — không CI, không lint, không test frontend. Đó là lý do build Docker hỏng, 26 test fail, và tầng tích hợp chưa bao giờ được chạy mà không ai biết.

---

## 1. Kết quả lệnh thực tế (bằng chứng gốc)

```
dotnet build src/backend/TutorHub.sln   → Build succeeded. 0 Warning(s) 0 Error(s)
dotnet test  src/backend/TutorHub.sln   → Domain 171 ✅ · Application 252 ✅ · Integration 26 ❌
   + VnPay__HashSecret / CloudflareR2__{AccountId,AccessKeyId,SecretAccessKey}
   → Integration 26/26 ✅  ⇒ TỔNG 449/449
npm run build (vite)                    → ✓ 3157 modules, built in 9.14s
docker build (context ./src/backend)    → ❌ MSB3202 ×3, exit 1
SDK: 10.0.112 (target net8.0, LangVersion 12.0)
Container: tutorhub-postgres (postgres:16-alpine) đang chạy, healthy, :5432
```

### Tài liệu vs thực tế

| Hạng mục | Tài liệu | Thực tế |
| :--- | :--- | :--- |
| Domain.UnitTests | 159 | **171** |
| Application.UnitTests | 240 | **252** |
| Api.IntegrationTests | 7 | **26** |
| Tổng | 406 (README + CLAUDE.md) | **449** |
| CLAUDE.md:31 | "398 Unit Tests – 100% Deterministic Pass" | 449 — và **mâu thuẫn với CLAUDE.md:69** ghi 406 |
| Số chương FR | 50 (CLAUDE.md) / 53 (README) | **53** → README đúng, CLAUDE.md sai |
| PRD version | "v1.0 Baseline Frozen" (CLAUDE.md) | **v1.1** (`docs/prd.md:3`) |
| Migrations | — | **9** |

---

## 2. 🔴 P0 — Chặn chạy dự án

### P0-1. ✅ `docker-compose up -d --build` thất bại (Quick Start "Khuyến nghị" của README)
`docker-compose.yml:21-23` đặt `context: ./src/backend`, nhưng `Dockerfile:12` chạy `dotnet restore TutorHub.sln`, và solution trỏ ra ngoài context:
```
TutorHub.sln:14  "..\test\TutorHub.Domain.UnitTests\…csproj"
TutorHub.sln:16  "..\test\TutorHub.Application.UnitTests\…csproj"
TutorHub.sln:18  "..\test\TutorHub.Api.IntegrationTests\…csproj"
```
→ `MSB3202: project file "/test/…" was not found` ×3, exit 1. **Đã chạy thật.**
**Sửa:** đổi `build.context` sang repo root, **hoặc** tạo solution chỉ chứa project build (không test) cho image.

### P0-2. ✅ Không có cơ chế tạo schema / nạp seed ⇒ DB rỗng
- `Program.cs` **không** gọi `Database.Migrate()`/`EnsureCreated()` (chỉ `app.Run()` dòng 183).
- `seedData.sql` **không được tham chiếu ở đâu**; compose chỉ mount volume `pgdata`, **không** mount file này vào `/docker-entrypoint-initdb.d/`.
- README + CLAUDE.md **không nhắc** `dotnet ef database update` (0 match).
- **9 migration có tồn tại và đã track** — nhưng không gì chạy chúng ở môi trường thật.

**Hệ quả:** kể cả sửa xong P0-1, `docker-compose up` vẫn cho Postgres **không có bảng nào**; mọi tài khoản test trong tài liệu đều không tồn tại.
**Sửa:** gọi `Migrate()` lúc khởi động (có gate môi trường) + thêm bước nạp seed.

### P0-3. ✅ Không có CORS ⇒ frontend không thể gọi API
Grep toàn backend: `AddCors|UseCors|WithOrigins|AllowAnyOrigin` → **0 match**. Pipeline (`Program.cs:159-183`) không có stage CORS. Frontend ở `:5173` gọi API ở `:5129` là cross-origin, và `vite.config.js` **không có `server.proxy`**.
**Hệ quả:** mọi request từ trình duyệt bị chặn (kể cả preflight `OPTIONS`, do có `Authorization` + `Content-Type: application/json`).
**Sửa:** `AddCors` với allowlist origin từ config + `UseCors` **trước** `UseAuthentication`; và/hoặc thêm `server.proxy` cho dev.

### P0-4. ✅ `dotnet run` fail lúc khởi động (Quick Start local)
`InfrastructureServiceCollectionExtensions.cs:36-63` có 4× `.ValidateOnStart()`; `VnPayOptions.HashSecret` (`VnPayOptions.cs:12`) + `CloudflareR2Options.AccountId/AccessKeyId/SecretAccessKey` (`CloudflareR2Options.cs:9,15,18`) đều `[Required]`, nhưng `appsettings.Development.json` để **rỗng** → `OptionsValidationException`. README không hướng dẫn set gì.
**Đã chứng minh:** cấp 4 biến này → **26/26 integration test PASS**. Đây là lỗi **tài liệu/reproducibility**, không phải test hỏng.
**Sửa:** thêm bước user-secrets vào README; inject giá trị dummy trong `IntegrationWebApplicationFactory.ConfigureAppConfiguration` (factory đã inject `ConnectionStrings` — chỉ cần thêm 4 giá trị).

### P0-5. ✅ Integration test không hermetic + credential hardcode
`IntegrationWebApplicationFactory.cs:20-21,80` hardcode `Username=tutorhub;Password=123456` và comment ghi *"no Testcontainers by owner decision"*. Thêm nữa `docker-compose.yml:8` mặc định `POSTGRES_PASSWORD:-tutorhub` ⇒ **làm đúng theo README Docker thì mật khẩu không khớp**, test vẫn fail.
**Sửa:** Testcontainers, hoặc đọc connection string từ env; bỏ mật khẩu hardcode.

---

## 3. 🔴 P0 — Frontend khẳng định sai sự thật về dòng tiền

| # | Vị trí | Vấn đề | TT |
| :--- | :--- | :--- | :--- |
| 1 | `BookingCheckout.jsx:54` | Gọi `paymentService.createPaymentUrl` — **method không tồn tại** (`payment.service.js:7` export `createVnPayUrl`) → luôn rơi vào `catch` | ✅ |
| 2 | `BookingCheckout.jsx:63,66` | Catch **tự chế giao dịch thành công**: `vnp_ResponseCode=00` + `vnp_TransactionNo=14892019` sinh ở client — vi phạm luật "mutation chỉ trong IPN" | ✅ |
| 3 | `PaymentReturn.jsx:9,13` | `searchParams.get('vnp_ResponseCode') \|\| '00'`, amount mặc định `2000000` → mở trang **không param** vẫn ra biên lai "đã trả 2.000.000 ₫" | ✅ |
| 4 | `AttendanceCard.jsx:34-36` | `if (tutorChoice === null) setTutorChoice(true)` → học viên click 1 lần **tự thoả mãn consensus 2 chiều**, UI báo đã giải ngân escrow | ✅ |
| 5 | `AdminDisputeDetail.jsx:25-36` | `setTimeout(() => message.success('Tiền đã giải phóng khỏi Escrow'), 800)` — không service call; **toàn khu admin là no-op báo thành công** | ✅ |
| 6 | `DisputeNew.jsx:39-41` | `catch (err)` → `message.info('Đơn khiếu nại đã được chuyển đến Bàn Trọng Tài.')` — **báo lỗi thành công** | ✅ |
| 7 | `AdminUsers.jsx:104` | So `u.status === 'Active'` nhưng nguồn trả `'ACTIVE'` (`admin.service.js:112,121,130`) → điều kiện **luôn false** ⇒ **mọi** user hiển thị như đang bị khoá | ✅ |
| 8 | `SessionDetail.jsx:15` | `handleConfirmAttendance` định nghĩa nhưng **0 `onClick`** ⇒ nút điểm danh không hoạt động | ✅ |

Bổ sung: **19/23 page không import service nào**; `admin.service.js` không được import ở đâu cả.

---

## 4. 🔴 P0 — Tầng tích hợp frontend ↔ backend chưa từng chạy được

> Phát hiện quan trọng nhất về mặt kiến trúc. Đã đối chiếu **cả 42 lời gọi** của frontend với route/verb/body thật của backend.

### F1. ✅ **Lỗi double-unwrap** — mọi màn admin/wallet/chat/notification/marketplace **vĩnh viễn** hiển thị mock
`api.js:56-58` (interceptor) **đã** bóc envelope và trả `resData.data` ⇒ biến `res` trong service **chính là DTO**. Nhưng các service lại đọc `.data` **lần thứ hai** — thuộc tính không tồn tại ⇒ guard fail ⇒ **fallback mock, im lặng và vĩnh viễn**:
- `admin.service.js:152` (`if (res && res.data)`) · `:168`, `:225` (`Array.isArray(res.data.items)`)
- `wallet.service.js:49` (`if (res && res.data)`) · `:65` (`res.data.items`)
- `notification.service.js:47` · `chat.service.js:84,97` · `Marketplace.jsx:93` · `TutorProfile.jsx:94`

Đối chiếu: `tutor.service.js:69` viết **đúng** (`res.items`) — nên chỉ file này mới thực sự nhận được dữ liệu thật.
**Hệ quả:** ngay cả khi đã sửa CORS và backend chạy tốt, toàn bộ dữ liệu quản trị / ví / thông báo / chat / marketplace / hồ sơ gia sư **vẫn là giả**.
**Sửa:** đổi `res.data` → `res`, `res.data.items` → `res.items`; giữ interceptor là **điểm unwrap duy nhất**.

### F2. ✅ Đánh dấu đã đọc dùng POST, backend chỉ nhận PATCH → **405 mỗi lần gọi**
`notification.service.js:59,70` dùng `api.post` vs `NotificationsController.cs:47,58` là `[HttpPatch]`. Lỗi bị `try/catch` nuốt rồi **sửa state mock và trả `true`** ⇒ UI báo thành công trong khi server chưa đổi gì. **Sửa:** đổi thành `api.patch`.

### F3. ✅ `GET /sessions/{id}` **không tồn tại** ở backend
`session.service.js:24` gọi endpoint này. `SessionsController.cs` có `[HttpGet]` (list), `[HttpGet("{id:guid}/learning-record")]`, `[HttpGet("{id:guid}/reschedule-requests")]` — **không có `[HttpGet("{id:guid}")]`**. ⇒ Trang chi tiết buổi học **luôn** render mock. **Sửa:** thêm endpoint, hoặc trỏ sang `/enrollments/{id}`.

### F4. ✅ Admin gửi sai body khi phân xử → 400 ⇒ **không admin nào phân xử được tranh chấp**
`admin.service.js:265` post `{ verdictType, notes }`, nhưng `AdminResolveDisputeCommandValidator.cs:11` là `RuleFor(x => x.AdminNotes).NotEmpty()` ⇒ 400. **Sửa:** gửi đúng `{ decision, customRefundAmount, adminNotes }`. (Lỗi này bị che vì nút admin vốn đã là no-op — xem §3 #5.)

### F5. ✅ Lệch tên field ở `TutorCard` → `undefined` và **crash TypeError**
Backend DTO dùng `ratingAvg`, `totalReviews`, `education`, `avatarUrl`, `fullName` — **không có** `rating`, `isVerified`, `minPrice`, `reviewCount`.
- `TutorCard.jsx:74` `tutor.rating.toFixed(1)` → **TypeError, card crash** với dữ liệu thật
- `TutorCard.jsx:40` `tutor.isVerified` → badge "đã xác thực" không bao giờ hiện
- `TutorCard.jsx:120` `formatCurrency(tutor.minPrice)` → render `0 ₫`

### F6. ✅ **Hash kiểm toán là giả** — nghiêm trọng về mặt nhận thức
`admin.service.js:233`: `sha256Hash: l.integrityHash || 'a7b8c9d0…a7b8'` — hash 64 ký tự **hardcode**, trong khi `AuditLogDto` **không có** field `integrityHash`. Sổ cái kiểm toán bất biến là trụ cột của hệ thống, mà UI đang hiển thị hash giả như bằng chứng toàn vẹn. Thêm: `:230-231` đọc `l.performedBy`/`l.actionType` (thật là `UserName`/`Action`) ⇒ actor luôn `'System'`. **Sửa:** map đúng field, bỏ hash giả.

### F7. Các lỗi hợp đồng còn lại (🔎)
| # | Vị trí | Vấn đề |
| :--- | :--- | :--- |
| a | `tutor.service.js:104` | Đọc `res.slots`, backend trả `days` ⇒ luôn fallback mock |
| b | `admin.service.js:4-14` vs DTO | Stats mock **phẳng**, DTO **lồng** (`financials.totalGmv`, `actionQueue.*`) — **không trùng key nào** |
| c | `admin.service.js:211` | `u.absentStrikes` không tồn tại trên DTO ⇒ cột strike luôn 0 ⇒ **leo thang kỷ luật chết** |
| d | `admin.service.js:171-172` | Đọc `item.tutorName/fullName/avatarUrl`; DTO là `UserFullName/UserEmail/UserAvatarUrl` |
| e | `TutorProfile.jsx:111-115` | Truyền **object** vào chỗ cần `Guid` (`createBooking(serviceId)`) ⇒ 400, rồi tạo mock booking |
| f | `EnrollmentDetail.jsx:9-32` | Hardcode `'PENDING_VERIFICATION'` — **enum này không tồn tại** ở backend (`SessionStatus.cs`) |

---

## 5. 🟠 P1 — Bảo mật

### S1. ✅ **JWT secret bị commit VÀ là default của Docker → giả được token Admin**
- `appsettings.Development.json:12` — `"Secret": "super_secret_jwt_key_tutorhub_platform_minimum_32_characters_long_2026!"` — **đã xác minh được git track**.
- `docker-compose.yml:32` — `${JWT_SECRET:-super_secret_jwt_key_tutorhub_platform_minimum_32_characters_long_2026!}` — **chuỗi y hệt**.
- `JwtOptions.cs:10` chỉ validate `[MinLength(32)]`; chuỗi này 71 ký tự nên **pass**.

⇒ Deploy bằng `docker-compose up` mà quên export `JWT_SECRET` sẽ chạy API production ký token bằng khoá **đã công khai trên GitHub**. Kẻ tấn công tự ký `{role:"Admin"}` và vào được toàn bộ `/api/v1/admin/*`: duyệt rút tiền, phán quyết tranh chấp (**di chuyển tiền**), ban user, đổi phí sàn.
**Sửa:** rotate khoá; dùng `${JWT_SECRET:?JWT_SECRET must be set}` (fail closed); đưa `appsettings.Development.json` vào `.gitignore` (hiện `.gitignore:66-67` chỉ ignore `appsettings.Local.json`).

### S2. ✅ **Outbox lease claim không atomic** → guard chống trùng là code chết
`OutboxDispatcherJob.cs:166-185` đọc row → set `Status=Processing`/`LockedBy`/`LockedUntil` → `SaveChangesAsync()` → bắt `DbUpdateConcurrencyException` với comment *"Another worker claimed this message"*. Nhưng **`OutboxMessageConfiguration.cs` không có `IsConcurrencyToken`/`IsRowVersion`/`xmin`** — đã xác minh: `xmin`/`IsRowVersion` xuất hiện **duy nhất** ở `DisputeConfiguration.cs:76-79`.
⇒ Không có predicate ⇒ `UPDATE … WHERE "Id" = @id` ⇒ hai worker cùng thành công, cùng dispatch.
**Hệ quả:** dispatch trùng sự kiện khi chạy nhiều replica. `BusinessEventNotificationHandler` có dedupe qua `InboxMessages`, nhưng guard đó **chỉ áp dụng ở đó** ⇒ mọi subscriber khác của `EarningCreated`/`RefundCreated`/`WithdrawalCompleted` không được bảo vệ. Single-instance (compose hiện tại) không bị ảnh hưởng — nên chưa lộ.
**Sửa:** claim bằng conditional atomic update (`ExecuteUpdateAsync` với `WHERE Status = Pending AND NextAttemptAt <= now`, kiểm rows-affected == 1). *(Cùng pattern chết cũng có ở `EmailDeliveryJob.cs:127`.)*

### S3. ✅ Chat attachment chỉ kiểm `Content-Type` do client khai
`ConversationsController.cs:155-167` kiểm size thật, nhưng type lấy từ `IFormFile.ContentType` (header client gửi), **không sniff từ bytes**; và `LocalFileStorage.cs:21-22` lấy extension từ **tên file người dùng** ⇒ `evil.html` với `Content-Type: image/png` được lưu thành `<guid>.html`.
Codebase đã biết làm đúng: `UploadMediaCommandHandler.cs:45-48` gọi `FileSignatureValidator.IsValidSignature` (magic bytes).
**Đánh giá chính xác:** **không phải stored-XSS khai thác được ngay** — `Program.cs` không có `UseStaticFiles`, và `DownloadAttachment` (`:225`) ép `application/octet-stream` (tải về, không render). Đây là **kiểm soát bị suy yếu**, trở nên khai thác được ngay khi ai đó thêm static hosting hoặc inline-serving. CLAUDE.md trap #4 ghi là đã enforce — thực tế chỉ **một phần**.
**Sửa:** dùng chung `FileSignatureValidator` + whitelist extension, lưu extension do server tự suy ra.

### S4. 🔎 Transport security không được enforce trong container
Không có `UseHsts` ở đâu; `Program.cs:174` `UseHttpsRedirection()` chạy dưới `Dockerfile:21` `ASPNETCORE_URLS=http://+:8080` và không có HTTPS port ⇒ **no-op**, stack compose phục vụ HTTP thuần.

### S5. ✅ Client IP lấy từ header giả mạo được
`PaymentsController.cs:97-121` tin `X-Forwarded-For`/`X-Real-IP` vô điều kiện, nhưng `Program.cs` **không** gọi `UseForwardedHeaders` và không có trusted-proxy allowlist ⇒ client tự khai được IP truyền cho VNPay. **Sửa:** `UseForwardedHeaders` + `KnownProxies`.

### S6. ✅ Refresh token lưu trong `localStorage`
`authStore.js:17-21` lưu cả `accessToken` và `refreshToken` (hạn 7 ngày) vào `localStorage` ⇒ đọc được qua XSS. **Sửa:** refresh token vào cookie `HttpOnly; Secure; SameSite`.

### S7. `AllowedHosts: "*"`, không có `global.json` ghim SDK
`appsettings.json:8` `"AllowedHosts": "*"`. Máy dev dùng .NET **10.0.112** trong khi project target `net8.0` ⇒ nên thêm `global.json`.

### S8. ✅ **Upload bằng chứng tranh chấp không được validate server-side** — bất biến 10MB/MIME là danh nghĩa
`DisputesController.cs:54` nhận `[FromBody] UploadEvidenceRequest(FileName, FileUrl, ContentType, FileSizeBytes)` — **không có `IFormFile`**, **không byte nào được đo**. Validator chỉ validate các giá trị *do client khai*; handler lưu nguyên xi, không kiểm host của `FileUrl`, không kiểm sở hữu. (Đối chiếu: `MediaController.cs:87` và `ConversationsController.cs:121` **có** dùng `IFormFile`.)
**Hệ quả kép:** (a) CLAUDE.md trap #4 (10MB + MIME whitelist) **không được thực thi thật**; (b) `FileUrl` là **chuỗi tuỳ ý do client đặt** rồi hiện trong màn trọng tài admin (`AdminGetDisputeInvestigationQueryHandler.cs:103`) ⇒ **injection URL tuỳ ý vào UI admin** (phishing/tracking).
**Sửa:** nhận multipart `IFormFile` và đo server-side, **hoặc** yêu cầu `ObjectKey` từ media pipeline rồi HEAD-verify — dự án **đã làm đúng ở chỗ khác** (`CompleteUploadCommandHandler.cs:33`), chỉ cần tái sử dụng.

### S9. ✅ Whitelist MIME của chat lệch chuẩn CLAUDE.md
`UploadLimits.cs:15-21` — `ChatAttachmentMimeTypes` = `image/jpeg, image/png, image/gif, application/pdf`.
Chuẩn (và `EvidenceMimeTypes` ở `:26-33`) = `image/jpeg, image/png, image/webp, application/pdf, text/plain`.
⇒ **Nhận `image/gif` trái phép**, và **từ chối `webp`/`txt` hợp lệ**. Thông báo lỗi ở `ConversationsController.cs:160-164` còn quảng cáo "JPEG, PNG, GIF, PDF".
**Sửa:** dùng đúng 5 định dạng chuẩn. Kèm theo: `ConversationsController.cs:160-167` tin `Content-Type` client, không check magic bytes — trong khi `UploadMediaCommandHandler.cs:70,80` đã dùng `FileSignatureValidator` đúng cách.

---

## 6. 🟠 P1 — Tính đúng đắn tài chính backend

### Tin tốt (đã xác minh ENFORCED — không cần sửa)
- ✅ **Inv 11 (VNPay Return read-only):** `ProcessVnPayReturnQueryHandler` verify signature trước, dùng `.AsNoTracking()`, **không** `SaveChanges` — thật sự read-only.
- ✅ **IPN là code tốt nhất repo:** signature → TmnCode → currency → amount-equality → `ExecutionStrategy` → `BeginTransactionAsync` → `SELECT … FOR UPDATE` serialize IPN trùng → map `DbUpdateException` theo unique index `IX_Enrollments_BookingId` cho concurrent activation → xử lý late-IPN (revive booking hoặc ghi `StudentRefund` với `SettlementRequired = true`). Xử lý đúng `rawAmount / 100m` (trap #2).
- ✅ **Lock ordering (Inv 10):** `AdminResolveDisputeCommandHandler` khoá **Dispute(`:40`) → Wallet(`:77`) → Transaction(`:232`)** — đúng thứ tự quy định, không deadlock. `FOR UPDATE` trên Wallets dùng nhất quán ở **9** đường tiền.
- ✅ **Inv 9 (DEC-S8-020) snapshot phí sàn:** mọi consumer đọc từ snapshot (`SubmitAttendanceCommandHandler.cs:125`, `AdminResolveDisputeCommandHandler.cs:132,251`), **không** rò rỉ phí "live".
- ✅ **Strict UTC:** grep `DateTime.Now|DateTime.Today|DateTimeOffset.Now` toàn backend → **0 match**; dùng `IClock`/`_clock.UtcNow`.
- ✅ **Authorization:** mọi controller có `[Authorize]`/`[Authorize(Roles=…)]`; cả 5 admin controller là class-level `Roles="Admin"` — không endpoint admin nào truy cập ẩn danh được.
- ✅ **IDOR:** đã kiểm `WalletsController` (pattern `me`), `GetEnrollmentByIdQueryHandler:41-46`, cả 3 conversation handler, `SubmitAttendance`/`ScheduleSession`/`CancelSession` — đều verify quyền sở hữu.
- ✅ **Pagination có chặn cận:** `Math.Clamp(…,1,100)` ở 15 chỗ — không có unbounded query DoS.
- ✅ **Không có empty catch**; **`GlobalExceptionHandler`** map `AppException→StatusCode`, `InvalidOperationException→409`, `ArgumentException→400`; chỉ lộ message nội bộ khi `IsDevelopment()`.
- ✅ **Không có secret thật trong `appsettings.json`** (tất cả để rỗng) — chỉ file Development bị lộ.

### 🔴 B0 (P0) — Ngưỡng rút tối thiểu 50.000 ₫ **không được enforce ở backend**
- `seedData.sql:498` **seed** luật này dưới dạng dữ liệu: `('f0000000-…-0002','MinWithdrawalAmount','50000','Số tiền rút tối thiểu mỗi lần (50.000 VNĐ)',…)`.
- Nhưng grep `MinWithdrawalAmount` trên **toàn bộ `*.cs`** → **0 kết quả**: không code nào đọc key này.
- `CreateWithdrawalCommandValidator` chỉ có `RuleFor(x => x.Amount).GreaterThan(0)`.
- Frontend cũng **không** gate (chỉ toast *sau khi* submit — §10).

⇒ **Gia sư rút được 1 VNĐ qua API.** Cả hai tầng đều không thực thi. DESIGN.md §3.3 nói ngưỡng này lấy từ `PlatformSettings`.
**Sửa:** đọc `MinWithdrawalAmount` trong validator/handler (**server-side, không tin client**); disable nút thay vì toast. ✅ đã xác minh

### Cần sửa
| # | Vị trí | Vấn đề |
| :--- | :--- | :--- |
| B1 | `AdminResolveDisputeCommandHandler.cs:290-295` | **Inv 7 (DEC-S8-025) là hằng đẳng thức rỗng**: `tutorNetRecovery` và `platformFeeReversal` đều là **phần dư** của `studentRefund` ⇒ tổng **luôn** ≡ `studentRefund`, không thể sai. **Không có validator số học nào** (`AppDbContext.cs:50-124` chỉ chặn xoá/sửa giao dịch đã quyết toán + chống chaining; `Transaction.cs:121-154` chỉ validate link type + amount không âm, **không** ràng buộc `feeReversal ≤ originalPayout.CommissionAmount`). ⇒ Settlement mất cân đối **không bao giờ bị phát hiện**. Đây là **bất biến quan trọng nhất hệ thống mà không được enforce ở đâu cả**. **Sửa:** tính độc lập một thành phần (không lấy phần dư) rồi assert đẳng thức + trần trước khi lưu. |
| B2 | `CreateDisputeCommandHandler.cs:107` | `maxTutorRecovery = originalTx?.PayoutAmount ?? session.EarningAmount` — fallback về **GROSS** trong khi trần đúng là **NET** ⇒ có thể giữ (hold) nhiều hơn tiền gia sư thực nhận, đúng loại sai lệch mà `INV-DISP-008`/`DEC-S8-028` muốn chặn. **Sửa:** thiếu giao dịch gốc ⇒ coi như 0 và chuyển `RequiresAdminFinancialIntervention`. |
| B3 | `Enrollment.cs:37` + `EnrollmentConfiguration.cs:32-37` | Snapshot phí sàn "bất biến" chỉ bằng **quy ước**: public setter, không `AfterSaveBehavior`. ⇒ handler tương lai có thể âm thầm ghi đè `PlatformFeeRate` hợp đồng cũ. **Sửa:** `private set` + domain method, hoặc `SetAfterSaveBehavior(Throw)`. |
| B4 | `Transaction.cs:146-148` | `PlatformFeeReversal.Amount = 0` (giá trị thật ở `CommissionAmount`) ⇒ mọi `Sum(t => t.Amount)` trên giao dịch điều chỉnh **đọc ra 0** ⇒ báo cáo doanh thu/hoàn phí sai lệch âm thầm. |
| B5 | `FastTrackResolveDisputeCommandHandler.cs:146-183` | Tự dựng `Transaction` thay vì dùng factory `CreatePayout`/`CreateRefund` ⇒ **đường ghi sổ cái thứ hai không được validate**. |
| B6 | `AdminGetPlatformRevenueAnalyticsQueryHandler.cs:56` | `?? 0m` ⇒ khi navigation `Enrollment` null, phí đang chờ **bị tính là 0** thay vì báo lỗi. |
| B7 | `EnrollmentActivationService.cs:61` | `FeePolicyVersion` được ghi nhưng **chỉ để hiển thị**, không bao giờ dùng để tính ⇒ nửa bất biến của DEC-S8-020 là trang trí. |
| B8 | `AppDbContext` — chỉ override `SaveChangesAsync(CancellationToken)` | `SaveChanges()`, `SaveChanges(bool)`, `SaveChangesAsync(bool, CancellationToken)` **không** được override. Hiện an toàn (grep `.SaveChanges()` = 0), nhưng **một dòng 2-arg trong tương lai sẽ âm thầm phá bất biến sổ cái mà không có lỗi biên dịch**. **Sửa:** override cả 4 overload, hoặc tốt hơn: chuyển guard vào `SaveChangesInterceptor` (bắt luôn `ExecuteUpdate`/`ExecuteDelete`). |
| B9 | `CreateDisputeCommandHandler.cs:114` | Nhánh `if (tutorWallet != null)` **không có `else`** ⇒ nếu không tìm thấy wallet, dispute post-release được tạo **không có hold và không có cờ `RequiresAdminFinancialIntervention`** — im lặng đi tiếp, đúng loại no-op mà DEC-S8-028 muốn chặn. **Sửa:** thêm `else` mark admin intervention. |

### Phân trang không deterministic (7 handler)
CLAUDE.md yêu cầu `.OrderByDescending(CreatedAt).ThenBy(Id)`. Có **7 handler thiếu hoàn toàn tiebreaker**:

| Handler | Dòng | OrderBy |
| :--- | :--- | :--- |
| `AdminGetAuditLogsQueryHandler` | 60 | `.OrderByDescending(a => a.CreatedAt)` |
| `GetAdminTutorApplicationsQueryHandler` | 41 | `.OrderByDescending(a => a.SubmittedAt)` |
| `GetAdminWithdrawalsQueryHandler` | 38 | `.OrderByDescending(w => w.RequestedAt)` |
| `GetMyAgreementsQueryHandler` | 44 | `.OrderByDescending(a => a.CreatedAt)` |
| `AdminGetDisputesQueryHandler` | 38 | `.OrderByDescending(d => d.CreatedAt)` |
| `GetMyEnrollmentsQueryHandler` | 47 | `.OrderByDescending(e => e.CreatedAt)` |
| `GetMyWithdrawalsQueryHandler` | 52 | `.OrderByDescending(w => w.RequestedAt)` |

Ngoài ra `GetAdminTutorsQueryHandler` có 2 nhánh sort (`:44`, `:49`) nhưng chỉ 1 tiebreaker.
Nghiêm trọng nhất là **`AdminGetAuditLogs`** — sổ cái kiểm toán; audit log ghi theo lô nên `CreatedAt` trùng nhau ⇒ **dòng bị lặp hoặc mất khi lật trang**. (Cũng đúng với `EnrollmentActivationService.cs:62,75` — cùng một `now` cho enrollment + toàn bộ N session.)
**Sửa:** thêm `.ThenBy(x => x.Id)`.

Phụ: `PagedResult<T>.CreateAsync` (`PagedResult.cs:25-38`) là **dead code** (0 call site) — và là helper **duy nhất** có `Skip/Take` mà **không** ordering. Nên xoá hoặc đổi signature để buộc nhận `IOrderedQueryable<T>`.

---

## 7. 🟠 P1 — Tài liệu

| Vị trí | Vấn đề |
| :--- | :--- |
| `README.md:8` | Badge `Tests-406 Passed (100%)` — URL tĩnh viết tay, **không bao giờ** phản ánh CI; thực tế 449 test |
| `README.md:96-99,136` | `159 + 240 + 7 = 406` → phải là **`171 + 252 + 26 = 449`** |
| `README.md:99,136` | Nói integration cần "Postgres container" — nguyên nhân thật là `OptionsValidationException` (4 secret rỗng) |
| `README.md:1` | Tiêu đề "TutorHub **Backend**" cho README của **toàn repo** (full-stack) |
| `README.md:93-94` | Mục frontend chỉ ghi `└── README.md`; không có lệnh `npm install`/`dev`/`build` |
| `README.md:101-104` | docs/ thiếu `frontend-roadmap.md` + `frontend-specification.md` (21 KB + 40 KB) |
| `README.md:120-125` | Quick Start `docker-compose up -d --build` **đã chứng minh thất bại** |
| `README.md:141-145` | `dotnet run` fail vì thiếu 4 secret; không hướng dẫn set |
| `README.md:155` | Thẻ test VNPay (NCB `9704198526191432198`, `NGUYEN VAN A`, `07/15`, OTP `123456`) — khớp sandbox VNPay chuẩn, **không xác minh được offline** (không phải sai) |
| `CLAUDE.md:31` | "398 Unit Tests – 100% Deterministic Pass" — sai và **mâu thuẫn với `:69`** |
| `CLAUDE.md:68` | `prd.md (PRD v1.0)` → thật là **v1.1**; `FR v1.0 - 50 Chương` → thật là **53** |
| `CLAUDE.md` (toàn bộ) | **Không đề cập frontend một lần nào** (0 match `frontend\|React\|Vite\|npm`) dù frontend là nửa repo |
| `launchSettings.json:16,26,35` | `"launchUrl": "weatherforecast"` + `launchBrowser: true` — sót từ template `dotnet new webapi`; endpoint **không tồn tại** ⇒ `dotnet run` tự mở browser vào trang 404 |
| `docs/frontend-roadmap.md:9` | Trỏ `docs/design.md` — **file không tồn tại**; chuẩn design là `DESIGN.md` ở root |
| `docs/frontend-roadmap.md` §3 vs §4 | §3 khẳng định "100% dữ liệu thật, không placeholder", §4 của **chính nó** mô tả "Dual-Mode (Mock & Live API)" — **mâu thuẫn nội bộ**, và thực tế chỉ 4/23 page gọi service |
| `docs/frontend-specification.md:45` | Link `file:///c:/…/Desktop/**TutorHub**/src/backend/seedData.sql` — trỏ sang **checkout khác**, hỏng với mọi người |
| `docs/frontend-specification.md:4` | Tự nhận "Source of Truth" nhưng **0** tài liệu nào tham chiếu |
| `docs/frontend-specification.md` §5.3 | Documented route `/tutor/enrollments/:id` — **không tồn tại** trong `routes/index.jsx` |
| `docs/frontend-specification.md:45` vs `roadmap.md:20` | "15 Gói học" vs "8 Gói học" — hai doc **mâu thuẫn** về cùng một file seed |
| `docs/functional-requirements.md:3-5` | Header còn ghi nguồn PRD **v1.0** (đã là v1.1); status "Draft for Review" |

---

## 8. 🟡 P2 — Hạ tầng & cấu hình

| # | Vị trí | Vấn đề | TT |
| :--- | :--- | :--- | :--- |
| 1 | `docker-compose.yml:48` | Healthcheck dùng `curl`, nhưng `Dockerfile:18` dùng `aspnet:8.0` (**không có curl**) ⇒ healthcheck không bao giờ pass (`/health` thì có thật — `Program.cs:162`) | 🔎 |
| 2 | `docker-compose.yml:40` | `VnPay__ReturnUrl` mặc định port **5000**, API chạy **8080**, `.env.example:17` lại **5129** ⇒ **3 port cho 1 URL** | ✅ |
| 3 | `.dockerignore` | Đặt ở root nhưng **context là `./src/backend`** ⇒ Docker không đọc (`Test-Path src/backend/.dockerignore` = False) ⇒ `COPY . .` mang cả `bin/`, `obj/` | ✅ |
| 4 | `docker-compose.yml` | Không có service frontend dù repo full-stack | ✅ |
| 5 | `.env.example` | Thiếu `VNPAY_BASE_URL` (compose có đọc); `POSTGRES_PORT` + 4 biến `JWT_*` khai báo nhưng **không ai đọc** (compose hardcode `:33-36`) ⇒ sửa `.env` không có tác dụng | 🔎 |
| 6 | `src/frontend/.env.production:2` | Trỏ `localhost:5129` (**không phải config production**) **và bị gitignore** ⇒ CI build không có biến nào; `constants.js:5` fallback về đúng localhost đó ⇒ **bundle production trỏ vào localhost** | ✅ |
| 7 | `index.html:5` | `<link rel="icon" href="/vite.svg">` nhưng **không có `public/`** ⇒ favicon 404 | ✅ |
| 8 | `.editorconfig` | Chỉ có rule `*.cs`; **không có rule cho JS/JSX/CSS** | ✅ |
| 9 | `.gitignore:32,39` | `.vs/` lặp 2 lần | ✅ |
| 10 | `index.css` vs `tailwind.config.js` | `outline-hidden` (**16 chỗ**) là utility Tailwind **v4** — bản cài là **3.4.19**, 0 match trong package ⇒ không emit CSS, ý định tắt outline **thất bại im lặng**. `.glass-surface` dùng 3 chỗ nhưng **không định nghĩa** ⇒ glassmorphism không render. `animate-fadeIn` không tồn tại | ✅ |
| 11 | `darkMode: "class"` | Config chết — không nơi nào set class, **0 utility `dark:`** trong toàn bộ `.jsx` | ✅ |

---

## 9. 🟡 P2 — Công cụ còn thiếu (nguyên nhân gốc)

1. **Không có CI** — 0 file workflow. Repo tuyên bố "0 warning" + "100% test trước PR" nhưng **không gì cưỡng chế** ⇒ lý do trực tiếp khiến build Docker hỏng và 26 test fail tồn tại mà không ai phát hiện.
2. **Không ESLint/Prettier** ở frontend (không dep, không script).
3. **Không test frontend** — không test runner, không script `test`.
4. **Không `src/frontend/.env.example`**, không `src/backend/README.md`.
5. **`src/frontend/README.md`** là stub 9 dòng, vẫn ghi "React / **Next.js / Vue** / Vite" và không có lệnh cài/chạy — trong khi `README.md:94` trỏ tới đó.
6. **8/9 signature component của DESIGN.md §3 là dead code** (chỉ `EscrowVaultSimulator` được import); `PlaceholderScreen.jsx` cũng dead và còn render `Stitch ID: {screenId.slice(0,8)}` — ID nội bộ của công cụ thiết kế.
7. **14 Command không có FluentValidation validator** (78 file command / 76 validator) — hầu hết là id-only nên rủi ro thấp, nhưng là khoảng trống nhất quán so với quy ước; đáng chú ý nhất là 2 command Admin Withdrawal.
8. **Layering violation:** `ConversationsController` inject thẳng `IAppDbContext` + `IFileStorage` và chạy EF query inline (`:124-178`, `:192-226`), trái với quy ước "thin controller chỉ dispatch MediatR".

---

## 10. A11y & UI (tóm tắt — chi tiết ở `UI-AUDIT.md`)

- Toàn cây `.jsx`: **đúng 1 `aria-label`** (và là tiếng Anh: `UnifiedNavbar.jsx:283`), **0 `htmlFor`**, **0 `role`**, **0 `tabIndex`**, **0 `onKeyDown`**, **0 `aria-live`**. Nhiều `div` có `onClick` ⇒ không dùng được bằng bàn phím.
- **Không có `Skeleton`/`Spin`/empty state/error state** ở đâu; `TutorProfile.jsx:128` `if (!tutor) return null` ⇒ **trang trắng** khi fetch.
- **Contrast fail WCAG AA:** `financial-available` `#10B981` trên trắng ≈ **2.56:1** (cần 4.5:1) — dùng cho chính số `WithdrawableBalance` (`TutorWallet.jsx:83`).
- **`formatters.js:22` không convert UTC → Asia/Ho_Chi_Minh** (thiếu plugin `utc`/`timezone`) và **0 call site** — mọi màn hình hardcode chuỗi ngày.
- **Không có `prefers-reduced-motion`**; `constants.js` gần như dead (`MIN_WITHDRAWAL_AMOUNT`/`PLATFORM_FEE_RATE` không ai dùng ⇒ **gốc của lỗi ngưỡng rút 50k và fee hardcode**).
- **Không có `Modal.confirm`** cho hành động bất khả hoàn; `AdminDisputeDetail.jsx:12` **pre-fill sẵn lý do phán quyết** ⇒ admin ghi phán quyết không cần một chữ nào.
- Copy/jargon lộ ra cho user: "Smart Escrow Protocol", "Trọng tài DEC-S8", "Cổng VNPay Sandbox 2.1.0", "Escrow Locked".

---

## 11. Thứ tự sửa đề xuất

### Giai đoạn 1 — Làm hệ thống chạy được thật (không thêm tính năng)
1. **CORS** backend + `server.proxy` Vite (§2 P0-3) → mở khoá toàn bộ tầng API.
2. **Sửa double-unwrap** (`res.data` → `res`, ~10 service, §4 F1) — thay đổi nhỏ nhất nhưng mở khoá **toàn bộ** dữ liệu thật.
3. Sửa `docker-compose` build context + `Program.cs` gọi `Migrate()` + nạp seed (§2 P0-1, P0-2).
4. Cấp 4 secret: ghi vào README + inject dummy trong `IntegrationWebApplicationFactory` (§2 P0-4); bỏ credential hardcode (P0-5).
5. Sửa 4 lỗi chặn chức năng: F2 (POST→PATCH), F3 (thiếu `GET /sessions/{id}`), **F4** (body phân xử sai — hiện **không admin nào phân xử được**), F5/F7e (field TutorCard + body booking).
6. **Thêm CI** (`.github/workflows`): `dotnet build` + `dotnet test` + `npm ci && npm run build`. **Bước quan trọng nhất về dài hạn** — không có nó, mọi thứ trên sẽ tái phát.

### Giai đoạn 2 — Bảo mật (độc lập, làm ngay)
7. **S1**: rotate JWT secret; `${JWT_SECRET:?...}`; gitignore `appsettings.Development.json`.
8. **S6**: refresh token → cookie `HttpOnly`.
9. **S2**: atomic outbox claim. **S3** + **S9**: dùng `FileSignatureValidator` + đúng whitelist MIME cho chat (bỏ `gif`, thêm `webp`/`txt`). **S8**: validate upload bằng chứng server-side (hiện bất biến 10MB/MIME là danh nghĩa + URL injection vào UI admin). S4/S5/S7.

### Giai đoạn 3 — Chặn mọi tuyên bố tài chính sai
10. 8 lỗi frontend §3 — đặc biệt P0-1→P0-4 (checkout/return/điểm danh). Nối `admin.service.js` vào trang admin, hoặc **gỡ banner "thành công" cho tới khi nối xong**.
11. **F6**: bỏ hash kiểm toán giả — với sản phẩm lấy "sổ cái bất biến" làm trụ cột, hiển thị hash giả là rủi ro niềm tin nghiêm trọng.

### Giai đoạn 3b — Gia cố tầng tài chính (khối lượng nhỏ, rủi ro cao)
12. **B0**: enforce ngưỡng rút 50.000 ₫ **ở server** — hiện gia sư rút được 1 VNĐ.
13. **B1**: thêm guard cho Inv 7 — bất biến quan trọng nhất hệ thống mà **không được enforce ở đâu cả**.
14. **B2**: fallback gross→net khi giữ tiền tranh chấp. **B4**: `PlatformFeeReversal.Amount = 0`. **B3**: khoá snapshot phí sàn bằng code. **B8**: override cả 4 overload `SaveChanges` (hoặc dùng interceptor). **B9**: thêm `else` cho nhánh thiếu wallet.
15. `.ThenBy(x => x.Id)` cho 7 handler (§6) — sửa 7 dòng, chặn lỗi mất/lặp dòng.

### Giai đoạn 4 — Hợp nhất về một nguồn sự thật
15. Đưa frontend dùng `constants.js` (§10) → tự sửa ngưỡng 50k, countdown 15 phút, casing enum.
16. Quyết định 8 signature component: nối hoặc xoá; xoá `PlaceholderScreen`.
17. A11y pass + skeleton/empty/error state + countdown §3.1 + shell responsive §4.1 (theo `UI-AUDIT.md`).

### Giai đoạn 5 — Tài liệu (làm cuối, sau khi số liệu đã đúng)
18. Sửa §7; **bỏ số test cứng khỏi tài liệu** để không lệch nữa; badge lấy từ CI; sửa `launchUrl`; gỡ/sửa 2 doc frontend orphan.

---

## 12. Những gì đang THỰC SỰ TỐT (đã xác minh — đừng sửa)

- ✅ **Backend build sạch tuyệt đối:** 0 warning / 0 error dưới `TreatWarningsAsErrors=true`.
- ✅ **449 test** (171 + 252 + 26); unit test nhanh và ổn định; **26/26 integration pass** khi môi trường đúng.
- ✅ **IPN VNPay là code chất lượng cao nhất repo** — signature, TmnCode, currency, amount invariant, execution strategy, transaction, `FOR UPDATE` serialize, map unique-violation, xử lý late-IPN.
- ✅ **Inv 11 (Return URL read-only) enforced thật**; xử lý đúng `*100`/`/100`.
- ✅ **Lock ordering (Inv 10) đúng chính xác**: Dispute → Wallet → Transaction.
- ✅ **Inv 9 snapshot phí sàn** được đọc đúng ở mọi consumer, không rò rỉ phí live.
- ✅ **Strict UTC tuyệt đối**: 0 match `DateTime.Now`/`Today`.
- ✅ **Authorization phủ đầy đủ** — cả 5 admin controller class-level `Roles="Admin"`; **IDOR đã kiểm đều sạch**.
- ✅ **Pagination có chặn cận** ở 15 chỗ; **không có empty catch**; `GlobalExceptionHandler` map status đúng và không lộ stack trace.
- ✅ **9 migration tồn tại và đã track** (có cả migration siết precision tiền `WidenTransactionMoneyPrecision`).
- ✅ **Không có secret thật trong `appsettings.json`** (đều rỗng); `dist/` và `node_modules/` **không** bị commit (890 file tracked, sạch). *(Lưu ý: `appsettings.Development.json` thì **có** secret — xem S1.)*
- ✅ **Bảng xác minh 11 bất biến + 4 bẫy (đã kiểm từng cái):** Inv 1–11 đều **ENFORCED**, trừ **trap 4 là PARTIAL** (xem S8/S9). Riêng trap 1 có 1 deviation nhỏ về hình thức: `GetMyBookingsQueryHandler.cs:59-66` dùng `<= ToDateTime(TimeOnly.MaxValue)` thay vì `< Date.AddDays(1)` — **tương đương về kết quả**, chỉ là drift risk. Trap 2 tốt hơn dự kiến: có luôn check số tiền (`ProcessVnPayIpnCommandHandler.cs:127`). Trap 3 enforced qua `SessionSchedulingValidationPolicy.cs:35-36` (convert **cả hai** endpoint, áp cho cả 3 entry point).
- ✅ **Frontend build sạch**, code-split hợp lý, font load thật, **`formatCurrency` đúng chuẩn** `2.000.000 ₫`.
- ✅ **`ApiResponse<T>` envelope khớp chính xác** với interceptor frontend; enum PascalCase nhất quán 2 chiều.
- ✅ **DESIGN.md là spec chất lượng thật** — có token, wireframe, checklist §6. Vấn đề là **mức độ tuân thủ**, không phải chất lượng spec.

---

## 13. Giới hạn của lần rà soát này

- **Không xem được UI render thật** (không có browser/screenshot) ⇒ các vấn đề thuần thị giác (căn lề, nhịp spacing, chất lượng cảm nhận) **chưa được đánh giá**.
- **Chưa xác minh runtime** một số mục: healthcheck `curl` (§8.1 — image build fail trước khi container chạy), `UseHsts`/HTTPS redirect (§5 S4), và **`UseExceptionHandler(_ => { })`** — `Program.cs:164` dùng overload **legacy** `Action<IApplicationBuilder>` (rỗng), nghi vấn **không** dùng `IExceptionHandler` đã đăng ký ở `:55`. Nếu đúng, toàn bộ map `DomainException → HTTP status` không chạy và client luôn nhận 500 trần — mà frontend phụ thuộc `message` trong envelope. **Cần kiểm chứng** bằng cách đổi sang `UseExceptionHandler()` (parameterless) hoặc viết 1 integration test khẳng định domain exception trả đúng status. Đây chính là loại test mà bộ 26 test hiện **thiếu**.
- Không xác minh được mật khẩu `Test@123` so với hash bcrypt trong `seedData.sql`, và không phân xử được "15 vs 8 gói học" giữa 2 doc mà không nạp DB.
- Một số mục đánh dấu 🔎 là phân tích tĩnh, chưa chạy.

---

*Các mục P0 đã được kiểm chứng bằng lệnh cụ thể (build, test, docker, grep, đọc code), không dựa vào suy luận. Báo cáo UI chi tiết: `UI-AUDIT.md`.*
