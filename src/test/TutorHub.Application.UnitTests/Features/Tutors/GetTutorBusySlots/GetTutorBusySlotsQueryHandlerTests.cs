using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.GetTutorBusySlots;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.GetTutorBusySlots;

public class GetTutorBusySlotsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubClock _clock = new(new DateTime(2026, 10, 21, 10, 0, 0, DateTimeKind.Utc));
    private readonly GetTutorBusySlotsQueryHandler _handler;

    public GetTutorBusySlotsQueryHandlerTests()
    {
        _handler = new GetTutorBusySlotsQueryHandler(_contextMock.Object, _clock);
    }

    [Fact]
    public async Task Handle_TutorNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.TutorProfiles)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile>()).Object);

        var query = new GetTutorBusySlotsQuery(Guid.NewGuid());

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _handler.Handle(query, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_TutorNotApproved_ShouldThrowNotFoundException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };

        _contextMock.Setup(c => c.TutorProfiles)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);

        // Application is Pending, not Approved
        var app = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            SubmittedAt = _clock.UtcNow
        };
        _contextMock.Setup(c => c.TutorApplications)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { app }).Object);

        var query = new GetTutorBusySlotsQuery(tutor.Id);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _handler.Handle(query, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ApprovedTutor_ShouldReturnOnlyScheduledSessionsWithinRange()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var student = new StudentProfileBuilder().Build();
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };

        var app = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            SubmittedAt = _clock.UtcNow
        };
        app.Approve(Guid.NewGuid());

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            StudentProfileId = student.Id,
            SessionDurationMinutes = 60
        };

        var scheduledSessionInRange = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1
        };
        scheduledSessionInRange.Schedule(_clock.UtcNow.AddDays(1), _clock.UtcNow.AddDays(1).AddMinutes(60));

        var cancelledSessionInRange = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 2
        };
        cancelledSessionInRange.Schedule(_clock.UtcNow.AddDays(2), _clock.UtcNow.AddDays(2).AddMinutes(60));
        cancelledSessionInRange.CancelSingle("Cancelled", _clock.UtcNow);

        var outOfRangeSession = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 3
        };
        outOfRangeSession.Schedule(_clock.UtcNow.AddDays(40), _clock.UtcNow.AddDays(40).AddMinutes(60));

        _contextMock.Setup(c => c.TutorProfiles)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);
        _contextMock.Setup(c => c.TutorApplications)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { app }).Object);
        _contextMock.Setup(c => c.Sessions)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<Session>
            {
                scheduledSessionInRange,
                cancelledSessionInRange,
                outOfRangeSession
            }).Object);

        var query = new GetTutorBusySlotsQuery(tutor.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].StartAt.Should().Be(scheduledSessionInRange.StartAt!.Value);
        result[0].EndAt.Should().Be(scheduledSessionInRange.EndAt!.Value);
    }
}
