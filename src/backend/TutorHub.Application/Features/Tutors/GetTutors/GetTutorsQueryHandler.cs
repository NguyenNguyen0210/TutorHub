using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.GetTutors;

public class GetTutorsQueryHandler : IRequestHandler<GetTutorsQuery, PagedResult<TutorSummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetTutorsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TutorSummaryDto>> Handle(GetTutorsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TutorProfiles
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .Where(t => t.Status == TutorProfileStatus.Verified && t.User.IsActive);

        // Filter by Subject
        if (request.SubjectId.HasValue)
        {
            query = query.Where(t => t.TutorSubjects.Any(ts => ts.SubjectId == request.SubjectId.Value && ts.IsActive));
        }

        // Filter by Price range
        if (request.MinPrice.HasValue)
        {
            query = query.Where(t => t.HourlyRate >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(t => t.HourlyRate <= request.MaxPrice.Value);
        }

        // Filter by Teaching Mode
        if (request.TeachingMode.HasValue)
        {
            query = query.Where(t => t.TeachingMode == request.TeachingMode.Value || t.TeachingMode == TeachingMode.Both);
        }

        // Filter by Minimum Rating
        if (request.MinRating.HasValue)
        {
            query = query.Where(t => t.RatingAvg >= request.MinRating.Value);
        }

        // Search by keyword (tutor full name, subject name, or category name)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(t =>
                t.User.FullName.ToLower().Contains(search) ||
                t.TutorSubjects.Any(ts => ts.IsActive && (
                    ts.Subject.Name.ToLower().Contains(search) ||
                    ts.Subject.Category.Name.ToLower().Contains(search))));
        }

        // Sorting
        query = request.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(t => t.HourlyRate),
            "price_desc" => query.OrderByDescending(t => t.HourlyRate),
            "reviews" => query.OrderByDescending(t => t.TotalReviews).ThenByDescending(t => t.RatingAvg),
            _ => query.OrderByDescending(t => t.RatingAvg).ThenByDescending(t => t.TotalReviews)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TutorSummaryDto(
                t.Id,
                t.UserId,
                t.User.FullName,
                t.User.AvatarUrl,
                t.Bio,
                t.Education,
                t.ExperienceYears,
                t.HourlyRate,
                t.TeachingMode.ToString(),
                t.Address,
                t.RatingAvg,
                t.TotalReviews,
                t.TutorSubjects.Where(ts => ts.IsActive).Select(ts => ts.Subject.Name).ToList()
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<TutorSummaryDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
