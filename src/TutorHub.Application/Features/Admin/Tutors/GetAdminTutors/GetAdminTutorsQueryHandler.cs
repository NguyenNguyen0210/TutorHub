using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Tutors.DTOs;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Admin.Tutors.GetAdminTutors;

public class GetAdminTutorsQueryHandler : IRequestHandler<GetAdminTutorsQuery, PagedResult<AdminTutorDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminTutorsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminTutorDto>> Handle(GetAdminTutorsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TutorProfiles
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(t => t.Status == request.Status.Value);
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
            .Select(t => new AdminTutorDto(
                t.Id,
                t.UserId,
                t.User.FullName,
                t.User.Email,
                t.User.Phone,
                t.User.AvatarUrl,
                t.Bio,
                t.Education,
                t.ExperienceYears,
                t.HourlyRate,
                t.TeachingMode.ToString(),
                t.Address,
                t.Status.ToString(),
                t.RejectionReason,
                t.ReviewedByAdminId,
                t.ReviewedAt,
                t.RatingAvg,
                t.TotalReviews,
                t.User.CreatedAt,
                t.TutorSubjects.Select(ts => new TutorSubjectDto(
                    ts.Id,
                    ts.SubjectId,
                    ts.Subject.Name,
                    ts.Subject.CategoryId,
                    ts.Subject.Category.Name,
                    ts.OverridePrice,
                    ts.IsActive
                )).ToList()
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminTutorDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
