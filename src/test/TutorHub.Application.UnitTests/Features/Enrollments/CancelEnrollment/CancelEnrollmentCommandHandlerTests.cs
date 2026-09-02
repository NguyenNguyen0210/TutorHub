using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Enrollments.CancelEnrollment;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Enrollments.CancelEnrollment;

public class CancelEnrollmentCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly CancelEnrollmentCommandHandler _handler;

    public CancelEnrollmentCommandHandlerTests()
    {
        _handler = new CancelEnrollmentCommandHandler(_contextMock.Object);
    }

    private static (Enrollment enrollment, User studentUser, User tutorUser, Wallet wallet) CreateTestAggregate(
        decimal earningPerSession = 500_000m,
        int totalSessions = 3,
        int completedSessions = 0,
        EnrollmentStatus status = EnrollmentStatus.Active)
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

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Chemistry" };
        var service = new Service { Id = Guid.NewGuid(), Title = "Chemistry Package" };

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

        if (status == EnrollmentStatus.Completed)
        {
            enrollment.RecordCompletedSession(enrollment.Sessions.Last().Id);
        }
        else if (status == EnrollmentStatus.Cancelled)
        {
            enrollment.Cancel("Already cancelled", CancelledBy.Student);
        }

        return (enrollment, studentUser, tutorUser, wallet);
    }

    [Fact]
    public async Task Handle_WhenStudentCancelsWithNoCompletedSessions_CancelsEnrollmentAndRefundsFullAmount()
    {
        // Arrange - 3 sessions of 500k = 1.5M total, 0 completed
        var (enrollment, studentUser, _, wallet) = CreateTestAggregate(500_000m, 3, 0);

        var transactions = new List<Transaction>();
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CancelEnrollmentCommand(studentUser.Id, enrollment.Id, "Student requested cancellation due to personal schedule.");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(EnrollmentStatus.Cancelled);
        result.CancelledBy.Should().Be(CancelledBy.Student);
        result.CancellationReason.Should().Be("Student requested cancellation due to personal schedule.");

        // All 3 sessions cancelled
        result.Sessions.Should().OnlyContain(s => s.Status == SessionStatus.Cancelled);

        // Financial Escrow Check: 1.5M - 1.5M = 0
        wallet.PendingBalance.Should().Be(0m);

        // Refund Transaction Check
        transactions.Should().HaveCount(1);
        var tx = transactions[0];
        tx.BookingId.Should().Be(enrollment.BookingId);
        tx.SessionId.Should().BeNull();
        tx.Amount.Should().Be(1_500_000m);
        tx.Status.Should().Be(TransactionStatus.Refunded);
    }

    [Fact]
    public async Task Handle_WhenStudentCancelsWithSomeCompletedSessions_PreservesCompletedSessionsAndRefundsUncompletedOnly()
    {
        // Arrange - 3 sessions of 500k = 1.5M total, 1 completed (500k earned), 2 uncompleted (1.0M refundable)
        var (enrollment, studentUser, _, wallet) = CreateTestAggregate(500_000m, 3, 1);
        wallet.PendingBalance = 1_000_000m; // 1M remaining in Escrow after session 1 payout release

        var transactions = new List<Transaction>();
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CancelEnrollmentCommand(studentUser.Id, enrollment.Id, "Student wants to stop after 1 session.");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(EnrollmentStatus.Cancelled);
        result.Sessions.Should().HaveCount(3);
        result.Sessions[0].Status.Should().Be(SessionStatus.Completed); // Session 1 preserved!
        result.Sessions[1].Status.Should().Be(SessionStatus.Cancelled);
        result.Sessions[2].Status.Should().Be(SessionStatus.Cancelled);

        // Refund: 1.5M - 500k = 1.0M
        wallet.PendingBalance.Should().Be(0m); // 1.0M - 1.0M = 0

        transactions.Should().HaveCount(1);
        transactions[0].Amount.Should().Be(1_000_000m);
        transactions[0].Status.Should().Be(TransactionStatus.Refunded);
    }

    [Fact]
    public async Task Handle_WhenEnrollmentIsCompleted_ThrowsConflictException()
    {
        // Arrange - All 3 completed -> Enrollment Completed
        var (enrollment, studentUser, _, _) = CreateTestAggregate(500_000m, 3, 3, EnrollmentStatus.Completed);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);

        var command = new CancelEnrollmentCommand(studentUser.Id, enrollment.Id, "Trying to cancel completed enrollment.");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Cannot cancel an enrollment that is already completed.");
    }

    [Fact]
    public async Task Handle_WhenEnrollmentAlreadyCancelled_ThrowsConflictException()
    {
        // Arrange
        var (enrollment, studentUser, _, _) = CreateTestAggregate(500_000m, 3, 0, EnrollmentStatus.Cancelled);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);

        var command = new CancelEnrollmentCommand(studentUser.Id, enrollment.Id, "Cancelling again.");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Enrollment is already cancelled.");
    }

    [Fact]
    public async Task Handle_WhenUserIsNotStudentOfEnrollment_ThrowsForbiddenException()
    {
        // Arrange
        var (enrollment, _, _, _) = CreateTestAggregate();
        var strangerId = Guid.NewGuid();
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);

        var command = new CancelEnrollmentCommand(strangerId, enrollment.Id, "Stranger attempting cancel.");

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

        var command = new CancelEnrollmentCommand(Guid.NewGuid(), Guid.NewGuid(), "Valid cancellation reason.");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenPendingBalanceInsufficient_ThrowsInvalidOperationException()
    {
        // Arrange - Escrow is 100k, but refund is 1.5M
        var (enrollment, studentUser, _, wallet) = CreateTestAggregate(500_000m, 3, 0);
        wallet.PendingBalance = 100_000m; // Insufficient!

        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);

        var command = new CancelEnrollmentCommand(studentUser.Id, enrollment.Id, "Cancellation reason.");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<InvalidOperationException>();
        ex.Which.Message.Should().Contain("Financial invariant violated: Pending escrow balance is insufficient");
    }
}
