using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.BackgroundServices;

public class AttendanceVerificationJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AttendanceVerificationJob> _logger;

    public AttendanceVerificationJob(
        IServiceScopeFactory scopeFactory,
        ILogger<AttendanceVerificationJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AttendanceVerificationJob started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessAttendanceVerificationWindowsAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing AttendanceVerificationJob loop");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        _logger.LogInformation("AttendanceVerificationJob stopped");
    }

    public async Task<int> ProcessAttendanceVerificationWindowsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        var now = DateTime.UtcNow;
        var count = 0;

        // 1. Open verification window for ended sessions (DEC-S7-021, INV-EVENT-014)
        var endedSessions = await dbContext.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .Where(s => s.Status == SessionStatus.Scheduled &&
                        s.EndAt.HasValue &&
                        s.EndAt.Value <= now &&
                        s.AttendanceVerificationOpenedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in endedSessions)
        {
            if (session.TryOpenAttendanceVerificationWindow(now, TimeSpan.FromHours(24)))
            {
                var studentUserId = session.Enrollment?.StudentProfile?.UserId ?? Guid.Empty;
                var tutorUserId = session.Enrollment?.TutorProfile?.UserId ?? Guid.Empty;

                // Enqueue AttendanceVerificationRequiredEvent in same DB transaction (DEC-S7-014)
                dbContext.AddOutboxMessage(new AttendanceVerificationRequiredEvent(
                    session.Id,
                    session.EnrollmentId,
                    studentUserId,
                    tutorUserId,
                    session.AttendanceVerificationDueAt!.Value));

                count++;
            }
        }

        if (endedSessions.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        // 2. Timeout unverified / incomplete sessions to PendingResolution (PRD §14, DEC-S7-021)
        var expiredSessions = await dbContext.Sessions
            .Where(s => s.Status == SessionStatus.Scheduled &&
                        s.AttendanceVerificationDueAt.HasValue &&
                        s.AttendanceVerificationDueAt.Value <= now &&
                        s.CompletedAt == null &&
                        (s.StudentAttendance != AttendanceStatus.Attended || s.TutorAttendance != AttendanceStatus.Attended))
            .ToListAsync(cancellationToken);

        foreach (var session in expiredSessions)
        {
            // Set flag for unresolved attendance (without auto-completing or releasing payouts)
            session.FlagAttendanceConflict();
            count++;
        }

        if (expiredSessions.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return count;
    }
}
