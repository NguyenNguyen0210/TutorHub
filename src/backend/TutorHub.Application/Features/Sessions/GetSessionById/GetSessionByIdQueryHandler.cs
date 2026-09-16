using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.GetSessionById;

public class GetSessionByIdQueryHandler : IRequestHandler<GetSessionByIdQuery, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetSessionByIdQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<SessionDto> Handle(GetSessionByIdQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // Authorization: Student, Tutor, or Admin
        if (role != UserRole.Admin &&
            session.Enrollment.StudentProfile.UserId != userId &&
            session.Enrollment.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to view this session.");
        }

        return SessionMapper.ToDto(session);
    }
}
