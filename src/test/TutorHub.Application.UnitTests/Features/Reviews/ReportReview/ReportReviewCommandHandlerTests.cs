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
    private readonly ReportReviewCommandHandler _handler;

    private readonly List<Review> _reviews = new();
    private readonly List<User> _users = new();
    private readonly List<Report> _reports = new();

    public ReportReviewCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(_users).Object);
        _contextMock.Setup(c => c.Reports).Returns(MockDbSetHelper.CreateMockDbSet(_reports).Object);

        _handler = new ReportReviewCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenReviewNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var command = new ReportReviewCommand(Guid.NewGuid(), Guid.NewGuid(), "Inappropriate language");

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
        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            Rating = 1
        };
        review.RemoveByAdmin("Already removed", Guid.NewGuid());
        _reviews.Add(review);

        var reporter = new UserBuilder().Build();
        _users.Add(reporter);

        var command = new ReportReviewCommand(review.Id, reporter.Id, "Inappropriate language");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("removed"));
    }

    [Fact]
    public async Task Handle_WhenValidReport_ShouldCreateReportRecordInTrustAndSafety()
    {
        // Arrange
        var enrollment = new Enrollment { Id = Guid.NewGuid(), BookingId = Guid.NewGuid() };
        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            Rating = 1,
            Comment = "Bad comment"
        };
        _reviews.Add(review);

        var reporter = new UserBuilder().WithFullName("John Doe").WithRole(UserRole.Tutor).Build();
        _users.Add(reporter);

        var command = new ReportReviewCommand(review.Id, reporter.Id, "Harassment and offensive language", "https://evidence.com/screenshot.png");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.ReporterUserId.Should().Be(reporter.Id);
        result.ReporterName.Should().Be("John Doe");
        result.ReporterRole.Should().Be("Tutor");
        result.Status.Should().Be(ReportStatus.Open);
        result.EvidenceUrl.Should().Be("https://evidence.com/screenshot.png");
        result.Description.Should().Contain("[Review Violation Report - ReviewId:");

        _reports.Should().HaveCount(1);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
