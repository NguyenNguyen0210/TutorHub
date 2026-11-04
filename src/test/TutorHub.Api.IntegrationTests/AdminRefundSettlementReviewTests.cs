using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;
public class AdminRefundSettlementReviewTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task SettlementRequiresOutstandingObligationAndReference_DoesNotCreditWalletOrRepeatSuccess()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, profile, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var booking = new Booking { Id = Guid.NewGuid(), StudentProfileId = profile.Id, TutorProfileId = tutor.Id, ServiceId = service.Id, SubjectId = service.SubjectId, TotalPrice = service.Price, TotalSessions = 3, SessionDurationMinutes = 60, Status = BookingStatus.Cancelled, CreatedAt = DateTime.UtcNow };
        Db.Bookings.Add(booking);
        var refund = Transaction.CreateRefund(booking.Id, null, null, null, 100_000m, $"REF-{Guid.NewGuid():N}", "External refund", DateTime.UtcNow);
        refund.SettlementRequired = true;
        var internalRefund = Transaction.CreateRefund(booking.Id, null, null, null, 50_000m, $"REF-{Guid.NewGuid():N}", "No external obligation", DateTime.UtcNow);
        Db.Transactions.AddRange(refund, internalRefund); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        var list = await SendAsync(new GetAdminTransactionsQuery(BookingId: booking.Id, SettlementRequired: true));
        list.Items.Should().ContainSingle(t => t.Id == refund.Id);
        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(admin));
        var endpoint = $"/api/v1/admin/disputes/refunds/{refund.Id}/callback";
        (await client.PostAsJsonAsync(endpoint, new { outcome = "Succeeded" })).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await client.PostAsJsonAsync($"/api/v1/admin/disputes/refunds/{internalRefund.Id}/callback", new { outcome = "Succeeded", providerReference = "BANK-123" })).StatusCode.Should().Be(HttpStatusCode.Conflict);
        var walletBefore = await Db.Wallets.AsNoTracking().Where(w => w.TutorProfileId == tutor.Id).Select(w => w.AvailableBalance).SingleAsync();
        (await client.PostAsJsonAsync(endpoint, new { outcome = "Failed", failureReason = "Bank transfer not yet completed" })).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync(endpoint, new { outcome = "Succeeded", providerReference = "BANK-RECONCILED-123" })).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync(endpoint, new { outcome = "Succeeded", providerReference = "BANK-RECONCILED-123" })).StatusCode.Should().Be(HttpStatusCode.Conflict);
        var stored = await Db.Transactions.AsNoTracking().SingleAsync(t => t.Id == refund.Id);
        stored.SettlementRequired.Should().BeFalse(); stored.Status.Should().Be(TransactionStatus.Succeeded);
        stored.PaymentGatewayRef.Should().Be("BANK-RECONCILED-123");
        (await Db.Wallets.AsNoTracking().Where(w => w.TutorProfileId == tutor.Id).Select(w => w.AvailableBalance).SingleAsync()).Should().Be(walletBefore);
        var audit = await Db.AuditLogs.AsNoTracking().SingleAsync(a => a.EntityId == refund.Id.ToString() && a.Action == "RefundSettlementSucceeded");
        using var json = JsonDocument.Parse(audit.NewValuesJson!);
        json.RootElement.GetProperty("providerReference").GetString().Should().Be("BANK-RECONCILED-123");
        SetCurrentUser(student.Id, UserRole.Student);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(student));
        (await client.PostAsJsonAsync(endpoint, new { outcome = "Succeeded", providerReference = "BANK-123" })).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
