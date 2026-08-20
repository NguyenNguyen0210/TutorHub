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

        // 2. Fetch and validate TutorProfile
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
            .Include(t => t.AvailabilitySlots)
            .FirstOrDefaultAsync(t => t.Id == request.TutorProfileId, cancellationToken);

        if (tutor == null || tutor.Status != TutorProfileStatus.Verified || !tutor.User.IsActive)
        {
            throw new BadRequestException("The selected tutor profile is not active or verified.");
        }

        // 3. Verify Tutor teaches the specified subject
        var tutorSubject = tutor.TutorSubjects.FirstOrDefault(ts => ts.SubjectId == request.SubjectId && ts.IsActive);
        if (tutorSubject == null)
        {
            throw new BadRequestException("The selected tutor does not teach this subject.");
        }

        var subject = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == request.SubjectId, cancellationToken);
        if (subject == null || !subject.IsActive)
        {
            throw new NotFoundException("Subject", request.SubjectId);
        }

        // 4. Validate booking falls within tutor's weekly availability
        var dayOfWeek = request.StartAt.DayOfWeek;
        var startLocalTime = TimeOnly.FromDateTime(request.StartAt);
        var endLocalTime = TimeOnly.FromDateTime(request.EndAt);

        var isWithinAvailability = tutor.AvailabilitySlots.Any(s =>
            s.IsActive &&
            s.DayOfWeek == dayOfWeek &&
            s.StartTime <= startLocalTime &&
            s.EndTime >= endLocalTime);

        if (!isWithinAvailability)
        {
            throw new BadRequestException("The requested booking time falls outside of the tutor's weekly availability schedule.");
        }

        // 5. Concurrency & Overlap check (Active Bookings)
        var hasConflict = await _context.Bookings
            .AnyAsync(b => b.TutorProfileId == tutor.Id &&
                           b.StartAt < request.EndAt && request.StartAt < b.EndAt &&
                           (b.Status == BookingStatus.Pending ||
                            b.Status == BookingStatus.Confirmed ||
                            b.Status == BookingStatus.Completed ||
                            (b.Status == BookingStatus.Holding && b.HoldingExpiresAt.HasValue && b.HoldingExpiresAt.Value > DateTime.UtcNow)),
                      cancellationToken);

        if (hasConflict)
        {
            throw new ConflictException("The selected time slot has already been booked or is currently held by another student.");
        }

        // 6. Calculate total amount
        var hourlyRate = tutorSubject.OverridePrice ?? tutor.HourlyRate;
        var durationHours = (decimal)(request.EndAt - request.StartAt).TotalHours;
        var totalAmount = Math.Round(durationHours * hourlyRate, 2);

        var now = DateTime.UtcNow;
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            StudentProfileId = student.Id,
            TutorProfileId = tutor.Id,
            SubjectId = subject.Id,
            StartAt = request.StartAt,
            EndAt = request.EndAt,
            HourlyRate = hourlyRate,
            TotalAmount = totalAmount,
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
            TutorProfileId: tutor.Id,
            TutorName: tutor.User.FullName,
            TutorEmail: tutor.User.Email,
            TutorPhone: tutor.User.Phone,
            SubjectId: subject.Id,
            SubjectName: subject.Name,
            StartAt: booking.StartAt,
            EndAt: booking.EndAt,
            HourlyRate: booking.HourlyRate,
            TotalAmount: booking.TotalAmount,
            Status: booking.Status,
            HoldingExpiresAt: booking.HoldingExpiresAt,
            ConfirmedAt: booking.ConfirmedAt,
            CompletedAt: booking.CompletedAt,
            CancelledAt: booking.CancelledAt,
            CancelledBy: booking.CancelledBy,
            CancellationReason: booking.CancellationReason,
            CreatedAt: booking.CreatedAt,
            Transaction: null
        );
    }
}
