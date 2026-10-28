using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Payments.PayFromWallet;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.BackgroundServices;
using TutorHub.Infrastructure.Distributed;

namespace TutorHub.Api.IntegrationTests;

public class AutoPayoutIsolationTests : IntegrationTestBase
{
    public AutoPayoutIsolationTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    [Trait("Category", "CriticalFlow")]
    public async Task ExpiredGracePeriod_ReleasesNetPayoutAndAppendsLedgerEntry()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        Db.Wallets.Add(new Wallet
        {
            Id = Guid.NewGuid(), UserId = studentUser.Id, StudentProfileId = student.Id,
            AvailableBalance = 1_000_000m, CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await Db.SaveChangesAsync();

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        await SendAsync(new PayBookingFromWalletCommand(booking.Id));

        var session = await Db.Sessions
            .FirstAsync(s => s.Enrollment.BookingId == booking.Id && s.SessionNumber == 1);
        var now = DateTime.UtcNow;
        session.Schedule(now.AddHours(-16), now.AddHours(-15));
        session.TryStartGracePeriod(now.AddHours(-14), TimeSpan.FromHours(12)).Should().BeTrue();
        await Db.SaveChangesAsync();
        Db.ChangeTracker.Clear();

        var job = new AutoPayoutJob(
            Factory.Services.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<AutoPayoutJob>.Instance,
            StubIntegrationClock.Instance,
            new Mock<IRedisDistributedLock>().Object);

        (await job.ProcessAutoPayoutAsync(CancellationToken.None)).Should().Be(1);

        var completed = await Db.Sessions.AsNoTracking().FirstAsync(s => s.Id == session.Id);
        completed.Status.Should().Be(SessionStatus.Completed);
        completed.IsPayoutReleased.Should().BeTrue();

        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        wallet.PendingBalance.Should().Be(600_000m);
        wallet.AvailableBalance.Should().Be(1_270_000m);

        var payout = await Db.Transactions.AsNoTracking().SingleAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payout.Amount.Should().Be(300_000m);
        payout.PlatformFeeAmount.Should().Be(30_000m);
        payout.PayoutAmount.Should().Be(270_000m);

        var ledger = await Db.WalletTransactions.AsNoTracking().SingleAsync(t =>
            t.ReferenceId == session.Id && t.Type == WalletTransactionType.SessionPayoutCredit);
        ledger.Amount.Should().Be(270_000m);
        ledger.BalanceBefore.Should().Be(1_000_000m);
        ledger.BalanceAfter.Should().Be(1_270_000m);
    }

    [Fact]
    public async Task FailedSessionDoesNotPolluteNextSessionCommit()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        Db.Wallets.Add(new Wallet
        {
            Id = Guid.NewGuid(), UserId = studentUser.Id, StudentProfileId = student.Id,
            AvailableBalance = 1_000_000m, CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await Db.SaveChangesAsync();
        SetCurrentUser(studentUser.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        await SendAsync(new PayBookingFromWalletCommand(booking.Id));

        var sessions = await Db.Sessions.Where(s => s.Enrollment.BookingId == booking.Id)
            .OrderBy(s => s.SessionNumber).ToListAsync();
        var now = DateTime.UtcNow;
        foreach (var session in sessions.Take(2))
        {
            session.Schedule(now.AddHours(-16), now.AddHours(-15));
            session.TryStartGracePeriod(now.AddHours(-14), TimeSpan.FromHours(12));
        }
        // The first payout will fail its unique gateway-reference constraint
        // after in-memory session and wallet mutations have already happened.
        Db.Transactions.Add(new Transaction
        {
            Id = Guid.NewGuid(), BookingId = booking.Id,
            Type = TransactionType.BookingPayment, Status = TransactionStatus.Pending,
            Amount = sessions[0].SessionPrice,
            PaymentGatewayRef = $"AutoPayout-{sessions[0].Id:N}", CreatedAt = now
        });
        await Db.SaveChangesAsync();
        Db.ChangeTracker.Clear();

        var job = new AutoPayoutJob(
            Factory.Services.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<AutoPayoutJob>.Instance,
            StubIntegrationClock.Instance,
            new Mock<IRedisDistributedLock>().Object);
        (await job.ProcessAutoPayoutAsync(CancellationToken.None)).Should().BeGreaterThan(0);

        var fresh = await Db.Sessions.AsNoTracking()
            .Where(s => s.Id == sessions[0].Id || s.Id == sessions[1].Id)
            .ToListAsync();
        fresh.Single(s => s.Id == sessions[0].Id).Status.Should().Be(SessionStatus.AwaitingPayout);
        fresh.Single(s => s.Id == sessions[1].Id).Status.Should().Be(SessionStatus.Completed);
        (await Db.Transactions.AsNoTracking().CountAsync(t => t.SessionId == sessions[1].Id &&
            t.Type == TransactionType.SessionPayoutCredit)).Should().Be(1);
    }
}
