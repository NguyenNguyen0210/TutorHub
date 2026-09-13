using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.CancelSession;

public class CancelSessionCommandHandler : IRequestHandler<CancelSessionCommand, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public CancelSessionCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<SessionDto> Handle(CancelSessionCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var session = await _context.Sessions
            .Include(s => s.Enrollment)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // 1. Authorization: only a participant of the enrollment.
        var enrollment = await _context.Enrollments
            .Include(e => e.StudentProfile)
            .Include(e => e.TutorProfile)
            .Include(e => e.Sessions)
            .FirstOrDefaultAsync(e => e.Id == session.EnrollmentId, cancellationToken);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", session.EnrollmentId);
        }

        if (enrollment.StudentProfile.UserId != userId &&
            enrollment.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to cancel this session.");
        }

        // 2. Enrollment must be Active (F-19 gate, no finance: a Pending
        // enrollment has nothing scheduled yet; use enrollment cancel instead).
        if (enrollment.Status != EnrollmentStatus.Active)
        {
            throw new ConflictException($"Cannot cancel a session of an enrollment in '{enrollment.Status}' status.");
        }

        // 3. Domain gate: Unscheduled, or Scheduled with future StartAt. Completed /
        // Cancelled / started sessions are rejected inside CancelSingle (→ 409 via handler mapping).
        var now = _clock.UtcNow;
        try
        {
            session.CancelSingle(request.Reason, now);
        }
        catch (ArgumentException ex)
        {
            throw new BadRequestException(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message);
        }

        // 4. Re-evaluate the contract lifecycle: the last unresolved Session may
        // now be terminal, allowing the Enrollment to complete (FR-ENR-005).
        enrollment.EvaluateCompletion();

        await _context.SaveChangesAsync(cancellationToken);

        // F-23 (Đợt 4): centralized mapping.
        return SessionMapper.ToDto(session);
    }
}
