using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Categories.DTOs;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Categories.GetPublicCategoryById;

public class GetPublicCategoryByIdQueryHandler : IRequestHandler<GetPublicCategoryByIdQuery, PublicCategoryDto>
{
    private readonly IAppDbContext _context;

    public GetPublicCategoryByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PublicCategoryDto> Handle(GetPublicCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .Where(c => c.Id == request.Id && c.IsActive)
            .Select(c => new PublicCategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.Subjects
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.Name)
                    .Select(s => new PublicSubjectDto(s.Id, s.Name, c.Id, c.Name))
                    .ToList()
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (category == null)
        {
            throw new NotFoundException("Category", request.Id);
        }

        return category;
    }
}
