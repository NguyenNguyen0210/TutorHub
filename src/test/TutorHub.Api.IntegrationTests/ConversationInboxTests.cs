using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Conversations.GetMyConversations;
using TutorHub.Application.Features.Conversations.GetOrCreateConversation;
using TutorHub.Application.Features.Conversations.SendMessage;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class ConversationInboxTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Theory]
    [InlineData(UserRole.Student)]
    [InlineData(UserRole.Tutor)]
    public async Task EmptyConversation_OpensWithoutAppearingInEitherInbox_UntilFirstMessage(UserRole initiator)
    {
        var (tutor, profile, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, profile, admin.Id);
        var sender = initiator == UserRole.Student ? student : tutor;
        var recipient = initiator == UserRole.Student ? tutor : student;
        SetCurrentUser(sender.Id, initiator);
        var conversation = await SendAsync(new GetOrCreateConversationCommand(recipient.Id));

        foreach (var participant in new[] { student, tutor })
        {
            SetCurrentUser(participant.Id, participant.Role);
            var inbox = await SendAsync(new GetMyConversationsQuery(PageSize: 1));
            inbox.Items.Should().BeEmpty();
            inbox.HasMore.Should().BeFalse();
            inbox.NextCursor.Should().BeNull();

            using var client = Factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
                Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(participant));
            var response = await client.GetAsync($"/api/v1/conversations/{conversation.Id}");
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            json.RootElement.GetProperty("data").GetProperty("id").GetGuid().Should().Be(conversation.Id);
        }

        SetCurrentUser(sender.Id, initiator);
        (await SendAsync(new GetOrCreateConversationCommand(recipient.Id))).Id.Should().Be(conversation.Id);
        var message = await SendAsync(new SendMessageCommand(conversation.Id, "Hello, let's arrange our lesson."));
        foreach (var participant in new[] { student, tutor })
        {
            SetCurrentUser(participant.Id, participant.Role);
            var inbox = await SendAsync(new GetMyConversationsQuery());
            inbox.Items.Should().ContainSingle().Which.LastMessageId.Should().Be(message.Id);
            inbox.Items[0].UnreadCount.Should().Be(participant.Id == sender.Id ? 0 : 1);
        }
        (await Db.Messages.AsNoTracking().CountAsync(m => m.ConversationId == conversation.Id)).Should().Be(1);
    }

    [Fact]
    public async Task EmptyConversation_CannotBeOpenedByAnUnrelatedUser()
    {
        var (tutor, profile, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, profile, admin.Id);
        SetCurrentUser(student.Id, UserRole.Student);
        var conversation = await SendAsync(new GetOrCreateConversationCommand(tutor.Id));
        var (outsider, _, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(outsider.Id, UserRole.Tutor);
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
            Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(outsider));
        (await client.GetAsync($"/api/v1/conversations/{conversation.Id}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.GetAsync($"/api/v1/conversations/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await SendAsync(new GetMyConversationsQuery())).Items.Should().BeEmpty();
    }
}
