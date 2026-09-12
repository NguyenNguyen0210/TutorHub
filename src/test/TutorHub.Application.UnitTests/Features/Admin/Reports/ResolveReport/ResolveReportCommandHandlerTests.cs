using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Reports.ResolveReport;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Reports.ResolveReport;

public class ResolveReportCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IAuditLogService> _auditLogServiceMock = new();
    private readonly ResolveReportCommandHandler _handler;

    private readonly List<Report> _reports = new();
    private readonly List<User> _users = new();
    private readonly List<Review> _reviews = new();
    private readonly List<RefreshToken> _refreshTokens = new();

    public ResolveReportCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Reports).Returns(MockDbSetHelper.CreateMockDbSet(_reports).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(_users).Object);
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(_refreshTokens).Object);

        _handler = new ResolveReportCommandHandler(_contextMock.Object, StubClock.Instance, _auditLogServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WhenReportNotFound_ShouldThrowNotFoundException()
    {
        var command = new ResolveReportCommand(Guid.NewGuid(), Guid.NewGuid(), ReportDecision.Dismissed, "No issue");

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenAlreadyResolved_ShouldThrowConflictException()
    {
        var report = new Report { Id = Guid.NewGuid(), Status = ReportStatus.Resolved };
        _reports.Add(report);

        var command = new ResolveReportCommand(report.Id, Guid.NewGuid(), ReportDecision.Dismissed, "Duplicate");

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("already been resolved"));
    }

    [Fact]
    public async Task Handle_WhenDecidingSuspendUser_ShouldSuspendReportedUser()
    {
        var reportedUser = new User { Id = Guid.NewGuid(), FullName = "Violator", Status = AccountStatus.Active };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Role = UserRole.Admin };
        _users.Add(reportedUser);
        _users.Add(admin);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.UserConduct,
            ReportedUserId = reportedUser.Id,
            ReportedUser = reportedUser,
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "Abusive conduct"
        };
        _reports.Add(report);

        var command = new ResolveReportCommand(report.Id, admin.Id, ReportDecision.SuspendUser, "Suspended for 7 days due to harassment");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(ReportStatus.Resolved);
        result.AdminDecision.Should().Be(ReportDecision.SuspendUser);
        reportedUser.Status.Should().Be(AccountStatus.Suspended);

        _auditLogServiceMock.Verify(a => a.LogAsync(
            It.Is<string>(s => s.Contains("SuspendUser")),
            "Report",
            report.Id.ToString(),
            admin.Id,
            null,
            It.IsAny<object>(),
            null,
            null,
            null,
            It.IsAny<CancellationToken>()
        ), Times.Once);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenDecidingBanUser_ShouldBanReportedUser()
    {
        var reportedUser = new User { Id = Guid.NewGuid(), FullName = "Scammer", Status = AccountStatus.Active };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Role = UserRole.Admin };
        _users.Add(reportedUser);
        _users.Add(admin);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.UserConduct,
            ReportedUserId = reportedUser.Id,
            ReportedUser = reportedUser,
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "Fraudulent payment attempts"
        };
        _reports.Add(report);

        var command = new ResolveReportCommand(report.Id, admin.Id, ReportDecision.BanUser, "Permanently banned for fraud");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(ReportStatus.Resolved);
        result.AdminDecision.Should().Be(ReportDecision.BanUser);
        reportedUser.Status.Should().Be(AccountStatus.Banned);
    }

    [Fact]
    public async Task Handle_WhenDecidingRemoveContent_OnReviewReport_ShouldRemoveReview()
    {
        // F-23: content via factory.
        var review = Review.Create(Guid.NewGuid(), 1, "Extremely offensive words");
        review.Id = Guid.NewGuid();
        _reviews.Add(review);

        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Role = UserRole.Admin };
        _users.Add(admin);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.ReviewViolation,
            TargetId = review.Id.ToString(),
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "Review violates community standards"
        };
        _reports.Add(report);

        var command = new ResolveReportCommand(report.Id, admin.Id, ReportDecision.RemoveContent, "Removed offensive review content");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(ReportStatus.Resolved);
        result.AdminDecision.Should().Be(ReportDecision.RemoveContent);
        review.IsRemoved.Should().BeTrue();
        review.RemovalReason.Should().Be("Removed offensive review content");
        review.RemovedByAdminId.Should().Be(admin.Id);
    }

    [Fact]
    public async Task Handle_NeverMutatesWalletsOrTransactions_UnderAnyCircumstance()
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin", Role = UserRole.Admin };
        _users.Add(admin);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.General,
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "General complaint"
        };
        _reports.Add(report);

        var command = new ResolveReportCommand(report.Id, admin.Id, ReportDecision.WarningIssued, "Warning issued");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(ReportStatus.Resolved);
        // Verify Wallets and Transactions DbSets are NEVER accessed
        _contextMock.Verify(c => c.Wallets, Times.Never);
        _contextMock.Verify(c => c.Transactions, Times.Never);
    }
}
