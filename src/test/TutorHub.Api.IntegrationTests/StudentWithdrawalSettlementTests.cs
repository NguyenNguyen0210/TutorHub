using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.StudentWallets.Commands.AdminCompleteWithdrawal;
using TutorHub.Application.Features.StudentWallets.Commands.AdminProcessWithdrawal;
using TutorHub.Application.Features.StudentWallets.Commands.RequestWithdrawal;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class StudentWithdrawalSettlementTests : IntegrationTestBase
{
    public StudentWithdrawalSettlementTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task StudentWithdrawal_Completion_ClearsHeldBalanceAndWritesSettlement()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(), UserId = studentUser.Id, StudentProfileId = student.Id,
            AvailableBalance = 300_000m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        Db.Wallets.Add(wallet);
        await Db.SaveChangesAsync();

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var requested = await SendAsync(new StudentRequestWithdrawalCommand(
            200_000m, "Vietcombank", "VCB", "1234567890", "INTEGRATION STUDENT"));
        SetCurrentUser(admin.Id, UserRole.Admin);
        await SendAsync(new AdminProcessStudentWithdrawalCommand(requested.Id));
        await SendAsync(new AdminCompleteStudentWithdrawalCommand(requested.Id));

        var fresh = await Db.Wallets.AsNoTracking().SingleAsync(w => w.Id == wallet.Id);
        fresh.AvailableBalance.Should().Be(100_000m);
        fresh.WithdrawingBalance.Should().Be(0m);
        (await Db.WalletTransactions.AsNoTracking().CountAsync(t =>
            t.WithdrawalId == requested.Id && t.Type == WalletTransactionType.WithdrawalSuccessSettlement))
            .Should().Be(1);
    }
}
