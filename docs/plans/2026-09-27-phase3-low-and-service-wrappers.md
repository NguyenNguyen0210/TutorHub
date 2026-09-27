# Phase 3 Implementation Plan — Low-Priority Items & Missing Service Wrappers

**Date**: 2026-09-27  
**Goal**: Resolve all remaining LOW findings (RL1–RL14) and bridge all missing frontend service wrappers to achieve complete API contract parity across TutorHub.

---

## Batch 1: Low-Priority Domain & Invariants Fixes (RL1–RL14)

### Task 1 (RL1 + RL2): IClock in JwtService and RefreshToken domain methods
- **Files**:
  - `src/backend/TutorHub.Infrastructure/Authentication/JwtService.cs`
  - `src/backend/TutorHub.Domain/Entities/RefreshToken.cs`
  - `src/backend/TutorHub.Application/Features/Auth/RefreshToken/RefreshTokenCommandHandler.cs`
- **Fix**:
  - Inject `IClock` into `JwtService`, use `_clock.UtcNow.AddMinutes(...)` for token expiration.
  - Add `IsExpiredAt(DateTime now)` and `IsActiveAt(DateTime now)` in `RefreshToken.cs`.
  - In `RefreshTokenCommandHandler.cs`, check `existingToken.IsExpiredAt(now)` using injected `_clock`.

### Task 2 (RL4 + RL5 + RL6): Booking dead code removal and Expire domain method
- **Files**:
  - `src/backend/TutorHub.Domain/Entities/Booking.cs`
  - `src/backend/TutorHub.Application/Features/Bookings/ProcessBookingTimeouts/ProcessBookingTimeoutsCommandHandler.cs`
- **Fix**:
  - Remove dead code `CalculateRefund` in `Booking.cs`.
  - Add `public void Expire(DateTime now)` on `Booking` verifying `Status == BookingStatus.Holding`.
  - In `ProcessBookingTimeoutsCommandHandler.cs`, call `booking.Expire(now)` instead of setting fields manually.

### Task 3 (RL7): AdminCancelEnrollment dynamic old status in audit log
- **Files**:
  - `src/backend/TutorHub.Application/Features/Enrollments/AdminCancelEnrollment/AdminCancelEnrollmentCommandHandler.cs`
- **Fix**:
  - Store `var oldStatus = enrollment.Status.ToString();` prior to cancellation.
  - In `_auditLogService.LogAsync`, pass `oldValues: new { status = oldStatus }`.

### Task 4 (RL8): RegisterCommandHandler remove silent nullable Add
- **Files**:
  - `src/backend/TutorHub.Application/Features/Auth/Register/RegisterCommandHandler.cs`
- **Fix**:
  - Replace `_context.Notifications?.Add(...)` with `_context.Notifications.Add(...)`.
  - Replace `_context.EmailDeliveries?.Add(...)` with `_context.EmailDeliveries.Add(...)`.

### Task 5 (RL9): Precise credential endpoint matching in api.js
- **Files**:
  - `src/frontend/src/services/api.js`
- **Fix**:
  - Replace broad `CREDENTIAL_ENDPOINTS.some(endpoint => url.includes(endpoint))` with regex `/^\/auth\/(login|register|refresh|logout|oauth)/.test(url)` to prevent false positives on query params.

### Task 6 (RL11): Invariant email comparison in LoginCommandHandler
- **Files**:
  - `src/backend/TutorHub.Application/Features/Auth/Login/LoginCommandHandler.cs`
- **Fix**:
  - Use `u.Email.ToLowerInvariant() == normalizedEmail` to avoid culture-sensitive Turkish-I comparison bugs.

### Task 7 (RL12 + RL13): Transaction & Settlement Calculator edge guards
- **Files**:
  - `src/backend/TutorHub.Domain/Entities/Transaction.cs`
  - `src/backend/TutorHub.Domain/Services/DisputeSettlementCalculator.cs`
- **Fix**:
  - In `Transaction.CreateFeeReversal`, validate `feeReversalAmount > 0` with `ArgumentOutOfRangeException`.
  - In `DisputeSettlementCalculator.cs`, ensure `tutorNetRecovery` and `platformFeeReversal` do not become negative from rounding by applying `Math.Max(0m, ...)`.

### Task 8 (RL14): Prevent Paused -> Published transition without Resume in Service.cs
- **Files**:
  - `src/backend/TutorHub.Domain/Entities/Service.cs`
- **Fix**:
  - In `Publish()`, throw `InvalidOperationException("A paused service must be resumed, not republished.")` if `Status == ServiceStatus.Paused`.

---

## Batch 2: Missing Frontend Service Wrappers (RL-W1–RL-W8)

### Task 9 (RL-W1): BookingService.getMyBookings
- **File**: `src/frontend/src/services/booking.service.js`
- **Fix**: Add `async getMyBookings(params)` calling `GET /bookings`.

### Task 10 (RL-W2): EnrollmentService.tutorCannotContinue
- **File**: `src/frontend/src/services/enrollment.service.js`
- **Fix**: Add `async tutorCannotContinue(id, reason)` calling `POST /enrollments/{id}/tutor-cannot-continue`.

### Task 11 (RL-W3, RL-W4, RL-W7): TutorService resubmit, updateMySubjects, replyReview
- **File**: `src/frontend/src/services/tutor.service.js`
- **Fix**:
  - Add `resubmitTutorApplication(payload)` -> `POST /tutors/me/application/resubmit`
  - Add `updateMySubjects(subjectIds)` -> `PUT /tutors/me/subjects`
  - Add `replyReview(reviewId, reply)` -> `POST /reviews/${reviewId}/reply`

### Task 12 (RL-W5, RL-W6): WalletService payout account & statement
- **File**: `src/frontend/src/services/wallet.service.js`
- **Fix**:
  - Add `updatePayoutAccount(payload)` -> `PUT /tutors/me/wallet/payout-account`
  - Add `getWalletStatement(params)` -> `GET /tutors/me/wallet/statement`

### Task 13 (RL-W8): ChatService uploadAttachment
- **File**: `src/frontend/src/services/chat.service.js`
- **Fix**:
  - Add `uploadAttachment(conversationId, file)` -> `POST /conversations/{conversationId}/messages/attachment` with `multipart/form-data`.
