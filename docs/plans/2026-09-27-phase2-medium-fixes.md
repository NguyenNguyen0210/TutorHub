# Phase 2: MEDIUM Fixes (RM1–RM13) — Implementation Plan

> **For agentic workers:** Use subagent-driven-development to implement. Each task = 1 commit.
> Backend: Clean Architecture + MediatR.
> Frontend: React JSX + Zustand + Tailwind.

**Convention reminders:**
- `dotnet build src/backend/TutorHub.sln --nologo -v q` -> 0 warnings, 0 errors.
- `dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` -> all pass.
- Frontend: `cmd /c "npx eslint src --quiet"` -> 0 errors, `cmd /c "npm run build"` -> success.
- **TUYỆT ĐỐI không add/commit file spec/plan/docs.**
- Stop API before build:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5129 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue
  ```

---

## File Map & Conflict Prevention

| Task | Issue Code | Files to modify | Notes |
|------|------------|-----------------|-------|
| **Task 1** | RM1 | `GetMeResponseDto.cs` (new), `GetMeQuery.cs`, `GetMeQueryHandler.cs`, `AuthController.cs`, `authStore.js` | DTO shape parity & profile include |
| **Task 2** | RM2 | `MemoryExternalAuthStateStore.cs` | Atomic lock on `Consume()` |
| **Task 3** | RM3 | `src/frontend/src/routes/index.jsx` | `<RequireAuth>` wrapper for `/payment/return` |
| **Task 4** | RM4 | `src/frontend/src/services/api.js` | Force logout if refresh succeeds without token |
| **Task 5** | RM5 | `Enrollment.cs` | Calculate refund only for newly cancelled sessions |
| **Task 6** | RM6 | `AdminProcessRefundCallbackCommandHandler.cs` | DB transaction + `FOR UPDATE` row lock on `Transaction` |
| **Task 7** | RM7 + RM8 | `AppDbContext.cs` | Immutability guards: `Failed` Transaction + `Confirmed/Rejected` TopUpRequest |
| **Task 8** | RM9 | `ScheduleSessionCommandHandler.cs`, `ScheduleSessionsBatchHandler.cs` | Student schedule overlap check |
| **Task 9** | RM10 | `Session.cs` | Explicit domain documentation on Both-Absent conflict rationale |
| **Task 10** | RM11 | `AuthController.cs` | Remove `[Authorize]` from `POST /auth/logout` |
| **Task 11** | RM12 | `ProcessBookingTimeoutsCommandHandler.cs` | Assign `BookingStatus.Expired` instead of `Cancelled` |
| **Task 12** | RM13 | `CreateBookingCommandHandler.cs` | Prevent duplicate active `Holding` bookings |

*Note:* RM7 and RM8 are combined into Task 7 because they both edit `AppDbContext.cs`. Task 1 and Task 10 both edit `AuthController.cs`, so Task 10 can be applied after Task 1.

---

## Task 1 (RM1): Synchronize GetMe DTO Shape with Login UserDto

**Problem:** `GetMeQueryHandler` currently returns `RegisterResponseDto` (`UserId, Email, FullName, Phone, Role, Status`), whereas Login returns `UserDto` (`Id, Email, FullName, Phone, Role, AvatarUrl, IdProfile, AbsentStrikes`). As a result, frontend `revalidateSession` cannot sync avatar, profile ID, or strikes on session revalidation.

**Files:**
- `src/backend/TutorHub.Application/Features/Auth/DTOs/GetMeResponseDto.cs` (new)
- `src/backend/TutorHub.Application/Features/Auth/GetMe/GetMeQuery.cs`
- `src/backend/TutorHub.Application/Features/Auth/GetMe/GetMeQueryHandler.cs`
- `src/backend/TutorHub.Api/Controllers/AuthController.cs`
- `src/frontend/src/store/authStore.js`

**Implementation:**
1. Create `GetMeResponseDto`:
   ```csharp
   namespace TutorHub.Application.Features.Auth.DTOs;

   public record GetMeResponseDto(
       Guid Id,
       Guid UserId,
       string Email,
       string FullName,
       string? Phone,
       string Role,
       string Status,
       string? AvatarUrl,
       Guid? IdProfile,
       int AbsentStrikes = 0
   );
   ```
2. Update `GetMeQuery`:
   ```csharp
   public record GetMeQuery : IRequest<GetMeResponseDto>;
   ```
3. Update `GetMeQueryHandler`:
   - Include `u.TutorProfile` and `u.StudentProfile`.
   - Resolve `idProfile` (`user.Role == UserRole.Tutor ? user.TutorProfile?.Id : user.StudentProfile?.Id`).
   - Return new `GetMeResponseDto`.
4. In `AuthController.cs:164-169`, update `[ProducesResponseType(typeof(ApiResponse<GetMeResponseDto>), ...)]` and return type.
5. In `src/frontend/src/store/authStore.js` `revalidateSession`:
   - Check `serverUser.id || serverUser.userId`.
   - Update user in store & localStorage: `avatarUrl`, `idProfile`, `absentStrikes`, `role`, `fullName`.

**Commit:** `fix(auth): align GetMe DTO with login UserDto and sync profile data`

---

## Task 2 (RM2): Atomic TOCTOU Fix in MemoryExternalAuthStateStore

**Problem:** In `MemoryExternalAuthStateStore.cs:66-71`, `_cache.TryGetValue(...)` followed by `_cache.Remove(...)` are two non-atomic calls. Concurrent requests with the same state string can both succeed before either removes it.

**File:** `src/backend/TutorHub.Infrastructure/Authentication/External/MemoryExternalAuthStateStore.cs`

**Implementation:**
Add a synchronization lock around state consumption:
```csharp
    private readonly object _stateLock = new();

    public PendingExternalAuth? Consume(string state, ExternalAuthProvider provider, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(state))
        {
            return null;
        }

        PendingExternalAuth? entry;
        lock (_stateLock)
        {
            if (!_cache.TryGetValue(StateKeyPrefix + state, out entry) || entry is null)
            {
                return null;
            }

            _cache.Remove(StateKeyPrefix + state);
        }

        if (entry.Provider != provider)
        {
            return null;
        }

        return entry;
    }
