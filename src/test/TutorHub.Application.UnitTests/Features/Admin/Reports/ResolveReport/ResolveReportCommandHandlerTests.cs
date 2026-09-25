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
    private readonly StubCurrentUserService _currentUser = new();
    private readonly ResolveReportCommandHandler _handler;

    private readonly List<Report> _reports = new();
    private readonly List<User> _users = new();
    private readonly List<Review> _reviews = new();
    private readonly List<RefreshToken> _refreshTokens = new();
    private readonly List<TutorProfile> _tutorProfiles = new();
    private readonly List<OutboxMessage> _outboxMessages = new();
    private readonly List<Service> _services = new();

    public ResolveReportCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Reports).Returns(MockDbSetHelper.CreateMockDbSet(_reports).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(_users).Object);
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(_refreshTokens).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(_tutorProfiles).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(_outboxMessages).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(_services).Object);

        _handler = new ResolveReportCommandHandler(_contextMock.Object, StubClock.Instance, _auditLogServiceMock.Object, _currentUser);
    }

    [Fact]
    public async Task Handle_WhenReportNotFound_ShouldThrowNotFoundException()
    {
        _currentUser.Set(Guid.NewGuid(), UserRole.Admin);
        var command = new ResolveReportCommand(Guid.NewGuid(), ReportDecision.Dismissed, "No issue");

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenAlreadyResolved_ShouldThrowConflictException()
    {
        var report = new Report { Id = Guid.NewGuid(), Status = ReportStatus.Resolved };
        _reports.Add(report);

        _currentUser.Set(Guid.NewGuid(), UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.Dismissed, "Duplicate");

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

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.SuspendUser, "Suspended for 7 days due to harassment");

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

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.BanUser, "Permanently banned for fraud");

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

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.RemoveContent, "Removed offensive review content");

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

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.WarningIssued, "Warning issued");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(ReportStatus.Resolved);
        // Verify Wallets and Transactions DbSets are NEVER accessed
        _contextMock.Verify(c => c.Wallets, Times.Never);
        _contextMock.Verify(c => c.Transactions, Times.Never);
    }

    [Fact]
    public async Task Handle_WhenAdminAttemptsSelfBan_ShouldThrowConflictException()
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin", Role = UserRole.Admin, Status = AccountStatus.Active };
        _users.Add(admin);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.UserConduct,
            ReportedUserId = admin.Id,
            ReportedUser = admin,
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "Self report"
        };
        _reports.Add(report);

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.BanUser, "Ban self");

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("cannot ban their own account"));
    }

    [Fact]
    public async Task Handle_WhenAdminAttemptsSelfSuspend_ShouldThrowConflictException()
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin", Role = UserRole.Admin, Status = AccountStatus.Active };
        _users.Add(admin);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.UserConduct,
            ReportedUserId = admin.Id,
            ReportedUser = admin,
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "Self report"
        };
        _reports.Add(report);

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.SuspendUser, "Suspend self");

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("cannot suspend their own account"));
    }

    [Fact]
    public async Task Handle_WhenBanningLastActiveAdmin_ShouldThrowConflictException()
    {
        var admin1 = new User { Id = Guid.NewGuid(), FullName = "Operating Admin", Role = UserRole.Admin, Status = AccountStatus.Active };
        var targetAdmin = new User { Id = Guid.NewGuid(), FullName = "Target Admin", Role = UserRole.Admin, Status = AccountStatus.Active };
        _users.Add(admin1);
        _users.Add(targetAdmin);

        // Remove admin1's active status or leave only targetAdmin active to simulate last active admin
        admin1.Suspend();

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.UserConduct,
            ReportedUserId = targetAdmin.Id,
            ReportedUser = targetAdmin,
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "Target admin violation"
        };
        _reports.Add(report);

        _currentUser.Set(admin1.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.BanUser, "Ban target admin");

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("last active administrator"));
    }

    [Fact]
    public async Task Handle_WhenWarningIssued_ShouldEnqueueReportResolvedOutboxEvent()
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin", Role = UserRole.Admin };
        var reportedUser = new User { Id = Guid.NewGuid(), FullName = "Student User", Status = AccountStatus.Active };
        _users.Add(admin);
        _users.Add(reportedUser);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.UserConduct,
            ReportedUserId = reportedUser.Id,
            ReportedUser = reportedUser,
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "Late arrival"
        };
        _reports.Add(report);

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.WarningIssued, "Official warning for tardiness");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(ReportStatus.Resolved);
        result.AdminDecision.Should().Be(ReportDecision.WarningIssued);

        _outboxMessages.Should().ContainSingle(m => m.EventType == TutorHub.Application.Common.Events.BusinessEventTypes.ReportResolved);
        var outboxMessage = _outboxMessages.Single(m => m.EventType == TutorHub.Application.Common.Events.BusinessEventTypes.ReportResolved);
        outboxMessage.Payload.Should().Contain("WarningIssued");
        outboxMessage.Payload.Should().Contain("Official warning for tardiness");
    }

    [Fact]
    public async Task Handle_WhenRemovingReview_ShouldRecalculateTutorProfileRating()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor User" };
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser
        };
        tutorProfile.ApplyReview(new List<int> { 5, 1 });
        _tutorProfiles.Add(tutorProfile);

        var enrollment1 = new Enrollment
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };
        var enrollment2 = new Enrollment
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile
        };

        var goodReview = Review.Create(enrollment1.Id, 5, "Great lesson");
        goodReview.Id = Guid.NewGuid();
        goodReview.Enrollment = enrollment1;
        _reviews.Add(goodReview);

        var badReview = Review.Create(enrollment2.Id, 1, "Offensive bad review");
        badReview.Id = Guid.NewGuid();
        badReview.Enrollment = enrollment2;
        _reviews.Add(badReview);

        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin", Role = UserRole.Admin };
        _users.Add(admin);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.ReviewViolation,
            TargetId = badReview.Id.ToString(),
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "Offensive review"
        };
        _reports.Add(report);

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.RemoveContent, "Removed offensive review");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(ReportStatus.Resolved);
        badReview.IsRemoved.Should().BeTrue();

        // Rating recalculated from remaining reviews: only goodReview (5 stars)
        tutorProfile.TotalReviews.Should().Be(1);
        tutorProfile.RatingAvg.Should().Be(5.0m);
    }

    [Fact]
    public async Task Handle_WhenAdminIsReporter_ShouldThrowConflictException()
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin", Role = UserRole.Admin };
        _users.Add(admin);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.General,
            ReporterUserId = admin.Id,
            Status = ReportStatus.Open,
            Description = "Self filed report"
        };
        _reports.Add(report);

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.Dismissed, "Dismiss");

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("cannot resolve reports they filed"));
    }

    [Fact]
    public async Task Handle_WhenDecidingRemoveContent_ForServiceViolation_ShouldUnpublishServiceAndAudit()
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin", Role = UserRole.Admin };
        _users.Add(admin);

        var service = new Service
        {
            Id = Guid.NewGuid(),
            Title = "Scam service",
            Status = ServiceStatus.Published,
            Price = 100000,
            TotalSessions = 5
        };
        _services.Add(service);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.ServiceViolation,
            TargetId = service.Id.ToString(),
            ReporterUserId = Guid.NewGuid(),
            Status = ReportStatus.Open,
            Description = "Misleading course"
        };
        _reports.Add(report);

        _currentUser.Set(admin.Id, UserRole.Admin);
        var command = new ResolveReportCommand(report.Id, ReportDecision.RemoveContent, "Unpublished misleading service");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(ReportStatus.Resolved);
        service.Status.Should().Be(ServiceStatus.Unpublished);

        _auditLogServiceMock.Verify(a => a.LogAsync(
            "SERVICE_FORCE_UNPUBLISHED",
            "Service",
            service.Id.ToString(),
            admin.Id,
            It.IsAny<object>(),
            It.IsAny<object>(),
            null,
            null,
            null,
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
