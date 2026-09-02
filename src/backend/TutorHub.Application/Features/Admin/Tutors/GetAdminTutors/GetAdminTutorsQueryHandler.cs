using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Tutors.GetAdminTutors;

public class GetAdminTutorsQueryHandler : IRequestHandler<GetAdminTutorsQuery, PagedResult<AdminTutorProfileDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminTutorsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminTutorProfileDto>> Handle(GetAdminTutorsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TutorProfiles
            .AsNoTracking()
            .Include(t => t.User)
                .ThenInclude(u => u.TutorApplications)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(t => t.User.TutorApplications.Any(a => a.Status == request.Status.Value));
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(t =>
                t.User.FullName.ToLower().Contains(search) ||
                t.User.Email.ToLower().Contains(search));
        }

        query = query.OrderByDescending(t => t.User.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new AdminTutorProfileDto(
                t.Id,
                t.UserId,
                t.User.FullName,
                t.User.Email,
                t.User.AvatarUrl,
                t.Bio,
                t.Education,
                t.ExperienceYears,
                t.TeachingMode.ToString(),
                t.Address,
                t.User.TutorApplications
                    .OrderBy(a => a.Status == TutorApplicationStatus.Approved ? 0 : a.Status == TutorApplicationStatus.Pending ? 1 : 2)
                    .ThenByDescending(a => a.SubmittedAt)
                    .Select(a => a.Status.ToString())
                    .FirstOrDefault() ?? "Unknown",
                t.RatingAvg,
                t.TotalReviews,
                t.User.CreatedAt,
                t.TutorSubjects.Select(ts => new TutorSubjectDto(
                    ts.Id,
                    ts.SubjectId,
                    ts.Subject.Name,
                    ts.Subject.CategoryId,
                    ts.Subject.Category.Name,
                    ts.IsActive
                )).ToList()
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminTutorProfileDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
