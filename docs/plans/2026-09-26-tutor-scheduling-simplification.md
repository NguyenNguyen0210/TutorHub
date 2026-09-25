# Tutor Scheduling Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the tutor availability-slot subsystem and the student-accepted reschedule-ticket flow; tutors schedule/reschedule/cancel sessions directly (single + batch) under a minimum-notice rule; calendar renders `Session[]` only.

**Architecture:** Domain-first deletion: keep `Session`/`Enrollment`/`Booking`/attendance/payout untouched; delete `AvailabilitySlot` + `SessionRescheduleRequest` aggregates with their features, endpoints, and tables; slim `SessionSchedulingValidationPolicy` to tutor-ownership + own-session overlap + minimum-notice; add atomic `ScheduleSessionsBatchCommand`; rebuild the tutor scheduling UI around per-enrollment unscheduled-session lists.

**Tech Stack:** .NET 8 + MediatR + FluentValidation + EF Core (Npgsql) + xUnit; React 18 + Vite + axios (no frontend test runner — verify with `npm run build` + `npx eslint`).

---

## Domain invariants (locked, do not renegotiate mid-plan)

1. `Unscheduled` sessions cannot be attended and never pay out.
2. Only the session's tutor schedules/reschedules/cancels; no student accept step anywhere.
3. Every new/changed `ScheduledStart` must satisfy `ScheduledStart >= now + MinimumNoticeHours` (default 24, `IConfiguration["Scheduling:MinimumNoticeHours"]`).
4. Batch schedule is all-or-nothing: validate every item, then apply.
5. Published-service commercial lock is unrelated and untouched.

## File-structure map

**Delete (backend):**
- `src/backend/TutorHub.Domain/Entities/AvailabilitySlot.cs`
- `src/backend/TutorHub.Domain/Entities/SessionRescheduleRequest.cs`
- `src/backend/TutorHub.Application/Features/Availability/` (entire folder)
- `src/backend/TutorHub.Application/Features/Sessions/Reschedule/` (entire folder: Propose/Accept/Reject/GetRequests + DTOs)
- `src/backend/TutorHub.Application/Features/Sessions/Common/SessionSchedulingValidationPolicy.cs` (replaced, see Task 2)
- `src/backend/TutorHub.Infrastructure/Persistence/Configurations/AvailabilitySlotConfiguration.cs`
- `src/backend/TutorHub.Infrastructure/Persistence/Configurations/SessionRescheduleRequestConfiguration.cs`
- All tests under `src/test/**/Features/{Availability,/*Reschedul*}/`

**Modify (backend):**
- `src/backend/TutorHub.Domain/Enums/SessionStatus.cs` — no change (already `Unscheduled|Scheduled|Completed|Cancelled`)
- `src/backend/TutorHub.Domain/Entities/Session.cs` — keep `Schedule/Reschedule/Cancel*`; add notice guard entry point if missing
- `src/backend/TutorHub.Application/Features/Sessions/ScheduleSession/*` — tutor-only + notice rule, drop availability check
- `src/backend/TutorHub.Application/Features/Sessions/CancelSession/*` — tutor cancel of `Scheduled` requires notice
- `src/backend/TutorHub.Api/Controllers/SessionsController.cs` — remove ticket endpoints, add batch endpoint
- `src/backend/TutorHub.Api/Controllers/TutorsController.cs` — remove 4 availability endpoints
- `src/backend/TutorHub.Infrastructure/Persistence/AppDbContext.cs` — remove 2 DbSets
- `appsettings.json` (+ `appsettings.Development.json` if it overrides) — add `Scheduling:MinimumNoticeHours: 24`
- New migration `DropAvailabilityAndRescheduleTickets` (drop 2 tables)

**Create (backend):**
- `.../Features/Sessions/Scheduling/SessionSchedulePolicy.cs` — ownership + overlap + notice in one place
- `.../Features/Sessions/ScheduleSessionsBatch/*` — `ScheduleSessionsBatchCommand/Handler/Validator/DTOs/ScheduleSessionsBatchRequest.cs`

