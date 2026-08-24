using System.Net;
using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.CancelBooking;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Bookings.CancelBooking;

public class CancelBookingCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly CancelBookingCommandHandler _handler;

    public CancelBookingCommandHandlerTests()
    {
        _handler = new CancelBookingCommandHandler(_contextMock.Object);
    }

    private static (Booking Booking, Guid StudentUserId, Guid TutorUserId) CreateTestBooking(
        BookingStatus status = BookingStatus.Pending,
        DateTime? startAt = null)
    {
        var studentUserId = Guid.NewGuid();
        var tutorUserId = Guid.NewGuid();
        var tutorProfileId = Guid.NewGuid();
        var studentProfileId = Guid.NewGuid();

        var studentUser = new User
        {
            Id = studentUserId,
            FullName = "Student One",
            Email = "student@example.com",
            Role = UserRole.Student
        };

        var tutorUser = new User
        {
            Id = tutorUserId,
            FullName = "Tutor One",
            Email = "tutor@example.com",
            Role = UserRole.Tutor
        };

        var studentProfile = new StudentProfile
        {
            Id = studentProfileId,
            UserId = studentUserId,
            User = studentUser
        };

        var tutorProfile = new TutorProfile
        {
            Id = tutorProfileId,
            UserId = tutorUserId,
            User = tutorUser
        };

        var subject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Mathematics"
        };

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfileId,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfileId,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            StartAt = startAt ?? DateTime.UtcNow.AddDays(2),
            EndAt = (startAt ?? DateTime.UtcNow.AddDays(2)).AddHours(1),
            HourlyRate = 200000,
            TotalAmount = 200000,
            Status = status,
            CreatedAt = DateTime.UtcNow
        };

        return (booking, studentUserId, tutorUserId);
    }

    [Fact]
    public async Task Handle_WhenStudentCancelsPendingBooking_ShouldCancelAndSave()
    {
        // Arrange
        var (booking, studentUserId, _) = CreateTestBooking(BookingStatus.Pending);
        var bookingsList = new List<Booking> { booking };
        var walletsList = new List<Wallet>();

        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(walletsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CancelBookingCommand(booking.Id, studentUserId, UserRole.Student, "Schedule conflict");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(BookingStatus.Cancelled);
        result.CancelledBy.Should().Be(CancelledBy.Student);
        result.CancellationReason.Should().Be("Schedule conflict");

        booking.Status.Should().Be(BookingStatus.Cancelled);
        booking.CancelledBy.Should().Be(CancelledBy.Student);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenBookingDoesNotExist_ShouldThrowNotFoundException()
    {
        // Arrange
        var bookingsList = new List<Booking>();
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);

        var nonExistentId = Guid.NewGuid();
        var command = new CancelBookingCommand(nonExistentId, Guid.NewGuid(), UserRole.Student, "Reason");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.NotFound);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenUserIsNotParticipant_ShouldThrowForbiddenException()
    {
        // Arrange
        var (booking, _, _) = CreateTestBooking(BookingStatus.Pending);
        var bookingsList = new List<Booking> { booking };

        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);

        var unauthorizedUserId = Guid.NewGuid();
        var command = new CancelBookingCommand(booking.Id, unauthorizedUserId, UserRole.Student, "Intruder cancel");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenBookingAlreadyCompleted_ShouldThrowConflictException()
    {
        // Arrange
        var (booking, studentUserId, _) = CreateTestBooking(BookingStatus.Completed);
        var bookingsList = new List<Booking> { booking };

        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(bookingsList).Object);

        var command = new CancelBookingCommand(booking.Id, studentUserId, UserRole.Student, "Cannot cancel finished session");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Conflict);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
