using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.GetEnrollmentById;

public class GetEnrollmentByIdQueryHandler : IRequestHandler<GetEnrollmentByIdQuery, EnrollmentDto>
{
    private readonly IAppDbContext _context;

    public GetEnrollmentByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<EnrollmentDto> Handle(GetEnrollmentByIdQuery request, CancellationToken cancellationToken)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.StudentProfile).ThenInclude(s => s.User)
            .Include(e => e.TutorProfile).ThenInclude(t => t.User)
            .Include(e => e.Subject)
            .Include(e => e.Service)
            .Include(e => e.Sessions)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, cancellationToken);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", request.EnrollmentId);
        }

        // Authorization: Student, Tutor, or Admin
        if (request.Role != UserRole.Admin &&
            enrollment.StudentProfile.UserId != request.UserId &&
            enrollment.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to view this enrollment.");
        }

        var sessionDtos = enrollment.Sessions.OrderBy(s => s.SessionNumber).Select(s => new SessionDto(
            Id: s.Id,
            EnrollmentId: s.EnrollmentId,
            SessionNumber: s.SessionNumber,
            EarningAmount: s.EarningAmount,
            StartAt: s.StartAt,
            EndAt: s.EndAt,
            Status: s.Status,
            IsPayoutReleased: s.IsPayoutReleased,
            CreatedAt: s.CreatedAt,
            CompletedAt: s.CompletedAt,
            CancelledAt: s.CancelledAt
        )).ToList();

        return new EnrollmentDto(
            Id: enrollment.Id,
            BookingId: enrollment.BookingId,
            StudentProfileId: enrollment.StudentProfileId,
            TutorProfileId: enrollment.TutorProfileId,
            ServiceId: enrollment.ServiceId,
            SubjectId: enrollment.SubjectId,
            SubjectName: enrollment.Subject.Name,
            TotalPrice: enrollment.TotalPrice,
            TotalSessions: enrollment.TotalSessions,
            CompletedSessions: enrollment.CompletedSessions,
            SessionDurationMinutes: enrollment.SessionDurationMinutes,
            TeachingMode: enrollment.TeachingMode,
            Status: enrollment.Status,
            CreatedAt: enrollment.CreatedAt,
            CompletedAt: enrollment.CompletedAt,
            CancelledAt: enrollment.CancelledAt,
            CancelledBy: enrollment.CancelledBy,
            CancellationReason: enrollment.CancellationReason,
            Sessions: sessionDtos
        );
    }
}