**Delete (frontend):**
- `src/frontend/src/pages/tutor/TutorAvailability.jsx`
- Availability calendar usage in `src/frontend/src/pages/discovery/TutorProfile.jsx`
- Ticket modal code in `src/frontend/src/pages/student/SessionDetail.jsx`

**Modify (frontend):**
- `src/frontend/src/routes/index.jsx` — `/tutor/availability` → redirect to `/tutor/schedule`; add `/tutor/schedule`
- `src/frontend/src/components/layout/navConfig.js` + `MobileFloatingDock.jsx` — Lịch dạy → `/tutor/schedule`; Lịch rảnh → enrollments needing schedule (see Task 12)
- `src/frontend/src/services/session.service.js` — add `scheduleSessionsBatch`, remove ticket methods
- `src/frontend/src/services/tutor.service.js` — remove availability methods
- `src/frontend/src/pages/student/SessionDetail.jsx` — direct reschedule form (tutor) + notice hint
- `src/frontend/src/pages/student/EnrollmentDetail.jsx` — per-session Schedule buttons

**Create (frontend):**
- `src/frontend/src/pages/tutor/TutorSchedule.jsx` — calendar of my sessions + per-enrollment bulk scheduling

## Phase order (each phase merges independently; B needs A, C/D need B)

- **Phase A (Tasks 1–4):** backend domain + policy + batch command + unit tests. Testable: `dotnet test` UnitTests.
- **Phase B (Tasks 5–7):** controllers, deletions, migration. Testable: API + swagger, old endpoints 404.
- **Phase C (Tasks 8–11):** tutor scheduling UI. Testable: Playwright bulk-schedule flow.
- **Phase D (Tasks 12–13):** frontend cleanup (availability page, discovery, detail). Testable: build + lint + no dead links.
- **Phase E (Task 14):** full E2E + docs.

### Task 1: New `SessionSchedulePolicy` (ownership + overlap + notice)

**Files:**
- Create: `src/backend/TutorHub.Application/Features/Sessions/Scheduling/SessionSchedulePolicy.cs`
- Test: `src/test/TutorHub.Application.UnitTests/Features/Sessions/Scheduling/SessionSchedulePolicyTests.cs`

Policy reads notice hours from `IConfiguration["Scheduling:MinimumNoticeHours"]` (default 24 when missing/invalid) and `IClock` for now. It replaces `SessionSchedulingValidationPolicy` (no availability-membership check anymore).

- [ ] **Step 1: Write the failing test**

```csharp
[Fact]
public void RequireNotice_RejectsStartInsideNoticeWindow()
{
    var policy = new SessionSchedulePolicy(ConfigWithNoticeHours(24), FixedClock(Utc(2026, 9, 26, 10, 0)));
    var ex = Assert.Throws<BadRequestException>(() =>
        policy.RequireSchedulable(Utc(2026, 9, 27, 9, 0), Utc(2026, 9, 27, 10, 0)));
    Assert.Contains("24", ex.Message);
}
```

Helpers `ConfigWithNoticeHours` (in-memory `ConfigurationBuilder().AddInMemoryCollection`) and `FixedClock`/`Utc` live in the test file — write them in this step too.

- [ ] **Step 2: Run it, expect FAIL** — `SessionSchedulePolicy` does not exist.

Run: `cmd /c "dotnet test src\test\TutorHub.Application.UnitTests --filter SessionSchedulePolicyTests --nologo -v q"`
Expected: build error `CS0246: SessionSchedulePolicy could not be found`.

- [ ] **Step 3: Implement the policy skeleton + notice rule**

