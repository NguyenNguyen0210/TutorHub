# Auto-Payout 12-Hour Grace Period — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dual-attendance verification system (Student + Tutor both confirm) with a Passive Approval auto-payout mechanism: after a session ends, a 12-hour grace period starts; if the Student files no issue report, the system auto-releases payout to the Tutor. This also changes the minimum scheduling notice from 24h to 2h.

**Architecture:** The old system required both parties to submit attendance within 24h. The new system assumes sessions succeed unless the Student reports a problem within 12h. The `AttendanceVerificationJob` is replaced by an `AutoPayoutJob` that (1) opens 12h grace periods for ended sessions, and (2) auto-completes sessions and releases payouts when the grace period expires without an issue report. The `SubmitAttendance` handler is replaced by a `ReportSessionIssue` handler (Student-only). The `FastTrackResolveDispute` handler is removed entirely. Frontend replaces the dual-attendance card with a grace period countdown + issue report button.

**Tech Stack:** .NET 8 / C# 12, EF Core 8, PostgreSQL, MediatR, React 18 + Vite + Tailwind CSS

**Note:** This refactor does NOT require running tests. Old attendance-related tests should be deleted, not updated.

---

## File Structure Map

### Files to DELETE (14 files)

| # | Path | Reason |
|---|------|--------|
| 1 | `src/backend/TutorHub.Domain/Enums/AttendanceStatus.cs` | Enum no longer used |
| 2 | `src/backend/TutorHub.Application/Features/Sessions/SubmitAttendance/SubmitAttendanceCommand.cs` | Replaced by ReportSessionIssue |
| 3 | `src/backend/TutorHub.Application/Features/Sessions/SubmitAttendance/SubmitAttendanceCommandValidator.cs` | Replaced by ReportSessionIssue |
| 4 | `src/backend/TutorHub.Application/Features/Sessions/SubmitAttendance/SubmitAttendanceCommandHandler.cs` | Replaced by ReportSessionIssue |
| 5 | `src/backend/TutorHub.Application/Features/Disputes/Commands/FastTrackResolveDispute/FastTrackResolveDisputeCommand.cs` | Fast-track removed |
| 6 | `src/backend/TutorHub.Application/Features/Disputes/Commands/FastTrackResolveDispute/FastTrackResolveDisputeCommandValidator.cs` | Fast-track removed |
| 7 | `src/backend/TutorHub.Application/Features/Disputes/Commands/FastTrackResolveDispute/FastTrackResolveDisputeCommandHandler.cs` | Fast-track removed |
| 8 | `src/backend/TutorHub.Application/Features/Disputes/Commands/FastTrackResolveDispute/FastTrackDisputeLocker.cs` | Fast-track removed |
| 9 | `src/backend/TutorHub.Infrastructure/BackgroundServices/AttendanceVerificationJob.cs` | Replaced by AutoPayoutJob |
| 10 | `src/backend/TutorHub.Infrastructure/BackgroundServices/AttendanceReminderJob.cs` | Replaced by GracePeriodReminderJob |
| 11 | `src/frontend/src/components/feedback/AttendanceCard.jsx` | Replaced by GracePeriodCard |

### Files to CREATE (7 files)

| # | Path | Responsibility |
|---|------|---------------|
| 1 | `src/backend/TutorHub.Application/Features/Sessions/ReportSessionIssue/ReportSessionIssueCommand.cs` | Command record |
| 2 | `src/backend/TutorHub.Application/Features/Sessions/ReportSessionIssue/ReportSessionIssueCommandValidator.cs` | FluentValidation |
| 3 | `src/backend/TutorHub.Application/Features/Sessions/ReportSessionIssue/ReportSessionIssueCommandHandler.cs` | Student-only issue report → freezes payout, creates dispute |
| 4 | `src/backend/TutorHub.Infrastructure/BackgroundServices/AutoPayoutJob.cs` | Replaces AttendanceVerificationJob |
| 5 | `src/backend/TutorHub.Infrastructure/BackgroundServices/GracePeriodReminderJob.cs` | Replaces AttendanceReminderJob |
| 6 | `src/frontend/src/components/feedback/GracePeriodCard.jsx` | 12h countdown + issue report UI |
| 7 | `src/frontend/src/pages/student/ReportSessionIssue.jsx` | Issue report form page |

### Files to MODIFY (heavily)

| # | Path | Changes |
|---|------|---------|
| 1 | `src/backend/TutorHub.Domain/Entities/Session.cs` | Remove 8 attendance fields, add 4 grace period fields, rewrite domain methods |
| 2 | `src/backend/TutorHub.Domain/Enums/SessionStatus.cs` | Add `AwaitingPayout` status |
| 3 | `src/backend/TutorHub.Domain/Entities/User.cs` | Remove AbsentStrikes system (3 fields + 2 methods) |
| 4 | `src/backend/TutorHub.Application/Features/Bookings/DTOs/SessionDto.cs` | Replace attendance fields with grace period fields |
| 5 | `src/backend/TutorHub.Application/Features/Bookings/DTOs/SessionMapper.cs` | Update mapping |
| 6 | `src/backend/TutorHub.Application/Common/Events/BusinessEvents.cs` | Replace attendance events with grace period events |
| 7 | `src/backend/TutorHub.Application/Features/Disputes/Commands/CreateDispute/CreateDisputeCommandHandler.cs` | Remove `FlagAttendanceConflict` usage |
| 8 | `src/backend/TutorHub.Application/Features/Disputes/Commands/AdminResolveDispute/AdminResolveDisputeCommandHandler.cs` | Remove `ResolveAttendanceByAdmin` usage, use `CompleteByAdmin` |
| 9 | `src/backend/TutorHub.Api/Controllers/SessionsController.cs` | Remove attendance endpoint, add report-issue endpoint |
| 10 | `src/backend/TutorHub.Api/Controllers/AdminDisputesController.cs` | Remove fast-track endpoint |
| 11 | `src/backend/TutorHub.Application/Features/Sessions/Scheduling/SessionSchedulePolicy.cs` | Change default from 24h to 2h |
| 12 | `src/backend/TutorHub.Infrastructure/Persistence/Configurations/SessionConfiguration.cs` | Add index for grace period queries |
| 13 | `src/frontend/src/services/session.service.js` | Replace `submitAttendance` with `reportSessionIssue` |
| 14 | `src/frontend/src/pages/student/SessionDetail.jsx` | Replace AttendanceCard with GracePeriodCard |
| 15 | `src/frontend/src/pages/student/EnrollmentDetail.jsx` | Update session status display |
| 16 | `src/frontend/src/pages/student/StudentDashboard.jsx` | Replace attendance action items with grace period items |
| 17 | `src/frontend/src/pages/tutor/TutorDashboard.jsx` | Replace attendance action items with payout countdown |
| 18 | `src/frontend/src/pages/admin/AdminDisputeDetail.jsx` | Remove bilateral attendance comparison |
| 19 | `src/frontend/src/config/enums.js` | Remove ATTENDANCE_STATUS, add SESSION_STATUS.AWAITING_PAYOUT |
| 20 | `src/frontend/src/components/ledger/StateBadge.jsx` | Remove attendance badges, add AwaitingPayout badge |

