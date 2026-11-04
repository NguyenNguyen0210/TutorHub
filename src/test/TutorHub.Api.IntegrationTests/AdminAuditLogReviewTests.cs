using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Admin.AuditLogs.GetAdminAuditLogs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class AdminAuditLogReviewTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task Filters_SearchesBeforePaging_UsesVietnamDayBoundaries_AndPreservesOriginalDetail()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        admin.FullName = "Nguyễn Hải Yến";
        var marker = Guid.NewGuid().ToString();
        var start = new DateTime(2026, 11, 3, 17, 0, 0, DateTimeKind.Utc);
        var records = new[] { -1, 0, 3600, 86399, 86400 }.Select(seconds => new AuditLog
        {
            Id = Guid.NewGuid(), UserId = admin.Id, Action = "ADMIN_CONVERSATION_INSPECTED", EntityName = "Conversation",
            EntityId = marker, CorrelationId = "corr-%_" + marker, CreatedAt = start.AddSeconds(seconds),
            NewValuesJson = " {\"returnedCount\":0,\"operationalReason\":\"  original reason  \"} "
        }).ToArray();
        Db.AuditLogs.AddRange(records);
        await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        var filter = new AdminGetAuditLogsQuery(EntityId: marker, Search: "nguyen hai yen", DateFrom: new DateTime(2026, 11, 4), DateTo: new DateTime(2026, 11, 4), PageSize: 2, OldestFirst: true);
        var first = await SendAsync(filter);
        first.TotalCount.Should().Be(3);
        first.TotalPages.Should().Be(2);
        first.HasNextPage.Should().BeTrue();
        first.Items.Select(x => x.Id).Should().Equal(records[1].Id, records[2].Id);
        var next = await SendAsync(filter with { PageNumber = 2 });
        next.Items.Should().ContainSingle(x => x.Id == records[3].Id);
        next.HasNextPage.Should().BeFalse();
        next.HasPreviousPage.Should().BeTrue();
        var descending = await SendAsync(filter with { OldestFirst = false });
        descending.Items.First().Id.Should().Be(records[3].Id);
        (await SendAsync(filter with { Search = "%_", Action = "ADMIN_CONVERSATION_INSPECTED" })).TotalCount.Should().Be(3);
        (await SendAsync(filter with { Search = marker })).TotalCount.Should().Be(3);
        (await SendAsync(filter with { Search = "", Action = "NotAnEvent" })).TotalCount.Should().Be(0);
        var invalid = () => SendAsync(filter with { DateFrom = new DateTime(2026, 11, 5) });
        await invalid.Should().ThrowAsync<BadRequestException>();
        var options = await SendAsync(new AdminGetAuditOptionsQuery());
        options.Entities.Should().Contain("Conversation");
        options.Actions.Should().Contain("ADMIN_CONVERSATION_INSPECTED");

        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(admin));
        var detail = await client.GetAsync($"/api/v1/admin/audit-logs/{records[1].Id}");
        detail.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await detail.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("data").GetProperty("newValuesJson").GetString().Should().Be(records[1].NewValuesJson);
        (await client.GetAsync($"/api/v1/admin/audit-logs/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        SetCurrentUser(student.Id, UserRole.Student);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(student));
        foreach (var suffix in new[] { "", "/options", $"/{records[1].Id}" })
            (await client.GetAsync("/api/v1/admin/audit-logs" + suffix)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
