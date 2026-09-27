using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Notifications;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.BackgroundServices;

public class GracePeriodReminderJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<GracePeriodReminderJob> _logger;
    private readonly IClock _clock;

    public GracePeriodReminderJob(
        IServiceScopeFactory scopeFactory,
        ILogger<GracePeriodReminderJob> logger,
        IClock clock)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _clock = clock;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("GracePeriodReminderJob started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SendGracePeriodRemindersAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing GracePeriodReminderJob loop");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        _logger.LogInformation("GracePeriodReminderJob stopped");
    }

    public async Task<int> SendGracePeriodRemindersAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var now = _clock.UtcNow;
        var reminderThreshold = now.AddHours(2);

        var sessions = await dbContext.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
            .Where(s => s.Status == SessionStatus.AwaitingPayout &&
                        !s.HasIssueReport &&
                        s.GracePeriodEndsAt.HasValue &&
                        s.GracePeriodEndsAt.Value <= reminderThreshold &&
                        s.GracePeriodEndsAt.Value > now)
            .ToListAsync(cancellationToken);

        var count = 0;

        foreach (var session in sessions)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var studentUser = session.Enrollment?.StudentProfile?.User;
            if (studentUser == null) continue;

            var dedupKey = $"reminder:graceperiod:{session.Id}:student:2h";

            // Check if reminder already sent (dedup by checking notifications)
            var alreadySent = await dbContext.Notifications
                .AnyAsync(n => n.UserId == studentUser.Id &&
                              n.Type == "GracePeriodReminder" &&
                              n.DeduplicationKey == dedupKey, cancellationToken);

            if (alreadySent) continue;

            var title = "Cảnh báo hết hạn báo cáo sự cố";
            var message = $"Cửa sổ báo cáo sự cố cho buổi học #{session.SessionNumber} sắp đóng. Hạn chót: {session.GracePeriodEndsAt:HH:mm dd/MM/yyyy}";
            var deepLink = NotificationRouteRegistry.Session(session.Id);

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = studentUser.Id,
                Title = title,
                Message = message,
                Type = "GracePeriodReminder",
                DeepLink = deepLink,
                IsCritical = false,
                DeduplicationKey = dedupKey,
                CreatedAt = now
            };

            dbContext.Notifications.Add(notification);

            if (!string.IsNullOrWhiteSpace(studentUser.Email))
            {
                var email = new EmailDelivery
                {
                    Id = Guid.NewGuid(),
                    NotificationId = notification.Id,
                    Notification = notification,
                    UserId = studentUser.Id,
                    ToEmail = studentUser.Email,
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
                count++;
                _logger.LogInformation("Sent grace period reminder for session {SessionId} to student {StudentUserId}",
                    session.Id, studentUser.Id);
            }
            catch (DbUpdateException)
            {
                // Unique constraint on DeduplicationKey handled gracefully
            }
        }

        return count;
    }
}
