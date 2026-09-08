using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Disputes.UploadEvidence;

public class UploadDisputeEvidenceCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly UploadDisputeEvidenceCommandHandler _handler;

    public UploadDisputeEvidenceCommandHandlerTests()
    {
        _handler = new UploadDisputeEvidenceCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ValidParticipant_UploadsEvidenceSuccessfully()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid(), Role = UserRole.Student };
        var tutorUser = new User { Id = Guid.NewGuid(), Role = UserRole.Tutor };

        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            InitiatorUserId = studentUser.Id,
            RespondentUserId = tutorUser.Id
        };

        var users = new List<User> { studentUser, tutorUser };
        var disputes = new List<Dispute> { dispute };
        var evidences = new List<DisputeEvidence>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(users).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.DisputeEvidences).Returns(MockDbSetHelper.CreateMockDbSet(evidences).Object);

        var command = new UploadDisputeEvidenceCommand(
            dispute.Id,
            studentUser.Id,
            "screenshot.png",
            "https://cdn.tutorhub.com/evidence/123.png",
            "image/png",
            1024 * 500); // 500KB

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.FileName.Should().Be("screenshot.png");
        evidences.Should().ContainSingle(e => e.FileName == "screenshot.png");
    }

    [Fact]
    public async Task Handle_NonParticipantNonAdmin_ThrowsForbiddenException()
    {
        // Arrange
        var studentUser = new User { Id = Guid.NewGuid(), Role = UserRole.Student };
        var tutorUser = new User { Id = Guid.NewGuid(), Role = UserRole.Tutor };
        var intruderUser = new User { Id = Guid.NewGuid(), Role = UserRole.Student };

        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            InitiatorUserId = studentUser.Id,
            RespondentUserId = tutorUser.Id
        };

        var users = new List<User> { studentUser, tutorUser, intruderUser };
        var disputes = new List<Dispute> { dispute };
        var evidences = new List<DisputeEvidence>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(users).Object);
        _contextMock.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(disputes).Object);
        _contextMock.Setup(c => c.DisputeEvidences).Returns(MockDbSetHelper.CreateMockDbSet(evidences).Object);

        var command = new UploadDisputeEvidenceCommand(
            dispute.Id,
            intruderUser.Id,
            "screenshot.png",
            "https://cdn.tutorhub.com/evidence/123.png",
            "image/png",
            1024 * 500);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => _handler.Handle(command, CancellationToken.None));
    }
}
