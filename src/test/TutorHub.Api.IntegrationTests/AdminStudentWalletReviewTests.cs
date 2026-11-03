using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawals;
using TutorHub.Application.Features.StudentWallets.Commands.AdminAdjustWallet;
using TutorHub.Application.Features.StudentWallets.Commands.AdminConfirmTopUp;
using TutorHub.Application.Features.StudentWallets.Commands.AdminRejectTopUp;
using TutorHub.Application.Features.StudentWallets.Queries.AdminFindStudentWallets;
using TutorHub.Application.Features.StudentWallets.Queries.AdminGetStudentWithdrawals;
using TutorHub.Application.Features.StudentWallets.Queries.AdminGetTopUpRequests;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class AdminStudentWalletReviewTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task ConcurrentAdjustmentsAgainstSamePreview_OnlyOneCanChangeBalance()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (user, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet { Id = Guid.NewGuid(), UserId = user.Id, StudentProfileId = student.Id, CreatedAt = DateTime.UtcNow };
        Db.Wallets.Add(wallet); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        async Task<bool> Adjust(decimal amount)
        {
            try { await SendAsync(new AdminAdjustStudentWalletCommand(wallet.Id, amount, FinancialDirection.Credit, "Concurrent preview verification", ExpectedAvailableBalance: 0)); return true; }
            catch (ConflictException) { return false; }
        }
        var outcomes = await Task.WhenAll(Adjust(100), Adjust(200));
        outcomes.Count(success => success).Should().Be(1);
        (await Db.WalletTransactions.CountAsync(t => t.WalletId == wallet.Id)).Should().Be(1);
        (await Db.AuditLogs.CountAsync(a => a.EntityId == wallet.Id.ToString())).Should().Be(1);
    }

    [Fact]
    public async Task AdjustmentApi_RequiresAdminAndKey_ReplaysOnce_RejectsStaleAndOverdraft_AndAudits()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet { Id = Guid.NewGuid(), UserId = studentUser.Id, StudentProfileId = student.Id, AvailableBalance = 1_500_000, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Db.Wallets.Add(wallet); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(admin));
        var payload = new { studentWalletId = wallet.Id, amount = 100_000, direction = "Credit", reason = "Matched support case for compensation", expectedAvailableBalance = 1_500_000 };
        const string path = "/api/v1/admin/student-wallets/adjust";
        (await client.PostAsJsonAsync(path, payload)).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        client.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        (await client.PostAsJsonAsync(path, new { payload.studentWalletId, payload.amount, payload.direction, payload.reason })).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        client.DefaultRequestHeaders.Remove("Idempotency-Key"); client.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        (await client.PostAsJsonAsync(path, payload)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync(path, payload)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Db.Wallets.AsNoTracking().SingleAsync(w => w.Id == wallet.Id)).AvailableBalance.Should().Be(1_600_000);
        var ledger = await Db.WalletTransactions.AsNoTracking().SingleAsync(t => t.WalletId == wallet.Id);
        ledger.BalanceBefore.Should().Be(1_500_000); ledger.BalanceAfter.Should().Be(1_600_000);
        (await Db.AuditLogs.AsNoTracking().CountAsync(a => a.Action == "STUDENT_WALLET_ADJUSTED" && a.EntityId == wallet.Id.ToString())).Should().Be(1);
        (await client.PostAsJsonAsync(path, payload with { amount = 200_000 })).StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        client.DefaultRequestHeaders.Remove("Idempotency-Key"); client.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        (await client.PostAsJsonAsync(path, payload)).StatusCode.Should().Be(HttpStatusCode.Conflict);
        var overdraft = () => SendAsync(new AdminAdjustStudentWalletCommand(wallet.Id, 2_000_000, FinancialDirection.Debit, "Overdraft must be rejected", ExpectedAvailableBalance: 1_600_000));
        await overdraft.Should().ThrowAsync<InvalidOperationException>();
        (await Db.WalletTransactions.AsNoTracking().CountAsync(t => t.WalletId == wallet.Id)).Should().Be(1);
        SetCurrentUser(studentUser.Id, UserRole.Student);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(studentUser));
        (await client.GetAsync("/api/v1/admin/student-wallets?search=" + wallet.Id)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await client.PostAsJsonAsync(path, payload)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task WalletLookupAndWithdrawalLists_AreRoleScoped_AndSearchFindsLinkedRecords()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet { Id = Guid.NewGuid(), UserId = studentUser.Id, StudentProfileId = student.Id, AvailableBalance = 500_000, CreatedAt = DateTime.UtcNow };
        var tutorWallet = await Db.Wallets.FirstAsync(w => w.UserId == tutorUser.Id);
        var topup = new TopUpRequest { Id = Guid.NewGuid(), WalletId = wallet.Id, TransferReference = "LEGACY-" + Guid.NewGuid(), Amount = 100_000, RequestedAt = DateTime.UtcNow };
        var studentWithdrawal = new Withdrawal { Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 50_000, BankName = "Bank", AccountNumber = "1234567890", AccountHolderName = "STUDENT", RequestedAt = DateTime.UtcNow };
        var tutorWithdrawal = new Withdrawal { Id = Guid.NewGuid(), WalletId = tutorWallet.Id, Amount = 50_000, BankName = "Bank", AccountNumber = "0987654321", AccountHolderName = "TUTOR", RequestedAt = DateTime.UtcNow };
        Db.Wallets.Add(wallet); Db.TopUpRequests.Add(topup); Db.Withdrawals.AddRange(studentWithdrawal, tutorWithdrawal); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        var found = await SendAsync(new AdminFindStudentWalletsQuery(studentUser.Email));
        found.Items.Should().ContainSingle(w => w.Id == wallet.Id && w.AvailableBalance == 500_000);
        (await SendAsync(new AdminFindStudentWalletsQuery(wallet.Id.ToString()))).Items.Should().ContainSingle(w => w.Id == wallet.Id);
        (await SendAsync(new AdminFindStudentWalletsQuery(tutorUser.Email))).Items.Should().BeEmpty();
        (await SendAsync(new AdminFindStudentWalletsQuery(""))).Items.Should().BeEmpty();
        (await SendAsync(new AdminGetTopUpRequestsQuery(Search: topup.TransferReference))).Items.Should().ContainSingle(t => t.Id == topup.Id && t.CanManuallyReview);
        (await SendAsync(new AdminGetTopUpRequestsQuery(RecordId: topup.Id))).Items.Should().ContainSingle();
        var students = await SendAsync(new AdminGetStudentWithdrawalsQuery(PageSize: 100));
        students.Items.Should().Contain(w => w.Id == studentWithdrawal.Id).And.NotContain(w => w.Id == tutorWithdrawal.Id);
        var tutors = await SendAsync(new GetAdminWithdrawalsQuery(PageSize: 50));
        tutors.Items.Should().Contain(w => w.Id == tutorWithdrawal.Id).And.NotContain(w => w.Id == studentWithdrawal.Id);
        var wrongWallet = () => SendAsync(new AdminAdjustStudentWalletCommand(tutorWallet.Id, 1, FinancialDirection.Credit, "Must not adjust tutor from student route"));
        await wrongWallet.Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task GatewayTopUp_CannotBeManuallyConfirmedOrRejected_AndNeverCreditsUnpaidMoney()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (user, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet { Id = Guid.NewGuid(), UserId = user.Id, StudentProfileId = student.Id, CreatedAt = DateTime.UtcNow };
        var request = new TopUpRequest { Id = Guid.NewGuid(), WalletId = wallet.Id, TransferReference = "TOPUP" + Guid.NewGuid().ToString("N"), Amount = 5_000_000, RequestedAt = DateTime.UtcNow };
        Db.Wallets.Add(wallet); Db.TopUpRequests.Add(request); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        var confirm = () => SendAsync(new AdminConfirmTopUpCommand(request.Id, "Gateway payment not actually confirmed"));
        var reject = () => SendAsync(new AdminRejectTopUpCommand(request.Id, "Manual rejection must not override gateway"));
        await confirm.Should().ThrowAsync<BadRequestException>(); await reject.Should().ThrowAsync<BadRequestException>();
        (await Db.Wallets.AsNoTracking().SingleAsync(w => w.Id == wallet.Id)).AvailableBalance.Should().Be(0);
        (await Db.WalletTransactions.AsNoTracking().CountAsync(t => t.WalletId == wallet.Id)).Should().Be(0);
        (await SendAsync(new AdminGetTopUpRequestsQuery(RecordId: request.Id))).Items.Single().CanManuallyReview.Should().BeFalse();
    }
}
