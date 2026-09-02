using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.CreateBooking;

public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, BookingDto>
{
    private readonly IAppDbContext _context;

    public CreateBookingCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BookingDto> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        // 1. Get or create StudentProfile for the current authenticated user
        var student = await _context.StudentProfiles
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == request.UserId, cancellationToken);

        if (student == null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            if (user == null || user.Role != UserRole.Student)
            {
                throw new ForbiddenException("Only registered students can create bookings.");
            }

            student = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
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

        // 4. Pure Service Checkout Holding Snapshot (15m expiration lock)
        var now = DateTime.UtcNow;
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

        return new BookingDto(
            Id: booking.Id,
            StudentProfileId: student.Id,
            StudentName: student.User.FullName,
            StudentEmail: student.User.Email,
            StudentPhone: student.User.Phone,
            TutorProfileId: service.TutorProfileId,
            TutorName: service.TutorProfile.User.FullName,
            TutorEmail: service.TutorProfile.User.Email,
            TutorPhone: service.TutorProfile.User.Phone,
            SubjectId: service.SubjectId,
            SubjectName: service.Subject.Name,
            Status: booking.Status,
            HoldingExpiresAt: booking.HoldingExpiresAt,
            ConfirmedAt: booking.ConfirmedAt,
            CompletedAt: booking.CompletedAt,
            CancelledAt: booking.CancelledAt,
            CancelledBy: booking.CancelledBy,
            CancellationReason: booking.CancellationReason,
            CreatedAt: booking.CreatedAt,
            Transaction: null,
            ServiceId: service.Id,
            TotalPrice: booking.TotalPrice,
            TotalSessions: booking.TotalSessions,
            SessionDurationMinutes: booking.SessionDurationMinutes,
            TeachingMode: booking.TeachingMode,
            Enrollment: null
        );
    }
}
