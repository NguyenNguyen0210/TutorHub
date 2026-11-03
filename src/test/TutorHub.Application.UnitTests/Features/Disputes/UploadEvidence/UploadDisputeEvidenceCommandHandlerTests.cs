using Microsoft.Extensions.Logging.Abstractions;
using TutorHub.Application.Common.Storage;
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
    private readonly StubCurrentUserService _currentUser = new();
    private readonly UploadDisputeEvidenceCommandHandler _handler;
    private readonly Mock<IObjectStorageService> _storage = new();

    public UploadDisputeEvidenceCommandHandlerTests()
    {
        _handler = new UploadDisputeEvidenceCommandHandler(_contextMock.Object, StubClock.Instance, _currentUser, _storage.Object, NullLogger<UploadDisputeEvidenceCommandHandler>.Instance);
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

        _currentUser.Set(studentUser.Id, studentUser.Role);
        var command = new UploadDisputeEvidenceCommand(
            dispute.Id,
            "screenshot.png",
            new MemoryStream(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D }),
            12); // 500KB

        _storage.Setup(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Stream stream, string key, string mime, CancellationToken ct) => new StoredFileResult(key, 12, mime, null));
        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.FileName.Should().Be("screenshot.png");
        evidences.Should().ContainSingle(e => e.FileName == "screenshot.png");

        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("Database write failed"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
        _storage.Verify(x => x.DeleteAsync(It.IsAny<string>(), CancellationToken.None), Times.Once);
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

        _currentUser.Set(intruderUser.Id, intruderUser.Role);
        var command = new UploadDisputeEvidenceCommand(
            dispute.Id,
            "screenshot.png",
            new MemoryStream(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D }),
            12);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => _handler.Handle(command, CancellationToken.None));
        _storage.Verify(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
