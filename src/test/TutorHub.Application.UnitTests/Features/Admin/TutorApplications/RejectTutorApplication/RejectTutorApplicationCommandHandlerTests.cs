using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.TutorApplications.RejectTutorApplication;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.TutorApplications.RejectTutorApplication;

public class RejectTutorApplicationCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly RejectTutorApplicationCommandHandler _handler;

    public RejectTutorApplicationCommandHandlerTests()
    {
        _handler = new RejectTutorApplicationCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_PendingApplication_WithReason_ShouldSetRejected()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();

        var pendingApp = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Bio = "Short bio",
            Education = "Incomplete degree",
            ExperienceYears = 0,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow
        };

        var applicationsList = new List<TutorApplication> { pendingApp };
        var tutorProfilesList = new List<TutorProfile>();
        var walletsList = new List<Wallet>();

        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(tutorProfilesList).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(walletsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new RejectTutorApplicationCommand(pendingApp.Id, adminId, "Missing verified diplomas and credentials.");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(TutorApplicationStatus.Rejected.ToString());
        result.RejectionReason.Should().Be("Missing verified diplomas and credentials.");

        pendingApp.Status.Should().Be(TutorApplicationStatus.Rejected);
        pendingApp.RejectionReason.Should().Be("Missing verified diplomas and credentials.");
        pendingApp.ReviewedByAdminId.Should().Be(adminId);
        pendingApp.ReviewedAt.Should().NotBeNull();

        // Invariant: Rejection MUST NEVER create TutorProfile or Wallet
        tutorProfilesList.Should().BeEmpty();
        walletsList.Should().BeEmpty();

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var applicationsList = new List<TutorApplication>();

        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new RejectTutorApplicationCommand(Guid.NewGuid(), adminId, "Some reason");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task Handle_EmptyOrWhitespaceReason_ShouldThrowInvalidOperationException(string? reason)
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();

        var pendingApp = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Bio = "Bio",
            Education = "Edu",
            ExperienceYears = 1,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow
        };

        var applicationsList = new List<TutorApplication> { pendingApp };
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new RejectTutorApplicationCommand(pendingApp.Id, adminId, reason!);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Rejection reason is required*");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_AlreadyApprovedApplication_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();

        var approvedApp = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Bio = "Bio",
            Education = "Edu",
            ExperienceYears = 5,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow
        };
        approvedApp.Approve(adminId);

        var applicationsList = new List<TutorApplication> { approvedApp };
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new RejectTutorApplicationCommand(approvedApp.Id, adminId, "Attempt to reject approved app");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Only Pending applications can be rejected*");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
