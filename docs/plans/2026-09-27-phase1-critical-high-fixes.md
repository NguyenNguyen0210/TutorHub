# Phase 1: CRITICAL + HIGH Fixes — Implementation Plan

> **For agentic workers:** Use subagent-driven-development to implement. Each task = 1 commit. Backend: Clean Architecture + MediatR. Frontend: React JSX + Zustand + Tailwind.

**Convention reminders:**
- `dotnet build src/backend/TutorHub.sln --nologo -v q` 0 warnings, 0 errors.
- `dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` all pass.
- Frontend: `npx eslint . --quiet` 0 errors, `npm run build` success.
- TUYỆT ĐỐI không add/commit file spec/plan/docs.
- Stop API before build: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5129 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue`

---

## File Map

| Task | Files to modify |
|------|----------------|
| T1 (RC1) | `AttendanceVerificationJob.cs` |
| T2 (RH1) | `CancelEnrollmentCommandHandler.cs`, `AdminCancelEnrollmentCommandHandler.cs` |
| T3 (RH2) | `EnrollmentActivationService.cs` |
| T4 (RH3) | `PayBookingFromWalletCommandHandler.cs` |
| T5 (RH4) | `CompleteExternalLoginCommandHandler.cs` |
| T6 (RH5) | `routes/index.jsx` |
| T7 (RH6) | `ScheduleSessionsBatchHandler.cs` |

No file conflicts between tasks — all 7 can run in parallel.

---

## Task 1 (RC1): Detach dirty entities after orphan recovery rollback

**Problem:** `AttendanceVerificationJob.cs` uses a single `dbContext` (line 57-58) across 3 phases. In the orphan recovery loop (lines 75-168), if `session.Complete()` at line 108 executes but the DB transaction rolls back at line 165, the in-memory entities remain mutated (`EntityState.Modified`). Later `SaveChangesAsync` at lines 201 and 222 flush these dirty entities — persisting a Completed session without payout.

**File:** `src/backend/TutorHub.Infrastructure/BackgroundServices/AttendanceVerificationJob.cs`

- [ ] **Step 1: Add entity state reset in the catch block**

After line 165 (`await tx.RollbackAsync(cancellationToken);`), add lines to reset the dirty entity states. The catch block (lines 163-167) currently looks like:

```csharp
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Failed to recover orphaned session {SessionId}", session.Id);
            }
```

Change to:

```csharp
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);

                // Reset in-memory mutations so later SaveChangesAsync does not flush
                // rolled-back state (session.Complete() + wallet changes).
                foreach (var entry in dbContext.ChangeTracker.Entries()
                    .Where(e => e.State == EntityState.Modified || e.State == EntityState.Added))
                {
                    if (entry.State == EntityState.Added)
                        entry.State = EntityState.Detached;
                    else
                        await entry.ReloadAsync(cancellationToken);
                }

                _logger.LogError(ex, "Failed to recover orphaned session {SessionId}", session.Id);
            }
```

**Why `ReloadAsync` instead of `Unchanged`?** Setting `EntityState.Unchanged` would snapshot the dirty property values as "original". `ReloadAsync` actually re-reads from the database, restoring the pre-mutation values. For `Added` entities (like the new `Transaction` and `TutorWalletTransaction`), we detach them since they don't exist in the DB.

**Important:** You need to add `using Microsoft.EntityFrameworkCore;` at the top of the file if `ChangeTracker` is not already accessible (it should be, since `dbContext` is `IAppDbContext` which extends `DbContext`). Check the `IAppDbContext` interface — if `ChangeTracker` is not exposed, you need to cast: `((DbContext)dbContext).ChangeTracker`. Read the interface definition first.

Actually, checking: `dbContext.Database` is already used (line 94), which is a `DatabaseFacade` from `DbContext`. But `ChangeTracker` may not be on the interface. If not, use a simpler approach:

**Alternative (simpler, preferred):** Instead of ChangeTracker manipulation, reload only the specific entities that were mutated:

```csharp
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);

                // Reload mutated entities so later SaveChangesAsync does not flush
                // rolled-back state. Complete() mutated session + enrollment.
                dbContext.Entry(session).State = EntityState.Unchanged;
                dbContext.Entry(session.Enrollment).State = EntityState.Unchanged;

                _logger.LogError(ex, "Failed to recover orphaned session {SessionId}", session.Id);
            }
