using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Subjects.GetPublicSubjectById;

public class GetPublicSubjectByIdQueryHandler : IRequestHandler<GetPublicSubjectByIdQuery, PublicSubjectDto>
{
    private readonly IAppDbContext _context;
    private readonly ISubjectCacheService _cache;

    public GetPublicSubjectByIdQueryHandler(IAppDbContext context, ISubjectCacheService? cache = null)
    {
        _context = context;
        _cache = cache ?? NoOpSubjectCacheService.Instance;
    }

    public async Task<PublicSubjectDto> Handle(GetPublicSubjectByIdQuery request, CancellationToken cancellationToken)
    {
        var subject = await _cache.GetSubjectAsync(
            request.Id,
            () => QueryAsync(request.Id, cancellationToken),
            cancellationToken);

        if (subject == null)
        {
            throw new NotFoundException("Subject", request.Id);
        }

        return subject;
    }

    private Task<PublicSubjectDto?> QueryAsync(Guid id, CancellationToken cancellationToken)
    {
        // Public Invariant: Subject must be active AND Category must be active.
        // A miss returns null so it is never cached; Handle maps it to 404.
        return _context.Subjects
            .AsNoTracking()
            .Where(s => s.Id == id && s.IsActive && s.Category.IsActive)
            .Select(s => new PublicSubjectDto(
                s.Id,
                s.Name,
                s.CategoryId,
                s.Category.Name
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
