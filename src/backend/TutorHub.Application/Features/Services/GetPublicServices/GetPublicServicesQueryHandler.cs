using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Services.GetPublicServices;

public class GetPublicServicesQueryHandler : IRequestHandler<GetPublicServicesQuery, PagedResult<PublicServiceListItemDto>>
{
    private readonly IAppDbContext _context;

    public GetPublicServicesQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<PublicServiceListItemDto>> Handle(GetPublicServicesQuery request, CancellationToken cancellationToken)
    {
        // Public visibility: Published status + Active Tutor Account + Approved Tutor Application
        var query = _context.Services
            .AsNoTracking()
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .Include(s => s.TutorProfile)
                .ThenInclude(tp => tp.User)
            .Where(s => s.Status == ServiceStatus.Published &&
                        s.TutorProfile.User.Status == AccountStatus.Active &&
                        s.TutorProfile.User.TutorApplications.Any(a => a.Status == TutorApplicationStatus.Approved));

        // Filter by Category
        if (request.CategoryId.HasValue)
        {
            query = query.Where(s => s.Subject.CategoryId == request.CategoryId.Value);
        }

        // Filter by Subject
        if (request.SubjectId.HasValue)
        {
            query = query.Where(s => s.SubjectId == request.SubjectId.Value);
        }

        // Filter by Teaching Mode
        if (request.TeachingMode.HasValue)
        {
            query = query.Where(s => s.TeachingMode == request.TeachingMode.Value || s.TeachingMode == TeachingMode.Both);
        }

        // Filter by Price Range
        if (request.MinPrice.HasValue)
        {
            query = query.Where(s => s.Price >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(s => s.Price <= request.MaxPrice.Value);
        }

        // Filter by Tutor's Minimum Rating
        if (request.MinRating.HasValue)
        {
            query = query.Where(s => s.TutorProfile.RatingAvg >= request.MinRating.Value);
        }

        // Filter by Search Keyword
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(s =>
                s.Title.ToLower().Contains(term) ||
                s.Description.ToLower().Contains(term) ||
                s.Subject.Name.ToLower().Contains(term) ||
                s.Subject.Category.Name.ToLower().Contains(term) ||
                s.TutorProfile.User.FullName.ToLower().Contains(term));
        }

        // Sorting
        query = request.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(s => s.Price).ThenBy(s => s.Id),
            "price_desc" => query.OrderByDescending(s => s.Price).ThenBy(s => s.Id),
            "rating_desc" => query.OrderByDescending(s => s.TutorProfile.RatingAvg)
                                  .ThenByDescending(s => s.TutorProfile.TotalReviews)
                                  .ThenBy(s => s.Id),
            "newest" => query.OrderByDescending(s => s.CreatedAt).ThenBy(s => s.Id),
            "sessions_desc" => query.OrderByDescending(s => s.TotalSessions).ThenBy(s => s.Id),
            _ => query.OrderByDescending(s => s.TutorProfile.RatingAvg)
                      .ThenByDescending(s => s.TutorProfile.TotalReviews)
                      .ThenByDescending(s => s.CreatedAt)
                      .ThenBy(s => s.Id)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 12 : (request.PageSize > 100 ? 100 : request.PageSize);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new PublicServiceListItemDto(
                s.Id,
                s.Title,
                s.Description,
                s.LearningScope,
                s.ExpectedOutcome,
                s.SubjectId,
                s.Subject.Name,
                s.Subject.CategoryId,
                s.Subject.Category.Name,
                s.TotalSessions,
                s.SessionDurationMinutes,
                s.Price,
                s.TeachingMode.ToString(),
                !string.IsNullOrWhiteSpace(s.TrialLessonUrl),
                s.TutorProfileId,
                s.TutorProfile.UserId,
                s.TutorProfile.User.FullName,
                s.TutorProfile.User.AvatarUrl,
                s.TutorProfile.RatingAvg,
                s.TutorProfile.TotalReviews,
                _context.Enrollments.Count(e => e.ServiceId == s.Id),
                s.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<PublicServiceListItemDto>(items, totalCount, pageNumber, pageSize);
    }
}
