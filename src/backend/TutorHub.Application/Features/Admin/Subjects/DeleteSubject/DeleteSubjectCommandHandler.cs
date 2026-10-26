using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Subjects.DeleteSubject;

public class DeleteSubjectCommandHandler : IRequestHandler<DeleteSubjectCommand, Unit>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public DeleteSubjectCommandHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<Unit> Handle(DeleteSubjectCommand request, CancellationToken cancellationToken)
    {
        var subject = await _context.Subjects
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (subject == null)
        {
            throw new NotFoundException("Subject", request.Id);
        }

        var hasTutors = await _context.TutorSubjects
            .AnyAsync(ts => ts.SubjectId == request.Id, cancellationToken);

        if (hasTutors)
        {
            throw new ConflictException("Cannot delete subject because it is referenced by one or more tutors. Deactivate the subject instead.");
        }

        var hasActiveBookings = await _context.Bookings
            .AnyAsync(b => b.SubjectId == request.Id && (b.Status == BookingStatus.Holding || b.Status == BookingStatus.Paid), cancellationToken);

        if (hasActiveBookings)
        {
            throw new ConflictException("Cannot delete subject because it has active bookings. Deactivate the subject instead.");
        }

        var userId = _currentUserService.UserIdOrThrow();

        subject.SoftDelete(userId, request.Reason);

        await _auditLogService.LogAsync(
            action: "SUBJECT_SOFT_DELETED",
            entityName: "Subject",
            entityId: subject.Id.ToString(),
            userId: userId,
            oldValues: new { subject.Name, subject.CategoryId, IsDeleted = false },
            newValues: new { IsDeleted = true, subject.DeleteReason, subject.DeletedAt },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
