# Full-Project Review Round 2 — Consolidated Findings

> Generated 2026-09-27 by 4 parallel review agents (Auth, Financial, Booking/Enrollment, Frontend-Backend contract).
> NOT to be committed.

---

## CRITICAL (1)

### RC1: Rolled-back orphan session mutations leak into later SaveChangesAsync
- **Files:** `AttendanceVerificationJob.cs:108,163-166,201`
- **Bug:** Orphan recovery loop uses per-session DB transactions. On rollback (line 165), the in-memory entity still has `Complete()` mutations tracked in the DbContext ChangeTracker. The later `SaveChangesAsync` at line 201 (for opened verification windows) and line 222 (for expired sessions) flush ALL dirty tracked entities — including those from failed orphan recoveries. Result: session marked Completed without payout.
- **Fix:** After rollback in the catch block, detach the dirty session + enrollment entities: `dbContext.Entry(session).State = EntityState.Unchanged; dbContext.Entry(session.Enrollment).State = EntityState.Unchanged;`

---

## HIGH (6)

### RH1: Enrollment cancellation doesn't check for active disputes
- **Files:** `Enrollment.cs:154-158`, `Session.cs:295-311`
- **Bug:** `Enrollment.Cancel()` calls `CancelFromEnrollment()` on all non-completed sessions. If a session has an active dispute, its status changes to Cancelled → dispute becomes unresolvable (FastTrack checks `Status == Scheduled`), stranding escrow.
- **Fix:** In `CancelEnrollmentCommandHandler`, before calling `enrollment.Cancel()`, check `dbContext.Disputes.AnyAsync(d => d.SessionId in enrollmentSessionIds && d.Status != Resolved && d.Status != Dismissed)`. Block cancellation if active disputes exist.

### RH2: No FOR UPDATE lock on wallet during enrollment activation
- **Files:** `EnrollmentActivationService.cs:100-114`
- **Bug:** Two concurrent webhook IPNs for different bookings of same tutor can race on `PendingBalance` credit. The wallet query uses `FirstOrDefaultAsync` without `FOR UPDATE`.
- **Fix:** Use `FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {booking.TutorProfileId} FOR UPDATE")`.

### RH3: Wallet-pay missing duplicate enrollment guard
- **Files:** `PayBookingFromWalletCommandHandler.cs`
- **Bug:** `HandlePaymentWebhookCommandHandler` has `IsDuplicateEnrollmentViolation` catch (line 128-133) but `PayBookingFromWalletCommandHandler` does NOT. Concurrent wallet payments for same service can create duplicate enrollments.
- **Fix:** Add the same `IsDuplicateEnrollmentViolation` catch around the `ActivateAsync` call.

### RH4: ExternalLogin record added to ChangeTracker before status check
- **Files:** `CompleteExternalLoginCommandHandler.cs:134-155`
- **Bug:** `_context.ExternalLogins.Add(loginEntry)` at line 144 executes before status check at lines 147-155. If future code path catches the exception, the banned user's OAuth link persists.
- **Fix:** Move lines 147-165 (status + lockout checks) to BEFORE line 132 (loginEntry creation).

### RH5: Infinite redirect loop on /student/wallet deep link
- **Files:** `routes/index.jsx:202`
- **Bug:** `<Route path="/student/wallet" element={<Navigate to="/student/wallet" replace />}` — redirects to itself infinitely. The actual Student wallet route is at line 150 inside the nested Student layout.
- **Fix:** Change target to the correct nested path or remove the line (line 150 already handles it for authenticated Students). For non-Student deep links, redirect to `/auth/login` or a generic page.

### RH6: Batch scheduling handler lacks DB transaction
- **Files:** `ScheduleSessionsBatchHandler.cs:120-134`
- **Bug:** Unlike the single `ScheduleSessionCommandHandler` (which wraps in `BeginTransactionAsync`), the batch handler does overlap check + save without a transaction. Concurrent scheduling can create conflicting sessions.
- **Fix:** Wrap from overlap check through `SaveChangesAsync` in `BeginTransactionAsync` / `CommitAsync`.

---

## MEDIUM (13)

