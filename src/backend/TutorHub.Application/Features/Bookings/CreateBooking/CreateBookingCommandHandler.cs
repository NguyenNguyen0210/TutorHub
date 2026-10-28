using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Application.Common.Concurrency;

namespace TutorHub.Application.Features.Bookings.CreateBooking;

public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, BookingDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public CreateBookingCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<BookingDto> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        // 1. Get or create StudentProfile for the current authenticated user
        var student = await _context.StudentProfiles
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (student == null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user == null || user.Role != UserRole.Student)
            {
                throw new ForbiddenException("Only registered students can create bookings.");
            }

            student = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                User = user
            };
            _context.StudentProfiles.Add(student);
        }

        // 2. Load Service Offering with TutorProfile.User and Subject
        var service = await _context.Services
            .Include(s => s.TutorProfile).ThenInclude(t => t.User)
            .Include(s => s.Subject)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", request.ServiceId);
        }

        // 3. Invariant Validations
        if (service.Status != ServiceStatus.Published)
        {
            throw new BadRequestException("Only published services can be booked.");
        }

        var isTutorApproved = await _context.TutorApplications
            .AnyAsync(a => a.UserId == service.TutorProfile.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        if (!isTutorApproved)
        {
            throw new BadRequestException("The tutor offering this service is not approved.");
        }

        if (service.TutorProfile.User.Status != AccountStatus.Active)
        {
            throw new ForbiddenException("The tutor's account is currently not active.");
        }

        if (student.UserId == service.TutorProfile.UserId)
        {
            throw new BadRequestException("Tutors cannot book their own services.");
        }

        var now = _clock.UtcNow;

        await using var transaction = await PostgresAdvisoryLock.BeginTransactionAsync(_context, cancellationToken);
        await PostgresAdvisoryLock.AcquireAsync(
            _context, $"booking-hold:{student.Id:D}:{service.Id:D}", cancellationToken);

        // Idempotency (RM13): If an active holding booking already exists for this student and service, return it
        var existingHolding = await _context.Bookings
            .FirstOrDefaultAsync(b => b.StudentProfileId == student.Id
                                   && b.ServiceId == service.Id
                                   && b.Status == BookingStatus.Holding
                                   && b.HoldingExpiresAt.HasValue
                                   && b.HoldingExpiresAt.Value > now, cancellationToken);
        if (existingHolding != null)
        {
            existingHolding.StudentProfile = student;
            existingHolding.TutorProfile = service.TutorProfile;
            existingHolding.Subject = service.Subject;
            return BookingMapper.ToDto(existingHolding, transaction: null);
        }

        // 4. Pure Service Checkout Holding Snapshot (15m expiration lock)
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            StudentProfileId = student.Id,
            TutorProfileId = service.TutorProfileId,
            SubjectId = service.SubjectId,
            ServiceId = service.Id,
            TotalPrice = service.Price,
            TotalSessions = service.TotalSessions,
            SessionDurationMinutes = service.SessionDurationMinutes,
            TeachingMode = service.TeachingMode,
            Status = BookingStatus.Holding,
            HoldingExpiresAt = now.AddMinutes(15),
            CreatedAt = now
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync(cancellationToken);
        if (transaction != null)
            await transaction.CommitAsync(cancellationToken);

        // centralized mapping (attach loaded navs first).
        booking.StudentProfile = student;
        booking.TutorProfile = service.TutorProfile;
        booking.Subject = service.Subject;
        return BookingMapper.ToDto(booking, transaction: null);
    }
}
