# IMPORTANT Fixes (I1–I11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 11 IMPORTANT-severity issues discovered during the 2026-09-27 codebase review — spanning auth, financial ledger, frontend contract, UX, and security.

**Architecture:** Fixes are independent (no cross-task dependency except I3 which is spec-only). Each task produces a single commit. Backend follows Clean Architecture + MediatR; frontend is Pure JSX + Zustand + Tailwind.

**Tech Stack:** .NET 8 / EF Core / PostgreSQL / xUnit + Moq; React 18 / Vite / ESLint

**Convention reminders:**
- `dotnet build src/backend/TutorHub.sln` 0 warnings (nếu API đang chạy khóa DLL → dừng API trước).
- `npx eslint` 0 errors (warnings pre-existing OK).
- TUYỆT ĐỐI không add/commit file spec/plan/docs.
- Commit message format: `fix(scope): description` hoặc `feat(scope): description`.

---

## Đợt 1 — Auth & Security (I1, I2, I5, I11)

### Task 1: I1 — External login link branch missing Include profile

**Problem:** `CompleteExternalLoginCommandHandler.cs:118-119` queries `_context.Users.FirstOrDefaultAsync(...)` without `.Include(u => u.TutorProfile).Include(u => u.StudentProfile)`. A Tutor linking Google first time → JWT missing `tutorProfileId` → frontend Tutor dashboard broken.

**Files:**
- Modify: `src/backend/TutorHub.Application/Features/Auth/ExternalLogin/CompleteExternalLoginCommandHandler.cs:118-119`
- Test: `src/test/TutorHub.Application.UnitTests/Features/Auth/ExternalLogin/CompleteExternalLoginCommandHandlerTests.cs` (existing file — add test)

- [ ] **Step 1: Write the failing test**

Add to existing test file a test that verifies linking an existing Tutor user populates `tutorProfileId` in the response. Setup: mock `_context.Users` to return a Tutor user when queried with `.Include(TutorProfile).Include(StudentProfile)`, but WITHOUT includes returns user with null TutorProfile. Assert `result.User.TutorProfileId` is not null.

Pattern: follow existing tests in the file (Moq + `MockDbSetHelper`). The test name: `Handle_ExistingTutorLinksGoogle_JwtIncludesTutorProfileId`.

- [ ] **Step 2: Run test — expect FAIL**

Run: `dotnet test src/test/TutorHub.Application.UnitTests --filter "FullyQualifiedName~CompleteExternalLogin" --nologo -v q`

- [ ] **Step 3: Fix the handler — add 2 Includes**

In `CompleteExternalLoginCommandHandler.cs`, change line 118-119 from:

```csharp
var existing = await _context.Users
    .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
```

to:

```csharp
var existing = await _context.Users
    .Include(u => u.TutorProfile)
    .Include(u => u.StudentProfile)
    .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
```

- [ ] **Step 4: Run test — expect PASS**

Run: `dotnet test src/test/TutorHub.Application.UnitTests --filter "FullyQualifiedName~CompleteExternalLogin" --nologo -v q`

- [ ] **Step 5: Build check**

