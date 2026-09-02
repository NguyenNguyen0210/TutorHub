using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.GetOrCreateConversation;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Conversations;

public class GetOrCreateConversationCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();

    [Fact]
    public async Task Handle_WhenExistingConversationFound_ReturnsExisting()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student One", Role = UserRole.Student };
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        studentUser.StudentProfile = studentProfile;

        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor One", Role = UserRole.Tutor };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        tutorUser.TutorProfile = tutorProfile;

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            CreatedAt = DateTime.UtcNow
        };

        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(studentUser.Id);

        _dbContextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { studentUser, tutorUser }).Object);
        _dbContextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(new List<Conversation> { conversation }).Object);

        var handler = new GetOrCreateConversationCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var result = await handler.Handle(new GetOrCreateConversationCommand(tutorUser.Id), CancellationToken.None);

        // Assert
        result.Id.Should().Be(conversation.Id);
        result.StudentProfileId.Should().Be(studentProfile.Id);
        result.TutorProfileId.Should().Be(tutorProfile.Id);
    }

    [Fact]
    public async Task Handle_WhenConversationDoesNotExist_CreatesNewWithCanonicalRoles()
    {
        // Arrange
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor Initiator", Role = UserRole.Tutor };
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        tutorUser.TutorProfile = tutorProfile;

        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student Target", Role = UserRole.Student };
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        studentUser.StudentProfile = studentProfile;

        var conversationsList = new List<Conversation>();

        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(tutorUser.Id);

        _dbContextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { tutorUser, studentUser }).Object);
        _dbContextMock.Setup(c => c.Conversations).Returns(MockDbSetHelper.CreateMockDbSet(conversationsList).Object);

        var handler = new GetOrCreateConversationCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var result = await handler.Handle(new GetOrCreateConversationCommand(studentUser.Id), CancellationToken.None);

        // Assert (INV-MSG-001: StudentProfile is always Student, TutorProfile is always Tutor)
        result.StudentProfileId.Should().Be(studentProfile.Id);
        result.TutorProfileId.Should().Be(tutorProfile.Id);
        conversationsList.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_WhenTargetIsSelf_ThrowsBadRequestException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(userId);

        var handler = new GetOrCreateConversationCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var act = () => handler.Handle(new GetOrCreateConversationCommand(userId), CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("Cannot create a conversation with yourself"));
    }

    [Fact]
    public async Task Handle_WhenBothUsersAreStudents_ThrowsBadRequestException()
    {
        // Arrange
        var student1 = new User { Id = Guid.NewGuid(), Role = UserRole.Student, StudentProfile = new StudentProfile() };
        var student2 = new User { Id = Guid.NewGuid(), Role = UserRole.Student, StudentProfile = new StudentProfile() };

        _currentUserServiceMock.Setup(c => c.IsAuthenticated).Returns(true);
        _currentUserServiceMock.Setup(c => c.UserId).Returns(student1.Id);

        _dbContextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { student1, student2 }).Object);

        var handler = new GetOrCreateConversationCommandHandler(_dbContextMock.Object, _currentUserServiceMock.Object);

        // Act
        var act = () => handler.Handle(new GetOrCreateConversationCommand(student2.Id), CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("only be created between a student and a tutor"));
    }
}
