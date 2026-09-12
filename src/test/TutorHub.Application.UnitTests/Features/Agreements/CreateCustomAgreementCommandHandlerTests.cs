using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Agreements.Commands.CreateCustomAgreement;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Agreements;

public class CreateCustomAgreementCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly CreateCustomAgreementCommandHandler _handler;

    private readonly List<TutorProfile> _tutorProfiles = new();
    private readonly List<StudentProfile> _studentProfiles = new();
    private readonly List<Subject> _subjects = new();
    private readonly List<Service> _services = new();
    private readonly List<Conversation> _conversations = new();
    private readonly List<CustomAgreement> _agreements = new();
    private readonly List<OutboxMessage> _outboxMessages = new();

    public CreateCustomAgreementCommandHandlerTests()
    {
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(_tutorProfiles).Object);
        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(_studentProfiles).Object);
        _contextMock.Setup(c => c.Subjects).Returns(MockDbSetHelper.CreateMockDbSet(_subjects).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(_services).Object);
        _contextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(_conversations).Object);
        _contextMock.Setup(c => c.CustomAgreements).Returns(MockDbSetHelper.CreateMockDbSet(_agreements).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(_outboxMessages).Object);

        _handler = new CreateCustomAgreementCommandHandler(_contextMock.Object, StubClock.Instance);
    }

    [Fact]
    public async Task Handle_WhenValidRequest_CreatesAgreementAndEnqueuesOutboxEvent()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor User", Role = UserRole.Tutor, Status = AccountStatus.Active };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutor);

        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student User", Role = UserRole.Student, Status = AccountStatus.Active };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        _studentProfiles.Add(student);

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Physics" };
        _subjects.Add(subject);

        var command = new CreateCustomAgreementCommand(
            TutorUserId: tutorUser.Id,
            StudentProfileId: student.Id,
            SubjectId: subject.Id,
            ServiceId: null,
            ConversationId: null,
            Title: "Physics intensive prep",
            Description: "10 private sessions",
            TotalPrice: 1500000m,
            TotalSessions: 10,
            SessionDurationMinutes: 60,
            TeachingMode: TeachingMode.Online,
            ValidityDays: 7
        );

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        result.Title.Should().Be("Physics intensive prep");
        result.TotalPrice.Should().Be(1500000m);
        result.TotalSessions.Should().Be(10);
        result.Status.Should().Be(CustomAgreementStatus.Proposed);
        result.TutorProfileId.Should().Be(tutor.Id);
        result.StudentProfileId.Should().Be(student.Id);

        _agreements.Should().HaveCount(1);
        _outboxMessages.Should().HaveCount(1);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCallerNotTutor_ThrowsForbiddenException()
    {
        var nonTutor = new User { Id = Guid.NewGuid(), FullName = "Student", Role = UserRole.Student, Status = AccountStatus.Active };

        var command = new CreateCustomAgreementCommand(
            TutorUserId: nonTutor.Id,
            StudentProfileId: Guid.NewGuid(),
            SubjectId: Guid.NewGuid(),
            ServiceId: null,
            ConversationId: null,
            Title: "Test",
            Description: "Test",
            TotalPrice: 100000m,
            TotalSessions: 1,
            SessionDurationMinutes: 60,
            TeachingMode: TeachingMode.Online
        );

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("registered tutors"));
    }

    [Fact]
    public async Task Handle_WhenConversationParticipantsMismatch_ThrowsBadRequestException()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor", Role = UserRole.Tutor, Status = AccountStatus.Active };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutor);

        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student", Role = UserRole.Student, Status = AccountStatus.Active };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        _studentProfiles.Add(student);

        var subject = new Subject { Id = Guid.NewGuid(), Name = "English" };
        _subjects.Add(subject);

        // Conversation between DIFFERENT participants
        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(), // Mismatched tutor
            StudentProfileId = student.Id
        };
        _conversations.Add(conversation);

        var command = new CreateCustomAgreementCommand(
            TutorUserId: tutorUser.Id,
            StudentProfileId: student.Id,
            SubjectId: subject.Id,
            ServiceId: null,
            ConversationId: conversation.Id,
            Title: "Test",
            Description: "Test",
            TotalPrice: 200000m,
            TotalSessions: 2,
            SessionDurationMinutes: 60,
            TeachingMode: TeachingMode.Online
        );

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("participants must match"));
    }
}
