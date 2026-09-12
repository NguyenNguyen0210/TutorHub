using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Agreements.Commands.CheckoutCustomAgreement;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Agreements;

public class CheckoutCustomAgreementCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly CheckoutCustomAgreementCommandHandler _handler;

    private readonly List<CustomAgreement> _agreements = new();
    private readonly List<Booking> _bookings = new();
    private readonly List<Service> _services = new();

    public CheckoutCustomAgreementCommandHandlerTests()
    {
        _contextMock.Setup(c => c.CustomAgreements).Returns(MockDbSetHelper.CreateMockDbSet(_agreements).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(_bookings).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(_services).Object);

        _handler = new CheckoutCustomAgreementCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenAccepted_CreatesBookingWith15mHoldAndSnapshotsTerms()
    {
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student Alice" };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor Bob" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Mathematics" };

        var agreement = new CustomAgreement
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            StudentProfileId = student.Id,
            StudentProfile = student,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Math Exam Prep",
            Description = "8 private sessions",
            TotalPrice = 2400000m,
            TotalSessions = 8,
            SessionDurationMinutes = 90,
            TeachingMode = TeachingMode.Online,
            Status = CustomAgreementStatus.Accepted,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        _agreements.Add(agreement);

        var command = new CheckoutCustomAgreementCommand(agreement.Id, studentUser.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        result.Status.Should().Be(BookingStatus.Holding);
        result.HoldingExpiresAt.Should().BeAfter(DateTime.UtcNow.AddMinutes(14));
        result.TotalPrice.Should().Be(2400000m); // Matches Agreement exactly (INV-AGREE-010)
        result.TotalSessions.Should().Be(8);
        result.SessionDurationMinutes.Should().Be(90);
        result.TeachingMode.Should().Be(TeachingMode.Online);

        _bookings.Should().HaveCount(1);
        _bookings[0].CustomAgreementId.Should().Be(agreement.Id);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenActiveHoldingBookingAlreadyExists_ReturnsIdempotentlyWithoutDuplicating()
    {
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student" };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Math" };

        var agreement = new CustomAgreement
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            StudentProfileId = student.Id,
            StudentProfile = student,
            SubjectId = subject.Id,
            Subject = subject,
            TotalPrice = 1000000m,
            TotalSessions = 4,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Status = CustomAgreementStatus.Accepted,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        _agreements.Add(agreement);

        var existingBooking = new Booking
        {
            Id = Guid.NewGuid(),
            CustomAgreementId = agreement.Id,
            StudentProfileId = student.Id,
            StudentProfile = student,
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            SubjectId = subject.Id,
            Subject = subject,
            TotalPrice = 1000000m,
            TotalSessions = 4,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Status = BookingStatus.Holding,
            HoldingExpiresAt = DateTime.UtcNow.AddMinutes(10), // Active hold
            CreatedAt = DateTime.UtcNow
        };
        _bookings.Add(existingBooking);

        var command = new CheckoutCustomAgreementCommand(agreement.Id, studentUser.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Id.Should().Be(existingBooking.Id);
        _bookings.Should().HaveCount(1); // No second booking was created (INV-AGREE-009, INV-AGREE-014)
    }

    private (User StudentUser, CustomAgreement Agreement) SeedAgreementWithBooking(BookingStatus bookingStatus, DateTime? holdingExpiresAt)
    {
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student" };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Math" };

        var agreement = new CustomAgreement
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            StudentProfileId = student.Id,
            StudentProfile = student,
            SubjectId = subject.Id,
            Subject = subject,
            TotalPrice = 1_000_000m,
            TotalSessions = 4,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Status = CustomAgreementStatus.Accepted,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        _agreements.Add(agreement);

        _bookings.Add(new Booking
        {
            Id = Guid.NewGuid(),
            CustomAgreementId = agreement.Id,
            StudentProfileId = student.Id,
            StudentProfile = student,
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            SubjectId = subject.Id,
            Subject = subject,
            TotalPrice = 1_000_000m,
            TotalSessions = 4,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Status = bookingStatus,
            HoldingExpiresAt = holdingExpiresAt,
            CreatedAt = DateTime.UtcNow
        });

        return (studentUser, agreement);
    }

    [Fact]
    public async Task Handle_WhenHoldingHasNullExpiry_RefreshesSameBookingWithoutDuplicate()
    {
        var (studentUser, agreement) = SeedAgreementWithBooking(BookingStatus.Holding, holdingExpiresAt: null);
        var command = new CheckoutCustomAgreementCommand(agreement.Id, studentUser.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(BookingStatus.Holding);
        result.HoldingExpiresAt.Should().BeAfter(DateTime.UtcNow.AddMinutes(14));
        _bookings.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_WhenHoldingExpired_RefreshesSameBooking()
    {
        var (studentUser, agreement) = SeedAgreementWithBooking(BookingStatus.Holding, DateTime.UtcNow.AddMinutes(-1));
        var command = new CheckoutCustomAgreementCommand(agreement.Id, studentUser.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.HoldingExpiresAt.Should().BeAfter(DateTime.UtcNow.AddMinutes(14));
        _bookings.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_WhenExistingBookingCancelled_ThrowsConflictNoDuplicate()
    {
        var (studentUser, agreement) = SeedAgreementWithBooking(BookingStatus.Cancelled, DateTime.UtcNow.AddMinutes(-30));
        var command = new CheckoutCustomAgreementCommand(agreement.Id, studentUser.Id);

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        _bookings.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_WhenAgreementNotAccepted_ThrowsConflictException()
    {
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student" };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var agreement = new CustomAgreement
        {
            Id = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            TutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), User = new User { Id = Guid.NewGuid() } },
            StudentProfileId = student.Id,
            StudentProfile = student,
            SubjectId = Guid.NewGuid(),
            Subject = new Subject { Id = Guid.NewGuid(), Name = "Math" },
            Status = CustomAgreementStatus.Proposed, // Not accepted yet!
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        _agreements.Add(agreement);

        var command = new CheckoutCustomAgreementCommand(agreement.Id, studentUser.Id);

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("cannot be checked out in status 'Proposed'"));
    }

    [Fact]
    public async Task Handle_SnapshotIndependence_WhenServiceMutated_BookingRetainsAgreementTerms()
    {
        var studentUser = new User { Id = Guid.NewGuid(), FullName = "Student" };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Math" };

        // Service originally was 500,000 VND but mutated later by tutor to 900,000 VND
        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            SubjectId = subject.Id,
            Price = 900000m,
            TotalSessions = 1
        };

        var agreement = new CustomAgreement
        {
            Id = Guid.NewGuid(),
            ServiceId = service.Id,
            Service = service,
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            StudentProfileId = student.Id,
            StudentProfile = student,
            SubjectId = subject.Id,
            Subject = subject,
            TotalPrice = 1500000m, // Bespoke agreed price for 5 sessions (INV-AGREE-007)
            TotalSessions = 5,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            Status = CustomAgreementStatus.Accepted,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        _agreements.Add(agreement);

        var command = new CheckoutCustomAgreementCommand(agreement.Id, studentUser.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        // Booking MUST snapshot from Agreement (1,500,000 VND), NOT from Service (900,000 VND) (INV-AGREE-008)
        result.TotalPrice.Should().Be(1500000m);
        result.TotalSessions.Should().Be(5);
    }
}