Run: `dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 6: Commit**

```
git add src/backend/.../CompleteExternalLoginCommandHandler.cs src/test/.../CompleteExternalLoginCommandHandlerTests.cs
git commit -m "fix(auth): include TutorProfile and StudentProfile when linking existing user via OAuth"
```

---

### Task 2: I2 — OAuth callback 401 triggers refresh-retry, losing Suspended/Banned error

**Problem:** `api.js:83` `CREDENTIAL_ENDPOINTS` lacks `'/auth/oauth/'`. When a Suspended user completes OAuth callback, backend returns 401 → interceptor treats it as expired token → tries refresh → loses original error message → user sees "link hết hạn" instead of "Account suspended".

**Files:**
- Modify: `src/frontend/src/services/api.js:83`

- [ ] **Step 1: Add OAuth path to CREDENTIAL_ENDPOINTS**

Change line 83 from:

```js
const CREDENTIAL_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
```

to:

```js
const CREDENTIAL_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/oauth/'];
```

- [ ] **Step 2: Lint check**

Run: `cmd /c "cd src/frontend && npx eslint src/services/api.js"` → 0 errors.

- [ ] **Step 3: Build check**

Run: `cmd /c "cd src/frontend && npm run build"` → success.

- [ ] **Step 4: Commit**

```
git add src/frontend/src/services/api.js
git commit -m "fix(frontend): prevent OAuth callback 401 from entering refresh queue"
```

---

### Task 3: I5 — Login label says "Email hoặc số điện thoại" but backend only searches email

**Problem:** `Login.jsx:353-365` label and placeholder promise phone login, but `LoginCommandHandler.cs:48` only queries `u.Email.ToLower()`. Users typing phone get 401 with no useful feedback.

**Decision:** Change label only (YAGNI — adding phone lookup is a separate feature). This is the simplest, safest fix.

**Files:**
- Modify: `src/frontend/src/pages/auth/Login.jsx:353-365`

- [ ] **Step 1: Update label and placeholder**

Change the label text from `Email hoặc số điện thoại` to `Email` (line 354).
Change the placeholder from `Nhập email hoặc số điện thoại của bạn` to `Nhập email của bạn` (line 365).
Change the comment on line 351 from `{/* 1. Email hoặc số điện thoại */}` to `{/* 1. Email */}`.

- [ ] **Step 2: Lint check**

Run: `cmd /c "cd src/frontend && npx eslint src/pages/auth/Login.jsx"` → 0 errors.

- [ ] **Step 3: Build check**

Run: `cmd /c "cd src/frontend && npm run build"` → success.

- [ ] **Step 4: Commit**

```
git add src/frontend/src/pages/auth/Login.jsx
git commit -m "fix(frontend): login label no longer promises phone support backend lacks"
```

---

### Task 4: I11 — User enumeration via register error message

**Problem:** `RegisterCommandHandler.cs:35` throws `ConflictException($"User with email '{request.Email}' already exists.")` — echoes email back, confirms account existence. Login already uses generic message.

**Files:**
- Modify: `src/backend/TutorHub.Application/Features/Auth/Register/RegisterCommandHandler.cs:35`
- Test: existing register tests — verify message changed

- [ ] **Step 1: Change error message**

In `RegisterCommandHandler.cs` line 35, change:

```csharp
throw new ConflictException($"User with email '{request.Email}' already exists.");
```

to:

```csharp
throw new ConflictException("An account with this email already exists.");
```

- [ ] **Step 2: Check existing tests still compile**

Run: `dotnet test src/test/TutorHub.Application.UnitTests --filter "FullyQualifiedName~Register" --nologo -v q`

If any test asserts on the old exact message string, update it to match the new message.

- [ ] **Step 3: Build check**

Run: `dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 4: Commit**

```
git add src/backend/.../RegisterCommandHandler.cs
git commit -m "fix(auth): register error no longer echoes email for enumeration prevention"
```

---

## Đợt 2 — Financial Integrity (I6, I7, I8)

### Task 5: I6 — TutorWalletTransaction missing from append-only guard

**Problem:** `AppDbContext.cs:88-170` blocks modify/delete on `Transaction`, `AuditLog`, `StudentWalletTransaction` but NOT `TutorWalletTransaction` (alias `WalletTransaction`). Tutor wallet ledger can be silently modified or deleted.

**Files:**
- Modify: `src/backend/TutorHub.Infrastructure/Persistence/AppDbContext.cs` (add block after line 169)
- Test: `src/test/TutorHub.Infrastructure.UnitTests/` or integration test (check if test project exists; if not, add unit test in Application tests that mocks DbContext)

- [ ] **Step 1: Add TutorWalletTransaction guard**

After line 169 (closing brace of StudentWalletTransaction block), add:

```csharp
        // Enforce append-only on TutorWalletTransaction (INV-TUTOR-WALLET-001)
        var modifiedTutorWalletTxs = ChangeTracker.Entries<TutorWalletTransaction>()
            .Where(e => e.State == EntityState.Modified || e.State == EntityState.Deleted)
            .ToList();
        if (modifiedTutorWalletTxs.Count > 0)
        {
            var ids = string.Join(",", modifiedTutorWalletTxs.Select(e => e.Entity.Id));
            throw new InvalidOperationException($"TutorWalletTransaction records are append-only and cannot be modified or deleted. Ids: {ids}.");
        }
```

Note: use fully qualified `TutorWalletTransaction` (from `TutorHub.Domain.Entities`) — the Infrastructure project does NOT have the `WalletTransaction` alias from Application's `GlobalUsings.cs`. Check the using directives at top of file; add `using TutorHub.Domain.Entities;` if not present (it likely is).

- [ ] **Step 2: Build check**

