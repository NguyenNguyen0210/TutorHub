using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Notifications;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.BackgroundServices;

public class SessionReminderJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SessionReminderJob> _logger;

    public SessionReminderJob(
        IServiceScopeFactory scopeFactory,
        ILogger<SessionReminderJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SessionReminderJob started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDueSessionRemindersAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing session reminders");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        _logger.LogInformation("SessionReminderJob stopped");
    }

    public async Task<int> ProcessDueSessionRemindersAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        var now = DateTime.UtcNow;
        var reminderThreshold = now.AddHours(24);

        // Due-based query recovering from scheduler downtime (FR-NOTIF-004)
        var dueSessions = await dbContext.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
            .Where(s => s.Status == SessionStatus.Scheduled &&
                        s.StartAt.HasValue &&
                        s.StartAt.Value <= reminderThreshold &&
                        s.StartAt.Value > now)
            .ToListAsync(cancellationToken);

        var count = 0;

        foreach (var session in dueSessions)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var dedupKey = $"reminder:session:{session.Id}:24h";

            var studentUser = session.Enrollment.StudentProfile.User;
            var tutorUser = session.Enrollment.TutorProfile.User;

            var title = "Upcoming Session Reminder";
            var message = $"Reminder: You have a scheduled session on {session.StartAt!.Value:dd/MM/yyyy HH:mm} UTC.";
            var deepLink = NotificationRouteRegistry.Session(session.Id);

            var participants = new[] { studentUser, tutorUser };

            foreach (var user in participants)
            {
                var alreadyNotified = await dbContext.Notifications
                    .AnyAsync(n => n.UserId == user.Id &&
                                   n.Type == "SessionReminder" &&
                                   n.DeduplicationKey == dedupKey,
                               cancellationToken);

                if (alreadyNotified) continue;

                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Title = title,
                    Message = message,
                    Type = "SessionReminder",
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

                count++;
            }

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                // Concurrently sent by another instance
            }
        }

        return count;
    }
}
