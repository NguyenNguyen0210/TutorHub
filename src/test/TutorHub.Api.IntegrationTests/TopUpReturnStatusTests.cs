using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.Payments.GetPaymentResult;
using TutorHub.Domain.Entities;

namespace TutorHub.Api.IntegrationTests;

public class TopUpReturnStatusTests : IntegrationTestBase
{
    public TopUpReturnStatusTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task SignedSuccessfulReturn_IsPendingUntilWalletCreditCommits()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (user, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(), UserId = user.Id, StudentProfileId = student.Id,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        var topUp = new TopUpRequest
        {
            Id = Guid.NewGuid(), Wallet = wallet, WalletId = wallet.Id,
            Amount = 100_000m, TransferReference = $"TOPUP{Guid.NewGuid():N}",
            RequestedAt = DateTime.UtcNow
        };
        Db.Wallets.Add(wallet);
        Db.TopUpRequests.Add(topUp);
        await Db.SaveChangesAsync();

        var gateway = new Mock<IPaymentGateway>();
        gateway.Setup(g => g.VerifyAndParseCallback(It.IsAny<IReadOnlyDictionary<string, string>>()))
            .Returns(new PaymentCallbackResult(true, null, topUp.TransferReference,
                topUp.Amount, true, "12345"));
        var handler = new GetPaymentResultQueryHandler(Db, gateway.Object);
        var query = new GetPaymentResultQuery(new Dictionary<string, string>());

        var pending = await handler.Handle(query, CancellationToken.None);
        pending.Success.Should().BeFalse();

        wallet.Credit(topUp.Amount, DateTime.UtcNow);
        topUp.ConfirmViaGateway("12345", DateTime.UtcNow);
        await Db.SaveChangesAsync();
        var confirmed = await handler.Handle(query, CancellationToken.None);
        confirmed.Success.Should().BeTrue();
    }
}