```csharp
namespace TutorHub.Application.Features.Sessions.Scheduling;

public sealed class SessionSchedulePolicy
{
    private readonly int _noticeHours;
    private readonly IClock _clock;
    public SessionSchedulePolicy(IConfiguration configuration, IClock clock)
    {
        _noticeHours = configuration.GetValue<int?>("Scheduling:MinimumNoticeHours") is int h && h >= 0 ? h : 24;
        _clock = clock;
    }
    public void RequireSchedulable(DateTime startAt, DateTime endAt)
    {
        if (endAt <= startAt) throw new BadRequestException("End time must be after start time.");
        if (startAt < _clock.UtcNow.AddHours(_noticeHours))
            throw new BadRequestException($"Sessions must be scheduled at least {_noticeHours} hours in advance.");
    }
    public void RequireNoOverlap(Guid tutorProfileId, DateTime startAt, DateTime endAt,
        IEnumerable<(Guid TutorProfileId, DateTime StartAt, DateTime? EndAt, string Status)> existing)
    {
        var clash = existing.Any(s => s.TutorProfileId == tutorProfileId
            && s.Status == nameof(SessionStatus.Scheduled)
            && startAt < (s.EndAt ?? DateTime.MaxValue) && (s.EndAt ?? startAt.AddMinutes(1)) > startAt
            && s.StartAt < endAt);
        if (clash) throw new ConflictException("The new time overlaps another scheduled session.");
    }
}
```

`BadRequestException`/`ConflictException` live in `TutorHub.Application.Common.Exceptions` (verify names via grep before writing; adjust). `IClock` is `TutorHub.Application.Common.Interfaces.IClock` with `UtcNow`.

- [ ] **Step 4: Run tests, expect PASS** (same command; `Passed: 1+`).
- [ ] **Step 5: Commit** `git add <both files> && git commit -m "feat(scheduling): SessionSchedulePolicy with minimum-notice rule"`

### Task 2: `ScheduleSession` becomes tutor-only + policy-based

**Files:**
- Modify: `.../Features/Sessions/ScheduleSession/ScheduleSessionCommandHandler.cs`
- Modify: `.../Features/Sessions/ScheduleSession/ScheduleSessionCommandValidator.cs`
- Delete: `.../Features/Sessions/Common/SessionSchedulingValidationPolicy.cs` (after handler no longer references it)
- Test: extend `src/test/.../Features/Sessions/ScheduleSession/ScheduleSessionCommandHandlerTests.cs`

Handler changes: (1) resolve tutor profile from `_currentUserService` and require `session.Enrollment.TutorProfile.UserId == currentUserId`, else `ForbiddenException` (student scheduling is gone); (2) call `policy.RequireSchedulable(StartAt, EndAt)`; (3) load tutor's other `Scheduled` sessions in range and call `RequireNoOverlap`; (4) if session is `Unscheduled` call domain `Schedule()`, if `Scheduled` call domain `Reschedule()` (direct tutor reschedule — no ticket); (5) keep return mapping. Remove any `AvailabilitySlot` query/`AvailabilityMutationPolicy` usage. Tests cover both branches.

- [ ] **Step 1: Write failing test** — student (enrollment.StudentProfile.UserId) scheduling an `Unscheduled` session throws `ForbiddenException`; tutor scheduling 2h ahead with 24h notice throws `BadRequestException`. Follow the existing test file's fixture style (in-memory DbContext + fixed clock).
- [ ] **Step 2: Run, expect FAIL** (student currently allowed).
- [ ] **Step 3: Implement** per above; delete `SessionSchedulingValidationPolicy.cs` only when zero references remain (`grep -r SessionSchedulingValidationPolicy src/` must print nothing).
- [ ] **Step 4: Run** `dotnet test ... --filter ScheduleSession` → all PASS.
- [ ] **Step 5: Commit** "feat(scheduling): tutor-only ScheduleSession with notice rule".

### Task 3: `ScheduleSessionsBatchCommand` (atomic bulk schedule)

**Files:**
- Create: `.../Features/Sessions/ScheduleSessionsBatch/ScheduleSessionsBatchCommand.cs`
- Create: `.../Features/Sessions/ScheduleSessionsBatch/ScheduleSessionsBatchHandler.cs`
- Create: `.../Features/Sessions/ScheduleSessionsBatch/ScheduleSessionsBatchValidator.cs`
- Create: `.../Features/Sessions/ScheduleSessionsBatch/DTOs/ScheduleSessionsBatchRequest.cs`
- Test: `src/test/.../Features/Sessions/ScheduleSessionsBatch/ScheduleSessionsBatchHandlerTests.cs`

