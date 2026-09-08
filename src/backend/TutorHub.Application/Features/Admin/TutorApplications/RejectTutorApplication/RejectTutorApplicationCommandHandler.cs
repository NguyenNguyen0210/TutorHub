using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;

namespace TutorHub.Application.Features.Admin.TutorApplications.RejectTutorApplication;

public class RejectTutorApplicationCommandHandler
    : IRequestHandler<RejectTutorApplicationCommand, AdminTutorApplicationDto>
{
    private readonly IAppDbContext _context;

    public RejectTutorApplicationCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminTutorApplicationDto> Handle(
        RejectTutorApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.TutorApplications
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (application == null)
            throw new NotFoundException("TutorApplication", request.ApplicationId);

        // Domain invariant — throws if not Pending, or reason is empty
        application.Reject(request.Reason, request.AdminId);

        // Enqueue Outbox Message in same DB transaction (DEC-S7-001, DEC-S7-002)
        _context.AddOutboxMessage(new TutorApplicationRejectedEvent(
            application.Id,
            application.UserId,
            request.Reason));

        await _context.SaveChangesAsync(cancellationToken);

        return AdminTutorApplicationDto.From(application);
    }
}
