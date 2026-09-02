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

        var now = DateTime.UtcNow;

        // 2. Service-based booking flow (Sprint 4)
        if (request.ServiceId.HasValue)
        {
            var service = await _context.Services
                .Include(s => s.TutorProfile).ThenInclude(t => t.User)
                .Include(s => s.Subject)
                .FirstOrDefaultAsync(s => s.Id == request.ServiceId.Value, cancellationToken);

            if (service == null)
            {
                throw new NotFoundException("Service", request.ServiceId.Value);
            }

            // Validate service status
            if (service.Status != ServiceStatus.Published)
            {
                throw new BadRequestException("The selected service is not published.");
            }

            // Validate tutor account status
            if (service.TutorProfile.User.Status != AccountStatus.Active)
            {
                throw new BadRequestException("The selected tutor profile is not active or verified.");
            }

            // Validate tutor application approval
            var isApproved = await _context.TutorApplications
                .AnyAsync(a => a.UserId == service.TutorProfile.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

            if (!isApproved)
            {
                throw new BadRequestException("The selected tutor profile is not active or verified.");
            }

            // Prevent self-booking
            if (service.TutorProfile.UserId == request.UserId)
            {
                throw new BadRequestException("Tutors cannot book their own services.");
            }

            // Validate subject is active
            if (!service.Subject.IsActive)
            {
                throw new BadRequestException("The selected subject is not active.");
            }

            var serviceBooking = new Booking
            {
                Id = Guid.NewGuid(),
                StudentProfileId = student.Id,
                StudentProfile = student,
                TutorProfileId = service.TutorProfileId,
                TutorProfile = service.TutorProfile,
                SubjectId = service.SubjectId,
                Subject = service.Subject,
                ServiceId = service.Id,
                Service = service,
                TotalPrice = service.Price,
                TotalSessions = service.TotalSessions,
                SessionDurationMinutes = service.SessionDurationMinutes,
                TeachingMode = service.TeachingMode,
                // Legacy fields for backward compatibility
                StartAt = now,
                EndAt = now.AddMinutes(service.SessionDurationMinutes),
                HourlyRate = service.TotalSessions > 0 ? service.Price / service.TotalSessions : service.Price,
                TotalAmount = service.Price,
                Status = BookingStatus.Holding,
                HoldingExpiresAt = now.AddMinutes(15),
                CreatedAt = now
            };

            _context.Bookings.Add(serviceBooking);
            await _context.SaveChangesAsync(cancellationToken);

            return new BookingDto(
                Id: serviceBooking.Id,
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
                StartAt: serviceBooking.StartAt,
                EndAt: serviceBooking.EndAt,
                HourlyRate: serviceBooking.HourlyRate,
                TotalAmount: serviceBooking.TotalAmount,
                Status: serviceBooking.Status,
                HoldingExpiresAt: serviceBooking.HoldingExpiresAt,
                ConfirmedAt: serviceBooking.ConfirmedAt,
                CompletedAt: serviceBooking.CompletedAt,
                CancelledAt: serviceBooking.CancelledAt,
                CancelledBy: serviceBooking.CancelledBy,
                CancellationReason: serviceBooking.CancellationReason,
                CreatedAt: serviceBooking.CreatedAt,
                Transaction: null,
                ServiceId: service.Id,
                TotalPrice: serviceBooking.TotalPrice,
                TotalSessions: serviceBooking.TotalSessions,
                SessionDurationMinutes: serviceBooking.SessionDurationMinutes,
                TeachingMode: serviceBooking.TeachingMode,
                Enrollment: null
            );
        }

        // 3. Legacy single-session booking flow
        var tutorProfileId = request.TutorProfileId!.Value;
        var subjectId = request.SubjectId!.Value;
        var startAt = request.StartAt!.Value;
        var endAt = request.EndAt!.Value;

        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
            .Include(t => t.AvailabilitySlots)
            .FirstOrDefaultAsync(t => t.Id == tutorProfileId, cancellationToken);

        if (tutor == null || tutor.User.Status != AccountStatus.Active)
        {
            throw new BadRequestException("The selected tutor profile is not active or verified.");
        }

        var isApprovedTutor = await _context.TutorApplications
            .AnyAsync(a => a.UserId == tutor.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        if (!isApprovedTutor)
        {
            throw new BadRequestException("The selected tutor profile is not active or verified.");
        }

        if (tutor.UserId == request.UserId)
        {
            throw new BadRequestException("Tutors cannot book their own services.");
        }

        var tutorSubject = tutor.TutorSubjects.FirstOrDefault(ts => ts.SubjectId == subjectId && ts.IsActive);
        if (tutorSubject == null)
        {
            throw new BadRequestException("The selected tutor does not teach this subject.");
        }

        var subject = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);
        if (subject == null || !subject.IsActive)
        {
            throw new NotFoundException("Subject", subjectId);
        }

        var dayOfWeek = startAt.DayOfWeek;
        var startLocalTime = TimeOnly.FromDateTime(startAt);
        var endLocalTime = TimeOnly.FromDateTime(endAt);

        var isWithinAvailability = tutor.AvailabilitySlots.Any(s =>
            s.IsActive &&
            s.DayOfWeek == dayOfWeek &&
            s.StartTime <= startLocalTime &&
            s.EndTime >= endLocalTime);

        if (!isWithinAvailability)
        {
            throw new BadRequestException("The requested booking time falls outside of the tutor's weekly availability schedule.");
        }

        var hasConflict = await _context.Bookings
            .AnyAsync(b => b.TutorProfileId == tutor.Id &&
                           b.StartAt < endAt && startAt < b.EndAt &&
                           (b.Status == BookingStatus.Pending ||
                            b.Status == BookingStatus.Confirmed ||
                            b.Status == BookingStatus.Completed ||
                            (b.Status == BookingStatus.Holding && b.HoldingExpiresAt.HasValue && b.HoldingExpiresAt.Value > DateTime.UtcNow)),
                      cancellationToken);

        if (hasConflict)
        {
            throw new ConflictException("The selected time slot has already been booked or is currently held by another student.");
        }

        var hourlyRate = tutorSubject.OverridePrice ?? tutor.HourlyRate;
        var durationHours = (decimal)(endAt - startAt).TotalHours;
        var totalAmount = Math.Round(durationHours * hourlyRate, 2);

        var legacyBooking = new Booking
        {
            Id = Guid.NewGuid(),
            StudentProfileId = student.Id,
            TutorProfileId = tutor.Id,
            SubjectId = subject.Id,
            StartAt = startAt,
            EndAt = endAt,
            HourlyRate = hourlyRate,
            TotalAmount = totalAmount,
            TotalPrice = totalAmount,
            TotalSessions = 1,
            SessionDurationMinutes = (int)(endAt - startAt).TotalMinutes,
            TeachingMode = TeachingMode.Online,
            Status = BookingStatus.Holding,
            HoldingExpiresAt = now.AddMinutes(15),
            CreatedAt = now
        };

        _context.Bookings.Add(legacyBooking);
        await _context.SaveChangesAsync(cancellationToken);

        return new BookingDto(
            Id: legacyBooking.Id,
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
            StartAt: legacyBooking.StartAt,
            EndAt: legacyBooking.EndAt,
            HourlyRate: legacyBooking.HourlyRate,
            TotalAmount: legacyBooking.TotalAmount,
            Status: legacyBooking.Status,
            HoldingExpiresAt: legacyBooking.HoldingExpiresAt,
            ConfirmedAt: legacyBooking.ConfirmedAt,
            CompletedAt: legacyBooking.CompletedAt,
            CancelledAt: legacyBooking.CancelledAt,
            CancelledBy: legacyBooking.CancelledBy,
            CancellationReason: legacyBooking.CancellationReason,
            CreatedAt: legacyBooking.CreatedAt,
            Transaction: null,
            ServiceId: null,
            TotalPrice: legacyBooking.TotalPrice,
            TotalSessions: legacyBooking.TotalSessions,
            SessionDurationMinutes: legacyBooking.SessionDurationMinutes,
            TeachingMode: legacyBooking.TeachingMode,
            Enrollment: null
        );
    }
}