### Test files to DELETE

| # | Path |
|---|------|
| 1 | `src/test/TutorHub.Domain.UnitTests/Entities/SessionAttendanceWindowTests.cs` |
| 2 | `src/test/TutorHub.Api.IntegrationTests/AttendanceConflictTests.cs` |
| 3 | `src/test/TutorHub.Api.IntegrationTests/AttendanceVerificationJobRecoveryTests.cs` |
| 4 | `src/test/TutorHub.Api.IntegrationTests/SingleAttendanceSubmissionTests.cs` |
| 5 | `src/test/TutorHub.Application.UnitTests/Features/Reminders/AttendanceReminderJobTests.cs` |
| 6 | `src/test/TutorHub.Application.UnitTests/Features/Reminders/AttendanceVerificationJobTests.cs` |
| 7 | `src/test/TutorHub.Application.UnitTests/Features/Disputes/FastTrackResolveDispute/FastTrackResolveDisputeCommandHandlerTests.cs` |

---

## Task Breakdown

### Task 1: Domain — Add `AwaitingPayout` to SessionStatus enum

**Files:**
- Modify: `src/backend/TutorHub.Domain/Enums/SessionStatus.cs`

- [ ] **Step 1: Add the new enum value**

Replace the entire file content:

```csharp
namespace TutorHub.Domain.Enums;

public enum SessionStatus
{
    Unscheduled, // Được sinh ra từ Enrollment nhưng chưa có lịch học cụ thể
    Scheduled,   // Đã chốt ngày giờ học (StartAt và EndAt không null)
    AwaitingPayout, // Buổi học đã kết thúc, đang trong Grace Period 12h chờ giải ngân
    Completed,   // Buổi học hoàn thành, EarningAmount đã được giải ngân
    Cancelled    // Buổi học bị hủy (do cancel Enrollment hoặc cancel riêng lẻ)
}
```

- [ ] **Step 2: Delete the AttendanceStatus enum**

Delete file: `src/backend/TutorHub.Domain/Enums/AttendanceStatus.cs`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(session-status): add AwaitingPayout enum value, delete AttendanceStatus enum"
```

---

### Task 2: Domain — Rewrite Session entity (grace period fields + methods)

**Files:**
- Modify: `src/backend/TutorHub.Domain/Entities/Session.cs`

- [ ] **Step 1: Replace attendance fields with grace period fields**

Remove lines 34-54 (the attendance and dispute resolution fields) and replace with grace period fields. The new fields section (after `CancelledAt`):

```csharp
    // --- 12-Hour Grace Period (Auto-Payout) ---
    public DateTime? GracePeriodStartedAt { get; private set; }
    public DateTime? GracePeriodEndsAt { get; private set; }
    public bool HasIssueReport { get; private set; } = false;
    public string? IssueReportReason { get; private set; }
    public string? IssueReportDescription { get; private set; }
    public DateTime? IssueReportedAt { get; private set; }
    public Guid? IssueReportedByUserId { get; private set; }

    // --- Payout linkage (used for idempotency by Application layer) ---
    public bool IsPayoutReleased { get; private set; } = false;

    // --- Admin resolution fields ---
    public string? ResolutionNotes { get; private set; }
    public string? ResolutionSource { get; private set; }
    public Guid? ResolvedByAdminId { get; private set; }
