using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Enrollments.TutorCannotContinue;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Enrollments.TutorCannotContinue;

public class TutorCannotContinueCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly TutorCannotContinueCommandHandler _handler;

    public TutorCannotContinueCommandHandlerTests()
    {
        _handler = new TutorCannotContinueCommandHandler(_contextMock.Object);
    }

    private static (Enrollment enrollment, User tutorUser, Wallet wallet) CreateTestAggregate(
        decimal earningPerSession = 400_000m,
        int totalSessions = 2,
        int completedSessions = 0)
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            PendingBalance = earningPerSession * totalSessions,
            AvailableBalance = 0m,
            UpdatedAt = DateTime.UtcNow
        };

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Physics" };
        var service = new Service { Id = Guid.NewGuid(), Title = "Physics Masterclass" };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            ServiceId = service.Id,
            Service = service,
            TotalPrice = earningPerSession * totalSessions,
            TotalSessions = totalSessions,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online
        };

        for (int i = 1; i <= totalSessions; i++)
        {
            var session = new Session
            {
                Id = Guid.NewGuid(),
                EnrollmentId = enrollment.Id,
                Enrollment = enrollment,
                SessionNumber = i,
                EarningAmount = earningPerSession
            };

            if (i <= completedSessions)
            {
                session.Schedule(DateTime.UtcNow.AddDays(-i), DateTime.UtcNow.AddDays(-i).AddHours(1));
                session.Complete();
            }

            enrollment.Sessions.Add(session);
        }

        return (enrollment, tutorUser, wallet);
    }

    [Fact]
    public async Task Handle_WhenTutorCannotContinue_CancelsEnrollmentWithCancelledByTutorAndRefundsEscrow()
    {
        // Arrange
        var (enrollment, tutorUser, wallet) = CreateTestAggregate(400_000m, 2, 0);

        var transactions = new List<Transaction>();
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new TutorCannotContinueCommand(tutorUser.Id, enrollment.Id, "Tutor relocated abroad unexpectedly.");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(EnrollmentStatus.Cancelled);
        result.CancelledBy.Should().Be(CancelledBy.Tutor);
        result.CancellationReason.Should().Be("Tutor relocated abroad unexpectedly.");
        wallet.PendingBalance.Should().Be(0m);
        transactions.Should().HaveCount(1);
        transactions[0].Amount.Should().Be(800_000m);
        transactions[0].Status.Should().Be(TransactionStatus.Refunded);
    }

    [Fact]
    public async Task Handle_WhenUserIsNotTutorOfEnrollment_ThrowsForbiddenException()
    {
        // Arrange
        var (enrollment, _, _) = CreateTestAggregate();
        var strangerId = Guid.NewGuid();
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);

        var command = new TutorCannotContinueCommand(strangerId, enrollment.Id, "Inability to continue.");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenEnrollmentNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment>()).Object);

        var command = new TutorCannotContinueCommand(Guid.NewGuid(), Guid.NewGuid(), "Inability to continue.");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
