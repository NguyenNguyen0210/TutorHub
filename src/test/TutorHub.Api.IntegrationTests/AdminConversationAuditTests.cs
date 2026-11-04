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
        var report = TutorHub.Domain.Entities.Report.Create(student.Id, TrustReportType.UserConduct, "Investigate conversation conduct", reportedUserId: tutor.Id);
        Db.Reports.Add(report);
        Db.Messages.Add(new TutorHub.Domain.Entities.Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderUserId = student.Id, Content = "Outside permitted date range", CreatedAt = DateTime.UtcNow.AddDays(-40) });
        await Db.SaveChangesAsync();
        var scopeQuery = $"&reportId={report.Id}&fromDate={DateTime.UtcNow.AddDays(-1):yyyy-MM-dd}&toDate={DateTime.UtcNow.AddDays(1):yyyy-MM-dd}";
        var (otherTutor, otherProfile, otherAdmin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (otherStudent, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, otherProfile, otherAdmin.Id);
        SetCurrentUser(otherStudent.Id, UserRole.Student);
        var unrelated = await SendAsync(new GetOrCreateConversationCommand(otherTutor.Id));
        await SendAsync(new SendMessageCommand(unrelated.Id, "Unrelated private conversation"));
        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(admin));
        SetCurrentUser(admin.Id, UserRole.Admin);
        (await client.GetAsync("/api/v1/admin/investigations/conversations?operationalReason=abc")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await client.GetAsync("/api/v1/admin/investigations/conversations?operationalReason=Investigate%20case%20123")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var scopedList = await client.GetAsync("/api/v1/admin/investigations/conversations?operationalReason=Investigate%20case%20123" + scopeQuery);
        scopedList.StatusCode.Should().Be(HttpStatusCode.OK);
        (await scopedList.Content.ReadAsStringAsync()).Should().Contain(conversation.Id.ToString()).And.NotContain(unrelated.Id.ToString());
        var messages = await client.GetAsync($"/api/v1/admin/investigations/conversations/{conversation.Id}/messages?operationalReason=Investigate%20case%20123" + scopeQuery);
        messages.StatusCode.Should().Be(HttpStatusCode.OK);
        (await messages.Content.ReadAsStringAsync()).Should().Contain("Private conversation text").And.NotContain("Outside permitted date range");
        var foreignScope = await client.GetAsync($"/api/v1/admin/investigations/conversations/{unrelated.Id}/messages?operationalReason=Investigate%20case%20123" + scopeQuery);
        foreignScope.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var audits = await Db.AuditLogs.AsNoTracking().Where(a => a.UserId == admin.Id && a.Action == "ADMIN_CONVERSATION_INSPECTED").ToListAsync();
        audits.Should().HaveCount(2);
        audits.Should().OnlyContain(a => a.NewValuesJson!.Contains(report.Id.ToString()));
        audits.Should().Contain(a => a.EntityId == conversation.Id.ToString());
        audits.Should().OnlyContain(a => a.NewValuesJson!.Contains("Investigate case 123") && !a.NewValuesJson.Contains("Private conversation text"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(student));
        SetCurrentUser(student.Id, UserRole.Student);
        (await client.GetAsync("/api/v1/admin/investigations/conversations?operationalReason=Investigate%20case%20123")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