### RM1: GetMe returns different DTO shape than login
- **Files:** `GetMeQueryHandler.cs`, `authStore.js:114`
- **Bug:** GetMe returns `RegisterResponseDto` (fields: `UserId, Email, FullName, Phone, Role, Status`) but login returns `UserDto` (fields: `Id, Email, FullName, AvatarUrl, IdProfile, AbsentStrikes`). Frontend `revalidateSession` works because it only reads `userId/status/role/fullName`, but cannot sync avatar, profile ID, or strikes.
- **Fix:** Create `GetMeResponseDto` matching `UserDto` shape, add `.Include(TutorProfile).Include(StudentProfile)` to the GetMe query.

### RM2: TOCTOU race in OAuth state Consume()
- **Files:** `MemoryExternalAuthStateStore.cs:57-79`
- **Bug:** `TryGetValue` then `Remove` are two separate operations — not atomic. Concurrent requests with same state value can both succeed.
- **Fix:** Use `ConcurrentDictionary` with `TryRemove` instead of `IMemoryCache`, or add a lock.

### RM3: /payment/return route not protected by auth guard
- **Files:** `routes/index.jsx:115`
- **Bug:** Checkout at line 112 is wrapped in `<RequireAuth>` but payment return at line 115 is not. Inconsistent.
- **Fix:** Wrap in `<RequireAuth>`.

### RM4: Refresh succeeds but no token → falls through silently
- **Files:** `api.js:149-158`
- **Bug:** If `refreshResponse.data?.data?.accessToken` is falsy after a 200 response, the old refresh token is consumed (rotated on server) but the frontend falls through with the original error. User locked out.
- **Fix:** If `newAccessToken` is falsy after successful refresh call, force logout immediately.

### RM5: Enrollment refund formula doesn't account for already-cancelled-and-refunded sessions
- **Files:** `Enrollment.cs:160-165`
- **Bug:** Refund = `TotalPrice - sum(Completed.EarningAmount)`. If session #1 was individually cancelled (and refunded), the formula ignores that and tries to refund for it again → overdraft escrow.
- **Fix:** Include cancelled sessions in earned amount: `Sessions.Where(s => s.Status == Completed || s.Status == Cancelled).Sum(...)`.

### RM6: AdminProcessRefundCallback lacks DB transaction and row lock
- **Files:** `AdminProcessRefundCallbackCommandHandler.cs`
- **Bug:** Concurrent callbacks for same refund can both read non-Succeeded status and both emit RefundCompletedEvent.
- **Fix:** Wrap in DB transaction with `SELECT ... FOR UPDATE` on Transaction row.

### RM7: Failed refund status not in append-only terminal check
- **Files:** `AppDbContext.cs:100-120`
- **Bug:** A `StudentRefund` in `Failed` status can be modified to `Succeeded` without the guard blocking it.
- **Fix:** Add `Failed` to the terminal status set in `EnforceLedgerImmutability()`.

### RM8: TopUpRequest not protected by append-only guard
- **Files:** `AppDbContext.cs:80-179`
- **Bug:** Confirmed `TopUpRequest` could be re-modified back to `Pending` and re-confirmed → double-credit.
- **Fix:** Add `TopUpRequest` guard that rejects modification when `origStatus == Confirmed`.

### RM9: No student-side scheduling overlap check
- **Files:** `ScheduleSessionCommandHandler.cs:72-92`, `ScheduleSessionsBatchHandler.cs:80-103`
- **Bug:** Only tutor-side overlap is checked. A student with two enrollments can have overlapping sessions.
- **Fix:** Add parallel overlap query for `StudentProfileId`.

### RM10: Both-Absent attendance treated as conflict instead of agreement
- **Files:** `Session.cs:127-140`
- **Bug:** `EvaluateAttendanceResolution()` flags both-Absent as conflict, requiring admin resolution.
- **Fix:** Treat both-Absent as agreement → auto-cancel the session (or document as intentional).

### RM11: Logout requires [Authorize] but token may be expired
- **Files:** `AuthController.cs:85-86`
- **Bug:** Expired access token → logout API call fails → server-side refresh token stays active until natural expiry.
- **Fix:** Remove `[Authorize]` from Logout endpoint; the refresh token itself is the credential.

