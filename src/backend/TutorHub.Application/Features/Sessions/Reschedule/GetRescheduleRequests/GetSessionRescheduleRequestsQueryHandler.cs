using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.Reschedule.DTOs;

namespace TutorHub.Application.Features.Sessions.Reschedule.GetRescheduleRequests;

public class GetSessionRescheduleRequestsQueryHandler : IRequestHandler<GetSessionRescheduleRequestsQuery, List<SessionRescheduleRequestDto>>
{
    private readonly IAppDbContext _context;

    public GetSessionRescheduleRequestsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SessionRescheduleRequestDto>> Handle(GetSessionRescheduleRequestsQuery request, CancellationToken cancellationToken)
    {
        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // Only participants (Student or Tutor) can view reschedule proposal history
        if (session.Enrollment.StudentProfile.UserId != request.UserId &&
            session.Enrollment.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to view reschedule requests for this session.");
        }

        var requests = await _context.SessionRescheduleRequests
            .Where(r => r.SessionId == request.SessionId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return requests.Select(SessionRescheduleRequestDto.FromEntity).ToList();
    }
}
