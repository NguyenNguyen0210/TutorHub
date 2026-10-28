using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Payments.InitiatePayment;
using TutorHub.Application.Features.Payments.PayFromWallet;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class PaymentAttemptRegressionTests : IntegrationTestBase
{
    public PaymentAttemptRegressionTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task TwoWalletPayments_UseDistinctReferences_AndPreserveGatewayAttempts()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        Db.Wallets.Add(new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = studentUser.Id,
            StudentProfileId = student.Id,
            AvailableBalance = 2_000_000m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await Db.SaveChangesAsync();
        SetCurrentUser(studentUser.Id, UserRole.Student);

        var firstBooking = await SendAsync(new CreateBookingCommand(service.Id));
        var gateway = await SendAsync(new InitiatePaymentCommand(firstBooking.Id, "127.0.0.1"));
        await SendAsync(new PayBookingFromWalletCommand(firstBooking.Id));

        var secondBooking = await SendAsync(new CreateBookingCommand(service.Id));
        await SendAsync(new PayBookingFromWalletCommand(secondBooking.Id));

        var transactions = await Db.Transactions.AsNoTracking()
            .Where(t => t.BookingId == firstBooking.Id || t.BookingId == secondBooking.Id)
            .ToListAsync();
        transactions.Should().HaveCount(3);
        transactions.Select(t => t.PaymentGatewayRef).Should().OnlyHaveUniqueItems();
        transactions.Should().ContainSingle(t => t.PaymentGatewayRef == gateway.MerchantReference
            && t.Status == TransactionStatus.Pending);
        (await Db.Enrollments.AsNoTracking().CountAsync(e =>
            e.BookingId == firstBooking.Id || e.BookingId == secondBooking.Id)).Should().Be(2);
    }
}