```

Also remove the `using TutorHub.Domain.Enums;` → replace with just what's needed (SessionStatus is in same namespace, no import needed). Actually keep the using since SessionStatus is in `TutorHub.Domain.Enums`.

- [ ] **Step 2: Replace all domain methods**

Remove ALL methods from `TryOpenAttendanceVerificationWindow` through `CancelFromEnrollment` and replace with:

```csharp
    // =======================================================
    // Domain Methods
    // =======================================================

    /// <summary>
    /// Starts the 12-hour grace period after a session ends.
    /// Transitions: Scheduled → AwaitingPayout.
    /// </summary>
    public bool TryStartGracePeriod(DateTime now, TimeSpan graceDuration)
    {
        if (Status != SessionStatus.Scheduled)
            return false;
        if (!EndAt.HasValue || EndAt.Value > now)
            return false;
        if (GracePeriodStartedAt.HasValue)
            return false; // Already started

        Status = SessionStatus.AwaitingPayout;
        GracePeriodStartedAt = now;
        GracePeriodEndsAt = now.Add(graceDuration);
        UpdatedAt = now;
        return true;
    }

    /// <summary>
    /// Student reports an issue during grace period. Freezes auto-payout.
    /// </summary>
    public void ReportIssue(Guid studentUserId, string reason, string description, DateTime now)
    {
        if (Status != SessionStatus.AwaitingPayout)
        {
            throw new InvalidOperationException(
                $"Cannot report issue for a session in '{Status}' status. Session must be in AwaitingPayout.");
        }

        if (HasIssueReport)
        {
            throw new InvalidOperationException("An issue has already been reported for this session.");
        }

        HasIssueReport = true;
        IssueReportReason = reason;
        IssueReportDescription = description;
        IssueReportedAt = now;
        IssueReportedByUserId = studentUserId;
        UpdatedAt = now;
    }

    /// <summary>
    /// Auto-completes the session when grace period expires with no issue report.
    /// Sets IsPayoutReleased = true.
    /// </summary>
    public void AutoComplete(DateTime now)
    {
        if (Status != SessionStatus.AwaitingPayout)
        {
            throw new InvalidOperationException(
                $"Cannot auto-complete a session in '{Status}' status.");
        }

        if (HasIssueReport)
        {
            throw new InvalidOperationException(
                "Cannot auto-complete a session with an active issue report.");
        }

        if (IsPayoutReleased)
        {
            throw new InvalidOperationException(
                "Payout for this session has already been released.");
        }

        Status = SessionStatus.Completed;
        IsPayoutReleased = true;
        CompletedAt = now;
        UpdatedAt = now;
    }

    /// <summary>
    /// Sets or updates the schedule for this Session.
    /// Valid from Unscheduled or Scheduled status.
    /// </summary>
    public void Schedule(DateTime startAt, DateTime endAt)
    {
        if (Status == SessionStatus.Completed || Status == SessionStatus.AwaitingPayout)
        {
            throw new InvalidOperationException(
                $"Cannot schedule a session in '{Status}' status.");
        }

        if (Status == SessionStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "Cannot schedule a cancelled session.");
        }

        if (endAt <= startAt)
        {
            throw new InvalidOperationException(
                "Session EndAt must be after StartAt.");
        }

        StartAt = startAt;
        EndAt = endAt;
        Status = SessionStatus.Scheduled;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mutates the schedule of an already Scheduled session.
    /// </summary>
    public void Reschedule(DateTime newStartAt, DateTime newEndAt, DateTime now)
    {
        if (Status != SessionStatus.Scheduled || !StartAt.HasValue || !EndAt.HasValue)
        {
            throw new InvalidOperationException(
                $"Cannot reschedule a session in '{Status}' status. Session must be Scheduled with an existing schedule.");
        }

        if (newEndAt <= newStartAt)
        {
            throw new InvalidOperationException(
                "Session EndAt must be after StartAt.");
        }

        StartAt = newStartAt;
        EndAt = newEndAt;
        UpdatedAt = now;
    }

    /// <summary>
    /// Admin resolution for disputed sessions.
    /// </summary>
    public void CompleteByAdmin(Guid adminId, string resolutionNotes, string resolutionSource, DateTime now, bool releasePayout = false)
    {
        if (Status != SessionStatus.AwaitingPayout && Status != SessionStatus.Scheduled)
        {
            throw new InvalidOperationException(
                $"Only AwaitingPayout or Scheduled sessions can be resolved by admin. Current status: '{Status}'.");
        }

        ResolvedByAdminId = adminId;
        ResolutionNotes = resolutionNotes;
        ResolutionSource = resolutionSource;
        HasIssueReport = false;
        Status = SessionStatus.Completed;
        CompletedAt = now;
        UpdatedAt = now;
        if (releasePayout)
        {
            IsPayoutReleased = true;
        }
    }

    /// <summary>
    /// Cancels a single session on participant request.
    /// </summary>
    public void CancelSingle(string reason, DateTime now)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("Cancellation reason is required.", nameof(reason));
        }

        if (Status == SessionStatus.Completed)
        {
            throw new InvalidOperationException("Cannot cancel a completed session.");
        }

        if (Status == SessionStatus.Cancelled)
        {
            throw new InvalidOperationException("Session is already cancelled.");
        }

        if (Status == SessionStatus.AwaitingPayout)
        {
            throw new InvalidOperationException("Cannot cancel a session that is awaiting payout. Use issue report instead.");
        }

        if (Status == SessionStatus.Scheduled && StartAt.HasValue && StartAt.Value <= now)
        {
            throw new InvalidOperationException("Cannot cancel a session that has already started.");
        }

        if (Status != SessionStatus.Unscheduled && Status != SessionStatus.Scheduled)
        {
            throw new InvalidOperationException(
                $"Cannot cancel a session in '{Status}' status.");
        }

        Status = SessionStatus.Cancelled;
        CancelledAt = now;
        UpdatedAt = now;
        ResolutionNotes = reason.Trim();
        ResolutionSource = "SingleSessionCancel";
    }

    /// <summary>
    /// Cancels the session. Called by Enrollment.Cancel() for bulk cancellation.
    /// </summary>
    public void CancelFromEnrollment()
    {
        if (Status == SessionStatus.Completed)
        {
            throw new InvalidOperationException(
                "Cannot cancel a completed session.");
        }

        if (Status == SessionStatus.Cancelled)
        {
            return; // idempotent for bulk cancel
        }

        Status = SessionStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(session-entity): replace 8 attendance fields with grace period fields, rewrite domain methods for auto-payout"
```

---

### Task 3: Domain — Remove AbsentStrikes from User entity

**Files:**
- Modify: `src/backend/TutorHub.Domain/Entities/User.cs`

- [ ] **Step 1: Remove AbsentStrikes fields and methods**

Remove these 3 fields:
```csharp
    public int AbsentStrikes { get; set; }
    public DateTime? StrikeWindowStart { get; set; }
    public DateTime? LastAbsentAt { get; set; }
```

Remove the `RecordAbsentStrike(DateTime now)` method entirely.

Remove the `IsBookingBlocked(DateTime now)` method entirely.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(user-entity): remove AbsentStrikes, StrikeWindowStart, LastAbsentAt fields and RecordAbsentStrike/IsBookingBlocked methods"
```

---

### Task 4: Application — Update SessionDto and SessionMapper

**Files:**
- Modify: `src/backend/TutorHub.Application/Features/Bookings/DTOs/SessionDto.cs`
- Modify: `src/backend/TutorHub.Application/Features/Bookings/DTOs/SessionMapper.cs`
- Delete: `src/backend/TutorHub.Application/Features/Bookings/DTOs/SubmitAttendanceRequest.cs` (if exists)

- [ ] **Step 1: Rewrite SessionDto**

```csharp
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.DTOs;

public record SessionDto(
    Guid Id,
    Guid EnrollmentId,
    int SessionNumber,
    decimal EarningAmount,
    DateTime? StartAt,
    DateTime? EndAt,
    SessionStatus Status,
    bool IsPayoutReleased,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    DateTime? CancelledAt,
    DateTime? GracePeriodStartedAt = null,
    DateTime? GracePeriodEndsAt = null,
    bool HasIssueReport = false,
    string? IssueReportReason = null,
    DateTime? IssueReportedAt = null,
    string? TutorName = null,
    string? SubjectName = null
);
```

- [ ] **Step 2: Rewrite SessionMapper**

```csharp
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Bookings.DTOs;

public static class SessionMapper
{
    public static SessionDto ToDto(Session session)
    {
        return new SessionDto(
            Id: session.Id,
            EnrollmentId: session.EnrollmentId,
            SessionNumber: session.SessionNumber,
            EarningAmount: session.EarningAmount,
            StartAt: session.StartAt,
            EndAt: session.EndAt,
            Status: session.Status,
            IsPayoutReleased: session.IsPayoutReleased,
            CreatedAt: session.CreatedAt,
            CompletedAt: session.CompletedAt,
            CancelledAt: session.CancelledAt,
            GracePeriodStartedAt: session.GracePeriodStartedAt,
            GracePeriodEndsAt: session.GracePeriodEndsAt,
            HasIssueReport: session.HasIssueReport,
            IssueReportReason: session.IssueReportReason,
            IssueReportedAt: session.IssueReportedAt,
            TutorName: session.Enrollment?.TutorProfile?.User?.FullName,
            SubjectName: session.Enrollment?.Subject?.Name
        );
    }

    public static List<SessionDto> ToOrderedList(IEnumerable<Session> sessions)
    {
        return sessions
            .OrderBy(s => s.SessionNumber)
            .Select(ToDto)
            .ToList();
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(session-dto): replace attendance fields with GracePeriodStartedAt/GracePeriodEndsAt/HasIssueReport in SessionDto and SessionMapper"
```

---

### Task 5: Application — Replace attendance events in BusinessEvents.cs

**Files:**
- Modify: `src/backend/TutorHub.Application/Common/Events/BusinessEvents.cs`

- [ ] **Step 1: Replace AttendanceVerificationRequiredEvent with GracePeriodStartedEvent**

Find the `AttendanceVerificationRequiredEvent` record and replace it with:

```csharp
public record GracePeriodStartedEvent(
    Guid SessionId,
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    DateTime GracePeriodEndsAt,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.GracePeriodStarted;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Session";
    public Guid AggregateId => SessionId;
}
```

- [ ] **Step 2: Replace AttendanceConflictDetectedEvent with SessionIssueReportedEvent**

Find the `AttendanceConflictDetectedEvent` record and replace it with:

```csharp
public record SessionIssueReportedEvent(
    Guid SessionId,
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    string Reason,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.SessionIssueReported;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Session";
    public Guid AggregateId => SessionId;
}
```

- [ ] **Step 3: Update BusinessEventTypes constants**

Find the constants `AttendanceVerificationRequired` and `AttendanceConflictDetected` and replace with:

```csharp
    public const string GracePeriodStarted = "GracePeriodStarted";
    public const string SessionIssueReported = "SessionIssueReported";
```

Also remove any `AttendanceVerificationRequired` and `AttendanceConflictDetected` constants.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(business-events): replace AttendanceVerificationRequiredEvent/AttendanceConflictDetectedEvent with GracePeriodStartedEvent/SessionIssueReportedEvent"
```

---

### Task 6: Application — Create ReportSessionIssue handler

**Files:**
- Create: `src/backend/TutorHub.Application/Features/Sessions/ReportSessionIssue/ReportSessionIssueCommand.cs`
- Create: `src/backend/TutorHub.Application/Features/Sessions/ReportSessionIssue/ReportSessionIssueCommandValidator.cs`
- Create: `src/backend/TutorHub.Application/Features/Sessions/ReportSessionIssue/ReportSessionIssueCommandHandler.cs`

- [ ] **Step 1: Create the Command record**

```csharp
using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Sessions.ReportSessionIssue;

public record ReportSessionIssueCommand(Guid SessionId, string Reason, string Description) : IRequest<SessionDto>;
```

- [ ] **Step 2: Create the Validator**

```csharp
using FluentValidation;

namespace TutorHub.Application.Features.Sessions.ReportSessionIssue;

public class ReportSessionIssueCommandValidator : AbstractValidator<ReportSessionIssueCommand>
{
    public ReportSessionIssueCommandValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MinimumLength(20).MaximumLength(2000);
    }
}
```

- [ ] **Step 3: Create the Handler skeleton**

```csharp
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.ReportSessionIssue;

