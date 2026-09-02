using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Notifications;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.BackgroundServices;

public class AttendanceReminderJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AttendanceReminderJob> _logger;

    public AttendanceReminderJob(
        IServiceScopeFactory scopeFactory,
        ILogger<AttendanceReminderJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AttendanceReminderJob started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDueAttendanceRemindersAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing attendance reminders");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        _logger.LogInformation("AttendanceReminderJob stopped");
    }

    public async Task<int> ProcessDueAttendanceRemindersAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        var now = DateTime.UtcNow;

        // Invariant DEC-S7-022: Reminders only for sessions with an actively opened verification window
        var activeSessions = await dbContext.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
            .Where(s => s.Status == SessionStatus.Scheduled &&
                        s.AttendanceVerificationOpenedAt.HasValue &&
                        s.AttendanceVerificationDueAt.HasValue &&
                        s.AttendanceVerificationDueAt.Value > now &&
                        s.CompletedAt == null)
            .ToListAsync(cancellationToken);

        var count = 0;

        foreach (var session in activeSessions)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var remaining = session.AttendanceVerificationDueAt!.Value - now;
            var windowTag = remaining <= TimeSpan.FromHours(2) ? "2h" : "23h";

            var studentUser = session.Enrollment.StudentProfile.User;
            var tutorUser = session.Enrollment.TutorProfile.User;

            // Student Reminder
            if (!session.StudentAttendance.HasValue)
            {
                var dedupKey = $"reminder:attendance:{session.Id}:student:{windowTag}";
                var sent = await SendReminderIfNotExistsAsync(dbContext, studentUser, session.Id, dedupKey, windowTag, now, cancellationToken);
                if (sent) count++;
            }

            // Tutor Reminder
            if (!session.TutorAttendance.HasValue)
            {
                var dedupKey = $"reminder:attendance:{session.Id}:tutor:{windowTag}";
                var sent = await SendReminderIfNotExistsAsync(dbContext, tutorUser, session.Id, dedupKey, windowTag, now, cancellationToken);
                if (sent) count++;
            }
        }

        return count;
    }

    private static async Task<bool> SendReminderIfNotExistsAsync(
        IAppDbContext dbContext,
        User user,
        Guid sessionId,
        string dedupKey,
        string windowTag,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var alreadySent = await dbContext.Notifications
            .AnyAsync(n => n.UserId == user.Id &&
                           n.Type == "AttendanceReminder" &&
                           n.DeduplicationKey == dedupKey,
                       cancellationToken);

        if (alreadySent) return false;

        var title = "Attendance Verification Reminder";
        var message = windowTag == "2h"
            ? "Urgent: Only 2 hours left to verify your session attendance before the verification window closes."
            : "Please verify your attendance for the recent tutoring session.";
        var deepLink = NotificationRouteRegistry.Session(sessionId);

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = title,
            Message = message,
            Type = "AttendanceReminder",
            DeepLink = deepLink,
            IsCritical = false,
            DeduplicationKey = dedupKey,
            CreatedAt = now
        };

        dbContext.Notifications.Add(notification);

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            var email = new EmailDelivery
            {
                Id = Guid.NewGuid(),
                NotificationId = notification.Id,
                Notification = notification,
                UserId = user.Id,
                ToEmail = user.Email,
                Subject = title,
                Body = message,
                Status = EmailDeliveryStatus.Pending,
                CreatedAt = now
            };

            dbContext.EmailDeliveries.Add(email);
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            return false;
        }
    }
}