```

Check if `dbContext.Entry(...)` is available on `IAppDbContext`. If not, check how other code accesses `Entry`. If `IAppDbContext` doesn't expose `Entry`, add `ChangeTracker` and `Entry` to the interface, OR use a different approach: create separate DI scope for each phase.

**If interface doesn't support Entry/ChangeTracker:** The cleanest fix is to create a NEW scope for phases 1 and 2, so they get a fresh `DbContext` that doesn't share tracked entities with the orphan recovery phase. Change lines 170-222 to:

```csharp
        // Phases 1 & 2 use a separate scope so orphan recovery's tracked entities
        // (potentially rolled-back) cannot leak into these saves.
        using var phase2Scope = _scopeFactory.CreateScope();
        var phase2Context = phase2Scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        // 1. Open verification window for ended sessions (DEC-S7-021, INV-EVENT-014)
        var endedSessions = await phase2Context.Sessions
        // ... rest uses phase2Context instead of dbContext
```

Read the file and the `IAppDbContext` interface to decide which approach works. Use the simplest one that compiles.

- [ ] **Step 2: Build check**

`dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 3: Run tests**

`dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` → all pass.

- [ ] **Step 4: Commit**

```
git add src/backend/TutorHub.Infrastructure/BackgroundServices/AttendanceVerificationJob.cs
git commit -m "fix(jobs): prevent rolled-back orphan recovery from leaking into later SaveChangesAsync"
```

---

## Task 2 (RH1): Block enrollment cancellation when active disputes exist

**Problem:** Neither `CancelEnrollmentCommandHandler` nor `AdminCancelEnrollmentCommandHandler` checks for active disputes. `Enrollment.Cancel()` calls `session.CancelFromEnrollment()` on all non-completed sessions, but cancelled sessions make disputes unresolvable (`FastTrackResolveDispute` checks `Status == Scheduled`), stranding escrow.

**Files:**
- `src/backend/TutorHub.Application/Features/Enrollments/CancelEnrollment/CancelEnrollmentCommandHandler.cs`
- `src/backend/TutorHub.Application/Features/Enrollments/AdminCancelEnrollment/AdminCancelEnrollmentCommandHandler.cs`

- [ ] **Step 1: Add dispute check to CancelEnrollmentCommandHandler**

After the status validation (line 61) and before `enrollment.Cancel()` (line 65), add:

```csharp
        // 2b. Block cancellation when sessions have active disputes (RH1-DISPUTE-GUARD)
        var sessionIds = enrollment.Sessions
            .Where(s => s.Status != SessionStatus.Completed)
            .Select(s => s.Id)
            .ToList();

        if (sessionIds.Count > 0)
        {
            var hasActiveDispute = await _context.Disputes
                .AsNoTracking()
                .AnyAsync(d => sessionIds.Contains(d.SessionId)
                    && d.Status != DisputeStatus.Resolved
                    && d.Status != DisputeStatus.Dismissed, cancellationToken);

            if (hasActiveDispute)
            {
                throw new ConflictException("Cannot cancel enrollment while sessions have active disputes. Please resolve all disputes first.");
            }
        }
```

You will need to add `using TutorHub.Domain.Enums;` if `DisputeStatus` is not already imported. Check the existing usings — `SessionStatus` is already used so `TutorHub.Domain.Enums` should be present.

Also need access to `_context.Disputes`. Check if `IAppDbContext` has a `Disputes` DbSet. If not, check how `AttendanceVerificationJob.cs` line 77 accesses it — it uses `dbContext.Disputes`. If the interface has it, proceed.

- [ ] **Step 2: Add same check to AdminCancelEnrollmentCommandHandler**

After line 67 (`throw ConflictException("Enrollment is already cancelled.")`) and before line 71 (`enrollment.Cancel(...)`), add the identical dispute check block.

- [ ] **Step 3: Build check**

`dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 4: Run tests**

`dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` → all pass.

If any existing test tries to cancel an enrollment that has an active dispute mock, update it accordingly.

- [ ] **Step 5: Commit**

```
git add src/backend/TutorHub.Application/Features/Enrollments/CancelEnrollment/CancelEnrollmentCommandHandler.cs src/backend/TutorHub.Application/Features/Enrollments/AdminCancelEnrollment/AdminCancelEnrollmentCommandHandler.cs
git commit -m "fix(enrollments): block cancellation when sessions have active disputes"
```

---

## Task 3 (RH2): Add FOR UPDATE lock on wallet in EnrollmentActivationService

**Problem:** `EnrollmentActivationService.ActivateAsync()` at line 100-101 queries the wallet without `FOR UPDATE`. Two concurrent payment confirmations for different bookings of the same tutor can race on `PendingBalance` (lost update).

**File:** `src/backend/TutorHub.Application/Features/Enrollments/Common/EnrollmentActivationService.cs`

- [ ] **Step 1: Replace plain query with FOR UPDATE**

Change lines 100-101 from:

```csharp
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.TutorProfileId == booking.TutorProfileId, cancellationToken);
```

to:

```csharp
        var wallet = await _context.Wallets
            .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {booking.TutorProfileId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
```

This matches the exact pattern used in `CancelEnrollmentCommandHandler.cs:75-77`, `AttendanceVerificationJob.cs:97-99`, and `PayBookingFromWalletCommandHandler.cs:79-80`.

**Important:** `FromSqlInterpolated` requires `using Microsoft.EntityFrameworkCore;` — check if already imported, add if not.

**Note:** The callers of `ActivateAsync` (`HandlePaymentWebhookCommandHandler` and `PayBookingFromWalletCommandHandler`) already use a DB transaction. The `FOR UPDATE` will serialize access within those transactions. Verify this is the case by checking that both callers wrap in `BeginTransactionAsync`.

- [ ] **Step 2: Build check**

`dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 3: Run tests**

`dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` → all pass.

Unit tests mock `_context.Wallets` and may not support `FromSqlInterpolated`. If tests fail, check how other handlers' tests mock the `FromSqlInterpolated` pattern (e.g., `FastTrackResolveDisputeCommandHandlerTests.cs` — it uses `IFastTrackDisputeLocker` seam). If needed, apply the same seam pattern: create an `IWalletLocker` interface. But first try — `FromSqlInterpolated` on a mock `DbSet` may just return the mock data without the SQL.

- [ ] **Step 4: Commit**

```
git add src/backend/TutorHub.Application/Features/Enrollments/Common/EnrollmentActivationService.cs
git commit -m "fix(enrollments): lock tutor wallet row during enrollment activation to prevent lost updates"
```

---

## Task 4 (RH3): Add duplicate enrollment guard to PayBookingFromWalletCommandHandler

**Problem:** `HandlePaymentWebhookCommandHandler` catches `DbUpdateException` with `IsDuplicateEnrollmentViolation` (lines 128-133) to handle concurrent activations gracefully. `PayBookingFromWalletCommandHandler` does NOT — a concurrent VNPay webhook + wallet payment for the same booking results in an unhandled 500 error after the student's wallet was already debited.

**File:** `src/backend/TutorHub.Application/Features/Payments/PayFromWallet/PayBookingFromWalletCommandHandler.cs`

- [ ] **Step 1: Wrap SaveChangesAsync with duplicate guard**

Change lines 156-157 from:

```csharp
            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
```

to:

```csharp
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (IsDuplicateEnrollmentViolation(ex))
            {
                await tx.RollbackAsync(cancellationToken);
                _logger.LogInformation("Wallet payment: concurrent activation for Booking #{BookingId}; treated as already paid.", booking.Id);
                throw new ConflictException("This booking has already been paid and activated. No duplicate charge was applied.");
            }

            await tx.CommitAsync(cancellationToken);
```

- [ ] **Step 2: Add the IsDuplicateEnrollmentViolation helper method**

Copy the method from `HandlePaymentWebhookCommandHandler.cs` (lines 235-253) and add it as a private static method at the bottom of `PayBookingFromWalletCommandHandler`:

```csharp
    private static bool IsDuplicateEnrollmentViolation(DbUpdateException ex)
    {
        var inner = ex.InnerException;
        if (inner == null)
        {
            return false;
        }

        var msg = inner.Message;
        var constraint = inner.GetType().GetProperty("ConstraintName")?.GetValue(inner) as string;
        var sqlState = inner.GetType().GetProperty("SqlState")?.GetValue(inner) as string;

        var isUnique = sqlState == "23505" || msg.Contains("23505", StringComparison.OrdinalIgnoreCase);
        var isEnrollmentIndex = string.Equals(constraint, "IX_Enrollments_BookingId", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("IX_Enrollments_BookingId", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("Enrollments_BookingId", StringComparison.OrdinalIgnoreCase);

        return isUnique && isEnrollmentIndex;
    }
```

**Important:** Since the student's wallet was already debited at line 92 (`wallet.Debit(booking.TotalPrice, now)`) within the same transaction, the `tx.RollbackAsync` will undo the wallet debit too. So the student is NOT charged. The `ConflictException` tells the frontend to show a user-friendly message.

Ensure `DbUpdateException` is importable — add `using Microsoft.EntityFrameworkCore;` if not already present.

- [ ] **Step 3: Build check**

`dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 4: Run tests**

`dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` → all pass.

- [ ] **Step 5: Commit**

```
git add src/backend/TutorHub.Application/Features/Payments/PayFromWallet/PayBookingFromWalletCommandHandler.cs
git commit -m "fix(payments): handle duplicate enrollment on concurrent wallet payment gracefully"
```

---

## Task 5 (RH4): Move status check before ExternalLogin.Add in OAuth handler

**Problem:** `CompleteExternalLoginCommandHandler.cs` line 144 adds `ExternalLoginEntity` to the ChangeTracker before status checks at lines 147-155. A Banned/Suspended user triggers `UnauthorizedException` but the link entity is tracked. On next login attempt, the `externalLogin is not null` branch (line 110) fires — creating a permanent login path for banned accounts.

**File:** `src/backend/TutorHub.Application/Features/Auth/ExternalLogin/CompleteExternalLoginCommandHandler.cs`

- [ ] **Step 1: Move status/lockout checks before ExternalLogin creation**

The current structure (lines 116-165) is:
1. Find existing user / create new user (116-132)
2. Create loginEntry + Add to context (134-144)
3. Status checks (147-160)
4. Reset failed login (162-165)

Reorder to:
1. Find existing user / create new user (116-132) — unchanged
2. **Status checks on `user`** — moved up
3. **Reset failed login** — moved up
4. Create loginEntry + Add to context — moved down

Change lines 116-167 from:

```csharp
        else
        {
            var existing = await _context.Users
                .Include(u => u.TutorProfile)
                .Include(u => u.StudentProfile)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

            if (existing is not null)
            {
                user = existing;
            }
            else
            {
                user = CreateStudent(identity, normalizedEmail, now);
            }

            loginEntry = new ExternalLoginEntity
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Provider = identity.Provider,
                ProviderUserId = identity.ProviderUserId,
                EmailAtLinkTime = normalizedEmail,
                CreatedAt = now,
                LastLoginAt = now
            };
            _context.ExternalLogins.Add(loginEntry);
        }

        if (user.Status == AccountStatus.Suspended)
        {
            throw new UnauthorizedException("Your account has been suspended. Please contact support.");
        }

        if (user.Status == AccountStatus.Banned)
        {
            throw new UnauthorizedException("Your account has been banned.");
        }

        if (user.IsLockedOut(now))
        {
            throw new UnauthorizedException("This account is temporarily locked. Please try again later.");
        }

        if (user.AccessFailedCount > 0 || user.LockoutEndAt.HasValue)
        {
            user.ResetFailedLogin();
        }

        loginEntry.LastLoginAt = now;
