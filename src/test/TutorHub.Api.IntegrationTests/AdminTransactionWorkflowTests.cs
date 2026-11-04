using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class AdminTransactionWorkflowTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task AdminCanFindRefundByReference_WithTypeAndExactDateFilters()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(student.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        var reference = $"ledger-{Guid.NewGuid():N}";
        var transaction = Transaction.CreateRefund(booking.Id, null, null, null, 100_000m, reference, "Test refund ledger", DateTime.UtcNow);
        transaction.Status = TransactionStatus.Succeeded;
        Db.Transactions.Add(transaction);
        await Db.SaveChangesAsync();
        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(admin));
        SetCurrentUser(admin.Id, UserRole.Admin);
        var day = transaction.CreatedAt.AddHours(7).ToString("yyyy-MM-dd");
        var response = await client.GetAsync($"/api/v1/admin/transactions?search={reference}&status=Succeeded&fromDate={day}&toDate={day}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var item = json.RootElement.GetProperty("data").GetProperty("items").EnumerateArray().Single();
        item.GetProperty("id").GetGuid().Should().Be(transaction.Id);
        item.GetProperty("type").GetString().Should().Be("StudentRefund");
        item.GetProperty("grossAmount").GetDecimal().Should().Be(100_000m);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(student));
        SetCurrentUser(student.Id, UserRole.Student);
        (await client.GetAsync("/api/v1/admin/transactions")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
