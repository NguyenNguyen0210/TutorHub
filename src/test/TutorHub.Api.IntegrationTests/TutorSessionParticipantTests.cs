using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Enrollments.GetMyEnrollments;
using TutorHub.Application.Features.LearningRecords.CreateLearningRecord;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class TutorSessionParticipantTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task TutorSummary_ReturnsTheEnrolledLearnersUserIdAndAvatar_WithoutExposingItToOtherTutors()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        student.AvatarUrl = "https://example.test/learner-avatar.png";
        await Db.SaveChangesAsync();
        SetCurrentUser(student.Id, UserRole.Student);
        var bookingDto = await SendAsync(new CreateBookingCommand(service.Id));
        var booking = await Db.Bookings.Include(b => b.StudentProfile).Include(b => b.TutorProfile).SingleAsync(b => b.Id == bookingDto.Id);
        await Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>().ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        await Db.SaveChangesAsync();
        SetCurrentUser(tutorUser.Id, UserRole.Tutor);
        var summary = (await SendAsync(new GetMyEnrollmentsQuery())).Items.Single(item => item.BookingId == booking.Id);
        summary.StudentUserId.Should().Be(student.Id);
        summary.StudentUserId.Should().NotBe(summary.StudentProfileId);
        summary.StudentAvatarUrl.Should().Be(student.AvatarUrl);
        summary.StudentName.Should().Be(student.FullName);
        var (stranger, _, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(stranger.Id, UserRole.Tutor);
        (await SendAsync(new GetMyEnrollmentsQuery())).Items.Should().NotContain(item => item.Id == summary.Id);
        var session = await Db.Sessions.SingleAsync(item => item.EnrollmentId == summary.Id && item.SessionNumber == 1);
        var start = DateTime.UtcNow.AddDays(1);
        session.Schedule(start, start.AddMinutes(summary.SessionDurationMinutes));
        session.Complete();
        await Db.SaveChangesAsync();
        var recordCommand = new CreateLearningRecordCommand(session.Id, "Actual completed lesson notes shared with the learner.");
        var strangerWrite = () => SendAsync(recordCommand);
        await strangerWrite.Should().ThrowAsync<ForbiddenException>();
        SetCurrentUser(tutorUser.Id, UserRole.Tutor);
        var record = await SendAsync(recordCommand);
        record.Content.Should().Be(recordCommand.Content);
        var duplicate = () => SendAsync(recordCommand);
        await duplicate.Should().ThrowAsync<ConflictException>();
    }
}