```

**Commit:** `fix(auth): make OAuth state consumption atomic to prevent TOCTOU race`

---

## Task 3 (RM3): Protect /payment/return with RequireAuth

**Problem:** In `src/frontend/src/routes/index.jsx:115`, `<Route path="/payment/return" element={<PaymentReturn />} />` is exposed publicly without `<RequireAuth>`, while checkout (`/student/bookings/:id/checkout`) is protected.

**File:** `src/frontend/src/routes/index.jsx`

**Implementation:**
Wrap `<PaymentReturn />` in `<RequireAuth>`:
```jsx
<Route path="/payment/return" element={
  <RequireAuth><PaymentReturn /></RequireAuth>
} />
```

**Commit:** `fix(frontend): protect payment return route with RequireAuth`

---

## Task 4 (RM4): Force Logout when Refresh Returns Empty AccessToken

**Problem:** In `src/frontend/src/services/api.js:149-166`, if the `/auth/refresh` HTTP call returns 200 OK but `accessToken` is falsy/missing in the response payload, the logic silently skips `if (newAccessToken)` without calling `processQueue(err, null)` or `logout()`, leaving callers hung or falling through to original error.

**File:** `src/frontend/src/services/api.js`

**Implementation:**
After `if (newAccessToken) { ... }`, add explicit handling for missing token:
```javascript
        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (newAccessToken) {
          useAuthStore.getState().login(useAuthStore.getState().user, {
            accessToken: newAccessToken,
            refreshToken: refreshResponse.data?.data?.refreshToken || refreshToken,
          });
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }

        const missingTokenErr = new Error('No access token returned from refresh.');
        processQueue(missingTokenErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(toApiError(missingTokenErr));
```

**Commit:** `fix(frontend): force logout when refresh succeeds with empty access token`

---

## Task 5 (RM5): Pro-rate Enrollment Refund for Newly Cancelled Sessions Only

**Problem:** `Enrollment.Cancel(reason, cancelledBy)` computes `refundAmount = TotalPrice - sum(Completed.EarningAmount)`. If session #1 was previously cancelled individually and refunded to the student (with pending escrow debited), `Cancel()` calculates refund as if session #1 was never refunded, causing double-refund and attempting to debit more than remaining pending escrow.

**File:** `src/backend/TutorHub.Domain/Entities/Enrollment.cs`

**Implementation:**
In `Cancel()`:
```csharp
        // Cancel all non-completed and not-already-cancelled sessions
        var newlyCancelledSessions = Sessions
            .Where(s => s.Status != SessionStatus.Completed && s.Status != SessionStatus.Cancelled)
            .ToList();

        foreach (var session in newlyCancelledSessions)
        {
            session.CancelFromEnrollment();
        }

        // Refund matches exactly the unearned, unrefunded sessions' escrow allocations
        return newlyCancelledSessions.Sum(s => s.EarningAmount);
```

**Commit:** `fix(enrollments): calculate enrollment cancellation refund from newly cancelled sessions only`

---

## Task 6 (RM6): Add DB Transaction and Row Lock in AdminProcessRefundCallback

**Problem:** `AdminProcessRefundCallbackCommandHandler.cs` reads `refundTx` without a row lock or transaction. Concurrent callback requests can both see non-Succeeded status and both emit `RefundCompletedEvent`.

**File:** `src/backend/TutorHub.Application/Features/Disputes/Commands/AdminProcessRefundCallback/AdminProcessRefundCallbackCommandHandler.cs`

**Implementation:**
1. Wrap in database transaction: `await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);`
2. Query `Transaction` with `FromSqlInterpolated($"SELECT * FROM \"Transactions\" WHERE \"Id\" = {request.RefundTransactionId} FOR UPDATE")`.
3. Wrap in try/catch with commit & rollback.

**Commit:** `fix(disputes): wrap admin refund callback in DB transaction with row lock`

---

## Task 7 (RM7 + RM8): AppDbContext Immutability Guards for Failed Transactions and TopUpRequests

**Problem:**
1. `AppDbContext.EnforceLedgerImmutability()` only checks `origStatus == Released || Succeeded`. If a `Transaction` has status `Failed`, it can be mutated after reaching terminal failure.
2. `TopUpRequest` has no ledger immutability guard in `AppDbContext.cs`. A `Confirmed` or `Rejected` top-up request could be mutated back to `Pending` and re-approved, leading to duplicate wallet credits.

**File:** `src/backend/TutorHub.Infrastructure/Persistence/AppDbContext.cs`

**Implementation:**
1. In `modifiedTerminalTransactions`:
   ```csharp
   return origStatus == TransactionStatus.Released ||
          origStatus == TransactionStatus.Succeeded ||
          origStatus == TransactionStatus.Failed ||
          origStatus == TransactionStatus.Refunded;
   ```
2. Add `TopUpRequest` guard in `EnforceLedgerImmutability()`:
   - Check no `Deleted` entries for `TopUpRequest`.
   - Check no `Modified` entries where `origStatus == TopUpRequestStatus.Confirmed || origStatus == TopUpRequestStatus.Rejected`.

**Commit:** `fix(ledger): enforce immutability on failed transactions and settled topup requests`

---

## Task 8 (RM9): Add Student-Side Scheduling Overlap Check

**Problem:** `ScheduleSessionCommandHandler.cs` and `ScheduleSessionsBatchHandler.cs` only check for overlap against `s.Enrollment.TutorProfileId == tutorProfileId`. If a student is enrolled in multiple courses or tutors, a session can be scheduled overlapping another session of that student.

**Files:**
- `src/backend/TutorHub.Application/Features/Sessions/ScheduleSession/ScheduleSessionCommandHandler.cs`
- `src/backend/TutorHub.Application/Features/Sessions/ScheduleSessionsBatch/ScheduleSessionsBatchHandler.cs`

**Implementation:**
1. In `ScheduleSessionCommandHandler`:
   - Query existing scheduled sessions for `s.Enrollment.StudentProfileId == enrollment.StudentProfileId && s.Id != session.Id && s.Status == SessionStatus.Scheduled && s.StartAt < request.EndAt && request.StartAt < s.EndAt`.
   - If any exist, throw `ConflictException("The student already has another session scheduled during this time slot.")`.
2. In `ScheduleSessionsBatchHandler`:
   - Collect `studentProfileIds`.
   - Check database overlap for students within `[rangeStart, rangeEnd]`.
   - Validate intra-batch student overlap as well.

**Commit:** `fix(scheduling): validate student-side schedule overlap on single and batch scheduling`

---

## Task 9 (RM10): Clarify & Document Both-Absent Domain Invariant in Session.cs

**Problem:** `EvaluateAttendanceResolution()` in `Session.cs:127-140` marks `HasAttendanceConflict = true` when `StudentAttendance == Absent && TutorAttendance == Absent`. Review finding questioned whether this should auto-cancel or be documented as intentional.

**Analysis:**
Per functional requirements FR-ATT-004 through FR-ATT-008:
- Earning release ONLY occurs when both parties attend (`Attended + Attended`).
- If both are absent, the session did NOT take place, but automatically cancelling it without dispute/admin review could cause inadvertent loss of hours or premature contract cancellation.
- Flagging `HasAttendanceConflict = true` triggers `AttendanceConflictDetectedEvent` so that admin/support can arbitrate or reschedule.

**File:** `src/backend/TutorHub.Domain/Entities/Session.cs`

**Implementation:**
Add explicit domain XML doc & comments explaining the intentional rationale:
```csharp
    private void EvaluateAttendanceResolution()
    {
        if (StudentAttendance.HasValue && TutorAttendance.HasValue)
        {
            if (StudentAttendance == AttendanceStatus.Attended && TutorAttendance == AttendanceStatus.Attended)
            {
                HasAttendanceConflict = false;
            }
            else
            {
                // INTENTIONAL (FR-ATT-005, DEC-RM10): Any combination other than Attended+Attended
                // (including Both Absent) is flagged as a conflict. Even though both agree they did
                // not attend, tutor earnings cannot be released and automatic cancellation without
                // human review risks unintended contract disruption. It must proceed to resolution.
                HasAttendanceConflict = true;
            }
        }
    }
