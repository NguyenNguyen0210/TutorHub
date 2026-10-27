using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.Disputes.Commands.AdminProcessRefundCallback;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class RefundRetryTests : IntegrationTestBase
{
    public RefundRetryTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task FailedSettlement_CanCompleteOnLaterProviderCallback()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (_, student, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var booking = new Booking
        {
            Id = Guid.NewGuid(), StudentProfileId = student.Id, TutorProfileId = tutor.Id,
            ServiceId = service.Id, SubjectId = service.SubjectId,
            TotalPrice = service.Price, TotalSessions = service.TotalSessions,
            SessionDurationMinutes = service.SessionDurationMinutes,
            TeachingMode = service.TeachingMode, Status = BookingStatus.Cancelled,
            CreatedAt = DateTime.UtcNow
        };
        Db.Bookings.Add(booking);
        var refund = Transaction.CreateRefund(
            booking.Id, null, null, null, 100_000m,
            $"REFUND-{Guid.NewGuid():N}", "Provider refund", DateTime.UtcNow);
        refund.SettlementRequired = true;
        Db.Transactions.Add(refund);
        await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);

        var failed = await SendAsync(new AdminProcessRefundCallbackCommand(
            refund.Id, TransactionStatus.Failed, null, "Provider unavailable"));
        failed.Status.Should().Be(TransactionStatus.Failed);
        failed.SettlementRequired.Should().BeTrue();

        var succeeded = await SendAsync(new AdminProcessRefundCallbackCommand(
            refund.Id, TransactionStatus.Succeeded, $"SETTLED-{Guid.NewGuid():N}", null));
        succeeded.Status.Should().Be(TransactionStatus.Succeeded);
        succeeded.SettlementRequired.Should().BeFalse();
        (await Db.Transactions.AsNoTracking().SingleAsync(t => t.Id == refund.Id))
            .RefundedAt.Should().NotBeNull();
    }
}