```csharp
public record SessionScheduleItem(Guid SessionId, DateTime StartAt, DateTime EndAt);
public record ScheduleSessionsBatchCommand(List<SessionScheduleItem> Items) : IRequest<List<SessionDto>>;
```

Validator: `Items` not empty, max 50, distinct `SessionId`s. Handler two-pass: pass 1 loads all sessions with enrollments, asserts every session is `Unscheduled`, belongs to current tutor, enrollment `Active`, notice + overlap valid **including intra-batch overlaps** (pairwise check of new times); pass 2 applies `session.Schedule(...)` to all and single `SaveChangesAsync`. Any failure → nothing persisted (no partial save before pass 2 completes).

- [ ] **Step 1: Failing test** — batch of 2 valid items schedules both; batch where item 2 violates notice leaves item 1 `Unscheduled` (reload from DbContext and assert).
- [ ] **Step 2: Run, expect FAIL** (types missing).
- [ ] **Step 3: Implement** command + validator + handler per above. Reuse `ServiceDtoMapper`? No — sessions use `Bookings/SessionMapper.cs` (`SessionDto`); follow how `ScheduleSessionCommandHandler` builds its return.
- [ ] **Step 4: Run** `--filter ScheduleSessionsBatch` → PASS.
- [ ] **Step 5: Commit** "feat(scheduling): atomic batch session scheduling".

### Task 4: `CancelSession` notice rule for tutor-cancelled `Scheduled` sessions

**Files:**
- Modify: `.../Features/Sessions/CancelSession/CancelSessionCommandHandler.cs` (+ validator test)
- Test: extend `CancelSession` handler tests.

Rule: cancelling an `Unscheduled` session needs no notice; cancelling a `Scheduled` session requires `ScheduledStart >= now + notice` via `SessionSchedulePolicy.RequireSchedulable(session.StartAt, session.EndAt ?? StartAt)` — reuse, do not duplicate the math. Keep existing enrollment-active and auto-complete behavior untouched.

- [ ] **Step 1: Failing test** — tutor cancels a `Scheduled` session starting in 2h (24h notice) → `BadRequestException`; cancelling `Unscheduled` → succeeds.
- [ ] **Step 2–5:** standard red/green/commit ("feat(scheduling): notice rule for session cancel").

### Task 5: `SessionsController` — batch endpoint in, ticket endpoints out

**Files:**
- Modify: `src/backend/TutorHub.Api/Controllers/SessionsController.cs`

- [ ] **Step 1: Delete ticket endpoints** — remove `POST /{id}/reschedule-requests`, `POST /{reqId}/accept`, `POST /{reqId}/reject`, `GET /{id}/reschedule-requests` actions. Verify: `grep -rn "eschedule" src/backend/TutorHub.Api/Controllers/SessionsController.cs` prints nothing.
- [ ] **Step 2: Add batch endpoint** after the single-schedule action:

```csharp
/// <summary>Tutor bulk-schedules unscheduled sessions atomically.</summary>
[Authorize(Roles = "Tutor")]
[HttpPost("schedule-batch")]
[ProducesResponseType(typeof(ApiResponse<List<SessionDto>>), StatusCodes.Status200OK)]
public async Task<IActionResult> ScheduleBatch(
    [FromBody] ScheduleSessionsBatchRequest request, CancellationToken cancellationToken)
{
    var command = new ScheduleSessionsBatchCommand(request.Items
        .Select(i => new SessionScheduleItem(i.SessionId, i.StartAt, i.EndAt)).ToList());
    var result = await _sender.Send(command, cancellationToken);
    return Ok(ApiResponse<List<SessionDto>>.SuccessResult(result, "Sessions scheduled successfully."));
}
```

