using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;
using TutorHub.Application.Common.Concurrency;

namespace TutorHub.Application.Features.Admin.TutorApplications.RejectTutorApplication;

public class RejectTutorApplicationCommandHandler
    : IRequestHandler<RejectTutorApplicationCommand, AdminTutorApplicationDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public RejectTutorApplicationCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AdminTutorApplicationDto> Handle(
        RejectTutorApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        await using var transaction = await PostgresAdvisoryLock.BeginTransactionAsync(_context, cancellationToken);
        await PostgresAdvisoryLock.LockRowAsync(_context,
            $"SELECT 1 FROM \"TutorApplications\" WHERE \"Id\" = {request.ApplicationId} FOR UPDATE",
            cancellationToken);

        var application = await _context.TutorApplications
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (application == null)
            throw new NotFoundException("TutorApplication", request.ApplicationId);

        // Domain invariant — throws if not Pending, or reason is empty
        application.Reject(request.Reason, userId);

        // Enqueue Outbox Message in same DB transaction
        _context.AddOutboxMessage(new TutorApplicationRejectedEvent(
            application.Id,
            application.UserId,
            request.Reason));

        await _context.SaveChangesAsync(cancellationToken);
        if (transaction != null)
            await transaction.CommitAsync(cancellationToken);

        return AdminTutorApplicationDto.From(application);
    }
}
