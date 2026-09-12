using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// M3 regression: the filtered unique index IX_Disputes_ActiveSessionId must
/// reject a second active (non-terminal) dispute for the same session at the
/// database level, independent of the handler's dedup query.
/// </summary>
public class ActiveDisputeUniqueIndexTests : IntegrationTestBase
{
    public ActiveDisputeUniqueIndexTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    private async Task<(Guid SessionId, Guid StudentUserId, Guid TutorUserId)> SeedSessionAsync()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, studentProfile, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        var category = new Category { Id = Guid.NewGuid(), Name = $"Cat {Guid.NewGuid():N}", IsActive = true };
        var subject = new Subject { Id = Guid.NewGuid(), Name = $"Subj {Guid.NewGuid():N}", CategoryId = category.Id, IsActive = true };
        Db.Categories.Add(category);
        Db.Subjects.Add(subject);

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            TutorProfileId = tutor.Id,
            SubjectId = subject.Id,
            TotalPrice = 900_000m,
            TotalSessions = 1,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Status = BookingStatus.Paid,
            CreatedAt = DateTime.UtcNow
        };
        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            StudentProfileId = studentProfile.Id,
            TutorProfileId = tutor.Id,
            ServiceId = service.Id,
            SubjectId = subject.Id,
            TotalPrice = 900_000m,
            TotalSessions = 1,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            CreatedAt = DateTime.UtcNow
        };
        enrollment.Activate();
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            SessionNumber = 1,
            EarningAmount = 900_000m,
            CreatedAt = DateTime.UtcNow
        };

        Db.Bookings.Add(booking);
        Db.Enrollments.Add(enrollment);
        Db.Sessions.Add(session);
        await Db.SaveChangesAsync();

        return (session.Id, studentUser.Id, tutorUser.Id);
    }

    private Dispute NewDispute(Guid sessionId, Guid studentUserId, Guid tutorUserId) => new()
    {
        Id = Guid.NewGuid(),
        SessionId = sessionId,
        InitiatorUserId = studentUserId,
        RespondentUserId = tutorUserId,
        Reason = DisputeReason.QualityIssue,
        Description = "A sufficiently long dispute description for the index test.",
        CreatedAt = DateTime.UtcNow
    };

    [Fact]
    public async Task SecondActiveDispute_ForSameSession_IsRejected()
    {
        var (sessionId, studentUserId, tutorUserId) = await SeedSessionAsync();

        Db.Disputes.Add(NewDispute(sessionId, studentUserId, tutorUserId));
        await Db.SaveChangesAsync();

        Db.Disputes.Add(NewDispute(sessionId, studentUserId, tutorUserId));
        var act = () => Db.SaveChangesAsync();

        await act.Should().ThrowAsync<DbUpdateException>();
    }

    [Fact]
    public async Task NewActiveDispute_AllowedAfterPreviousResolved()
    {
        var (sessionId, studentUserId, tutorUserId) = await SeedSessionAsync();

        var first = NewDispute(sessionId, studentUserId, tutorUserId);
        Db.Disputes.Add(first);
        await Db.SaveChangesAsync();

        first.DismissByAdmin(tutorUserId, "No grounds", DateTime.UtcNow);
        await Db.SaveChangesAsync();

        Db.Disputes.Add(NewDispute(sessionId, studentUserId, tutorUserId));
        var act = () => Db.SaveChangesAsync();

        await act.Should().NotThrowAsync();
    }
}
