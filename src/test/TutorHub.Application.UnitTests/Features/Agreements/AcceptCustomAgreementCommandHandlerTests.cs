using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Agreements.Commands.AcceptCustomAgreement;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Agreements;

public class AcceptCustomAgreementCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly AcceptCustomAgreementCommandHandler _handler;

    private readonly List<CustomAgreement> _agreements = new();
    private readonly List<OutboxMessage> _outboxMessages = new();

    public AcceptCustomAgreementCommandHandlerTests()
    {
        _contextMock.Setup(c => c.CustomAgreements).Returns(MockDbSetHelper.CreateMockDbSet(_agreements).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(_outboxMessages).Object);

        _handler = new AcceptCustomAgreementCommandHandler(_contextMock.Object, _currentUser);
    }

    [Fact]
    public async Task Handle_WhenValid_TransitionsToAcceptedAndEnqueuesOutboxEvent()
    {
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student User" };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor User" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Chemistry" };

        var agreement = new CustomAgreement
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            StudentProfileId = student.Id,
            StudentProfile = student,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Chemistry Course",
            Description = "5 sessions",
            TotalPrice = 1000000m,
            TotalSessions = 5,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Status = CustomAgreementStatus.Proposed,
            ExpiresAt = DateTime.UtcNow.AddDays(5),
            CreatedAt = DateTime.UtcNow
        };
        _agreements.Add(agreement);

        _currentUser.Set(studentUser.Id, UserRole.Student);

        var command = new AcceptCustomAgreementCommand(agreement.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(CustomAgreementStatus.Accepted);
        agreement.Status.Should().Be(CustomAgreementStatus.Accepted);
        agreement.AcceptedAt.Should().NotBeNull();

        _outboxMessages.Should().HaveCount(1);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCallerNotDesignatedStudent_ThrowsForbiddenException()
    {
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student 1" };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor User" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var agreement = new CustomAgreement
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            StudentProfileId = student.Id,
            StudentProfile = student,
            SubjectId = Guid.NewGuid(),
            Subject = new Subject { Id = Guid.NewGuid(), Name = "Math" },
            Status = CustomAgreementStatus.Proposed,
            ExpiresAt = DateTime.UtcNow.AddDays(5),
            CreatedAt = DateTime.UtcNow
        };
        _agreements.Add(agreement);

        var wrongStudentUserId = Guid.NewGuid();
        _currentUser.Set(wrongStudentUserId, UserRole.Student);
        var command = new AcceptCustomAgreementCommand(agreement.Id);

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("designated student participant"));
    }

    [Fact]
    public async Task Handle_WhenAgreementExpired_ThrowsConflictException()
    {
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student" };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var agreement = new CustomAgreement
        {
            Id = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            TutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), User = new User { Id = Guid.NewGuid(), FullName = "Tutor" } },
            StudentProfileId = student.Id,
            StudentProfile = student,
            SubjectId = Guid.NewGuid(),
            Subject = new Subject { Id = Guid.NewGuid(), Name = "Math" },
            Status = CustomAgreementStatus.Proposed,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-10), // Expired!
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        _agreements.Add(agreement);

        _currentUser.Set(studentUser.Id, UserRole.Student);

        var command = new AcceptCustomAgreementCommand(agreement.Id);

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("expired"));
    }
}
