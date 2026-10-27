using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Payments.HandlePaymentWebhook;
using TutorHub.Application.Features.StudentWallets.Commands.AdminConfirmTopUp;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class TopUpConcurrencyTests : IntegrationTestBase
{
    public TopUpConcurrencyTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task TwoConfirmations_OnlyCreditWalletOnce()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = studentUser.Id,
            StudentProfileId = student.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var topUp = new TopUpRequest
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Amount = 150_000m,
            TransferReference = $"TEST-{Guid.NewGuid():N}",
            RequestedAt = DateTime.UtcNow
        };
        Db.Wallets.Add(wallet);
        Db.TopUpRequests.Add(topUp);
        await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);

        var command = new AdminConfirmTopUpCommand(topUp.Id);
        await Task.WhenAll(SendAsync(command), SendAsync(command));

        var balance = await Db.Wallets.AsNoTracking().Where(w => w.Id == wallet.Id)
            .Select(w => w.AvailableBalance).SingleAsync();
        balance.Should().Be(150_000m);
        (await Db.WalletTransactions.AsNoTracking().CountAsync(t =>
            t.ReferenceId == topUp.Id && t.Type == WalletTransactionType.TopUpCredit)).Should().Be(1);
    }

    [Fact]
    public async Task TwoGatewayCallbacks_OnlyCreditWalletOnce()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(), UserId = studentUser.Id, StudentProfileId = student.Id,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        var topUp = new TopUpRequest
        {
            Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 150_000m,
            TransferReference = $"TOPUP{Guid.NewGuid():N}", RequestedAt = DateTime.UtcNow
        };
        Db.Wallets.Add(wallet);
        Db.TopUpRequests.Add(topUp);
        await Db.SaveChangesAsync();

        using var firstScope = Factory.Services.CreateScope();
        using var secondScope = Factory.Services.CreateScope();
        var parameters = new Dictionary<string, string> { ["reference"] = topUp.TransferReference };

        Task<PaymentWebhookAck> InvokeAsync(IServiceProvider services)
        {
            var handler = new HandlePaymentWebhookCommandHandler(
                services.GetRequiredService<IAppDbContext>(),
                StubIntegrationClock.Instance,
                new ValidTopUpGateway(),
                services.GetRequiredService<IEnrollmentActivationService>(),
                services.GetRequiredService<IAuditLogService>(),
                NullLogger<HandlePaymentWebhookCommandHandler>.Instance);
            return handler.Handle(new HandlePaymentWebhookCommand(parameters), CancellationToken.None);
        }

        var replies = await Task.WhenAll(
            InvokeAsync(firstScope.ServiceProvider), InvokeAsync(secondScope.ServiceProvider));
        replies.Should().OnlyContain(reply => reply.Code == "00");
        (await Db.Wallets.AsNoTracking().Where(w => w.Id == wallet.Id)
            .Select(w => w.AvailableBalance).SingleAsync()).Should().Be(150_000m);
        (await Db.WalletTransactions.AsNoTracking().CountAsync(t =>
            t.ReferenceId == topUp.Id && t.Type == WalletTransactionType.TopUpCredit)).Should().Be(1);
    }

    private sealed class ValidTopUpGateway : IPaymentGateway
    {
        public string CreateRedirect(PaymentRedirectRequest request) => "https://payment.test";

        public PaymentCallbackResult VerifyAndParseCallback(IReadOnlyDictionary<string, string> parameters)
            => new(true, null, parameters["reference"], 150_000m, true, "123456789");

        public PaymentWebhookAck BuildAcknowledgement(PaymentWebhookOutcome outcome)
            => new(outcome == PaymentWebhookOutcome.Success ? "00" : "99", outcome.ToString());
    }
}
