using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
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
}
