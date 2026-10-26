using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Search;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Admin.Subjects.GetAdminTrashSubjects;

public class GetAdminTrashSubjectsQueryHandler : IRequestHandler<GetAdminTrashSubjectsQuery, PagedResult<AdminSubjectDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminTrashSubjectsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminSubjectDto>> Handle(GetAdminTrashSubjectsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Subjects
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(s => s.Category)
            .Include(s => s.TutorSubjects)
            .Where(s => s.IsDeleted);

        if (request.CategoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == request.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.Search)) + "%";
            query = query.Where(s =>
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(s.Name)!.ToLower(), pattern, @"\") ||
                (s.Category != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(s.Category.Name)!.ToLower(), pattern, @"\")));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderByDescending(s => s.DeletedAt)
            .ThenBy(s => s.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new AdminSubjectDto(
                s.Id,
                s.Name,
                s.CategoryId,
                s.Category != null ? s.Category.Name : string.Empty,
                s.IsActive,
                s.TutorSubjects.Count,
                _context.Bookings.Count(b => b.SubjectId == s.Id),
                s.IsDeleted,
                s.DeletedAt,
                s.DeleteReason
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