`ScheduleSessionsBatchRequest{List<SessionScheduleItemDto> Items}` with `SessionId/StartAt/EndAt` — mirror property names used by `ScheduleSessionRequest`. Check `ApiResponse<T>.SuccessResult` and `SessionDto` namespace imports match neighboring actions.

- [ ] **Step 3: Build** `cmd /c "dotnet build src\backend\TutorHub.Api\TutorHub.Api.csproj --nologo -v q"` → `Build succeeded, 0 warnings, 0 errors`.
- [ ] **Step 4: Commit** "feat(api): batch schedule endpoint, remove reschedule tickets".

### Task 6: Delete availability + ticket subsystems

**Files:** all paths listed under "Delete (backend)" in the file map, plus `AppDbContext.cs` (remove `AvailabilitySlots` + `SessionRescheduleRequests` DbSets).

Order matters (references first):
- [ ] **Step 1:** Delete `Features/Availability/` and `Features/Sessions/Reschedule/` folders. Remove the 4 availability actions from `TutorsController.cs` (`tutors/{id}/availability`, `me/availability-slots` GET/POST/DELETE, `me/availability-schedule` PUT).
- [ ] **Step 2:** Delete `AvailabilitySlot.cs`, `SessionRescheduleRequest.cs`, both `Configurations/*` files. Remove DbSets from `AppDbContext.cs`. Grep gates (each must print nothing): `AvailabilitySlot`, `SessionRescheduleRequest`, `availability-schedule`, `availability-slots`, `reschedule-requests`.
- [ ] **Step 3:** Delete tests under `src/test/**/Features/{Availability,ScheduleSessionReschedule*,*Reschedule*/}` — list them with `dir /s` first, delete only scheduling-ticket + availability tests (keep `SessionTests`, attendance tests).
- [ ] **Step 4: Build** solution-wide → 0 errors. Fix stragglers (usually an unused `using`).
- [ ] **Step 5: Commit** "chore(scheduling): delete availability slots and reschedule tickets".

### Task 7: Migration dropping both tables

- [ ] **Step 1:** Generate: `cmd /c "dotnet ef migrations add DropAvailabilityAndRescheduleTickets --project src\backend\TutorHub.Infrastructure --startup-project src\backend\TutorHub.Api"` — inspect the generated `Up()`; it must contain `DropTable("AvailabilitySlots")` and `DropTable("SessionRescheduleRequests")` and nothing else destructive. If it contains anything else, stop and reconcile the model snapshot before proceeding.
- [ ] **Step 2:** Apply locally against dev DB and verify: new columns/tables gone, app starts with `Database__MigrateOnStartup=true`.
- [ ] **Step 3: Run unit suites** `dotnet test src\test\TutorHub.Domain.UnitTests` (237+) and `TutorHub.Application.UnitTests` (400+) → 0 failed.
- [ ] **Step 4: Commit** (migration + snapshot) "chore(db): drop availability and reschedule ticket tables".

### Task 8: `session.service.js` — batch method in, ticket methods out

**Files:**
- Modify: `src/frontend/src/services/session.service.js`

- [ ] **Step 1:** Add (next to `scheduleSession`, same axios-envelope style — verify how `scheduleSession` unwraps `api.post` first):

```js
async scheduleSessionsBatch(items) {
  const res = await api.post('/sessions/schedule-batch', { items });
  return Array.isArray(res) ? res : [];
},
```

- [ ] **Step 2:** Delete `proposeReschedule/acceptReschedule/rejectReschedule/getRescheduleRequests`. Grep gate: `grep -rn "eschedule" src/frontend/src/services/session.service.js` prints nothing (case-insensitive match for `scheduleSession/scheduleSessionsBatch` allowed — check each hit).
- [ ] **Step 3: Lint** `npx eslint src/frontend/src/services/session.service.js` → 0 errors.
- [ ] **Step 4: Commit** "feat(frontend): batch schedule API, remove ticket calls".

### Task 9: New `TutorSchedule.jsx` page (calendar + bulk scheduling)

**Files:**
- Create: `src/frontend/src/pages/tutor/TutorSchedule.jsx`
- Modify: `src/frontend/src/routes/index.jsx` (add `/tutor/schedule`; `/tutor/availability` → `<Navigate to="/tutor/schedule" replace />`)

