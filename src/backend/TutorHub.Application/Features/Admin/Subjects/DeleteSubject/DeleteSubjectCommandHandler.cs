using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Admin.Subjects.DeleteSubject;

public class DeleteSubjectCommandHandler : IRequestHandler<DeleteSubjectCommand, Unit>
{
    private readonly IAppDbContext _context;

    public DeleteSubjectCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteSubjectCommand request, CancellationToken cancellationToken)
    {
        var subject = await _context.Subjects
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (subject == null)
        {
            throw new NotFoundException("Subject", request.Id);
        }

        // Safe Deletion: Check if associated with Tutors or Bookings
        var hasTutors = await _context.TutorSubjects
            .AnyAsync(ts => ts.SubjectId == request.Id, cancellationToken);

        var hasBookings = await _context.Bookings
            .AnyAsync(b => b.SubjectId == request.Id, cancellationToken);

        if (hasTutors || hasBookings)
        {
            throw new ConflictException("Cannot delete subject that is currently associated with tutors or bookings. Please deactivate the subject instead.");
        }

        _context.Subjects.Remove(subject);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException("Cannot delete subject because it is referenced by other records.");
        }

        return Unit.Value;
    }
}
