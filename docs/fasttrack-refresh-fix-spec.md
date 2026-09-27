# SPEC — Fix C1 (FastTrack mất tiền hoàn) + C2 (deadlock refresh/logout) + kết luận C3

> Nguồn: báo cáo rà soát 2026-09-27. C1 + C2 đã **xác minh đúng bằng đọc code trực tiếp**;
> C3 đã **bác bỏ bằng bằng chứng** (mục 3 — không cần fix, cấm "fix" bừa).
> Tài liệu này không chứa secret.

---

## C1. FastTrack nhánh student-wins không cộng tiền ví — CRITICAL

### 1.1 Hiện tượng

Admin fast-track resolve dispute theo hướng học viên thắng (`StudentWinsFullRefund`):
ví học viên **không +tiền**, giao dịch `StudentRefund` kẹt `Pending` vĩnh viễn,
không có settlement nào chạy tiếp. Mất tiền thật của học viên.

### 1.2 Root cause (đã xác minh)

`FastTrackResolveDisputeCommandHandler.cs:166-190` chỉ làm 2 việc: `Add` refund
`Pending` + emit `RefundCreatedEvent` (event này chỉ có 1 consumer gửi
*thông báo* — `BusinessEventNotificationHandler.cs:396`, không cộng tiền).

Đối chiếu nhánh tương đương đã đúng ở `AdminResolveDisputeCommandHandler.cs:210-249`:

| Bước | AdminResolve (đúng) | FastTrack (sai) |
|---|---|---|
| Cộng ví | `CreditRefundAsync(...)` (:210) | thiếu |
| Tạo refund | `Transaction.CreateRefund(..., originalPayout: null, ...)` (:219) | `new Transaction` thủ công (:168) |
| Trạng thái | `Succeeded`, `RefundedAt=now`, `SettlementRequired=false` (:228-230) | `Pending`, không `SettlementRequired` (:180-181) |
| Events | `RefundCreatedEvent` + `RefundCompletedEvent` (:233-249) | chỉ `RefundCreatedEvent` (:185) |

Lỗi phụ cùng file: nhánh tutor-wins dựng `new Transaction{...SessionPayoutCredit}`
thủ công (`:146-162`) thay vì factory — né validation `DEC-S8-030` trong
`Transaction.CreateRefund` (`Transaction.cs:97-100`).

### 1.3 Thiết kế fix (mirror AdminResolve, không phát minh mới)

1. Inject `IStudentWalletService` vào `FastTrackResolveDisputeCommandHandler`
   (ctor + field). Service đã đăng ký DI (AdminResolve đang dùng) — implementer
   grep `AddScoped<IStudentWalletService>` xác nhận trước khi sửa.
2. Viết lại nhánh student-wins (`:166-190`) đúng mẫu AdminResolve `:210-249`:

```csharp
// Student attended, tutor ghosted: full refund.
decision = DisputeResolutionDecision.StudentWinsFullRefund;
await _studentWalletService.CreditRefundAsync(
    enrollment.StudentProfileId,
    gross,
    "DisputeResolution",
    dispute.Id,
    $"Hoàn tiền fast-track Buổi #{session.SessionNumber}",
    now,
    cancellationToken);

var refundTx = Transaction.CreateRefund(
    bookingId: enrollment.BookingId,
    sessionId: session.Id,
    disputeId: dispute.Id,
    originalPayout: null,
    amount: gross,
    paymentGatewayRef: $"FastTrackEscrowRefund-{dispute.Id:N}",
    description: $"Pre-release escrow refund for Session #{session.SessionNumber}",
    now: now);
refundTx.Status = TransactionStatus.Succeeded;
refundTx.RefundedAt = now;
refundTx.SettlementRequired = false;
_context.Transactions.Add(refundTx);

_context.AddOutboxMessage(new RefundCreatedEvent(
    enrollment.Id, enrollment.StudentProfile.UserId, new MoneyDto(gross), refundTx.Id,
    Guid.NewGuid(), 1, now));
_context.AddOutboxMessage(new RefundCompletedEvent(
    enrollment.Id, enrollment.StudentProfile.UserId, new MoneyDto(gross), refundTx.Id,
    Guid.NewGuid(), 1, now));
```

3. Nhánh tutor-wins (`:146-162`): thay `new Transaction{...}` bằng
   `Transaction.CreatePayout(bookingId, sessionId, disputeId, gross, feeRate, platformFee, tutorNetPayout, $"FastTrackEscrowRelease-{dispute.Id:N}", now)`.
   Giữ nguyên `WalletTransaction` thủ công (entity khác, không có factory) và
   `CreditAvailable` — chỉ đổi `Transaction`.
4. `originalPayout: null` là **hợp lệ**, không phá luật #4: FastTrack chỉ xử lý
   pre-release (`:66-70` đã chặn post-release), đúng mẫu AdminResolve pre-release
   (`AdminResolveDisputeCommandHandler.cs:219-227`, reviewer B đã xác nhận #4 OK
   với `null`). Công thức #7 không đụng (`SplitGross` giữ nguyên), thứ tự khóa #10
   và biên transaction giữ nguyên.

### 1.4 Cổng kiểm

- Unit test mới `FastTrackResolveDispute...Tests` (theo mẫu `MockDbSetHelper` +
  Moq như `LoginCommandHandlerTests`): student-wins → ví được credit
  (`CreditRefundAsync` gọi 1 lần đúng số tiền), refund `Succeeded` +
  `SettlementRequired=false`, `SaveChanges` 1 lần; tutor-wins → payout qua factory.
