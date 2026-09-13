using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Enrollments.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.GetMyEnrollments;

public class GetMyEnrollmentsQueryHandler : IRequestHandler<GetMyEnrollmentsQuery, PagedResult<EnrollmentSummaryDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyEnrollmentsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<EnrollmentSummaryDto>> Handle(GetMyEnrollmentsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

        var query = _context.Enrollments.AsNoTracking();

        if (role == UserRole.Student)
        {
            query = query.Where(e => e.StudentProfile.UserId == userId);
        }
        else if (role == UserRole.Tutor)
        {
            query = query.Where(e => e.TutorProfile.UserId == userId);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(e => e.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query.OrderByDescending(e => e.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EnrollmentSummaryDto(
                e.Id,
                e.BookingId,
                e.StudentProfileId,
                e.StudentProfile.User.FullName,
                e.StudentProfile.User.Email,
                e.TutorProfileId,
                e.TutorProfile.User.FullName,
                e.TutorProfile.User.Email,
                e.ServiceId,
                e.Service.Title,
                e.SubjectId,
                e.Subject.Name,
                e.TotalPrice,
                e.TotalSessions,
                e.Sessions.Count(s => s.Status == SessionStatus.Completed), // Server-side SQL COUNT
                e.SessionDurationMinutes,
                e.TeachingMode,
                e.Status,
                e.CreatedAt,
                e.CompletedAt,
                e.CancelledAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<EnrollmentSummaryDto>(items, totalCount, pageNumber, pageSize);
    }
}
