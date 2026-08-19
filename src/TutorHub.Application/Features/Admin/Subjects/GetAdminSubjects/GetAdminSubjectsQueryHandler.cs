using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Admin.Subjects.GetAdminSubjects;

public class GetAdminSubjectsQueryHandler : IRequestHandler<GetAdminSubjectsQuery, PagedResult<AdminSubjectDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminSubjectsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminSubjectDto>> Handle(GetAdminSubjectsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Subjects
            .AsNoTracking()
            .Include(s => s.Category)
            .Include(s => s.TutorSubjects)
            .AsQueryable();

        if (request.CategoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == request.CategoryId.Value);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(s => s.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(search) || s.Category.Name.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderBy(s => s.Category.Name)
            .ThenBy(s => s.Name)
            .ThenBy(s => s.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new AdminSubjectDto(
                s.Id,
                s.Name,
                s.CategoryId,
                s.Category.Name,
                s.IsActive,
                s.TutorSubjects.Count,
                _context.Bookings.Count(b => b.SubjectId == s.Id)
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminSubjectDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