- `dotnet build src/backend/TutorHub.sln` 0 warning; full `Application.UnitTests` pass.

---

## C2. Deadlock khi cả access + refresh token đều hết hạn — CRITICAL

### 2.1 Hiện tượng

User để session quá hạn refresh: mọi request 401 sau đó **treo vĩnh viễn**,
không logout được, storage không xóa, phải xóa cache thủ công.

### 2.2 Root cause (đã xác minh, chuỗi 4 mắt xích)

1. Request X 401 → interceptor vào nhánh refresh (`api.js:126-140`), set
   `isRefreshing = true`, gọi refresh → refresh cũng 401.
2. Nhánh `catch` (`api.js:159-162`) gọi `processQueue(err)` rồi `logout()`.
3. `logout()` (`authStore.js:30-38`) `await api.post('/auth/logout', ...)` **trước**
   khi xóa storage; endpoint này có `[Authorize]`
   (`AuthController.cs:85-86`) nên cũng 401.
4. Lúc này `isRefreshing` vẫn `true` (khối `finally` ở `api.js:163-165` chưa chạy
   vì đang kẹt ở `await logout()` trong `catch`) → POST logout bị đẩy vào
   `failedQueue` (`api.js:128-136`) mà queue này đã được xử lý xong ở bước 2 →
   promise không bao giờ resolve → `await` treo → `finally` không chạy →
   `isRefreshing` kẹt `true` → mọi 401 sau treo theo. Vòng kín.

### 2.3 Thiết kế fix (làm cả 2, thiếu 1 vẫn hở)

**(a) `api.js:83` — thêm `'/auth/logout'` vào `CREDENTIAL_ENDPOINTS`:**

```js
const CREDENTIAL_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
```

Khớp bằng `url.includes` như hiện tại. Tác dụng: POST logout không bao giờ đi vào
nhánh refresh/queue — 401 thì về thẳng `toApiError`.

**(b) `authStore.js:30-49` — xóa session TRƯỚC, gọi API sau (best-effort):**

```js
logout: async () => {
  const refreshToken = get().refreshToken;
  localStorage.removeItem('tutorhub_user');
  localStorage.removeItem('tutorhub_token');
  localStorage.removeItem('tutorhub_refresh_token');
  set({ user: null, accessToken: null, refreshToken: null, role: null, isAuthenticated: false });
  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } catch (err) {
    console.warn('[authStore] Logout API error:', err.message);
  }
},
```

Với (a), `await` này luôn resolve (không qua queue) nên giữ `await` an toàn;
dù server chết vẫn chỉ chờ hết timeout rồi `catch`, UI đã về trang login từ trước.
Không đổi hành vi khi logout bình thường (vẫn revoke refresh ở server).

Ngoài phạm vi fix này (ghi nhận, không làm): thêm `'/auth/oauth/'` vào
`CREDENTIAL_ENDPOINTS` (I4 — 401 callback kích hoạt refresh-retry làm mất lỗi gốc).

### 2.4 Cổng kiểm

- `npx eslint` 0 errors + `npm run build` pass (frontend không có test runner).
- Test tay quyết định: **tắt API, bấm logout** → phải về trang login ngay,
  `localStorage` sạch (hiện tại treo). Sau đó bật API, login/logout bình thường.
- Không đụng nhánh login/register/refresh — backend không đổi file nào cho C2.

---

## C3. Claim "MemoryCache Size gây 500" — KẾT LUẬN: không bug, không fix

- Claim: `MemoryExternalAuthStateStore.cs:51` set `Size = 1` trong khi
  `AddMemoryCache()` trần (`InfrastructureServiceCollectionExtensions.cs:151`)
  → `GET /oauth/{p}/start` 500.
- Bằng chứng bác bỏ:
  1. Đọc code: entry có `Size` nhưng cache không đặt `SizeLimit` — .NET chỉ
     yêu cầu `Size` khi `SizeLimit` được set; không set thì giá trị bị bỏ qua,
     không ném.
  2. Đo thật: `GET /api/v1/auth/oauth/google/start` trên API đang chạy trả **200**
     + `authorizeUrl` hợp lệ (`accounts.google.com`, `S256`, `select_account`).
- Verdict: **NO ACTION.** Cấm "fix" bằng cách thêm `SizeLimit` (YAGNI — thêm ràng
  buộc mới mà không giải quyết vấn đề thật nào).

---

## Phạm vi chạm + cổng kiểm chung

| Fix | Files |
|---|---|
| C1 | `.../Disputes/Commands/FastTrackResolveDispute/FastTrackResolveDisputeCommandHandler.cs` (+ ctor inject), test mới `src/test/.../Features/Disputes/...` |
| C2 | `src/frontend/src/services/api.js` (1 dòng), `src/frontend/src/store/authStore.js` (đảo thứ tự logout) |
| C3 | không chạm file nào |

Cổng chung: `dotnet build` 0 warning/error (dừng API trước khi build để tránh
khóa file DLL — lỗi `MSB3027/MSB3021` đã gặp, không phải lỗi code),
`Application.UnitTests` full pass, `npm run lint` 0 errors + `npm run build` pass,
test tay C2 khi API tắt.
