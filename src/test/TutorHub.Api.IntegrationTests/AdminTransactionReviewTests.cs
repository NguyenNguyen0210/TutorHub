using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class AdminTransactionReviewTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task VietnamCalendarRange_TypeAndSort_AreAppliedBeforePagination()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(student.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        var start = new DateTime(2026, 11, 2, 17, 0, 0, DateTimeKind.Utc);
        Transaction Row(DateTime date, decimal amount, TransactionType type = TransactionType.StudentRefund) => new() {
            Id = Guid.NewGuid(), BookingId = booking.Id, Type = type, Amount = amount,
            Status = TransactionStatus.Pending, CreatedAt = date, PaymentGatewayRef = "REVIEW-" + Guid.NewGuid()
        };
        var before = Row(start.AddTicks(-10), 1);
        var first = Row(start, 100);
        var second = Row(start.AddHours(23).AddMinutes(59), 300);
        var excluded = Row(start.AddDays(1), 500);
        var payment = Row(start.AddHours(2), 700, TransactionType.BookingPayment);
        Db.Transactions.AddRange(before, first, second, excluded, payment); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        var date = new DateTime(2026, 11, 3);
        var filter = new GetAdminTransactionsQuery(FromDate: date, ToDate: date, BookingId: booking.Id, Type: TransactionType.StudentRefund, Sort: AdminTransactionSort.AmountDesc, PageSize: 1);
        var page1 = await SendAsync(filter);
        page1.TotalCount.Should().Be(2); page1.TotalPages.Should().Be(2);
        page1.Items.Single().Id.Should().Be(second.Id);
        (await SendAsync(filter with { PageNumber = 2 })).Items.Single().Id.Should().Be(first.Id);
        (await SendAsync(filter with { Sort = AdminTransactionSort.AmountAsc })).Items.Single().Id.Should().Be(first.Id);
        (await SendAsync(filter with { Sort = AdminTransactionSort.Oldest })).Items.Single().Id.Should().Be(first.Id);
        (await SendAsync(filter with { Sort = AdminTransactionSort.Newest })).Items.Single().Id.Should().Be(second.Id);
        (await SendAsync(new GetAdminTransactionsQuery(Search: first.Id.ToString()))).Items.Single().Id.Should().Be(first.Id);
    }

    [Fact]
    public async Task DetailAndRelatedLedger_UseRealMetadata_AndAreAdminOnly()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(student.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        var now = DateTime.UtcNow;
        var payout = Transaction.CreatePayout(booking.Id, Guid.NewGuid(), null, 300_000, 0.1m, 30_000, 270_000, "REVIEW-PAYOUT-" + Guid.NewGuid(), now);
        // No session row is required for this financial-only fixture; nullable linkage stays honest.
        payout.SessionId = null;
        var refund = Transaction.CreateRefund(booking.Id, null, null, payout, 50_000, "REVIEW-REFUND-" + Guid.NewGuid(), "Refund pending reconciliation", now.AddSeconds(1));
        Db.Transactions.AddRange(payout, refund); await Db.SaveChangesAsync();
        service.SoftDelete(admin.Id); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(admin));
        using var detail = JsonDocument.Parse(await client.GetStringAsync($"/api/v1/admin/transactions/{refund.Id}"));
        var data = detail.RootElement.GetProperty("data");
        data.GetProperty("relatedTransactionId").GetGuid().Should().Be(payout.Id);
        data.GetProperty("serviceTitle").GetString().Should().Be(service.Title);
        data.GetProperty("refundedAt").ValueKind.Should().Be(JsonValueKind.Null);
        var related = await SendAsync(new GetAdminTransactionsQuery(BookingId: booking.Id));
        related.Items.Select(item => item.Id).Should().Contain(new[] { payout.Id, refund.Id });
        (await client.GetAsync($"/api/v1/admin/transactions/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.GetAsync("/api/v1/admin/transactions?sort=99")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await client.GetAsync("/api/v1/admin/transactions?type=99")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await client.GetAsync("/api/v1/admin/transactions?fromDate=2026-11-04&toDate=2026-11-03")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(student));
        SetCurrentUser(student.Id, UserRole.Student);
        (await client.GetAsync($"/api/v1/admin/transactions/{refund.Id}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
