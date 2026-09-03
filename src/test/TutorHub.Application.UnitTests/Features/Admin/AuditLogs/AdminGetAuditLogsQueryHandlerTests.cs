using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.AuditLogs.GetAdminAuditLogs;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.AuditLogs;

public class AdminGetAuditLogsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly AdminGetAuditLogsQueryHandler _handler;

    public AdminGetAuditLogsQueryHandlerTests()
    {
        _handler = new AdminGetAuditLogsQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_FilterByEntityNameAndCorrelationId_ReturnsFilteredLogs()
    {
        // Arrange
        var log1 = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = "DisputeCreated",
            EntityName = "Dispute",
            EntityId = "disp-1",
            CorrelationId = "corr-abc",
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        var log2 = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = "PlatformFeeUpdated",
            EntityName = "PlatformSetting",
            EntityId = "PlatformFeeRate",
            CorrelationId = "corr-xyz",
            CreatedAt = DateTime.UtcNow.AddMinutes(-5)
        };

        var logs = new List<AuditLog> { log1, log2 };
        _contextMock.Setup(c => c.AuditLogs).Returns(MockDbSetHelper.CreateMockDbSet(logs).Object);

        var query = new AdminGetAuditLogsQuery(
            EntityName: "Dispute",
            CorrelationId: "corr-abc"
        );

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().ContainSingle(i => i.EntityName == "Dispute" && i.CorrelationId == "corr-abc");
    }

    [Fact]
    public async Task Handle_Pagination_AppliesSkipAndTake()
    {
        // Arrange
        var logs = Enumerable.Range(1, 15).Select(i => new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = $"Action_{i}",
            EntityName = "Dispute",
            EntityId = $"disp-{i}",
            CorrelationId = $"corr-{i}",
            CreatedAt = DateTime.UtcNow.AddMinutes(-i)
        }).ToList();

        _contextMock.Setup(c => c.AuditLogs).Returns(MockDbSetHelper.CreateMockDbSet(logs).Object);

        var query = new AdminGetAuditLogsQuery(
            PageNumber: 2,
            PageSize: 5
        );

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.TotalCount.Should().Be(15);
        result.PageNumber.Should().Be(2);
        result.PageSize.Should().Be(5);
        result.Items.Should().HaveCount(5);
    }
}
