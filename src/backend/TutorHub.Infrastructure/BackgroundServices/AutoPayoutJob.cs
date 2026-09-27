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
        count += await ProcessExpiredGracePeriodsAsync(dbContext, now, cancellationToken);

        return count;
    }

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
}