### RM12: BookingStatus.Expired never assigned; dashboard stats always show 0
- **Files:** `BookingStatus.cs:12`, `ProcessBookingTimeoutsCommandHandler.cs:53`
- **Bug:** `ProcessBookingTimeoutsCommandHandler` sets status to `Cancelled` not `Expired`. Admin dashboard queries for `Expired` → always 0.
- **Fix:** Either remove `Expired` enum or use it in the timeout handler.

### RM13: No duplicate Holding booking prevention
- **Files:** `CreateBookingCommandHandler.cs`
- **Bug:** Student can spam CreateBooking for same service → multiple concurrent Holdings.
- **Fix:** Pre-check for existing `Holding` booking with same `StudentProfileId + ServiceId`.

---

## LOW (16) — Fix if touching the file, otherwise defer

| ID | File | Issue |
|----|------|-------|
| RL1 | `RefreshToken.cs:17` | `IsExpired` uses `DateTime.UtcNow` instead of IClock |
| RL2 | `JwtService.cs:51` | Token expiry uses `DateTime.UtcNow` instead of IClock |
| RL3 | `Session.cs`, `Enrollment.cs` (multiple) | Domain methods use `DateTime.UtcNow` instead of passed `now` |
| RL4 | `Booking.cs:81-91` | `CalculateRefund()` is dead code — never called |
| RL5 | `Booking.cs:7-49` | Lifecycle properties use public setters — no encapsulation |
| RL6 | `ProcessBookingTimeoutsCommandHandler.cs:51-57` | Bypasses domain `Cancel()` method |
| RL7 | `AdminCancelEnrollmentCommandHandler.cs:145` | Audit log hardcodes "Active" as old status |
| RL8 | `RegisterCommandHandler.cs:79,109` | Nullable DbSet `?.Add()` silently skips |
| RL9 | `api.js:83,121` | `includes()` matching is overly broad |
| RL10 | `CompleteExternalLoginCommandHandler.cs:24` | `IPasswordHasher` injected but only for random hash |
| RL11 | `LoginCommandHandler.cs:48` | `ToLower()` culture-sensitive email comparison |
| RL12 | `Transaction.cs:135` | `CreateFeeReversal` allows zero amount |
| RL13 | `DisputeSettlementCalculator.cs:46-49` | No guard against negative recovery from rounding |
| RL14 | `Service.cs:46-55` | `Publish()` and `Resume()` duplicate Paused→Published path |
| RL15 | `Enrollment.cs:51`, `Session.cs:29` | Default `DateTime.UtcNow` initializers (overridden by service) |
| RL16 | `SessionReminderJob.cs:77` | Dedup key shared between student and tutor (OK if index includes UserId) |

---

## Missing Service Wrappers (feature gaps, not bugs — defer)

| Backend Endpoint | Missing Frontend Wrapper |
|-----------------|------------------------|
| `GET /bookings` | `getMyBookings()` |
| `POST /enrollments/{id}/tutor-cannot-continue` | `tutorCannotContinue()` |
| `POST /tutors/me/application/resubmit` | `resubmitTutorApplication()` |
| `PUT /tutors/me/subjects` | `updateMySubjects()` |
| `PUT /tutors/me/wallet/payout-account` | `updatePayoutAccount()` |
| `GET /tutors/me/wallet/statement` | `getWalletStatement()` |
| `POST /reviews/{id}/reply` | `replyReview()` |
| `POST /conversations/{id}/messages/attachment` | `uploadAttachment()` |
| Many admin endpoints | Various admin wrappers |

---

## Recommended Fix Order

### Phase 1 — CRITICAL + HIGH bugs (money/security/crash)
1. RC1: Detach dirty entities after orphan rollback
2. RH1: Block enrollment cancellation with active disputes
3. RH2: FOR UPDATE on wallet in activation
4. RH3: Duplicate enrollment guard in wallet-pay
5. RH4: Move status check before ExternalLogin.Add
6. RH5: Fix infinite redirect
7. RH6: DB transaction in batch scheduling

### Phase 2 — MEDIUM bugs
8-20. RM1–RM13 in priority order

### Phase 3 — LOW items
21+. Fix when touching the file
