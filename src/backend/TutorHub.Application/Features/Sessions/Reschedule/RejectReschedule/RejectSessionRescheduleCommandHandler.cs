using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.Reschedule.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.Reschedule.RejectReschedule;

public class RejectSessionRescheduleCommandHandler : IRequestHandler<RejectSessionRescheduleCommand, SessionRescheduleRequestDto>
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly IClock _clock;

    public RejectSessionRescheduleCommandHandler(
        IAppDbContext context,
        IAuditLogService auditLogService,
        IClock clock)
    {
        _context = context;
        _auditLogService = auditLogService;
        _clock = clock;
    }

    public async Task<SessionRescheduleRequestDto> Handle(RejectSessionRescheduleCommand request, CancellationToken cancellationToken)
    {
        var requestEntity = await _context.SessionRescheduleRequests
            .FirstOrDefaultAsync(r => r.Id == request.RequestId, cancellationToken);

        if (requestEntity == null)
        {
            throw new NotFoundException("SessionRescheduleRequest", request.RequestId);
        }

        if (requestEntity.SessionId != request.SessionId)
        {
            throw new NotFoundException("SessionRescheduleRequest does not belong to the specified session.");
        }

        var session = await _context.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // 1. Strict Actor Authorization (INV-RESCHED-001): Only the Student can reject
        if (session.Enrollment.StudentProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("Only the Student can reject a session reschedule proposal.");
        }

        // 2. Proposal State Check (INV-RESCHED-004)
        if (requestEntity.Status != RescheduleRequestStatus.Pending)
        {
            throw new ConflictException($"Reschedule request has already been resolved with status '{requestEntity.Status}'.");
        }

        // 3. Deterministic clock
        var now = _clock.UtcNow;

        // 4. Domain mutation on request (Session schedule remains untouched)
        requestEntity.Reject(request.UserId, request.RejectionReason, now);

        // 5. Permanent Audit Log inside SAME unit of work
        await _auditLogService.LogAsync(
            action: "SESSION_RESCHEDULE_REJECTED",
            entityName: "SessionRescheduleRequest",
            entityId: requestEntity.Id.ToString(),
            userId: request.UserId,
            oldValues: new { Status = RescheduleRequestStatus.Pending.ToString() },
            newValues: new { Status = requestEntity.Status.ToString(), Reason = request.RejectionReason },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return SessionRescheduleRequestDto.FromEntity(requestEntity);
    }
}