Run: `dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 3: Run full tests**

Run: `dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` → all pass.

- [ ] **Step 4: Commit**

```
git add src/backend/.../AppDbContext.cs
git commit -m "fix(persistence): enforce append-only on TutorWalletTransaction ledger"
```

---

### Task 6: I7 — Orphan-recovery mutates session before escrow check

**Problem:** `AttendanceVerificationJob.cs:90-91` calls `session.Complete()` and `session.Enrollment.RecordCompletedSession()` BEFORE the DB transaction and escrow check (line 97-109). If wallet has insufficient `PendingBalance`, the code rolls back the DB transaction but the in-memory entities remain mutated as `Completed`. Later `SaveChangesAsync` calls (lines 201, 222) flush this dirty state.

**Files:**
- Modify: `src/backend/TutorHub.Infrastructure/BackgroundServices/AttendanceVerificationJob.cs:88-110`

- [ ] **Step 1: Move mutations after escrow check**

Move lines 90-91 (`session.Complete()` and `session.Enrollment.RecordCompletedSession(session.Id)`) to AFTER the wallet check passes (after line 109, before line 111). The corrected order:

```csharp
_logger.LogWarning("Recovering orphaned session {SessionId}: both Attended but payout not released", session.Id);

var gross = session.EarningAmount;
var commissionRate = session.Enrollment.PlatformFeeRate;
var (commissionAmount, netPayout) = PlatformFeeCalculator.SplitGross(gross, commissionRate);

await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
try
{
    var wallet = await dbContext.Wallets
        .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {session.Enrollment.TutorProfileId} FOR UPDATE")
        .FirstOrDefaultAsync(cancellationToken);

    if (wallet == null || wallet.PendingBalance < gross)
    {
        _logger.LogError("Financial invariant violated during orphaned session recovery: Pending escrow balance insufficient for session {SessionId}", session.Id);
        await tx.RollbackAsync(cancellationToken);
        continue;
    }

    // Mutate entities ONLY after invariant check passes
    session.Complete();
    session.Enrollment.RecordCompletedSession(session.Id);

    wallet.DebitPending(gross, now);
    wallet.CreditAvailable(netPayout, now);
    // ... rest unchanged
```

- [ ] **Step 2: Build check**

Run: `dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 3: Run full tests**

Run: `dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` → all pass (job is in Infrastructure, tested via integration — no unit test breakage expected).

- [ ] **Step 4: Commit**

```
git add src/backend/.../AttendanceVerificationJob.cs
git commit -m "fix(jobs): defer session Complete() until after escrow invariant check"
```

---

### Task 7: I8 — Date filtering: half-open and timezone issues

**Problem:**
- `GetMyBookingsQueryHandler.cs:65-66` uses `TimeOnly.MaxValue` (23:59:59.999) with `<=` — misses records at exact midnight of next day. Should use half-open `< nextDay`.
- `AdminGetAuditLogsQueryHandler.cs:46` compares raw `DateTime?` against UTC `CreatedAt` without `DateTime.SpecifyKind(..., Utc)` — if client sends unspecified-kind DateTime, Npgsql may interpret it wrong.

**Files:**
- Modify: `src/backend/TutorHub.Application/Features/Bookings/GetMyBookings/GetMyBookingsQueryHandler.cs:63-67`
- Modify: `src/backend/TutorHub.Application/Features/Admin/AuditLogs/GetAdminAuditLogs/AdminGetAuditLogsQueryHandler.cs:44-53`

- [ ] **Step 1: Fix GetMyBookings — use half-open range**

Change lines 63-67 from:

```csharp
if (request.ToDate.HasValue)
{
    var toUtc = request.ToDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
    query = query.Where(b => b.CreatedAt <= toUtc);
}
```

to:

```csharp
if (request.ToDate.HasValue)
{
    var toExclusive = request.ToDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
    query = query.Where(b => b.CreatedAt < toExclusive);
}
```

- [ ] **Step 2: Fix AdminGetAuditLogs — SpecifyKind Utc**

Change lines 44-53 from:

```csharp
if (request.DateFrom.HasValue)
{
    query = query.Where(a => a.CreatedAt >= request.DateFrom.Value);
}

if (request.DateTo.HasValue)
{
    var endOfDayExclusive = request.DateTo.Value.Date.AddDays(1);
    query = query.Where(a => a.CreatedAt < endOfDayExclusive);
}
```

to:

```csharp
if (request.DateFrom.HasValue)
{
    var fromUtc = DateTime.SpecifyKind(request.DateFrom.Value, DateTimeKind.Utc);
    query = query.Where(a => a.CreatedAt >= fromUtc);
}

if (request.DateTo.HasValue)
{
    var toExclusive = DateTime.SpecifyKind(request.DateTo.Value.Date.AddDays(1), DateTimeKind.Utc);
    query = query.Where(a => a.CreatedAt < toExclusive);
}
```

- [ ] **Step 3: Build check**

Run: `dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 4: Run full tests**

Run: `dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` → all pass.

- [ ] **Step 5: Commit**

```
git add src/backend/.../GetMyBookingsQueryHandler.cs src/backend/.../AdminGetAuditLogsQueryHandler.cs
git commit -m "fix(queries): use half-open date ranges and SpecifyKind Utc for date filtering"
```

---

## Đợt 3 — Frontend UX & Contract (I4, I9, I10)

### Task 8: I4 — Hide Facebook/Apple buttons when providers not available

**Problem:** Facebook/Apple buttons always render but only show a toast. Spec says gate by `getProviders()` response. Google button already uses this pattern (hidden when not in providers list).

**Files:**
- Modify: `src/frontend/src/pages/auth/Login.jsx:460-478` (+ handler :176-180)
- Modify: `src/frontend/src/pages/auth/Register.jsx:567-585` (+ handler :164-168)

- [ ] **Step 1: Login.jsx — conditionally render Facebook/Apple**

The Google button is already gated by `enabledProviders.includes('Google')`. Apply the same pattern:

Wrap the Facebook button (lines 460-468) with `{enabledProviders.includes('Facebook') && ( ... )}`.
Wrap the Apple button (lines 470-478) with `{enabledProviders.includes('Apple') && ( ... )}`.

Also update the grid class: the `<div>` wrapping all 3 buttons should use dynamic grid columns based on how many providers are enabled. Change from `grid-cols-3` to a computed value, OR simpler: use `flex flex-wrap gap-3 justify-center` instead of grid (since 0-3 buttons possible). Check current class — if it's `grid grid-cols-3`, switch to `flex flex-wrap gap-3` to handle variable button count.

Remove the toast-only early return in `handleSocialLogin` for non-Google providers (lines 177-179) — those buttons won't render anymore if provider isn't in the list.

- [ ] **Step 2: Register.jsx — same pattern**

Mirror the Login.jsx changes: gate Facebook/Apple by `enabledProviders.includes(...)`, switch to flex layout, remove toast early return in `handleSocialRegister` (lines 165-167).

- [ ] **Step 3: Lint check**

Run: `cmd /c "cd src/frontend && npx eslint src/pages/auth/Login.jsx src/pages/auth/Register.jsx"` → 0 errors.

- [ ] **Step 4: Build check**

Run: `cmd /c "cd src/frontend && npm run build"` → success.

- [ ] **Step 5: Commit**

```
git add src/frontend/src/pages/auth/Login.jsx src/frontend/src/pages/auth/Register.jsx
git commit -m "fix(frontend): hide social login buttons for providers not returned by backend"
```

---

### Task 9: I9 — Add createConversation to chat.service.js

**Problem:** Backend `POST /conversations` (body `{ targetUserId }`) exists but `chat.service.js` has no wrapper. Users can't initiate conversations from frontend.

**Files:**
- Modify: `src/frontend/src/services/chat.service.js` (add method to `chatService` object)

- [ ] **Step 1: Add getOrCreateConversation method**

Add to `chatService` object (after `markConversationAsRead`, before closing `};`):

```js
  /**
   * POST /conversations → ConversationDto
   * Get or create a 1-to-1 conversation with the target user.
   */
  async getOrCreateConversation(targetUserId) {
    const res = await api.post('/conversations', { targetUserId });
    return normalizeConversation(res);
  },
