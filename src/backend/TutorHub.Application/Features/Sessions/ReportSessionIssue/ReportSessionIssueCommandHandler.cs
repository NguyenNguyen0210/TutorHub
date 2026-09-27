using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.ReportSessionIssue;

public class ReportSessionIssueCommandHandler : IRequestHandler<ReportSessionIssueCommand, SessionDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public ReportSessionIssueCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<SessionDto> Handle(ReportSessionIssueCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var session = await _context.Sessions
                .FromSqlInterpolated($"SELECT * FROM \"Sessions\" WHERE \"Id\" = {request.SessionId} FOR UPDATE")
                .Include(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
                .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
                .FirstOrDefaultAsync(cancellationToken);

            if (session == null)
                throw new NotFoundException("Session", request.SessionId);

            // Only the Student can report issues
            var isStudent = session.Enrollment.StudentProfile.UserId == userId;
            if (!isStudent)
                throw new ForbiddenException("Only students can report session issues.");

            // Must be in grace period
            if (session.Status != SessionStatus.AwaitingPayout)
                throw new BadRequestException($"Cannot report issue for a session in '{session.Status}' status. Session must be in the 12-hour grace period.");

            // Must be within grace period window
            if (session.GracePeriodEndsAt.HasValue && session.GracePeriodEndsAt.Value < now)
                throw new BadRequestException("The 12-hour grace period has expired. Please contact admin for post-payout disputes.");

            // Record the issue report on the session (freezes auto-payout)
            session.ReportIssue(userId, request.Reason, request.Description, now);

            // Auto-create a dispute for admin resolution
            var tutorUserId = session.Enrollment.TutorProfile.UserId;
            var dispute = new Dispute
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                InitiatorUserId = userId,
                RespondentUserId = tutorUserId,
                Reason = request.Reason,
                Description = request.Description,
                CreatedAt = now
            };

            // Pre-release escrow hold (money is still in PendingBalance)
            dispute.SetFinancialHold(session.EarningAmount, FinancialHoldType.EscrowHold, FinancialHoldStatus.Active, now);

            _context.Disputes.Add(dispute);

            _context.AddOutboxMessage(new SessionIssueReportedEvent(
                session.Id,
                session.EnrollmentId,
                userId,
                tutorUserId,
                request.Reason));

            _context.AddOutboxMessage(new DisputeCreatedEvent(
                dispute.Id,
                session.EnrollmentId,
                userId,
                tutorUserId));

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return SessionMapper.ToDto(session);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
