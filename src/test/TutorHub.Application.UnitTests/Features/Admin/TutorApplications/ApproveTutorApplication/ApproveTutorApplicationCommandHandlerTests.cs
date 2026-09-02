using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.TutorApplications.ApproveTutorApplication;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.TutorApplications.ApproveTutorApplication;

public class ApproveTutorApplicationCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly ApproveTutorApplicationCommandHandler _handler;

    public ApproveTutorApplicationCommandHandlerTests()
    {
        _handler = new ApproveTutorApplicationCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_PendingApplication_ShouldSetApproved_AndCreateProfileAndWallet()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var user = new UserBuilder()
            .WithRole(UserRole.Tutor)
            .WithStatus(AccountStatus.Active)
            .Build();

        var pendingApp = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Bio = "Top physics tutor",
            Education = "M.Sc Physics",
            ExperienceYears = 4,
            TeachingMode = TeachingMode.Both,
            Address = "456 Hanoi Rd",
            Latitude = 21.028511,
            Longitude = 105.854444,
            SubmittedAt = DateTime.UtcNow
        };

        var applicationsList = new List<TutorApplication> { pendingApp };
        var tutorProfilesList = new List<TutorProfile>();
        var walletsList = new List<Wallet>();

        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(tutorProfilesList).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(walletsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ApproveTutorApplicationCommand(pendingApp.Id, adminId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(TutorApplicationStatus.Approved.ToString());
        pendingApp.Status.Should().Be(TutorApplicationStatus.Approved);
        pendingApp.ReviewedByAdminId.Should().Be(adminId);
        pendingApp.ReviewedAt.Should().NotBeNull();

        // Verify Profile creation from application snapshot
        tutorProfilesList.Should().ContainSingle();
        var createdProfile = tutorProfilesList.Single();
        createdProfile.UserId.Should().Be(user.Id);
        createdProfile.Bio.Should().Be("Top physics tutor");
        createdProfile.Education.Should().Be("M.Sc Physics");
        createdProfile.ExperienceYears.Should().Be(4);
        createdProfile.TeachingMode.Should().Be(TeachingMode.Both);
        createdProfile.Address.Should().Be("456 Hanoi Rd");
        createdProfile.RatingAvg.Should().Be(0);
        createdProfile.TotalReviews.Should().Be(0);

        // Verify Wallet creation
        walletsList.Should().ContainSingle();
        var createdWallet = walletsList.Single();
        createdWallet.TutorProfileId.Should().Be(createdProfile.Id);
        createdWallet.AvailableBalance.Should().Be(0);
        createdWallet.PendingBalance.Should().Be(0);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var applicationsList = new List<TutorApplication>();

        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new ApproveTutorApplicationCommand(Guid.NewGuid(), adminId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
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
            ExperienceYears = 2,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow
        };
        approvedApp.Approve(adminId);

        var applicationsList = new List<TutorApplication> { approvedApp };
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new ApproveTutorApplicationCommand(approvedApp.Id, adminId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Only Pending applications can be approved*");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_RejectedApplication_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();

        var rejectedApp = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Bio = "Bio",
            Education = "Edu",
            ExperienceYears = 2,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow
        };
        rejectedApp.Reject("Insufficient documents", adminId);

        var applicationsList = new List<TutorApplication> { rejectedApp };
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);

        var command = new ApproveTutorApplicationCommand(rejectedApp.Id, adminId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Only Pending applications can be approved*");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ProfileAlreadyExists_ShouldThrowConflictException()
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
            ExperienceYears = 2,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow
        };

        var existingProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Bio = "Existing bio",
            Education = "Existing edu",
            ExperienceYears = 2,
            TeachingMode = TeachingMode.Online
        };

        var applicationsList = new List<TutorApplication> { pendingApp };
        var tutorProfilesList = new List<TutorProfile> { existingProfile };

        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(applicationsList).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(tutorProfilesList).Object);

        var command = new ApproveTutorApplicationCommand(pendingApp.Id, adminId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*already exists for this user*");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
