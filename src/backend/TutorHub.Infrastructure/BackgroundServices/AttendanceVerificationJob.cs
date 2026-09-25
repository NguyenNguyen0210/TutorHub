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

public class AttendanceVerificationJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AttendanceVerificationJob> _logger;
    private readonly IClock _clock;

    public AttendanceVerificationJob(
        IServiceScopeFactory scopeFactory,
        ILogger<AttendanceVerificationJob> logger,
        IClock clock)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _clock = clock;
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

        var now = _clock.UtcNow;
        var count = 0;

        // 0. Safety net: Recover orphaned sessions where both attended but payout was not released (INV-003, DEC-S8-020)
        var orphanedSessions = await dbContext.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.Sessions)
            .Where(s => s.Status == SessionStatus.Scheduled &&
                        s.StudentAttendance == AttendanceStatus.Attended &&
                        s.TutorAttendance == AttendanceStatus.Attended &&
                        !s.IsPayoutReleased &&
                        s.CompletedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in orphanedSessions)
        {
            var hasActiveDispute = await dbContext.Disputes
                .AsNoTracking()
                .AnyAsync(d => d.SessionId == session.Id
                    && d.Status != DisputeStatus.Resolved
                    && d.Status != DisputeStatus.Dismissed, cancellationToken);

            if (hasActiveDispute)
            {
                continue;
            }

            _logger.LogWarning("Recovering orphaned session {SessionId}: both Attended but payout not released", session.Id);

            session.Complete();
            session.Enrollment.RecordCompletedSession(session.Id);

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
                    paymentGatewayRef: $"EscrowRelease-Recovery-{session.Id:N}",
                    now: now);

                dbContext.Transactions.Add(payoutTx);

                var ledgerEntry = new TutorWalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Type = TutorWalletTransactionType.SessionPayoutCredit,
                    Amount = netPayout,
                    BalanceAfter = wallet.AvailableBalance,
                    Description = $"Payout released for Session #{session.SessionNumber} (Safety net recovery)",
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
                _logger.LogError(ex, "Failed to recover orphaned session {SessionId}", session.Id);
            }
        }

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
