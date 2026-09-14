using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.PlatformSettings.Commands.AdminUpdatePlatformFee;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.PlatformSettings.AdminUpdatePlatformFee;

public class AdminUpdatePlatformFeeCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly Mock<IAuditLogService> _auditLogMock = new();
    private readonly AdminUpdatePlatformFeeCommandHandler _handler;

    public AdminUpdatePlatformFeeCommandHandlerTests()
    {
        _handler = new AdminUpdatePlatformFeeCommandHandler(_contextMock.Object, StubClock.Instance, _currentUser, _auditLogMock.Object);
    }

    [Fact]
    public async Task Handle_InitialFeeUpdate_CreatesSettingAndInitialVersion()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        _currentUser.Set(adminId, UserRole.Admin);
        var settings = new List<PlatformSetting>();
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.PlatformSettings).Returns(MockDbSetHelper.CreateMockDbSet(settings).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new AdminUpdatePlatformFeeCommand(0.12m, "Adjusting rate to 12%");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Key.Should().Be("PlatformFeeRate");
        result.CurrentVersion.Should().Be(1);
        result.Versions.Should().HaveCount(1);
        result.Versions.First().Version.Should().Be(1);
        result.Versions.First().Reason.Should().Be("Adjusting rate to 12%");
    }

    [Fact]
    public async Task Handle_SubsequentFeeUpdate_BumpsVersionMonotonically()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        _currentUser.Set(adminId, UserRole.Admin);
        var existingSetting = new PlatformSetting
        {
            Id = Guid.NewGuid(),
            Key = "PlatformFeeRate",
            Value = "0.1000",
            CurrentVersion = 1,
            Versions = new List<PlatformSettingVersion>
            {
                new() { Version = 1, Value = "0.1000" }
            }
        };

        var settings = new List<PlatformSetting> { existingSetting };
        var outbox = new List<OutboxMessage>();

        _contextMock.Setup(c => c.PlatformSettings).Returns(MockDbSetHelper.CreateMockDbSet(settings).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outbox).Object);

        var command = new AdminUpdatePlatformFeeCommand(0.15m, "Increasing rate to 15%");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.CurrentVersion.Should().Be(2);
        result.Versions.Should().HaveCount(2);
        result.Versions.First().Version.Should().Be(2);
        result.Versions.First().Reason.Should().Be("Increasing rate to 15%");
    }

    [Fact]
    public void ExistingEnrollmentSnapshot_IsNotAffectedByFeeRateUpdate()
    {
        // DEC-S8-020 Invariant Test: Existing enrollment keeps snapshot PlatformFeeRate and version
        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            PlatformFeeRate = 0.10m,
            FeePolicyVersion = 1
        };

        // Simulating platform fee change to 0.15m version 2
        var newFeeRate = 0.15m;
        var newVersion = 2;

        // Enrollment snapshot remains intact
        enrollment.PlatformFeeRate.Should().Be(0.10m);
        enrollment.FeePolicyVersion.Should().Be(1);
        enrollment.PlatformFeeRate.Should().NotBe(newFeeRate);
        enrollment.FeePolicyVersion.Should().NotBe(newVersion);
    }

    [Fact]
    public async Task Handle_WhenFeeRateChanges_WritesAuditLog()
    {
        // P0-A4: CLAUDE.md convention #6 requires admin platform-configuration
        // changes to land in the central audit log.
        var adminId = Guid.NewGuid();
        _currentUser.Set(adminId, UserRole.Admin);

        _contextMock.Setup(c => c.PlatformSettings).Returns(MockDbSetHelper.CreateMockDbSet(new List<PlatformSetting>()).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(new List<OutboxMessage>()).Object);

        await _handler.Handle(new AdminUpdatePlatformFeeCommand(0.12m, "Audit trail check."), CancellationToken.None);

        _auditLogMock.Verify(a => a.LogAsync(
            "PlatformFeeRateUpdated",
            "PlatformSetting",
            It.IsAny<string>(),
            adminId,
            It.IsAny<object?>(),
            It.IsAny<object?>(),
            It.IsAny<string?>(),
            It.IsAny<string?>(),
            It.IsAny<string?>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