public class ReportSessionIssueCommandHandler : IRequestHandler<ReportSessionIssueCommand, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public ReportSessionIssueCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<SessionDto> Handle(ReportSessionIssueCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var session = await _context.Sessions
                .FromSqlInterpolated($"SELECT * FROM \"Sessions\" WHERE \"Id\" = {request.SessionId} FOR UPDATE")
                .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
                .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
                .FirstOrDefaultAsync(cancellationToken);

            if (session == null)
                throw new NotFoundException("Session", request.SessionId);

            // Only the Student can report issues
            var isStudent = session.Enrollment.StudentProfile.UserId == userId;
            if (!isStudent)
                throw new ForbiddenException("Only students can report session issues.");

            // Must be in grace period
            if (session.Status != SessionStatus.AwaitingPayout)
                throw new BadRequestException($"Cannot report issue for a session in '{session.Status}' status. Session must be in the 12-hour grace period.");

            // Must be within grace period window
            if (session.GracePeriodEndsAt.HasValue && session.GracePeriodEndsAt.Value < now)
                throw new BadRequestException("The 12-hour grace period has expired. Please contact admin for post-payout disputes.");

            // Record the issue report on the session (freezes auto-payout)
            session.ReportIssue(userId, request.Reason, request.Description, now);

            // Auto-create a dispute for admin resolution
            var tutorUserId = session.Enrollment.TutorProfile.UserId;
            var dispute = new Dispute
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                InitiatorUserId = userId,
                RespondentUserId = tutorUserId,
                Reason = request.Reason,
                Description = request.Description,
                CreatedAt = now
            };

            // Pre-release escrow hold (money is still in PendingBalance)
            dispute.SetFinancialHold(session.EarningAmount, FinancialHoldType.EscrowHold, FinancialHoldStatus.Active, now);

            _context.Disputes.Add(dispute);

            _context.AddOutboxMessage(new SessionIssueReportedEvent(
                session.Id,
                session.EnrollmentId,
                userId,
                tutorUserId,
                request.Reason));

            _context.AddOutboxMessage(new DisputeCreatedEvent(
                dispute.Id,
                session.EnrollmentId,
                userId,
                tutorUserId));

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return SessionMapper.ToDto(session);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(report-session-issue): add ReportSessionIssueCommand/Validator/Handler — student-only issue report during 12h grace period, auto-creates dispute"
```

---

### Task 7: Application — Delete SubmitAttendance and FastTrackResolveDispute

**Files:**
- Delete: `src/backend/TutorHub.Application/Features/Sessions/SubmitAttendance/` (entire folder)
- Delete: `src/backend/TutorHub.Application/Features/Disputes/Commands/FastTrackResolveDispute/` (entire folder)

- [ ] **Step 1: Delete the SubmitAttendance folder**

```bash
Remove-Item -Recurse -Force "src/backend/TutorHub.Application/Features/Sessions/SubmitAttendance"
```

- [ ] **Step 2: Delete the FastTrackResolveDispute folder**

```bash
Remove-Item -Recurse -Force "src/backend/TutorHub.Application/Features/Disputes/Commands/FastTrackResolveDispute"
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor(attendance-removal): delete SubmitAttendance command/validator/handler and FastTrackResolveDispute command/validator/handler/locker"
```

---

### Task 8: Application — Update CreateDisputeCommandHandler

**Files:**
- Modify: `src/backend/TutorHub.Application/Features/Disputes/Commands/CreateDispute/CreateDisputeCommandHandler.cs`

- [ ] **Step 1: Update session status check**

Replace:
```csharp
        if (session.Status == SessionStatus.Unscheduled || session.Status == SessionStatus.Cancelled)
```
With:
```csharp
        if (session.Status == SessionStatus.Unscheduled || session.Status == SessionStatus.Cancelled || session.Status == SessionStatus.Scheduled)
```

This ensures disputes can only be filed for sessions in `AwaitingPayout` or `Completed` status (i.e., the session has ended).

- [ ] **Step 2: Remove FlagAttendanceConflict call in pre-release block**

In the pre-release block (the `if (!session.IsPayoutReleased)` branch), find and remove:
```csharp
            session.FlagAttendanceConflict();
```

The issue report mechanism handles freezing now, not attendance conflict flags.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(create-dispute): block disputes for Scheduled sessions, remove FlagAttendanceConflict call — disputes now require AwaitingPayout or Completed status"
```

