using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Subjects.GetPublicSubjectById;

public class GetPublicSubjectByIdQueryHandler : IRequestHandler<GetPublicSubjectByIdQuery, PublicSubjectDto>
{
    private readonly IAppDbContext _context;

    public GetPublicSubjectByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PublicSubjectDto> Handle(GetPublicSubjectByIdQuery request, CancellationToken cancellationToken)
    {
        // Public Invariant: Subject must be active AND Category must be active
        var subject = await _context.Subjects
            .AsNoTracking()
            .Where(s => s.Id == request.Id && s.IsActive && s.Category.IsActive)
            .Select(s => new PublicSubjectDto(
                s.Id,
                s.Name,
                s.CategoryId,
                s.Category.Name
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (subject == null)
        {
            throw new NotFoundException("Subject", request.Id);
        }

        return subject;
    }
}
