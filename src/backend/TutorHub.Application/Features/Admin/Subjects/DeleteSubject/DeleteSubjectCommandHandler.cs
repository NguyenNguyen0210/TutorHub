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

        var hasTutors = await _context.TutorSubjects
            .AnyAsync(ts => ts.SubjectId == request.Id, cancellationToken);

        if (hasTutors)
        {
            throw new ConflictException("Cannot delete subject because it is referenced by one or more tutors. Deactivate the subject instead.");
        }

        _context.Subjects.Remove(subject);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