Page structure (follow `TutorServices.jsx` patterns: `useToast`, `CardSkeleton`, `ErrorState`, `EmptyState`):
1. Header "Lịch dạy" + sub "Lịch các buổi học của bạn".
2. Upcoming list from `session.service.getMySessions({ fromDate: today })` sorted by `StartAt`, each row: date/time, service title, `Session #n`, status badge (reuse `SESSION_STATUS_META` from `config/enums.js`), link to `/tutor/sessions/:id`.
3. "Cần xếp lịch" section: enrollments from `enrollment.service.getMyEnrollments()` filtered client-side to those with `Unscheduled` sessions (via `getEnrollmentById` per enrollment — cap at 20, cache in state). Each enrollment card lists its unscheduled sessions with `datetime-local` inputs + per-row [Xếp lịch] (calls existing `scheduleSession`) and one [Xếp tất cả] calling `scheduleSessionsBatch` with all filled rows; toast success/error; reload data after.
4. Unfilled rows are skippable (the `Unscheduled` invariant: tutor may schedule gradually). Clamp `datetime-local` min to now + 24h in the input (`min` attribute) as UX hint; server enforces.

- [ ] **Step 1: Skeleton** — file with imports, section comments, route wiring; build passes.
- [ ] **Step 2: Upcoming list** — implement section 2; verify in browser (login as `tutor.an@tutorhub.com` / `Test@123`) that real sessions render.
- [ ] **Step 3: Bulk section** — implement section 3; Playwright-verify: fill 2 rows → [Xếp tất cả] → both become `Scheduled` (reload shows them in upcoming).
- [ ] **Step 4: Lint + build** (`npx eslint` on the file, `npm run build`) → clean.
- [ ] **Step 5: Commit** "feat(frontend): tutor schedule calendar + bulk scheduling".

### Task 10: `SessionDetail.jsx` — direct reschedule replaces ticket modal

**Files:**
- Modify: `src/frontend/src/pages/student/SessionDetail.jsx` (shared student+tutor hub)

