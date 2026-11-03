using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence.Migrations;

namespace TutorHub.Api.IntegrationTests;

public class LegacyTransactionStatusTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task LegacyStatusRepairPreservesLedger_AndRestoresAdminReadEndpoints()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(student.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        var paymentId = Guid.NewGuid(); var payoutId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var reference = $"LegacyNormalize-{Guid.NewGuid():N}";
        // Recreate imported rows from the pre-constraint schema in the isolated test DB.
        await Db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Transactions\" DROP CONSTRAINT \"CK_Transactions_Status\"");
        await Db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "Transactions" ("Id","BookingId","Amount","Type","Status","PlatformFeeRate","PlatformFeeAmount","PayoutAmount","PaymentGatewayRef","CreatedAt","SettlementRequired")
            VALUES ({paymentId},{booking.Id},{100m},'BookingPayment','Success',{0m},{0m},{0m},{reference + "-payment"},{now},false)
            """);
        await Db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "Transactions" ("Id","BookingId","Amount","Type","Status","PlatformFeeRate","PlatformFeeAmount","PayoutAmount","PaymentGatewayRef","CreatedAt","ReleasedAt","SettlementRequired")
            VALUES ({payoutId},{booking.Id},{100m},'SessionPayoutCredit','Success',{0.1m},{10m},{90m},{reference + "-payout"},{now},{now},false)
            """);
        var before = await Db.Database.SqlQuery<string>($"""
            SELECT (to_jsonb(t) - 'Status')::text AS "Value" FROM "Transactions" t
            WHERE t."Id" IN ({paymentId},{payoutId}) ORDER BY t."Id"
            """).ToListAsync();
        using var client = Factory.CreateClient();
        SetCurrentUser(admin.Id, UserRole.Admin);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(admin));
        using var baseline = JsonDocument.Parse(await client.GetStringAsync("/api/v1/admin/dashboard/stats"));
        var baselinePayout = baseline.RootElement.GetProperty("data").GetProperty("financials").GetProperty("totalTutorPayouts").GetDecimal();
        (await client.GetAsync("/api/v1/admin/dashboard/revenue-chart")).StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        await using (var transaction = await Db.Database.BeginTransactionAsync())
        {
            await Db.Database.ExecuteSqlRawAsync(NormalizeLegacyTransactionStatuses.NormalizeSql);
            await Db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Transactions\" ADD CONSTRAINT \"CK_Transactions_Status\" CHECK (\"Status\" IN ('Held','Released','Refunded','Pending','Succeeded','Failed'))");
            await transaction.CommitAsync();
        }
        var after = await Db.Database.SqlQuery<string>($"""
            SELECT (to_jsonb(t) - 'Status')::text AS "Value" FROM "Transactions" t
            WHERE t."Id" IN ({paymentId},{payoutId}) ORDER BY t."Id"
            """).ToListAsync();
        after.Should().Equal(before);
        var repaired = await Db.Transactions.AsNoTracking().Where(t => t.Id == paymentId || t.Id == payoutId).ToListAsync();
        repaired.Should().OnlyContain(t => t.Status == TransactionStatus.Succeeded);
        foreach (var path in new[] { "/admin/dashboard/stats", "/admin/dashboard/revenue-chart", "/admin/analytics/platform-revenue", $"/admin/transactions?status=Succeeded&search={reference}" })
            (await client.GetAsync("/api/v1" + path)).StatusCode.Should().Be(HttpStatusCode.OK);
        var ledger = await client.GetStringAsync($"/api/v1/admin/transactions?status=Succeeded&search={reference}");
        using var json = JsonDocument.Parse(ledger);
        json.RootElement.GetProperty("data").GetProperty("items").GetArrayLength().Should().Be(2);
        using var restoredStats = JsonDocument.Parse(await client.GetStringAsync("/api/v1/admin/dashboard/stats"));
        restoredStats.RootElement.GetProperty("data").GetProperty("financials").GetProperty("totalTutorPayouts").GetDecimal().Should().Be(baselinePayout + 90m);
        var tamper = () => Db.Database.ExecuteSqlInterpolatedAsync($"UPDATE \"Transactions\" SET \"Amount\"={1m} WHERE \"Id\"={payoutId}");
        (await tamper.Should().ThrowAsync<PostgresException>()).Which.SqlState.Should().Be("P0001");
        // The normalized payment is immutable; new invalid statuses are covered below.
        var unknownId = Guid.NewGuid();
        var invalidInsert = () => Db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "Transactions" ("Id","BookingId","Amount","Type","Status","PlatformFeeRate","PlatformFeeAmount","PayoutAmount","CreatedAt","SettlementRequired")
            VALUES ({unknownId},{booking.Id},{100m},'BookingPayment','Success',{0m},{0m},{0m},{now},false)
            """);
        (await invalidInsert.Should().ThrowAsync<PostgresException>()).Which.SqlState.Should().Be("23514");
    }
}