```

Also update the JSDoc comment at top of file (lines 1-9) to include:
```
 * - POST /conversations                      → ConversationDto (body { targetUserId })
```

- [ ] **Step 2: Lint check**

Run: `cmd /c "cd src/frontend && npx eslint src/services/chat.service.js"` → 0 errors.

- [ ] **Step 3: Build check**

Run: `cmd /c "cd src/frontend && npm run build"` → success.

- [ ] **Step 4: Commit**

```
git add src/frontend/src/services/chat.service.js
git commit -m "feat(frontend): add getOrCreateConversation to chat service"
```

---

### Task 10: I10 — Revalidate session from server on app boot

**Problem:** On page reload, `authStore.js` hydrates purely from `localStorage`. If admin bans/suspends a user or changes role, the stale local data persists until manual logout. Backend `GET /auth/me` endpoint exists and returns `{ id, email, fullName, phone, role, status }`.

**Files:**
- Modify: `src/frontend/src/store/authStore.js` (add `revalidate` action)
- Modify: `src/frontend/src/routes/index.jsx` or `src/frontend/src/App.jsx` (call revalidate on mount) — check which is the app root

- [ ] **Step 1: Add revalidateSession action to authStore**

Add a new action in `authStore.js` inside the `create((set, get) => ({...}))` block:

```js
  revalidateSession: async () => {
    const token = get().accessToken;
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      const current = get().user;
      if (!res || !res.id) {
        get().logout();
        return;
      }
      if (res.status === 'Suspended' || res.status === 'Banned') {
        get().logout();
        return;
      }
      if (current && (current.role !== res.role || current.fullName !== res.fullName)) {
        const updated = { ...current, role: res.role, fullName: res.fullName, name: res.fullName };
        localStorage.setItem('tutorhub_user', JSON.stringify(updated));
        set({ user: updated, role: res.role });
      }
    } catch {
      // Network error or 401 — silent fail, interceptor handles refresh/logout
    }
  },