- [ ] **Step 1:** Delete propose/accept/reject modal + calls. Grep gate: no `proposeReschedule|acceptReschedule|rejectReschedule` remains in the file.
- [ ] **Step 2:** Tutor-only "Đổi lịch" form (visible when `session.status === 'Scheduled'` and current user is the tutor — follow the file's existing role detection): two `datetime-local` inputs + submit → existing `scheduleSession(id, startAt, endAt)` (backend Task 2 routes `Scheduled` sessions through domain `Reschedule()`). Form shows hint "Lịch mới phải trước giờ học ít nhất 24 giờ".
- [ ] **Step 3:** Student view: schedule shown read-only (no action buttons where ticket buttons were).
- [ ] **Step 4:** Playwright-verify as tutor: reschedule a future session → new time shows; as student: no reschedule UI.
- [ ] **Step 5: Lint + commit** "feat(frontend): direct tutor reschedule".

### Task 11: `EnrollmentDetail.jsx` — per-session Schedule buttons

**Files:**
- Modify: `src/frontend/src/pages/student/EnrollmentDetail.jsx`

In the `sessions[]` timeline, for each `Unscheduled` session show tutor-only [Xếp lịch] opening a small inline `datetime-local` + confirm (calls `scheduleSession`, then reloads `getEnrollmentById`). Students see "Chờ gia sư xếp lịch" muted text instead. Reuse the notice hint copy from Task 10.

- [ ] Steps: implement → Playwright-verify (tutor schedules one session from timeline) → lint → commit "feat(frontend): schedule actions in enrollment timeline".

### Task 12: Nav + availability page removal

**Files:**
- Delete: `src/frontend/src/pages/tutor/TutorAvailability.jsx`
- Modify: `src/frontend/src/components/layout/navConfig.js`, `src/frontend/src/components/layout/MobileFloatingDock.jsx`, `src/frontend/src/services/tutor.service.js`

- [ ] **Step 1:** Delete `TutorAvailability.jsx`. In `navConfig.js`: Lịch dạy → `/tutor/schedule`; Lịch rảnh → `/tutor/schedule?filter=unscheduled` (TutorSchedule reads the query param and scrolls to/highlights the "Cần xếp lịch" section — implement that one-line behavior in Task 9; if skipped there, Lịch rảnh points to plain `/tutor/schedule`). Mirror both in `MobileFloatingDock.jsx`.
- [ ] **Step 2:** Delete availability methods from `tutor.service.js` (`getTutorAvailability`, `getMyAvailabilitySlots`, slot create/delete if present). Grep gate: `availability` (case-insensitive) prints nothing in the file.
- [ ] **Step 3: Build + lint** → clean. **Commit** "chore(frontend): remove availability UI".

### Task 13: Discovery + dashboard cleanup

**Files:**
- Modify: `src/frontend/src/pages/discovery/TutorProfile.jsx`, `src/frontend/src/pages/tutor/TutorDashboard.jsx`, `src/frontend/src/pages/student/StudentDashboard.jsx` (only if they reference availability)

- [ ] **Step 1:** Remove the availability calendar from `TutorProfile.jsx` (booking a package needs no slot). Keep services/reviews sections untouched.
- [ ] **Step 2:** Grep gates repo-wide: `getMyAvailabilitySlots|getTutorAvailability|/tutor/availability|TutorAvailability|RescheduleRequest|proposeReschedule` must print nothing outside `docs/` and `seedData.sql` (seed may keep historical rows; document if touched).
- [ ] **Step 3: Build + lint** → clean. **Commit** "chore(frontend): drop availability from discovery".

### Task 14: Full E2E + docs

- [ ] **Step 1: Restart backend** with `Database__MigrateOnStartup=true` (same env-override pattern as before: `ConnectionStrings__DefaultConnection` → host `5433`) and confirm migration applied.
- [ ] **Step 2: Playwright pass** (login `tutor.an@tutorhub.com` / `Test@123`): bulk-schedule 3 sessions from `/tutor/schedule` → they appear in upcoming; reschedule one from SessionDetail; cancel one inside notice window → 409 toast; confirm `/tutor/availability` redirects; confirm public tutor profile has no calendar.
- [ ] **Step 3: Screenshot** the new schedule page for the PR/record, then delete the png from the repo.
- [ ] **Step 4: Update** `docs/frontend-specification.md` + `README.md` only where they describe availability/ticket flows (grep `availability|AvailableSlot|reschedule` in `docs/`; minimal diffs).
- [ ] **Step 5: Final suites** — `dotnet test` Domain + Application UnitTests (0 failed), `npm run build` clean. **Commit** "docs: scheduling simplification follow-ups".

## Self-review

1. **Spec coverage:** every element of the requested model is tasked — tutor-set schedule (2, 9, 11), no student accept (2, 6, 10), notice rule (1, 2, 4), bulk schedule (3, 5, 9), `Unscheduled` allowed (9, 11), calendar = `Session[]` (9, 13), attendance→payout invariant untouched (no task mutates it — correct), no AvailabilitySlot/TimeSlot/RecurringSchedule (6, 7, 12, 13).
2. **Placeholder scan:** no TBD/TODO-later steps; validation numbers (24h, 50 items, 30–240 min) are explicit; each step names exact files/commands.
3. **Type consistency:** `SessionScheduleItem(SessionId, StartAt, EndAt)` is defined once in Task 3 and reused verbatim in Task 5's controller mapping; `ServiceDto`/`SessionDto`/`ApiResponse.SuccessResult` reuse existing types (agents verify namespaces in-tree); frontend `scheduleSessionsBatch(items)` matches the controller's `{ items }` body.

One known approximation: `Scheduling:MinimumNoticeHours` via `IConfiguration` — if the tree already has a typed `PlatformSettings` accessor for this (check `EnrollmentActivationService`'s fee-rate read), prefer it and keep the same default of 24.
