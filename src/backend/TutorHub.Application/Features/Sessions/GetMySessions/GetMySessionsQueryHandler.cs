using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.GetMySessions;

public class GetMySessionsQueryHandler : IRequestHandler<GetMySessionsQuery, List<SessionCalendarDto>>
{
    private readonly IAppDbContext _context;

    public GetMySessionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SessionCalendarDto>> Handle(GetMySessionsQuery request, CancellationToken cancellationToken)
    {
        // 1. Validate date range window
        if (request.FromDate.HasValue != request.ToDate.HasValue)
        {
            throw new BadRequestException("FromDate and ToDate must either both be provided or both omitted.");
        }

        if (request.FromDate.HasValue && request.ToDate.HasValue && request.FromDate.Value >= request.ToDate.Value)
        {
            throw new BadRequestException("FromDate must be strictly earlier than ToDate.");
        }

        // 2. Query with direct LINQ Projection
        var query = _context.Sessions.AsNoTracking();

        if (request.Role == UserRole.Student)
        {
            query = query.Where(s => s.Enrollment.StudentProfile.UserId == request.UserId);
        }
        else if (request.Role == UserRole.Tutor)
        {
            query = query.Where(s => s.Enrollment.TutorProfile.UserId == request.UserId);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(s => s.Status == request.Status.Value);
        }

        if (request.FromDate.HasValue && request.ToDate.HasValue)
        {
            // Intersection Date Range: [FromDate, ToDate)
            query = query.Where(s => s.StartAt != null && s.EndAt != null &&
                                     s.StartAt < request.ToDate.Value &&
                                     s.EndAt > request.FromDate.Value);
        }

        return await query
            .OrderBy(s => s.StartAt ?? DateTime.MaxValue)
            .ThenBy(s => s.SessionNumber)
            .Select(s => new SessionCalendarDto(
                s.Id,
                s.EnrollmentId,
                s.SessionNumber,
                s.Enrollment.Subject.Name,
                s.Enrollment.StudentProfile.User.FullName,
                s.Enrollment.TutorProfile.User.FullName,
                s.StartAt,
                s.EndAt,
                s.Enrollment.SessionDurationMinutes,
                s.Enrollment.TeachingMode,
                s.Status
            ))
            .ToListAsync(cancellationToken);
    }
}
