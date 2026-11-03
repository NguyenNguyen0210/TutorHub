using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Conversations.GetOrCreateConversation;
using TutorHub.Application.Features.Conversations.SendMessage;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class AdminConversationAuditTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task OperationalReadRequiresReason_AndPersistsAuditWithoutMessageContent()
    {
        var (tutor, profile, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, profile, admin.Id);
        SetCurrentUser(student.Id, UserRole.Student);
        var conversation = await SendAsync(new GetOrCreateConversationCommand(tutor.Id));
        await SendAsync(new SendMessageCommand(conversation.Id, "Private conversation text"));
        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(admin));
        SetCurrentUser(admin.Id, UserRole.Admin);
        (await client.GetAsync("/api/v1/admin/conversations?operationalReason=abc")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await client.GetAsync("/api/v1/admin/conversations?operationalReason=Investigate%20case%20123")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.GetAsync($"/api/v1/admin/conversations/{conversation.Id}/messages?operationalReason=Investigate%20case%20123")).StatusCode.Should().Be(HttpStatusCode.OK);
        var audits = await Db.AuditLogs.AsNoTracking().Where(a => a.UserId == admin.Id && a.Action == "ADMIN_CONVERSATION_INSPECTED").ToListAsync();
        audits.Should().HaveCount(2);
        audits.Should().Contain(a => a.EntityId == conversation.Id.ToString());
        audits.Should().OnlyContain(a => a.NewValuesJson!.Contains("Investigate case 123") && !a.NewValuesJson.Contains("Private conversation text"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(student));
        SetCurrentUser(student.Id, UserRole.Student);
        (await client.GetAsync("/api/v1/admin/conversations?operationalReason=Investigate%20case%20123")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
