using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.ReportReview;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
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

    public ReportReviewCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(_users).Object);
        _contextMock.Setup(c => c.Reports).Returns(MockDbSetHelper.CreateMockDbSet(_reports).Object);

        _handler = new ReportReviewCommandHandler(_contextMock.Object, _currentUser);
    }

    [Fact]
    public async Task Handle_WhenReviewNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _currentUser.Set(Guid.NewGuid(), UserRole.Tutor);
        var command = new ReportReviewCommand(Guid.NewGuid(), "Inappropriate language");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenReviewIsAlreadyRemoved_ShouldThrowConflictException()
    {
        // Arrange
        var enrollment = new Enrollment { Id = Guid.NewGuid(), BookingId = Guid.NewGuid() };
        // F-23: content via factory.
        var review = Review.Create(enrollment.Id, 1, null);
        review.Id = Guid.NewGuid();
        review.Enrollment = enrollment;
        review.RemoveByAdmin("Already removed", Guid.NewGuid());
        _reviews.Add(review);

        var reporter = new UserBuilder().Build();
        _users.Add(reporter);

        _currentUser.Set(reporter.Id, reporter.Role);
        var command = new ReportReviewCommand(review.Id, "Inappropriate language");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("removed"));
    }

    [Fact]
    public async Task Handle_WhenValidReport_ShouldCreateReportRecordInTrustAndSafety()
    {
        var studentUser = new UserBuilder().Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile
        };
        var review = Review.Create(enrollment.Id, 1, "Bad comment");
        review.Id = Guid.NewGuid();
        review.Enrollment = enrollment;
        _reviews.Add(review);

        var reporter = new UserBuilder().WithFullName("John Doe").WithRole(UserRole.Tutor).Build();
        _users.Add(reporter);

        _currentUser.Set(reporter.Id, reporter.Role);
        var command = new ReportReviewCommand(review.Id, "Harassment and offensive language", "https://evidence.com/screenshot.png");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.ReporterUserId.Should().Be(reporter.Id);
        result.ReporterName.Should().Be("John Doe");
        result.ReporterRole.Should().Be("Tutor");
        result.ReportType.Should().Be(TrustReportType.ReviewViolation);
        result.TargetId.Should().Be(review.Id.ToString());
        result.ReportedUserId.Should().Be(studentProfile.UserId);
        result.Status.Should().Be(ReportStatus.Open);
        result.EvidenceUrl.Should().Be("https://evidence.com/screenshot.png");
        result.Description.Should().Contain("[Review Violation Report - ReviewId:");

        _reports.Should().HaveCount(1);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