```

**Commit:** `docs(domain): document intentional conflict classification for both-absent attendance`

---

## Task 10 (RM11): Remove [Authorize] from Logout Endpoint

**Problem:** In `AuthController.cs:85`, `[Authorize]` is placed on `POST /auth/logout`. When an access token expires while the user is idle, calling logout returns 401 Unauthorized, preventing the server-side refresh token from being revoked. `LogoutCommandHandler` only uses `request.RefreshToken` (hashed) and does not rely on claims from `ICurrentUserService`.

**File:** `src/backend/TutorHub.Api/Controllers/AuthController.cs`

**Implementation:**
Remove `[Authorize]` attribute above `[HttpPost("logout")]`.

**Commit:** `fix(auth): allow logout without access token authorization to revoke refresh tokens`

---

## Task 11 (RM12): Assign BookingStatus.Expired in ProcessBookingTimeouts

**Problem:** `ProcessBookingTimeoutsCommandHandler.cs:53` sets `booking.Status = BookingStatus.Cancelled` when a 15-minute holding booking expires. Meanwhile, `GetAdminDashboardStatsQueryHandler.cs:76` queries `BookingStatus.Expired`, which always returns 0 because `Expired` is never assigned. `BookingStatus.cs` explicitly defines `Expired` for this exact case.

**File:** `src/backend/TutorHub.Application/Features/Bookings/ProcessBookingTimeouts/ProcessBookingTimeoutsCommandHandler.cs`

**Implementation:**
Change line 53:
```csharp
booking.Status = BookingStatus.Expired;
booking.CancelledBy = CancelledBy.System;
booking.CancellationReason = "HoldingExpired";
booking.CancelledAt = now;
```

**Commit:** `fix(bookings): mark timed-out holding bookings as Expired instead of Cancelled`

---

## Task 12 (RM13): Prevent Duplicate Active Holding Bookings

**Problem:** `CreateBookingCommandHandler.cs` does not check if the student already has an active, unexpired `Holding` booking for the same service. A student can click repeatedly, creating multiple concurrent holding records for the same service.

**File:** `src/backend/TutorHub.Application/Features/Bookings/CreateBooking/CreateBookingCommandHandler.cs`

**Implementation:**
Before creating the new booking:
```csharp
        var existingHolding = await _context.Bookings
            .FirstOrDefaultAsync(b => b.StudentProfileId == student.Id
                                   && b.ServiceId == service.Id
                                   && b.Status == BookingStatus.Holding
                                   && b.HoldingExpiresAt.HasValue
                                   && b.HoldingExpiresAt.Value > now, cancellationToken);
        if (existingHolding != null)
        {
            throw new ConflictException("You already have an active pending booking held for this service. Please proceed to payment or wait for the hold to expire.");
        }
