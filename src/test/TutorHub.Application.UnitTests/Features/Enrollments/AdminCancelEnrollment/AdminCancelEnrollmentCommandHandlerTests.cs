using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Enrollments.AdminCancelEnrollment;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Enrollments.AdminCancelEnrollment;

public class AdminCancelEnrollmentCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly AdminCancelEnrollmentCommandHandler _handler;

    public AdminCancelEnrollmentCommandHandlerTests()
    {
        _handler = new AdminCancelEnrollmentCommandHandler(_contextMock.Object);
    }

    private static (Enrollment enrollment, Wallet wallet) CreateTestAggregate(
        decimal earningPerSession = 300_000m,
        int totalSessions = 2)
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

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Biology" };
        var service = new Service { Id = Guid.NewGuid(), Title = "Biology Prep" };

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
            enrollment.Sessions.Add(session);
        }

        return (enrollment, wallet);
    }

    [Fact]
    public async Task Handle_WhenAdminCancels_CancelsEnrollmentWithCancelledByAdminAndRefundsEscrow()
    {
        // Arrange
        var (enrollment, wallet) = CreateTestAggregate(300_000m, 2);
        var adminId = Guid.NewGuid();

        var transactions = new List<Transaction>();
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet> { wallet }).Object);
        _contextMock.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new AdminCancelEnrollmentCommand(adminId, UserRole.Admin, enrollment.Id, "Administrative intervention due to policy violation.");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(EnrollmentStatus.Cancelled);
        result.CancelledBy.Should().Be(CancelledBy.Admin);
        result.CancellationReason.Should().Be("Administrative intervention due to policy violation.");
        wallet.PendingBalance.Should().Be(0m);
        transactions.Should().HaveCount(1);
        transactions[0].Amount.Should().Be(600_000m);
        transactions[0].Status.Should().Be(TransactionStatus.Refunded);
    }

    [Fact]
    public async Task Handle_WhenUserIsNotAdmin_ThrowsForbiddenException()
    {
        // Arrange
        var (enrollment, _) = CreateTestAggregate();
        var studentId = Guid.NewGuid();

        var command = new AdminCancelEnrollmentCommand(studentId, UserRole.Student, enrollment.Id, "Administrative cancel.");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }
}