```

- [ ] **Step 2: Call revalidateSession on app mount**

Find the app's root component (likely `App.jsx` or the component wrapping `<RouterProvider>`). Add a `useEffect` at the top level:

```jsx
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

// Inside the component:
useEffect(() => {
  useAuthStore.getState().revalidateSession();
}, []);
```

Check `src/frontend/src/App.jsx` or `src/frontend/src/main.jsx` for the right place. The effect should run once on mount with `[]` deps.

- [ ] **Step 3: Lint check**

Run: `cmd /c "cd src/frontend && npx eslint src/store/authStore.js src/App.jsx"` → 0 errors.

- [ ] **Step 4: Build check**

Run: `cmd /c "cd src/frontend && npm run build"` → success.

- [ ] **Step 5: Commit**

```
git add src/frontend/src/store/authStore.js src/frontend/src/App.jsx
git commit -m "feat(frontend): revalidate session from server on app boot"
```

---

## Đợt 4 — Spec-Only (I3)

### Task 11: I3 — OAuth users cannot set password (spec update only)

**Problem:** `ChangePasswordCommandHandler.cs:37` requires `request.CurrentPassword` verification. OAuth users created with random 64-byte hash can never call this. No `SetPassword`, `ForgotPassword`, or `ResetPassword` endpoint exists anywhere in backend.

**Decision:** This is a feature gap, not a bug. Adding a full password reset flow (email verification, token generation, rate limiting) is a separate project. For now, update the spec to acknowledge the limitation and remove the promise.

**Files:**
- Modify: `docs/external-auth-spec.md` (if §2.4 mentions password setting — update to say "not yet implemented")

- [ ] **Step 1: Update spec — acknowledge limitation**

Find §2.4 (or equivalent section about post-OAuth account management) in `docs/external-auth-spec.md`. Add a note:

```markdown
> **Known limitation:** OAuth-only accounts cannot set a local password. The `ChangePassword`
> endpoint requires current password verification, which is impossible for accounts created via
> OAuth (random hash). A dedicated `SetPassword` or `ForgotPassword` flow is planned but not
> yet implemented.
```

- [ ] **Step 2: Do NOT commit** (spec/docs are never committed per project rule)

File stays as local reference only.

---

## Cổng kiểm chung (chạy sau tất cả task)

```bash
# Backend
dotnet build src/backend/TutorHub.sln --nologo -v q          # 0 warnings, 0 errors
dotnet test src/test/TutorHub.Domain.UnitTests --nologo -v q  # all pass
dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q  # all pass

# Frontend
cd src/frontend
npx eslint .   # 0 errors (pre-existing warnings OK)
npm run build  # success
```

## Tóm tắt commits

| Task | Scope | Commit message |
|------|-------|----------------|
| T1 (I1) | Backend | `fix(auth): include TutorProfile and StudentProfile when linking existing user via OAuth` |
| T2 (I2) | Frontend | `fix(frontend): prevent OAuth callback 401 from entering refresh queue` |
| T3 (I5) | Frontend | `fix(frontend): login label no longer promises phone support backend lacks` |
| T4 (I11) | Backend | `fix(auth): register error no longer echoes email for enumeration prevention` |
| T5 (I6) | Backend | `fix(persistence): enforce append-only on TutorWalletTransaction ledger` |
| T6 (I7) | Backend | `fix(jobs): defer session Complete() until after escrow invariant check` |
| T7 (I8) | Backend | `fix(queries): use half-open date ranges and SpecifyKind Utc for date filtering` |
| T8 (I4) | Frontend | `fix(frontend): hide social login buttons for providers not returned by backend` |
| T9 (I9) | Frontend | `feat(frontend): add getOrCreateConversation to chat service` |
| T10 (I10) | Frontend | `feat(frontend): revalidate session from server on app boot` |
| T11 (I3) | Docs | (not committed — local spec update only) |
