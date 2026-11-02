using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.Admin.Users.GetAdminUserById;
using TutorHub.Application.Features.StudentWallets.Commands.CreateVnPayTopUp;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Entities;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyTopUpRequests;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentTransactions;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentWithdrawals;
using TutorHub.Application.Features.StudentWallets.Queries.AdminGetTopUpRequests;
using TutorHub.Application.Features.StudentWallets.Queries.AdminGetStudentWithdrawals;
using TutorHub.Application.Features.StudentWallets.Commands.AdminAdjustWallet;

namespace TutorHub.Api.IntegrationTests;

public class StudentWalletRuntimeTests : IntegrationTestBase
{
    public StudentWalletRuntimeTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task WalletHistories_QueryMappedWalletIdAndKeepStudentOwnership()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var (_, otherTutor, otherAdmin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (otherUser, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, otherTutor, otherAdmin.Id);
        var wallet = new Wallet { Id = Guid.NewGuid(), UserId = studentUser.Id, StudentProfileId = student.Id, CreatedAt = DateTime.UtcNow };
        var topUp = new TopUpRequest { Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 150_000m, TransferReference = $"HISTORY-{Guid.NewGuid():N}", RequestedAt = DateTime.UtcNow };
        var withdrawal = new Withdrawal { Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 50_000m, BankName = "Vietcombank", AccountNumber = "1234567890", AccountHolderName = "TEST STUDENT", RequestedAt = DateTime.UtcNow };
        var entry = new WalletTransaction { Id = Guid.NewGuid(), WalletId = wallet.Id, Type = WalletTransactionType.TopUpCredit, Direction = FinancialDirection.Credit, Amount = 150_000m, BalanceBefore = 0, BalanceAfter = 150_000m, CreatedAt = DateTime.UtcNow };
        Db.Wallets.Add(wallet);
        Db.TopUpRequests.Add(topUp);
        Db.Withdrawals.Add(withdrawal);
        Db.WalletTransactions.Add(entry);
        await Db.SaveChangesAsync();

        SetCurrentUser(studentUser.Id, UserRole.Student);
        (await SendAsync(new GetMyTopUpRequestsQuery())).Items.Should().ContainSingle(x => x.Id == topUp.Id && x.StudentWalletId == wallet.Id);
        (await SendAsync(new GetMyStudentWithdrawalsQuery())).Items.Should().ContainSingle(x => x.Id == withdrawal.Id && x.StudentWalletId == wallet.Id);
        (await SendAsync(new GetMyStudentTransactionsQuery())).Items.Should().ContainSingle(x => x.Id == entry.Id && x.StudentWalletId == wallet.Id);

        SetCurrentUser(otherUser.Id, UserRole.Student);
        (await SendAsync(new GetMyTopUpRequestsQuery())).Items.Should().BeEmpty();
        (await SendAsync(new GetMyStudentWithdrawalsQuery())).Items.Should().BeEmpty();
        (await SendAsync(new GetMyStudentTransactionsQuery())).Items.Should().BeEmpty();

        SetCurrentUser(admin.Id, UserRole.Admin);
        (await SendAsync(new AdminGetTopUpRequestsQuery(PageSize: 100))).Items.Should().Contain(x => x.Id == topUp.Id && x.StudentWalletId == wallet.Id);
        (await SendAsync(new AdminGetStudentWithdrawalsQuery(PageSize: 100))).Items.Should().Contain(x => x.Id == withdrawal.Id && x.StudentWalletId == wallet.Id);
    }

    [Fact]
    public async Task AdminAdjustment_LocksTheUnifiedWalletTable()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet { Id = Guid.NewGuid(), UserId = studentUser.Id, StudentProfileId = student.Id, CreatedAt = DateTime.UtcNow };
        Db.Wallets.Add(wallet);
        await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        var updated = await SendAsync(new AdminAdjustStudentWalletCommand(wallet.Id, 100_000m, FinancialDirection.Credit, "Integration adjustment regression"));
        updated.AvailableBalance.Should().Be(100_000m);
        (await Db.WalletTransactions.AsNoTracking().CountAsync(x => x.WalletId == wallet.Id)).Should().Be(1);
    }

    [Fact]
    public async Task VnPayTopUp_CreatesWalletWithoutAnInvalidInclude()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(studentUser.Id, UserRole.Student);

        var redirect = await SendAsync(new CreateVnPayTopUpCommand(150_000m, "127.0.0.1"));

        redirect.PaymentUrl.Should().NotBeNullOrWhiteSpace();
        (await Db.Wallets.AsNoTracking().CountAsync(w =>
            w.UserId == studentUser.Id && w.StudentProfileId == student.Id)).Should().Be(1);
    }

    [Fact]
    public async Task AdminTutorDetail_ReadsWalletThroughMappedUserNavigation()
    {
        var (tutorUser, _, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(admin.Id, UserRole.Admin);

        var detail = await SendAsync(new GetAdminUserByIdQuery(tutorUser.Id));

        detail.TutorProfile.Should().NotBeNull();
        detail.TutorProfile!.WalletBalance.Should().Be(1_000_000m);
    }
}