```

**Commit:** `fix(bookings): prevent duplicate active holding bookings for the same student and service`

---

## Execution Sequence

### Batch 1 (Parallel - 6 Tasks)
- **Task 2 (RM2)**: `MemoryExternalAuthStateStore.cs`
- **Task 3 (RM3)**: `routes/index.jsx`
- **Task 4 (RM4)**: `services/api.js`
- **Task 5 (RM5)**: `Enrollment.cs`
- **Task 6 (RM6)**: `AdminProcessRefundCallbackCommandHandler.cs`
- **Task 7 (RM7+RM8)**: `AppDbContext.cs`

### Batch 2 (Parallel - 6 Tasks)
- **Task 1 (RM1)**: `GetMeResponseDto.cs`, `GetMeQuery.cs`, `GetMeQueryHandler.cs`, `AuthController.cs`, `authStore.js`
- **Task 8 (RM9)**: `ScheduleSessionCommandHandler.cs`, `ScheduleSessionsBatchHandler.cs`
- **Task 9 (RM10)**: `Session.cs`
- **Task 10 (RM11)**: `AuthController.cs` (runs after Task 1 finishes)
- **Task 11 (RM12)**: `ProcessBookingTimeoutsCommandHandler.cs`
- **Task 12 (RM13)**: `CreateBookingCommandHandler.cs`

---

## Verification After Execution
1. Stop API: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5129 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue`
2. `dotnet build src/backend/TutorHub.sln --nologo -v q` -> 0 errors, 0 warnings
3. `dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` -> all tests pass
4. `cmd /c "cd src/frontend && npx eslint src --quiet"` -> 0 errors
5. `cmd /c "cd src/frontend && npm run build"` -> successful production bundle
