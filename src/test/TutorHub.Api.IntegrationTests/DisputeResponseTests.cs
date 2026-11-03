using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.Features.Disputes.Commands.SubmitDisputeResponse;
using TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;
using TutorHub.Application.Features.Disputes.Queries.GetMyDisputes;
using TutorHub.Application.Features.Disputes.Queries.AdminGetDisputeInvestigation;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class DisputeResponseTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    private async Task<(Guid DisputeId, Guid StudentId, Guid TutorId, Guid AdminId)> ArrangeDispute()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(student.Id, UserRole.Student);
        var dto = await SendAsync(new CreateBookingCommand(service.Id));
        var booking = await Db.Bookings.Include(x => x.StudentProfile).Include(x => x.TutorProfile).FirstAsync(x => x.Id == dto.Id);
        await Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>().ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        await Db.SaveChangesAsync();
        var session = await Db.Sessions.FirstAsync(x => x.Enrollment.BookingId == booking.Id && x.SessionNumber == 1);
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        session.TryStartGracePeriod(DateTime.UtcNow.AddHours(-2), TimeSpan.FromHours(12));
        await Db.SaveChangesAsync();
        var dispute = await SendAsync(new CreateDisputeCommand(session.Id, DisputeReason.QualityIssue, "Student explanation of a lesson quality issue."));
        return (dispute.Id, student.Id, tutor.UserId, admin.Id);
    }

    [Fact]
    public async Task ParticipantTextOnlyResponse_IsDurableAndVisibleToBothSidesAndAdmin_WithoutChangingMoney()
    {
        var (id, student, tutor, admin) = await ArrangeDispute();
        var transactions = await Db.Transactions.CountAsync();
        var wallets = await Db.Wallets.AsNoTracking().OrderBy(x => x.Id).Select(x => new { x.Id, x.AvailableBalance, x.PendingBalance }).ToListAsync();
        SetCurrentUser(tutor, UserRole.Tutor);
        var command = new SubmitDisputeResponseCommand(id, Guid.NewGuid(), "  I taught the complete lesson and can explain the timeline.  ");
        await Assert.ThrowsAsync<NotFoundException>(() => SendAsync(command with { DisputeId = Guid.NewGuid() }));
        var response = await SendAsync(command);
        response.Content.Should().Be(command.Content.Trim());
        response.AuthorUserId.Should().Be(tutor);
        response.AuthorRole.Should().Be(UserRole.Tutor);
        response.AuthorName.Should().NotBeEmpty();
        var replay = await SendAsync(command);
        replay.Id.Should().Be(response.Id);
        (await Db.DisputeResponses.CountAsync(x => x.DisputeId == id)).Should().Be(1);
        SetCurrentUser(student, UserRole.Student);
        (await SendAsync(new GetMyDisputesQuery())).Single(x => x.Id == id).Responses.Single().Content.Should().Be(response.Content);
        SetCurrentUser(admin, UserRole.Admin);
        (await SendAsync(new AdminGetDisputeInvestigationQuery(id))).Dispute.Responses.Single().Id.Should().Be(response.Id);
        (await Db.Transactions.CountAsync()).Should().Be(transactions);
        (await Db.Wallets.AsNoTracking().OrderBy(x => x.Id).Select(x => new { x.Id, x.AvailableBalance, x.PendingBalance }).ToListAsync()).Should().BeEquivalentTo(wallets);
    }

    [Fact]
    public async Task ResponseRejectsOutsidersInvalidContentReusedIdsAndNewSubmissionsAfterClosure()
    {
        var (id, student, tutor, admin) = await ArrangeDispute();
        var command = new SubmitDisputeResponseCommand(id, Guid.NewGuid(), "A participant explanation with enough useful detail.");
        SetCurrentUser(admin, UserRole.Admin);
        await Assert.ThrowsAsync<ForbiddenException>(() => SendAsync(command));
        SetCurrentUser(tutor, UserRole.Tutor);
        await Assert.ThrowsAsync<AppValidationException>(() => SendAsync(command with { Content = " " }));
        await Assert.ThrowsAsync<AppValidationException>(() => SendAsync(command with { Content = new string('a', 10001) }));
        await SendAsync(command);
        await Assert.ThrowsAsync<ConflictException>(() => SendAsync(command with { Content = "Different content cannot replace the original explanation." }));
        SetCurrentUser(student, UserRole.Student);
        await Assert.ThrowsAsync<ConflictException>(() => SendAsync(command));
        SetCurrentUser(admin, UserRole.Admin);
        await SendAsync(new AdminResolveDisputeCommand(id, DisputeResolutionDecision.DismissedNoFinancialChange, null, "Reviewed the explanations; dismissing without a financial change."));
        SetCurrentUser(tutor, UserRole.Tutor);
        await Assert.ThrowsAsync<ConflictException>(() => SendAsync(command with { SubmissionId = Guid.NewGuid() }));
        (await SendAsync(command)).Id.Should().Be(command.SubmissionId);
    }

    [Fact]
    public async Task EvidenceCanAttachOnlyToOwnResponseInSameDispute_AndConcurrentRetriesStoreOneExplanation()
    {
        var (id, student, tutor, _) = await ArrangeDispute();
        SetCurrentUser(tutor, UserRole.Tutor);
        var command = new SubmitDisputeResponseCommand(id, Guid.NewGuid(), "The lesson happened at the agreed time, with supporting evidence.");
        var results = await Task.WhenAll(SendAsync(command), SendAsync(command));
        results.Select(x => x.Id).Distinct().Should().ContainSingle();
        (await Db.DisputeResponses.CountAsync(x => x.DisputeId == id)).Should().Be(1);
        var file = new UploadDisputeEvidenceCommand(id, "proof.txt", "https://example.test/proof.txt", "text/plain", 50, command.SubmissionId);
        var evidence = await SendAsync(file);
        evidence.ResponseId.Should().Be(command.SubmissionId);
        SetCurrentUser(student, UserRole.Student);
        await Assert.ThrowsAsync<ForbiddenException>(() => SendAsync(file));
        var own = await SendAsync(command with { SubmissionId = Guid.NewGuid(), Content = "The student also has additional information to provide." });
        await Assert.ThrowsAsync<ForbiddenException>(() => SendAsync(file with { ResponseId = Guid.NewGuid() }));
        (await SendAsync(new GetMyDisputesQuery())).Single(x => x.Id == id).Evidences.Single().ResponseId.Should().Be(command.SubmissionId);
        own.AuthorUserId.Should().Be(student);
    }

    [Fact]
    public async Task HttpEndpoint_BindsTextAndOptionalEvidenceResponseId_AndDerivesAuthorFromAuthentication()
    {
        var (id, _, tutor, _) = await ArrangeDispute();
        SetCurrentUser(tutor, UserRole.Tutor);
        var user = await Db.Users.FirstAsync(x => x.Id == tutor);
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(user));
        var submissionId = Guid.NewGuid();
        var response = await client.PostAsJsonAsync($"/api/v1/disputes/{id}/responses", new { submissionId, content = "My written explanation, submitted without a required attachment.", authorUserId = Guid.NewGuid() });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("data").GetProperty("authorUserId").GetGuid().Should().Be(tutor);
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(submissionId.ToString()), "responseId");
        form.Add(new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D }), "file", "proof.png");
        var upload = await client.PostAsync($"/api/v1/disputes/{id}/evidence", form);
        upload.StatusCode.Should().Be(HttpStatusCode.Created);
        (await Db.DisputeEvidences.AsNoTracking().SingleAsync(x => x.DisputeId == id)).ResponseId.Should().Be(submissionId);
    }
}
