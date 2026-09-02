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
        // Marketplace visibility: Approved Application + Active User + At least one Published Service
        var query = _context.TutorProfiles
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .Include(t => t.Services)
            .Where(t => t.User.Status == AccountStatus.Active &&
                        t.User.TutorApplications.Any(a => a.Status == TutorApplicationStatus.Approved) &&
                        t.Services.Any(s => s.Status == ServiceStatus.Published));

        // Filter by Subject (either registered or offered via published service)
        if (request.SubjectId.HasValue)
        {
            query = query.Where(t => t.Services.Any(s => s.Status == ServiceStatus.Published && s.SubjectId == request.SubjectId.Value) ||
                                     t.TutorSubjects.Any(ts => ts.SubjectId == request.SubjectId.Value && ts.IsActive));
        }

        // Existential Price filter over published Services
        if (request.MinPrice.HasValue)
        {
            query = query.Where(t => t.Services.Any(s => s.Status == ServiceStatus.Published && s.Price >= request.MinPrice.Value));
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(t => t.Services.Any(s => s.Status == ServiceStatus.Published && s.Price <= request.MaxPrice.Value));
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

        // Search by keyword (tutor full name, service title, subject name, or category name)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(t =>
                t.User.FullName.ToLower().Contains(search) ||
                t.Services.Any(s => s.Status == ServiceStatus.Published && (
                    s.Title.ToLower().Contains(search) ||
                    s.Subject.Name.ToLower().Contains(search))) ||
                t.TutorSubjects.Any(ts => ts.IsActive && (
                    ts.Subject.Name.ToLower().Contains(search) ||
                    ts.Subject.Category.Name.ToLower().Contains(search))));
        }

        // Sorting
        query = request.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(t => t.Services.Where(s => s.Status == ServiceStatus.Published).Min(s => s.Price)),
            "price_desc" => query.OrderByDescending(t => t.Services.Where(s => s.Status == ServiceStatus.Published).Max(s => s.Price)),
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
