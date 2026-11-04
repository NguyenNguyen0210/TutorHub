using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Admin.Withdrawals.CompleteWithdrawal;
using TutorHub.Application.Features.Admin.Withdrawals.FailWithdrawal;
using TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawalById;
using TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawals;
using TutorHub.Application.Features.Admin.Withdrawals.ProcessWithdrawal;
using TutorHub.Application.Features.StudentWallets.Commands.RequestWithdrawal;
using TutorHub.Application.Features.Wallets.CreateWithdrawal;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class AdminWithdrawalReviewTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task GlobalSummaryAndSearch_AreNotLimitedToVisiblePage_AndExcludeStudentRequests()
    {
        var (user, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(admin.Id, UserRole.Admin);
        var before = await SendAsync(new GetAdminWithdrawalSummaryQuery());
        var marker = Guid.NewGuid().ToString("N");
        SetCurrentUser(user.Id, UserRole.Tutor);
        var ids = new List<Guid>();
        for (var i = 0; i < 12; i++) ids.Add((await SendAsync(new CreateWithdrawalCommand(50_000, $"Đối soát {marker}", AccountNumber: "1234567890", AccountHolderName: "TUTOR TEST"))).Id);
        SetCurrentUser(admin.Id, UserRole.Admin);
        await SendAsync(new ProcessWithdrawalCommand(ids[0]));
        await SendAsync(new ProcessWithdrawalCommand(ids[1]));
        await SendAsync(new CompleteWithdrawalCommand(ids[1], "BANK-REFERENCE-TEST"));
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet { Id = Guid.NewGuid(), UserId = studentUser.Id, StudentProfileId = student.Id, AvailableBalance = 100_000, CreatedAt = DateTime.UtcNow };
        Db.Wallets.Add(wallet); await Db.SaveChangesAsync();
        SetCurrentUser(studentUser.Id, UserRole.Student);
        var studentRequest = await SendAsync(new StudentRequestWithdrawalCommand(50_000, "Bank", null, "1234567890", "STUDENT TEST"));
        SetCurrentUser(admin.Id, UserRole.Admin);
        var summary = await SendAsync(new GetAdminWithdrawalSummaryQuery());
        summary.TotalCount.Should().Be(before.TotalCount + 12);
        summary.PendingCount.Should().Be(before.PendingCount + 10);
        summary.ProcessingCount.Should().Be(before.ProcessingCount + 1);
        var first = await SendAsync(new GetAdminWithdrawalsQuery(Search: "doi soat " + marker, PageSize: 5));
        first.TotalCount.Should().Be(12); first.Items.Should().HaveCount(5); first.TotalPages.Should().Be(3);
        var second = await SendAsync(new GetAdminWithdrawalsQuery(Search: marker, PageSize: 5, PageNumber: 2));
        second.Items.Select(row => row.Id).Should().NotIntersectWith(first.Items.Select(row => row.Id));
        var exact = await SendAsync(new GetAdminWithdrawalsQuery(Search: ids[0].ToString()));
        exact.Items.Should().ContainSingle(row => row.Id == ids[0]);
        var studentDetail = () => SendAsync(new GetAdminWithdrawalByIdQuery(studentRequest.Id));
        await studentDetail.Should().ThrowAsync<TutorHub.Application.Common.Exceptions.NotFoundException>();
    }

    [Fact]
    public async Task CompleteApi_RequiresReconciliation_ReplaysOnce_AndDetailShowsRealLedgerSnapshots()
    {
        var (user, _, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(user.Id, UserRole.Tutor);
        var request = await SendAsync(new CreateWithdrawalCommand(200_000, "Vietcombank", AccountNumber: "1234567890", AccountHolderName: "TUTOR TEST"));
        SetCurrentUser(admin.Id, UserRole.Admin);
        await SendAsync(new ProcessWithdrawalCommand(request.Id));
        var held = await Db.Wallets.AsNoTracking().SingleAsync(w => w.Id == request.WalletId);
        held.AvailableBalance.Should().Be(800_000); held.WithdrawingBalance.Should().Be(200_000);
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(admin));
        var path = $"/api/v1/admin/withdrawals/{request.Id}/complete";
        var payload = new { bankTransferReference = "BANK20261104-TEST", reconciliationNote = "Matched bank receipt and beneficiary" };
        (await client.PostAsJsonAsync(path, payload)).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        client.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        (await client.PostAsJsonAsync(path, new { bankTransferReference = "" })).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        client.DefaultRequestHeaders.Remove("Idempotency-Key"); client.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        (await client.PostAsJsonAsync(path, payload)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync(path, payload)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync(path, payload with { bankTransferReference = "CHANGED" })).StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var detail = await SendAsync(new GetAdminWithdrawalByIdQuery(request.Id));
        detail.Status.Should().Be(WithdrawalStatus.Completed);
        detail.AvailableBalanceAtRequest.Should().Be(1_000_000);
        detail.AvailableBalanceAfterReservation.Should().Be(800_000);
        detail.BankTransferReference.Should().Be(payload.bankTransferReference);
        detail.ReconciliationNote.Should().Be(payload.reconciliationNote);
        detail.ProcessingStartedAt.Should().NotBeNull(); detail.ProcessedAt.Should().NotBeNull();
        (await Db.WalletTransactions.CountAsync(t => t.WithdrawalId == request.Id && t.Type == WalletTransactionType.WithdrawalSuccessSettlement)).Should().Be(1);
        (await Db.AuditLogs.CountAsync(a => a.EntityId == request.Id.ToString() && a.Action == "WithdrawalCompleted")).Should().Be(1);
        held = await Db.Wallets.AsNoTracking().SingleAsync(w => w.Id == request.WalletId);
        held.AvailableBalance.Should().Be(800_000); held.WithdrawingBalance.Should().Be(0);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(user));
        (await client.GetAsync("/api/v1/admin/withdrawals/summary")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await client.GetAsync($"/api/v1/admin/withdrawals/{request.Id}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task FailedRequest_RestoresHeldFunds_AndHasNoInventedTransferReference()
    {
        var (user, _, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(user.Id, UserRole.Tutor);
        var request = await SendAsync(new CreateWithdrawalCommand(200_000, "Bank", AccountNumber: "1234567890", AccountHolderName: "TUTOR TEST"));
        SetCurrentUser(admin.Id, UserRole.Admin);
        await SendAsync(new ProcessWithdrawalCommand(request.Id));
        await SendAsync(new FailWithdrawalCommand(request.Id, "Beneficiary bank rejected the transfer"));
        var detail = await SendAsync(new GetAdminWithdrawalByIdQuery(request.Id));
        detail.Status.Should().Be(WithdrawalStatus.Failed);
        detail.BankTransferReference.Should().BeNull();
        detail.FailureReason.Should().Be("Beneficiary bank rejected the transfer");
        var wallet = await Db.Wallets.AsNoTracking().SingleAsync(w => w.Id == request.WalletId);
        wallet.AvailableBalance.Should().Be(1_000_000); wallet.WithdrawingBalance.Should().Be(0);
    }
}