```

To:

```csharp
        else
        {
            var existing = await _context.Users
                .Include(u => u.TutorProfile)
                .Include(u => u.StudentProfile)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

            if (existing is not null)
            {
                user = existing;
            }
            else
            {
                user = CreateStudent(identity, normalizedEmail, now);
            }
        }

        // Validate account status BEFORE creating any ExternalLogin link.
        // This prevents banned/suspended users from getting a permanent OAuth
        // login path that bypasses the email-matching branch on next attempt.
        if (user.Status == AccountStatus.Suspended)
        {
            throw new UnauthorizedException("Your account has been suspended. Please contact support.");
        }

        if (user.Status == AccountStatus.Banned)
        {
            throw new UnauthorizedException("Your account has been banned.");
        }

        if (user.IsLockedOut(now))
        {
            throw new UnauthorizedException("This account is temporarily locked. Please try again later.");
        }

        if (user.AccessFailedCount > 0 || user.LockoutEndAt.HasValue)
        {
            user.ResetFailedLogin();
        }

        // Only create the ExternalLogin link after status validation passes.
        if (externalLogin is null)
        {
            loginEntry = new ExternalLoginEntity
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Provider = identity.Provider,
                ProviderUserId = identity.ProviderUserId,
                EmailAtLinkTime = normalizedEmail,
                CreatedAt = now,
                LastLoginAt = now
            };
            _context.ExternalLogins.Add(loginEntry);
        }

        loginEntry.LastLoginAt = now;