---

### Task 9: Application — Update AdminResolveDisputeCommandHandler

**Files:**
- Modify: `src/backend/TutorHub.Application/Features/Disputes/Commands/AdminResolveDispute/AdminResolveDisputeCommandHandler.cs`

- [ ] **Step 1: Replace ResolveAttendanceByAdmin with CompleteByAdmin**

Search for all occurrences of `session.ResolveAttendanceByAdmin(` and replace with `session.CompleteByAdmin(`. The method signature is the same.

- [ ] **Step 2: Update status checks**

Find any check for `session.Status != SessionStatus.Scheduled` in the pre-release resolution block and update to also accept `SessionStatus.AwaitingPayout`:

Replace:
```csharp
if (session.Status != SessionStatus.Scheduled)
```
With:
```csharp
if (session.Status != SessionStatus.Scheduled && session.Status != SessionStatus.AwaitingPayout)
```

(Apply this wherever it appears in the handler for status validation.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(admin-resolve-dispute): replace ResolveAttendanceByAdmin with CompleteByAdmin, accept AwaitingPayout status for admin resolution"
```

---

### Task 10: Application — Update SessionSchedulePolicy (24h → 2h)

**Files:**
- Modify: `src/backend/TutorHub.Application/Features/Sessions/Scheduling/SessionSchedulePolicy.cs`

- [ ] **Step 1: Change default from 24 to 2**

Replace:
```csharp
    private const int DefaultMinimumNoticeHours = 24;
```
With:
```csharp
    private const int DefaultMinimumNoticeHours = 2;
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(schedule-policy): change DefaultMinimumNoticeHours from 24 to 2 for reschedule cutoff"
```

---

### Task 11: Infrastructure — Create AutoPayoutJob

**Files:**
- Create: `src/backend/TutorHub.Infrastructure/BackgroundServices/AutoPayoutJob.cs`
- Delete: `src/backend/TutorHub.Infrastructure/BackgroundServices/AttendanceVerificationJob.cs`

- [ ] **Step 1: Delete the old job**

```bash
Remove-Item -Force "src/backend/TutorHub.Infrastructure/BackgroundServices/AttendanceVerificationJob.cs"
```

- [ ] **Step 2: Create AutoPayoutJob skeleton**

Create `src/backend/TutorHub.Infrastructure/BackgroundServices/AutoPayoutJob.cs` with the full class structure including using statements, constructor, and `ExecuteAsync` loop (same pattern as old job: 2-minute interval, error backoff).

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Services;

namespace TutorHub.Infrastructure.BackgroundServices;

public class AutoPayoutJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AutoPayoutJob> _logger;
    private readonly IClock _clock;

    public AutoPayoutJob(
        IServiceScopeFactory scopeFactory,
        ILogger<AutoPayoutJob> logger,
        IClock clock)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _clock = clock;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AutoPayoutJob started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessAutoPayoutAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing AutoPayoutJob loop");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        _logger.LogInformation("AutoPayoutJob stopped");
    }

    // TODO: implement ProcessAutoPayoutAsync
}
```

- [ ] **Step 3: Implement ProcessAutoPayoutAsync — Phase 1 (open grace periods)**

Add to the class:

```csharp
    public async Task<int> ProcessAutoPayoutAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var now = _clock.UtcNow;
        var count = 0;

        // Phase 1: Open 12-hour grace period for ended sessions
        var endedSessions = await dbContext.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .Where(s => s.Status == SessionStatus.Scheduled &&
                        s.EndAt.HasValue &&
                        s.EndAt.Value <= now &&
                        s.GracePeriodStartedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in endedSessions)
        {
            if (session.TryStartGracePeriod(now, TimeSpan.FromHours(12)))
            {
                var studentUserId = session.Enrollment?.StudentProfile?.UserId ?? Guid.Empty;
                var tutorUserId = session.Enrollment?.TutorProfile?.UserId ?? Guid.Empty;

                dbContext.AddOutboxMessage(new GracePeriodStartedEvent(
                    session.Id,
                    session.EnrollmentId,
                    studentUserId,
                    tutorUserId,
                    session.GracePeriodEndsAt!.Value));

                count++;
            }
        }

        if (endedSessions.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        // Phase 2: Auto-complete and release payout for expired grace periods
        // (implemented in next step)
        count += await ProcessExpiredGracePeriodsAsync(dbContext, now, cancellationToken);

        return count;
    }
```

- [ ] **Step 4: Implement ProcessAutoPayoutAsync — Phase 2 (auto-payout)**

Add to the class:

```csharp
    private async Task<int> ProcessExpiredGracePeriodsAsync(IAppDbContext dbContext, DateTime now, CancellationToken cancellationToken)
    {
        var count = 0;

        var expiredSessions = await dbContext.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.Sessions)
            .Where(s => s.Status == SessionStatus.AwaitingPayout &&
                        s.GracePeriodEndsAt.HasValue &&
                        s.GracePeriodEndsAt.Value <= now &&
                        !s.HasIssueReport &&
                        !s.IsPayoutReleased)
            .ToListAsync(cancellationToken);

        foreach (var session in expiredSessions)
        {
            var hasActiveDispute = await dbContext.Disputes
                .AsNoTracking()
                .AnyAsync(d => d.SessionId == session.Id
                    && d.Status != DisputeStatus.Resolved
                    && d.Status != DisputeStatus.Dismissed, cancellationToken);

            if (hasActiveDispute)
                continue;

            _logger.LogInformation("Auto-completing session {SessionId} after 12h grace period", session.Id);

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
                    _logger.LogError("Financial invariant violated during auto-payout: insufficient pending balance for session {SessionId}", session.Id);
                    await tx.RollbackAsync(cancellationToken);
                    continue;
                }

                session.AutoComplete(now);
                session.Enrollment.RecordCompletedSession(session.Id);

                wallet.DebitPending(gross, now);
                wallet.CreditAvailable(netPayout, now);

                var payoutTx = Transaction.CreatePayout(
                    bookingId: session.Enrollment.BookingId,
                    sessionId: session.Id,
                    disputeId: null,
                    gross: gross,
                    feeRate: commissionRate,
                    feeAmount: commissionAmount,
                    netPayout: netPayout,
                    paymentGatewayRef: $"AutoPayout-{session.Id:N}",
                    now: now);

                dbContext.Transactions.Add(payoutTx);

                var ledgerEntry = new TutorWalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Type = TutorWalletTransactionType.SessionPayoutCredit,
                    Amount = netPayout,
                    BalanceAfter = wallet.AvailableBalance,
                    Description = $"Auto-payout for Session #{session.SessionNumber}",
                    CreatedAt = now
                };

                if (dbContext.WalletTransactions != null)
                {
                    dbContext.WalletTransactions.Add(ledgerEntry);
                }

                dbContext.AddOutboxMessage(new SessionCompletedEvent(
                    session.Id,
                    session.EnrollmentId,
                    session.Enrollment.StudentProfile.UserId,
                    session.Enrollment.TutorProfile.UserId,
                    new MoneyDto(gross)));

                dbContext.AddOutboxMessage(new EarningCreatedEvent(
                    session.Id,
                    session.Enrollment.TutorProfileId,
                    session.Enrollment.TutorProfile.UserId,
                    new MoneyDto(gross),
                    new MoneyDto(commissionAmount),
                    new MoneyDto(netPayout),
                    payoutTx.Id));

                await dbContext.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
                count++;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Failed to auto-payout session {SessionId}", session.Id);
            }
        }

        return count;
    }
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auto-payout-job): add AutoPayoutJob — opens 12h grace period for ended sessions, auto-releases payout when grace period expires without issue report"
```

---

### Task 12: Infrastructure — Create GracePeriodReminderJob + delete old jobs

**Files:**
- Create: `src/backend/TutorHub.Infrastructure/BackgroundServices/GracePeriodReminderJob.cs`
- Delete: `src/backend/TutorHub.Infrastructure/BackgroundServices/AttendanceReminderJob.cs`

- [ ] **Step 1: Delete old reminder job**

```bash
Remove-Item -Force "src/backend/TutorHub.Infrastructure/BackgroundServices/AttendanceReminderJob.cs"
```

- [ ] **Step 2: Create GracePeriodReminderJob**

Create a background service that runs every 5 minutes, finds sessions in `AwaitingPayout` with `GracePeriodEndsAt` approaching (<=2h remaining), and sends reminder notifications to Students that their window to report issues is closing. Use the same dedup pattern as the old `AttendanceReminderJob` but only target Students (not Tutors). Notification type: `"GracePeriodReminder"`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(grace-period-reminder): add GracePeriodReminderJob for student notification when <=2h remaining, delete AttendanceReminderJob"
```

---

### Task 13: Infrastructure — Register new jobs in DI, update Outbox event registry

**Files:**
- Modify: DI registration file (search for `AttendanceVerificationJob` registration)
- Modify: Outbox event type registry (search for `AttendanceVerificationRequired` registration)

- [ ] **Step 1: Find and update DI registration**

Search for where `AttendanceVerificationJob` and `AttendanceReminderJob` are registered as hosted services and replace with `AutoPayoutJob` and `GracePeriodReminderJob`.

- [ ] **Step 2: Find and update Outbox EventTypeRegistry**

Replace `AttendanceVerificationRequired` → `GracePeriodStarted` and `AttendanceConflictDetected` → `SessionIssueReported` in the outbox event type mappings.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(di-registration): register AutoPayoutJob/GracePeriodReminderJob as hosted services, update outbox event type mappings to GracePeriodStarted/SessionIssueReported"
```

---

### Task 14: API — Update SessionsController

**Files:**
- Modify: `src/backend/TutorHub.Api/Controllers/SessionsController.cs`

- [ ] **Step 1: Remove the attendance endpoint**

Find and remove the `SubmitAttendance` action method:
```csharp
    [HttpPost("{id:guid}/attendance")]
    public async Task<IActionResult> SubmitAttendance(...)
```

- [ ] **Step 2: Add the report-issue endpoint**

Add a new endpoint:
```csharp
    [HttpPost("{id:guid}/report-issue")]
    public async Task<IActionResult> ReportSessionIssue(Guid id, [FromBody] ReportSessionIssueRequest request)
    {
        var result = await _mediator.Send(new ReportSessionIssueCommand(id, request.Reason, request.Description));
        return Ok(ApiResponse<SessionDto>.SuccessResult(result, "Issue reported successfully. Payout has been frozen pending admin review."));
    }
```

Add the request record at the bottom of the file:
```csharp
public record ReportSessionIssueRequest(string Reason, string Description);
```

- [ ] **Step 3: Remove FastTrack endpoint from AdminDisputesController**

In `src/backend/TutorHub.Api/Controllers/AdminDisputesController.cs`, find and remove the fast-track resolve endpoint (references `FastTrackResolveDisputeCommand`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sessions-api): remove POST /sessions/{id}/attendance endpoint, add POST /sessions/{id}/report-issue endpoint, remove fast-track dispute endpoint from AdminDisputesController"
```

---

### Task 15: Infrastructure — Update SessionConfiguration for new columns

**Files:**
- Modify: `src/backend/TutorHub.Infrastructure/Persistence/Configurations/SessionConfiguration.cs`

- [ ] **Step 1: Add index for grace period queries**

Add after the existing indexes:
```csharp
        builder.HasIndex(s => new { s.Status, s.GracePeriodEndsAt });
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(session-config): add composite index on (Status, GracePeriodEndsAt) for AutoPayoutJob query performance"
```

---

### Task 16: Delete all attendance-related test files

**Files to delete:**

- [ ] **Step 1: Delete test files**

```bash
Remove-Item -Force "src/test/TutorHub.Domain.UnitTests/Entities/SessionAttendanceWindowTests.cs"
Remove-Item -Force "src/test/TutorHub.Api.IntegrationTests/AttendanceConflictTests.cs"
Remove-Item -Force "src/test/TutorHub.Api.IntegrationTests/AttendanceVerificationJobRecoveryTests.cs"
Remove-Item -Force "src/test/TutorHub.Api.IntegrationTests/SingleAttendanceSubmissionTests.cs"
Remove-Item -Force "src/test/TutorHub.Application.UnitTests/Features/Reminders/AttendanceReminderJobTests.cs"
Remove-Item -Force "src/test/TutorHub.Application.UnitTests/Features/Reminders/AttendanceVerificationJobTests.cs"
Remove-Item -Force "src/test/TutorHub.Application.UnitTests/Features/Disputes/FastTrackResolveDispute/FastTrackResolveDisputeCommandHandlerTests.cs"
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore(tests): delete 7 attendance-related test files — SessionAttendanceWindowTests, AttendanceConflictTests, AttendanceVerificationJobRecoveryTests, SingleAttendanceSubmissionTests, AttendanceReminderJobTests, AttendanceVerificationJobTests, FastTrackResolveDisputeTests"
```

---

### Task 17: Fix remaining compilation errors across backend

**Files:**
- Any file that still references `AttendanceStatus`, `HasAttendanceConflict`, `StudentAttendance`, `TutorAttendance`, `AttendanceVerificationOpenedAt`, `AttendanceVerificationDueAt`, `AttendanceVerifiedAt`, `SubmitStudentAttendance`, `SubmitTutorAttendance`, `EvaluateAttendanceResolution`, `FlagAttendanceConflict`, `TryOpenAttendanceVerificationWindow`, `ResolveAttendanceByAdmin`, `RecordAbsentStrike`, `IsBookingBlocked`, `AbsentStrikes`, `StrikeWindowStart`, `LastAbsentAt`, `AttendanceVerificationRequiredEvent`, `AttendanceConflictDetectedEvent`, `FastTrackResolveDisputeCommand`

- [ ] **Step 1: Search for all remaining references**

```bash
cd src/backend
grep -rn "AttendanceStatus\|HasAttendanceConflict\|StudentAttendance\|TutorAttendance\|AttendanceVerification\|AttendanceVerified\|SubmitStudentAttendance\|SubmitTutorAttendance\|EvaluateAttendanceResolution\|FlagAttendanceConflict\|TryOpenAttendanceVerification\|ResolveAttendanceByAdmin\|RecordAbsentStrike\|IsBookingBlocked\|AbsentStrikes\|StrikeWindowStart\|LastAbsentAt\|AttendanceConflictDetected\|FastTrackResolveDispute" --include="*.cs" .
```

- [ ] **Step 2: Fix each file**

For each file found:
- **Notification handlers**: Remove cases for `AttendanceVerificationRequired` and `AttendanceConflictDetected`, add cases for `GracePeriodStarted` and `SessionIssueReported`
- **DTOs that reference AbsentStrikes**: Remove the field from admin user DTOs
- **Queries referencing attendance fields**: Update to use grace period fields
- **Test files still referencing old fields**: Update or remove assertion lines

- [ ] **Step 3: Attempt build**

```bash
dotnet build src/backend/TutorHub.sln
```

Fix any remaining errors iteratively.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix(backend): resolve remaining references to AttendanceStatus, HasAttendanceConflict, StudentAttendance, TutorAttendance, AbsentStrikes across all backend files"
```

---

### Task 18: Frontend — Update session service and enums

**Files:**
- Modify: `src/frontend/src/services/session.service.js`
- Modify: `src/frontend/src/config/enums.js`

- [ ] **Step 1: Replace submitAttendance with reportSessionIssue in session.service.js**

Remove:
```javascript
  async submitAttendance(id, outcome) {
    const res = await api.post(`/sessions/${id}/attendance`, { outcome });
    return res;
  },
```

Add:
```javascript
  async reportSessionIssue(id, reason, description) {
    const res = await api.post(`/sessions/${id}/report-issue`, { reason, description });
    return res;
  },
```

Also update the JSDoc header comment to replace the attendance line with report-issue.

- [ ] **Step 2: Update enums.js**

Remove `ATTENDANCE_STATUS`, `ATTENDANCE_STATUS_META`, and `getAttendanceStatusMeta()`.

Add `AwaitingPayout` to `SESSION_STATUS` if not already present:
```javascript
export const SESSION_STATUS = {
  UNSCHEDULED: 'Unscheduled',
  SCHEDULED: 'Scheduled',
  AWAITING_PAYOUT: 'AwaitingPayout',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
```

Add meta for the new status:
```javascript
export const SESSION_STATUS_META = {
  ...existing entries...,
  AwaitingPayout: { label: 'Chờ giải ngân', color: 'holding', icon: 'timer' },
};
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(session-service): replace submitAttendance() with reportSessionIssue(), add AwaitingPayout to SESSION_STATUS enum, remove ATTENDANCE_STATUS constants"
```

---

### Task 19: Frontend — Create GracePeriodCard component

**Files:**
- Create: `src/frontend/src/components/feedback/GracePeriodCard.jsx`
- Delete: `src/frontend/src/components/feedback/AttendanceCard.jsx`

- [ ] **Step 1: Delete AttendanceCard**

```bash
Remove-Item -Force "src/frontend/src/components/feedback/AttendanceCard.jsx"
```

- [ ] **Step 2: Create GracePeriodCard skeleton**

Create `src/frontend/src/components/feedback/GracePeriodCard.jsx` with:
- A countdown timer showing time remaining in the 12h grace period
- For Student: a "Báo cáo sự cố" (Report Issue) button that opens a form
- For Tutor: read-only countdown showing when they'll receive payment
- Status badges: "Đang chờ giải ngân" (holding), "Đã báo cáo sự cố" (danger), "Đã giải ngân" (success)
- Escrow amount display

The component should accept props: `session`, `onIssueReported`, `isTutor`.

- [ ] **Step 3: Implement GracePeriodCard**

Build the full component using the project's design system (Tailwind tokens, Lucide icons, Badge/Button/Callout/Icon components). Show the countdown using `dayjs` diff from `session.gracePeriodEndsAt`. Include inline issue report form with reason (select) and description (textarea, min 20 chars).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(grace-period-card): add GracePeriodCard component with 12h countdown timer and inline issue report form, delete AttendanceCard"
```

---

### Task 20: Frontend — Update SessionDetail page

**Files:**
- Modify: `src/frontend/src/pages/student/SessionDetail.jsx`

- [ ] **Step 1: Replace AttendanceCard import and usage**

Replace:
```javascript
import AttendanceCard from '@/components/feedback/AttendanceCard';
```
With:
```javascript
import GracePeriodCard from '@/components/feedback/GracePeriodCard';
```

- [ ] **Step 2: Replace handleAttendanceSubmitted with handleIssueReported**

Replace the `handleAttendanceSubmitted` function:
```javascript
  const handleIssueReported = async (reason, description) => {
    const updated = await sessionService.reportSessionIssue(id, reason, description);
    setSession(updated);
    toast.success('Đã gửi báo cáo sự cố. Tiền buổi học đã được đóng băng chờ xử lý.');
  };
```

- [ ] **Step 3: Replace the AttendanceCard render with GracePeriodCard**

Replace:
```jsx
      {!isCancelled && (
        <AttendanceCard
          session={session}
          onAttendanceSubmitted={handleAttendanceSubmitted}
          isTutor={isTutor}
        />
      )}
```
With:
```jsx
      {!isCancelled && (
        <GracePeriodCard
          session={session}
          onIssueReported={handleIssueReported}
          isTutor={isTutor}
        />
      )}
```

- [ ] **Step 4: Update the deadline banner**

Replace the `attendanceVerificationDueAt` banner with grace period:
```jsx
      {session.gracePeriodEndsAt && !isCancelled && !isCompleted && (
        <Callout
          variant="holding"
          title="Cửa sổ bảo vệ 12 giờ"
          icon={<Icon name="timer" size="md" />}
        >
          Hạn chót báo cáo sự cố:{' '}
          <strong className="font-mono tabular-nums">
            {formatDateTime(session.gracePeriodEndsAt)}
          </strong>{' '}
          — Nếu không có báo cáo, tiền sẽ tự động chuyển cho gia sư.
        </Callout>
      )}
```

- [ ] **Step 5: Update the reschedule notice text from 24h to 2h**

Replace `24 giờ` with `2 giờ` and `24 'hour'` with `2 'hour'` in the reschedule modal validation and notice text.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(session-detail-page): replace AttendanceCard with GracePeriodCard, update deadline banner to show grace period countdown, change reschedule notice from 24h to 2h"
```

---

### Task 21: Frontend — Update StudentDashboard

**Files:**
- Modify: `src/frontend/src/pages/student/StudentDashboard.jsx`

- [ ] **Step 1: Replace attendance action items**

Find the section that filters sessions needing student attendance (look for `attendance-` keys or `studentAttendance` checks) and replace with grace period action items: sessions in `AwaitingPayout` status where `hasIssueReport` is false and `gracePeriodEndsAt` is in the future.

Change the action item label from "Chờ điểm danh" to "Cửa sổ báo cáo sự cố đang mở" and link to the session detail page.

- [ ] **Step 2: Remove absentStrikes display**

Remove any display of `absentStrikes` from the dashboard.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(student-dashboard): replace attendance action items with grace period issue-report window items, remove absentStrikes display"
```

---

### Task 22: Frontend — Update TutorDashboard

**Files:**
- Modify: `src/frontend/src/pages/tutor/TutorDashboard.jsx`

- [ ] **Step 1: Replace attendance action items**

Find the section that filters sessions needing tutor attendance and replace with: sessions in `AwaitingPayout` status showing "Tiền sẽ được giải ngân vào [gracePeriodEndsAt]" as informational items (no action required from tutor).

- [ ] **Step 2: Remove absentStrikes display**

Remove any display of `absentStrikes` from the dashboard.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(tutor-dashboard): replace attendance action items with auto-payout countdown info, remove absentStrikes display"
```

---

### Task 23: Frontend — Update EnrollmentDetail, AdminDisputeDetail, StateBadge, Notifications

**Files:**
- Modify: `src/frontend/src/pages/student/EnrollmentDetail.jsx`
- Modify: `src/frontend/src/pages/admin/AdminDisputeDetail.jsx`
- Modify: `src/frontend/src/pages/admin/AdminUsers.jsx`
- Modify: `src/frontend/src/components/ledger/StateBadge.jsx`
- Modify: `src/frontend/src/pages/shared/Notifications.jsx`

- [ ] **Step 1: Update EnrollmentDetail**

Replace `hasAttendanceConflict` checks with `hasIssueReport`. Replace `attendanceVerificationDueAt` with `gracePeriodEndsAt`. Replace `studentAttendance` checks with `hasIssueReport` or status checks.

- [ ] **Step 2: Update AdminDisputeDetail**

Remove the "Bilateral Attendance Comparison" section (the 2-column Student/Tutor attendance display with `ATTENDANCE_LABELS`). Replace with a simpler "Issue Report Details" section showing the issue reason, description, and timestamp.

- [ ] **Step 3: Update AdminUsers**

Remove the "Absent Strike Tracker" section and all `absentStrikes`/`lastAbsentAt` displays.

- [ ] **Step 4: Update StateBadge**

Remove `ATTENDANCE_STATUS` import and attendance badge rendering. Add `AwaitingPayout` badge rendering with holding variant.

- [ ] **Step 5: Update Notifications**

Replace the "Attendance" category filter tag with "Grace Period". Update any notification styling that uses attendance-specific logic.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(admin-pages): update EnrollmentDetail/AdminDisputeDetail/AdminUsers/StateBadge/Notifications — replace attendance displays with grace period and issue report UI"
```

---

### Task 24: Frontend — Fix remaining attendance references

- [ ] **Step 1: Search for all remaining attendance references**

```bash
cd src/frontend
grep -rn "attendance\|Attended\|Absent\|submitAttendance\|AttendanceCard\|hasAttendanceConflict\|attendanceVerificationDueAt\|absentStrikes\|lastAbsentAt\|ATTENDANCE_STATUS" --include="*.js" --include="*.jsx" src/
```

- [ ] **Step 2: Fix each file found**

Remove or replace each reference with the grace period equivalent.

- [ ] **Step 3: Verify frontend builds**

```bash
cd src/frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix(frontend): resolve all remaining references to attendance/Attended/Absent/submitAttendance/AttendanceCard/hasAttendanceConflict across frontend codebase"
```

---

### Task 25: Update documentation (CLAUDE.md, README.md, DESIGN.md)

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `DESIGN.md`

- [ ] **Step 1: Update CLAUDE.md**

Replace all references to "Attendance Verification Window 24h" with "12-Hour Grace Period Auto-Payout". Update the High-Level Flow diagram. Update the system architecture description. Remove references to `AttendanceVerificationJob`, `AttendanceReminderJob`, `SubmitAttendance`. Add references to `AutoPayoutJob`, `GracePeriodReminderJob`, `ReportSessionIssue`.

Key sections to update:
- Line 6: Replace "điểm danh 2 chiều (Attendance Verification Window)" with "cơ chế giải ngân tự động 12 giờ (Auto-Payout Grace Period)"
- System architecture High-Level Flow section
- Background Jobs reference (change from 6 to 6 but different names)
- Frontend description

- [ ] **Step 2: Update README.md**

Replace "Điểm danh 2 chiều (Attendance Window)" feature description with "Giải ngân tự động 12 giờ (Auto-Payout Grace Period)".

- [ ] **Step 3: Update DESIGN.md**

Update the "Dual Attendance Verification Card" component spec (§7.2) to describe the new "Grace Period Countdown Card". Remove references to bilateral attendance. Update the Holding Countdown description to mention 12h grace period instead of 15-minute checkout only.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs(auto-payout): update CLAUDE.md/README.md/DESIGN.md — replace dual-attendance verification references with 12h auto-payout grace period documentation"
```

---

### Task 26: Final verification — build check

- [ ] **Step 1: Backend build**

```bash
dotnet build src/backend/TutorHub.sln
```

Fix any remaining compilation errors.

- [ ] **Step 2: Frontend build**

```bash
cd src/frontend && npm run build
```

Fix any remaining errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(auto-payout): final build verification — complete migration from dual-attendance to 12h grace period auto-payout system"
```

---

## Summary of Changes

| Area | Old System | New System |
|------|-----------|------------|
| **After session ends** | 24h window, both sides submit Attended/Absent | 12h grace period, only Student can report issue |
| **Happy path** | Both submit Attended → payout | No report → auto-payout after 12h |
| **Issue path** | Attendance conflict → admin | Student reports issue → dispute created → admin |
| **Gia sư action** | Must submit attendance | None required |
| **Scheduling notice** | 24 hours minimum | 2 hours minimum |
| **AbsentStrikes** | Rolling 30-day strike window | Removed entirely |
| **FastTrack disputes** | Pre-release one-sided silence template | Removed entirely |
| **Session statuses** | Unscheduled, Scheduled, Completed, Cancelled | + AwaitingPayout |
| **Background jobs** | AttendanceVerificationJob, AttendanceReminderJob | AutoPayoutJob, GracePeriodReminderJob |
