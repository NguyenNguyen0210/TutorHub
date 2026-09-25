using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.ReportReview;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Reviews.ReportReview;

public class ReportReviewCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly ReportReviewCommandHandler _handler;

    private readonly List<Review> _reviews = new();
    private readonly List<User> _users = new();
    private readonly List<Report> _reports = new();
    private readonly List<OutboxMessage> _outboxMessages = new();

    public ReportReviewCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(_users).Object);
        _contextMock.Setup(c => c.Reports).Returns(MockDbSetHelper.CreateMockDbSet(_reports).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(_outboxMessages).Object);

        _handler = new ReportReviewCommandHandler(_contextMock.Object, _currentUser);
    }

    [Fact]
    public async Task Handle_WhenSelfReporting_ShouldThrowBadRequestException()
    {
        // Arrange
        var studentUserId = Guid.NewGuid();
        var studentUser = new User { Id = studentUserId, FullName = "Student", Role = UserRole.Student };
        _users.Add(studentUser);

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUserId, User = studentUser }
        };

        var review = Review.Create(enrollment.Id, 5, "My review");
        review.Id = Guid.NewGuid();
        review.Enrollment = enrollment;
        _reviews.Add(review);

        _currentUser.Set(studentUserId, UserRole.Student);
        var command = new ReportReviewCommand(review.Id, "Reporting myself", null);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("cannot report your own review"));
    }

    [Fact]
    public async Task Handle_WhenOpenReportAlreadyExists_ShouldThrowConflictException()
    {
        // Arrange
        var studentUserId = Guid.NewGuid();
        var tutorUserId = Guid.NewGuid();
        var tutorUser = new User { Id = tutorUserId, FullName = "Tutor", Role = UserRole.Tutor };
        _users.Add(tutorUser);

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUserId }
        };

        var review = Review.Create(enrollment.Id, 1, "Offensive review");
        review.Id = Guid.NewGuid();
        review.Enrollment = enrollment;
        _reviews.Add(review);

        var existingReport = new Report
        {
            Id = Guid.NewGuid(),
            ReportType = TrustReportType.ReviewViolation,
            TargetId = review.Id.ToString(),
            ReporterUserId = tutorUserId,
            Status = ReportStatus.Open,
            Description = "Already reported"
        };
        _reports.Add(existingReport);

        _currentUser.Set(tutorUserId, UserRole.Tutor);
        var command = new ReportReviewCommand(review.Id, "Reporting again", null);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("already have an open report"));
    }

    [Fact]
    public async Task Handle_WhenValidReport_ShouldCreateReportAndOutboxEvent()
    {
        // Arrange
        var studentUserId = Guid.NewGuid();
        var tutorUserId = Guid.NewGuid();
        var tutorUser = new User { Id = tutorUserId, FullName = "Tutor", Role = UserRole.Tutor };
        _users.Add(tutorUser);

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUserId }
        };

        var review = Review.Create(enrollment.Id, 1, "False defamatory review");
        review.Id = Guid.NewGuid();
        review.Enrollment = enrollment;
        _reviews.Add(review);

        _currentUser.Set(tutorUserId, UserRole.Tutor);
        var command = new ReportReviewCommand(review.Id, "False defamatory content", "https://evidence.example.com");

        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.ReportType.Should().Be(TrustReportType.ReviewViolation);
        result.TargetId.Should().Be(review.Id.ToString());
        result.ReporterUserId.Should().Be(tutorUserId);
        result.Status.Should().Be(ReportStatus.Open);

        _contextMock.Verify(c => c.Reports.Add(It.IsAny<Report>()), Times.Once);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
