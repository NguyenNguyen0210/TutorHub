using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.SubmitAttendance;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Sessions.SubmitAttendance;

public class SubmitAttendanceCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly SubmitAttendanceCommandHandler _handler;

    public SubmitAttendanceCommandHandlerTests()
    {
        _handler = new SubmitAttendanceCommandHandler(_contextMock.Object);
    }

    private static (Session session, Enrollment enrollment, User studentUser, User tutorUser, Wallet wallet) CreateTestAggregate(
        decimal earningAmount = 300_000m,
        decimal pendingBalance = 900_000m,
        int totalSessions = 3)
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
            PendingBalance = pendingBalance,
            AvailableBalance = 0m,
            UpdatedAt = DateTime.UtcNow
        };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            ServiceId = Guid.NewGuid(),
            TotalPrice = earningAmount * totalSessions,
            TotalSessions = totalSessions,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1,
            EarningAmount = earningAmount
        };

        var pastStart = DateTime.UtcNow.AddHours(-3);
        var pastEnd = DateTime.UtcNow.AddHours(-2);
        session.Schedule(pastStart, pastEnd); // Scheduled in the past

        enrollment.Sessions.Add(session);

        return (session, enrollment, studentUser, tutorUser, wallet);
    }

    [Fact]
    public async Task Handle_WhenStudentSubmitsAttended_RecordsStudentAttendanceAndAwaitsTutor()
    {
        // Arrange
        var (session, _, studentUser, _, wallet) = CreateTestAggregate();
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SubmitAttendanceCommand(studentUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.StudentAttendance.Should().Be(AttendanceStatus.Attended);
        result.TutorAttendance.Should().BeNull();
        result.Status.Should().Be(SessionStatus.Scheduled); // Not completed yet
        result.IsPayoutReleased.Should().BeFalse();
        wallet.PendingBalance.Should().Be(900_000m); // Wallet unchanged
        wallet.AvailableBalance.Should().Be(0m);
    }

    [Fact]
    public async Task Handle_WhenTutorSubmitsAttended_RecordsTutorAttendanceAndAwaitsStudent()
    {
        // Arrange
        var (session, _, _, tutorUser, wallet) = CreateTestAggregate();
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SubmitAttendanceCommand(tutorUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.TutorAttendance.Should().Be(AttendanceStatus.Attended);
        result.StudentAttendance.Should().BeNull();
        result.Status.Should().Be(SessionStatus.Scheduled);
        result.IsPayoutReleased.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenBothSubmitAttended_CompletesSessionAndReleasesEscrowPayoutWith10PercentFee()
    {
        // Arrange
        var (session, enrollment, studentUser, tutorUser, wallet) = CreateTestAggregate(earningAmount: 300_000m, pendingBalance: 900_000m);
        session.SubmitStudentAttendance(AttendanceStatus.Attended, DateTime.UtcNow.AddMinutes(-10)); // Student already attended

        var transactions = new List<Transaction>();
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SubmitAttendanceCommand(tutorUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(SessionStatus.Completed);
        result.IsPayoutReleased.Should().BeTrue();
        result.HasAttendanceConflict.Should().BeFalse();

        // Financial Invariant Check: 300k Gross - 10% (30k) = 270k Net
        wallet.PendingBalance.Should().Be(600_000m); // 900k - 300k
        wallet.AvailableBalance.Should().Be(270_000m); // 0 + 270k

        // Payout Transaction Check
        transactions.Should().HaveCount(1);
        var tx = transactions[0];
        tx.SessionId.Should().Be(session.Id);
        tx.BookingId.Should().Be(enrollment.BookingId);
        tx.Amount.Should().Be(300_000m);
        tx.CommissionRate.Should().Be(0.10m);
        tx.CommissionAmount.Should().Be(30_000m);
        tx.PayoutAmount.Should().Be(270_000m);
        tx.Status.Should().Be(TransactionStatus.Released);
    }

    [Fact]
    public async Task Handle_WhenConflict_StudentAbsentTutorAttended_FlagsConflictAndDoesNotReleasePayout()
    {
        // Arrange
        var (session, _, _, tutorUser, wallet) = CreateTestAggregate(earningAmount: 300_000m, pendingBalance: 900_000m);
        session.SubmitStudentAttendance(AttendanceStatus.Absent, DateTime.UtcNow.AddMinutes(-10)); // Student reported Absent!

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SubmitAttendanceCommand(tutorUser.Id, session.Id, AttendanceStatus.Attended); // Tutor reported Attended

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.HasAttendanceConflict.Should().BeTrue();
        result.Status.Should().Be(SessionStatus.Scheduled); // Stays Scheduled, no completion
        result.IsPayoutReleased.Should().BeFalse();
        wallet.PendingBalance.Should().Be(900_000m); // No money moved
        wallet.AvailableBalance.Should().Be(0m);
    }

    [Fact]
    public async Task Handle_WhenConflict_StudentAttendedTutorAbsent_FlagsConflictAndDoesNotReleasePayout()
    {
        // Arrange
        var (session, _, studentUser, _, wallet) = CreateTestAggregate();
        session.SubmitTutorAttendance(AttendanceStatus.Absent, DateTime.UtcNow.AddMinutes(-10)); // Tutor reported Absent!

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SubmitAttendanceCommand(studentUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.HasAttendanceConflict.Should().BeTrue();
        result.Status.Should().Be(SessionStatus.Scheduled);
        result.IsPayoutReleased.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenBeforeSessionEnd_ThrowsBadRequestException()
    {
        // Arrange - Session ends in the future
        var (session, _, studentUser, _, _) = CreateTestAggregate();
        session.Schedule(DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(2)); // In the future!

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new SubmitAttendanceCommand(studentUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Attendance verification can only be submitted after the session has ended.");
    }

    [Fact]
    public async Task Handle_WhenSessionIsUnscheduled_ThrowsBadRequestException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            ServiceId = Guid.NewGuid(),
            TotalPrice = 300_000m,
            TotalSessions = 1,
            SessionDurationMinutes = 60
        };

        var session = new Session { Id = Guid.NewGuid(), EnrollmentId = enrollment.Id, Enrollment = enrollment }; // Unscheduled!
        enrollment.Sessions.Add(session);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new SubmitAttendanceCommand(studentUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Cannot submit attendance for an unscheduled session.");
    }

    [Fact]
    public async Task Handle_WhenSessionAlreadyCompleted_ThrowsConflictException()
    {
        // Arrange
        var (session, _, studentUser, _, _) = CreateTestAggregate();
        session.Complete(); // Already Completed

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new SubmitAttendanceCommand(studentUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Session is already completed.");
    }

    [Fact]
    public async Task Handle_WhenUserIsNotParticipant_ThrowsForbiddenException()
    {
        // Arrange
        var (session, _, _, _, _) = CreateTestAggregate();
        var strangerId = Guid.NewGuid();

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new SubmitAttendanceCommand(strangerId, session.Id, AttendanceStatus.Attended);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenSessionNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session>()).Object);

        var command = new SubmitAttendanceCommand(Guid.NewGuid(), Guid.NewGuid(), AttendanceStatus.Attended);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenPendingBalanceInsufficient_ThrowsInvalidOperationExceptionAndDoesNotReleasePayout()
    {
        // Arrange - Pending balance is 100k, but session earning is 300k
        var (session, _, _, tutorUser, wallet) = CreateTestAggregate(earningAmount: 300_000m, pendingBalance: 100_000m);
        session.SubmitStudentAttendance(AttendanceStatus.Attended, DateTime.UtcNow.AddMinutes(-10));

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);

        var command = new SubmitAttendanceCommand(tutorUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<InvalidOperationException>();
        ex.Which.Message.Should().Contain("Financial invariant violated: Pending escrow balance is insufficient");
    }

    [Fact]
    public async Task Handle_WhenFinalSessionCompleted_TransitionsEnrollmentToCompletedStatus()
    {
        // Arrange - TotalSessions is 1
        var (session, enrollment, _, tutorUser, wallet) = CreateTestAggregate(earningAmount: 300_000m, pendingBalance: 300_000m, totalSessions: 1);
        session.SubmitStudentAttendance(AttendanceStatus.Attended, DateTime.UtcNow.AddMinutes(-10));

        var transactions = new List<Transaction>();
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SubmitAttendanceCommand(tutorUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        enrollment.Status.Should().Be(EnrollmentStatus.Completed);
        enrollment.CompletedSessions.Should().Be(1);
    }

    [Fact]
    public async Task Handle_WhenNonFinalSessionCompleted_KeepsEnrollmentActive()
    {
        // Arrange - TotalSessions is 3
        var (session, enrollment, _, tutorUser, wallet) = CreateTestAggregate(earningAmount: 300_000m, pendingBalance: 900_000m, totalSessions: 3);
        session.SubmitStudentAttendance(AttendanceStatus.Attended, DateTime.UtcNow.AddMinutes(-10));

        var transactions = new List<Transaction>();
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SubmitAttendanceCommand(tutorUser.Id, session.Id, AttendanceStatus.Attended);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        enrollment.Status.Should().Be(EnrollmentStatus.Active);
        enrollment.CompletedSessions.Should().Be(1);
    }
}