```

**IMPORTANT:** The `loginEntry` variable is declared at line 108 (`ExternalLoginEntity loginEntry;`). In the `externalLogin is not null` branch (line 110-114), `loginEntry = externalLogin;`. In the `else` branch, `loginEntry` was assigned at the creation point. After reordering, `loginEntry` is not assigned in the `else` branch until after the status checks. This means the compiler will complain about "use of unassigned variable" at `loginEntry.LastLoginAt = now;` if the early-return throws happen before `loginEntry` is assigned.

Fix: Initialize `loginEntry` to `externalLogin` at the top, then conditionally create a new one in the `else` branch:

At line 108, change:
```csharp
        ExternalLoginEntity loginEntry;
```
to:
```csharp
        ExternalLoginEntity? loginEntry = externalLogin;
```

Then the `if (externalLogin is not null)` branch no longer needs to set `loginEntry = externalLogin;` (it's already set). Update accordingly. Or keep the existing structure and just ensure `loginEntry` is always assigned before the status checks — the simplest approach is to move the status checks into a separate local method or just restructure as shown above.

- [ ] **Step 2: Build check**

`dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 3: Run tests**

`dotnet test src/test/TutorHub.Application.UnitTests --filter "FullyQualifiedName~CompleteExternalLogin" --nologo -v q` → all pass.

- [ ] **Step 4: Commit**

```
git add src/backend/TutorHub.Application/Features/Auth/ExternalLogin/CompleteExternalLoginCommandHandler.cs
git commit -m "fix(auth): validate account status before creating OAuth login link"
```

---

## Task 6 (RH5): Fix infinite redirect on /student/wallet deep link

**Problem:** `routes/index.jsx` line 202 has `<Navigate to="/student/wallet" replace />` inside a route that matches `/student/wallet` — infinite redirect loop.

**File:** `src/frontend/src/routes/index.jsx`

- [ ] **Step 1: Fix the redirect target**

The `/student/wallet` route at line 150 (inside the Student layout) already handles authenticated Student users. This deep-link redirect at line 202 is for users arriving from external URLs (e.g., notifications). For a Student, line 150 handles it. For a non-Student role, they should go to their own wallet or a generic page.

The simplest fix: remove line 202 entirely (the nested route at line 150 already handles `/student/wallet` for Students; non-Students will get a role mismatch from `RequireRole` which should redirect them).

However, check how `RequireRole` handles mismatches — does it redirect to a generic page, or show an error? If it shows an error, the deep-link redirect may have been intended to help. But an infinite loop is worse than a role error.

**Safest option:** Just delete line 202.

Change:
```jsx
      {/* Deep Link Redirections (from notifications & external URLs) */}
      <Route path="/student/wallet" element={<RequireAuth><Navigate to="/student/wallet" replace /></RequireAuth>} />
      <Route path="/admin/student-topups" element={<RequireAuth><Navigate to="/admin/student-wallets" replace /></RequireAuth>} />
```

To:
```jsx
      {/* Deep Link Redirections (from notifications & external URLs) */}
      <Route path="/admin/student-topups" element={<RequireAuth><Navigate to="/admin/student-wallets" replace /></RequireAuth>} />
```

- [ ] **Step 2: Lint + Build check**

```
cmd /c "cd src/frontend && npx eslint src/routes/index.jsx --quiet"
cmd /c "cd src/frontend && npm run build"
```

- [ ] **Step 3: Commit**

```
git add src/frontend/src/routes/index.jsx
git commit -m "fix(frontend): remove infinite redirect loop on /student/wallet deep link"
```

---

## Task 7 (RH6): Add DB transaction to batch scheduling handler

**Problem:** `ScheduleSessionsBatchHandler` does overlap check + save without a DB transaction, unlike `ScheduleSessionCommandHandler` which wraps in `BeginTransactionAsync`. Concurrent batch + single scheduling can create overlapping sessions.

**File:** `src/backend/TutorHub.Application/Features/Sessions/ScheduleSessionsBatch/ScheduleSessionsBatchHandler.cs`

- [ ] **Step 1: Wrap overlap check through SaveChangesAsync in a transaction**

The single handler pattern (from `ScheduleSessionCommandHandler.cs:69-121`):
```csharp
await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
try
{
    // overlap check + schedule + save
    await _context.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
}
catch
{
    await transaction.RollbackAsync(cancellationToken);
    throw;
}
```

Apply to `ScheduleSessionsBatchHandler.cs`. Wrap from line 76 (overlap query) through line 134 (SaveChangesAsync):

Change lines 76-134 from:

```csharp
        // Overlap against the tutor's other Scheduled sessions (single query, batch ids excluded).
        var rangeStart = request.Items.Min(i => i.StartAt);
        // ... all the way through ...
        await _context.SaveChangesAsync(cancellationToken);
```

To:

```csharp
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Overlap against the tutor's other Scheduled sessions (single query, batch ids excluded).
            var rangeStart = request.Items.Min(i => i.StartAt);
            var rangeEnd = request.Items.Max(i => i.EndAt);
            var tutorProfileIds = sessions.Select(s => s.Enrollment.TutorProfileId).Distinct().ToList();
            var dbScheduled = await _context.Sessions
                .Where(s => !ids.Contains(s.Id) &&
                            tutorProfileIds.Contains(s.Enrollment.TutorProfileId) &&
                            s.Status == SessionStatus.Scheduled &&
                            s.StartAt.HasValue &&
                            s.StartAt < rangeEnd && rangeStart < s.EndAt)
                .Select(s => new
                {
                    TutorProfileId = s.Enrollment.TutorProfileId,
                    StartAt = s.StartAt,
                    EndAt = s.EndAt
                })
                .ToListAsync(cancellationToken);

            foreach (var item in request.Items)
            {
                var session = byId[item.SessionId];
                policy.RequireNoOverlap(
                    session.Enrollment.TutorProfileId,
                    item.StartAt,
                    item.EndAt,
                    dbScheduled
                        .Where(s => s.TutorProfileId == session.Enrollment.TutorProfileId)
                        .Select(s => (s.TutorProfileId, s.StartAt!.Value, s.EndAt, nameof(SessionStatus.Scheduled))));
            }

            // Intra-batch pairwise overlap (all items are tutor-owned by now).
            for (var i = 0; i < request.Items.Count; i++)
            {
                for (var j = i + 1; j < request.Items.Count; j++)
                {
                    var a = request.Items[i];
                    var b = request.Items[j];
                    if (a.StartAt < b.EndAt && b.StartAt < a.EndAt)
                    {
                        throw new ConflictException("Two sessions in the batch overlap each other.");
                    }
                }
            }

            // Pass 2: apply everything, then persist once — no partial save.
            foreach (var item in request.Items)
            {
                var session = byId[item.SessionId];
                session.Schedule(item.StartAt, item.EndAt);
                _context.AddOutboxMessage(new SessionScheduledEvent(
                    session.Id,
                    session.EnrollmentId,
                    session.Enrollment.StudentProfile.UserId,
                    session.Enrollment.TutorProfile.UserId,
                    item.StartAt,
                    item.EndAt));
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
```

The `return` statement at line 136 stays outside the try/catch (after the transaction commits).

- [ ] **Step 2: Build check**

`dotnet build src/backend/TutorHub.sln --nologo -v q` → 0 warnings, 0 errors.

- [ ] **Step 3: Run tests**

`dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q` → all pass.

- [ ] **Step 4: Commit**

```
git add src/backend/TutorHub.Application/Features/Sessions/ScheduleSessionsBatch/ScheduleSessionsBatchHandler.cs
git commit -m "fix(scheduling): wrap batch scheduling in DB transaction to prevent concurrent overlap"
```

---

## Cổng kiểm chung (chạy sau tất cả task)

```bash
# Backend
dotnet build src/backend/TutorHub.sln --nologo -v q          # 0 warnings, 0 errors
dotnet test src/test/TutorHub.Domain.UnitTests --nologo -v q  # all pass
dotnet test src/test/TutorHub.Application.UnitTests --nologo -v q  # all pass

# Frontend
cd src/frontend
npx eslint . --quiet   # 0 errors
npm run build           # success
```

## Tóm tắt commits

| Task | Commit message |
|------|----------------|
| T1 (RC1) | `fix(jobs): prevent rolled-back orphan recovery from leaking into later SaveChangesAsync` |
| T2 (RH1) | `fix(enrollments): block cancellation when sessions have active disputes` |
| T3 (RH2) | `fix(enrollments): lock tutor wallet row during enrollment activation to prevent lost updates` |
| T4 (RH3) | `fix(payments): handle duplicate enrollment on concurrent wallet payment gracefully` |
| T5 (RH4) | `fix(auth): validate account status before creating OAuth login link` |
| T6 (RH5) | `fix(frontend): remove infinite redirect loop on /student/wallet deep link` |
| T7 (RH6) | `fix(scheduling): wrap batch scheduling in DB transaction to prevent concurrent overlap` |
