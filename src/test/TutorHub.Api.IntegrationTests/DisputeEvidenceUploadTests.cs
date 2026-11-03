using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Common.Storage;
using TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class DisputeEvidenceUploadTests : IntegrationTestBase
{
    public DisputeEvidenceUploadTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task UploadEvidence_MultipartFormOverHttp_ValidatesMagicBytesAndCreatesEvidence()
    {
        // 1. Arrange: tutor, student, service, booking, session
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var bookingDto = await SendAsync(new CreateBookingCommand(service.Id));

        var booking = await Db.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.TutorProfile)
            .FirstAsync(b => b.Id == bookingDto.Id);

        var activation = Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>();
        await activation.ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        await Db.SaveChangesAsync();

        var session = await Db.Sessions.FirstAsync(s => s.Enrollment.BookingId == booking.Id && s.SessionNumber == 1);
        session.Schedule(DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1));
        session.TryStartGracePeriod(DateTime.UtcNow.AddHours(-1), TimeSpan.FromHours(12));
        await Db.SaveChangesAsync();

        // Create dispute
        var disputeDto = await SendAsync(new CreateDisputeCommand(session.Id, DisputeReason.TutorNoShow, "Tutor was absent for the whole session."));

        using var client = Factory.CreateClient();

        // Valid PNG header (89 50 4E 47 0D 0A 1A 0A)
        var validPngBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        var fileContent = new ByteArrayContent(validPngBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");

        using var form = new MultipartFormDataContent();
        form.Add(fileContent, "file", "evidence.png");

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/disputes/{disputeDto.Id}/evidence")
        {
            Content = form
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", IssueAccessToken(studentUser));

        SetCurrentUser(studentUser.Id, UserRole.Student);

        // 2. Act
        using var response = await client.SendAsync(request);

        // 3. Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        doc.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();

        var data = doc.RootElement.GetProperty("data");
        data.GetProperty("disputeId").GetGuid().Should().Be(disputeDto.Id);
        data.GetProperty("fileName").GetString().Should().Be("evidence.png");
        data.GetProperty("contentType").GetString().Should().Be("image/png");

        // Verify entity in database
        var evidenceEntity = await Db.DisputeEvidences.FirstOrDefaultAsync(e => e.DisputeId == disputeDto.Id);
        evidenceEntity.Should().NotBeNull();
        evidenceEntity!.FileName.Should().Be("evidence.png");
        evidenceEntity.ContentType.Should().Be("image/png");
    }

    private string IssueAccessToken(User user)
    {
        using var scope = Factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(user);
    }

    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D];
    private async Task<(DisputeDto Dispute, User Student, User Tutor, User Admin)> ArrangeCase()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(student.Id, UserRole.Student);
        var dto = await SendAsync(new CreateBookingCommand(service.Id));
        var booking = await Db.Bookings.Include(b => b.StudentProfile).Include(b => b.TutorProfile).SingleAsync(b => b.Id == dto.Id);
        await Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>().ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        await Db.SaveChangesAsync();
        var session = await Db.Sessions.FirstAsync(s => s.Enrollment.BookingId == booking.Id && s.SessionNumber == 1);
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        session.TryStartGracePeriod(DateTime.UtcNow.AddHours(-2), TimeSpan.FromHours(12));
        await Db.SaveChangesAsync();
        return (await SendAsync(new CreateDisputeCommand(session.Id, DisputeReason.QualityIssue, "A lesson issue requiring investigation.")), student, tutorUser, admin);
    }
    private static MultipartFormDataContent Form()
    {
        var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(Png), "file", "evidence.png");
        return form;
    }

    [Fact]
    public async Task DownloadUsesManagedObject_NotExpiredUrl_AndRequiresParticipantOrAdmin()
    {
        var (dispute, student, tutor, admin) = await ArrangeCase();
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", IssueAccessToken(student));
        using var form = Form();
        (await client.PostAsync($"/api/v1/disputes/{dispute.Id}/evidence", form)).StatusCode.Should().Be(HttpStatusCode.Created);
        var evidence = await Db.DisputeEvidences.SingleAsync(e => e.DisputeId == dispute.Id);
        evidence.ObjectKey.Should().StartWith($"reports/evidence/{dispute.Id:N}/");
        evidence.FileUrl.Should().BeEmpty();
        var key = evidence.ObjectKey!;
        var url = $"/api/v1/disputes/{dispute.Id}/evidence/{evidence.Id}/download";
        foreach (var user in new[] { student, tutor, admin })
        {
            SetCurrentUser(user.Id, user.Role);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", IssueAccessToken(user));
            var download = await client.GetAsync(url);
            download.StatusCode.Should().Be(HttpStatusCode.OK);
            (await download.Content.ReadAsByteArrayAsync()).Should().Equal(Png);
        }
        // Simulate a legacy signed URL that expired years ago. Only its generated
        // key is recovered; the external address is never requested.
        evidence.ObjectKey = null;
        evidence.FileUrl = $"https://expired.invalid/bucket/{key}?X-Amz-Date=20200101T000000Z&X-Amz-Expires=1";
        await Db.SaveChangesAsync();
        (await client.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.OK);
        evidence.FileUrl = "https://untrusted.invalid/foreign.pdf";
        await Db.SaveChangesAsync();
        (await client.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        evidence.ObjectKey = key;
        await Db.SaveChangesAsync();

        var (outsider, _, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(outsider.Id, outsider.Role);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", IssueAccessToken(outsider));
        (await client.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await client.GetAsync($"/api/v1/disputes/{Guid.NewGuid()}/evidence/{evidence.Id}/download")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        client.DefaultRequestHeaders.Authorization = null;
        (await client.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RejectsMetadataAndClosedOrUnauthorizedUploads_AndCleansPartialStorageWrites()
    {
        var (dispute, student, _, admin) = await ArrangeCase();
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", IssueAccessToken(student));
        var storage = (TestObjectStorageService)Scope.ServiceProvider.GetRequiredService<IObjectStorageService>();
        var count = storage.ObjectCount;
        var url = $"/api/v1/disputes/{dispute.Id}/evidence";
        (await client.PostAsJsonAsync(url, new { fileUrl = "https://untrusted.invalid/evil.pdf", fileName = "evil.pdf", contentType = "application/pdf", fileSizeBytes = 10 })).StatusCode.Should().Be(HttpStatusCode.UnsupportedMediaType);
        storage.ObjectCount.Should().Be(count);
        var (outsider, _, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(outsider.Id, outsider.Role);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", IssueAccessToken(outsider));
        using var unauthorized = Form();
        (await client.PostAsync(url, unauthorized)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        storage.ObjectCount.Should().Be(count);
        SetCurrentUser(student.Id, student.Role);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", IssueAccessToken(student));
        storage.FailNextUploadAfterWrite = true;
        using var failing = Form();
        (await client.PostAsync(url, failing)).StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        storage.ObjectCount.Should().Be(count);
        (await Db.DisputeEvidences.CountAsync(e => e.DisputeId == dispute.Id)).Should().Be(0);
        SetCurrentUser(admin.Id, admin.Role);
        await SendAsync(new AdminResolveDisputeCommand(dispute.Id, DisputeResolutionDecision.DismissedNoFinancialChange, null, "Closed after reviewing the reported issue."));
        SetCurrentUser(student.Id, student.Role);
        using var closed = Form();
        (await client.PostAsync(url, closed)).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        storage.ObjectCount.Should().Be(count);
    }
}
