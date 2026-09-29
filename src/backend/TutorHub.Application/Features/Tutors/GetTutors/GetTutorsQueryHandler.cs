using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Search;
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

        // Filter by Category
        if (request.CategoryId.HasValue)
        {
            query = query.Where(t =>
                t.Services.Any(s => s.Status == ServiceStatus.Published && s.Subject.CategoryId == request.CategoryId.Value) ||
                t.TutorSubjects.Any(ts => ts.IsActive && ts.Subject.CategoryId == request.CategoryId.Value));
        }

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

        // Filter by Experience Range
        if (request.MinExperience.HasValue)
        {
            query = query.Where(t => t.ExperienceYears >= request.MinExperience.Value);
        }

        if (request.MaxExperience.HasValue)
        {
            query = query.Where(t => t.ExperienceYears <= request.MaxExperience.Value);
        }

        // Filter by Degree Level from Approved Application
        if (!string.IsNullOrWhiteSpace(request.DegreeLevel))
        {
            // Term normalization is client-side by design; DB unaccent is authoritative column-side.
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.DegreeLevel)) + "%";
            query = query.Where(t => t.User.TutorApplications.Any(a =>
                a.Status == TutorApplicationStatus.Approved &&
                ((a.DegreeLevel != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.DegreeLevel)!.ToLower(), pattern, @"\")) ||
                  EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Education)!.ToLower(), pattern, @"\"))));
        }

        // Filter by University from Approved Application
        if (!string.IsNullOrWhiteSpace(request.University))
        {
            // Term normalization is client-side by design; DB unaccent is authoritative column-side.
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.University)) + "%";
            query = query.Where(t => t.User.TutorApplications.Any(a =>
                a.Status == TutorApplicationStatus.Approved &&
                ((a.University != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.University)!.ToLower(), pattern, @"\")) ||
                  EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Education)!.ToLower(), pattern, @"\"))));
        }

        // Filter by Certification from Approved Application
        if (!string.IsNullOrWhiteSpace(request.Certification))
        {
            // Term normalization is client-side by design; DB unaccent is authoritative column-side.
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.Certification)) + "%";
            query = query.Where(t => t.User.TutorApplications.Any(a =>
                a.Status == TutorApplicationStatus.Approved &&
                ((a.Certifications != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.Certifications)!.ToLower(), pattern, @"\")) ||
                  EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Bio)!.ToLower(), pattern, @"\") ||
                  EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Education)!.ToLower(), pattern, @"\"))));
        }

        // Filter by City / Address
        if (!string.IsNullOrWhiteSpace(request.City))
        {
            // Term normalization is client-side by design; DB unaccent is authoritative column-side.
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.City)) + "%";
            query = query.Where(t =>
                (t.Address != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.Address)!.ToLower(), pattern, @"\")) ||
                t.User.TutorApplications.Any(a => a.Status == TutorApplicationStatus.Approved && a.Address != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.Address)!.ToLower(), pattern, @"\")));
        }

        // Search by keyword (tutor full name, service title, subject name, or category name)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            // Term normalization is client-side by design; DB unaccent is authoritative column-side.
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.Search)) + "%";
            query = query.Where(t =>
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(t.User.FullName)!.ToLower(), pattern, @"\") ||
                t.Services.Any(s => s.Status == ServiceStatus.Published && (
                    EF.Functions.Like(VietnameseSearch.UnaccentImmutable(s.Title)!.ToLower(), pattern, @"\") ||
                    EF.Functions.Like(VietnameseSearch.UnaccentImmutable(s.Subject.Name)!.ToLower(), pattern, @"\"))) ||
                t.TutorSubjects.Any(ts => ts.IsActive && (
                    EF.Functions.Like(VietnameseSearch.UnaccentImmutable(ts.Subject.Name)!.ToLower(), pattern, @"\") ||
                    EF.Functions.Like(VietnameseSearch.UnaccentImmutable(ts.Subject.Category.Name)!.ToLower(), pattern, @"\"))));
        }

        // Sorting (deterministic: business key first, Id tiebreaker last per repo convention)
        query = request.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(t => t.Services.Where(s => s.Status == ServiceStatus.Published).Min(s => s.Price)).ThenBy(t => t.Id),
            "price_desc" => query.OrderByDescending(t => t.Services.Where(s => s.Status == ServiceStatus.Published).Max(s => s.Price)).ThenBy(t => t.Id),
            "reviews" => query.OrderByDescending(t => t.TotalReviews).ThenByDescending(t => t.RatingAvg).ThenBy(t => t.Id),
            "exp_desc" or "experience_desc" => query.OrderByDescending(t => t.ExperienceYears).ThenByDescending(t => t.RatingAvg).ThenBy(t => t.Id),
            "rating_desc" => query.OrderByDescending(t => t.RatingAvg).ThenByDescending(t => t.TotalReviews).ThenBy(t => t.Id),
            _ => query.OrderByDescending(t => t.RatingAvg).ThenByDescending(t => t.TotalReviews).ThenBy(t => t.Id)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 100 ? 100 : request.PageSize);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TutorSummaryDto(
                t.Id,
                t.UserId,
                t.User.FullName,
                t.User.AvatarUrl,
                t.Bio,
                t.Education,
                t.ExperienceYears,
                t.TeachingMode.ToString(),
                t.Address,
                t.RatingAvg,
                t.TotalReviews,
                t.TutorSubjects.Where(ts => ts.IsActive).Select(ts => ts.Subject.Name).ToList(),
                t.Services.Where(s => s.Status == ServiceStatus.Published).Select(s => (decimal?)s.Price).Min(),
                t.User.TutorApplications.Any(a => a.Status == TutorApplicationStatus.Approved),
                t.User.TutorApplications
                    .Where(a => a.Status == TutorApplicationStatus.Approved)
                    .Select(a => a.University)
                    .FirstOrDefault(),
                t.User.TutorApplications
                    .Where(a => a.Status == TutorApplicationStatus.Approved)
                    .Select(a => a.Major)
                    .FirstOrDefault(),
                t.User.TutorApplications
                    .Where(a => a.Status == TutorApplicationStatus.Approved)
                    .Select(a => a.DegreeLevel)
                    .FirstOrDefault(),
                t.User.TutorApplications
                    .Where(a => a.Status == TutorApplicationStatus.Approved)
                    .Select(a => a.Certifications)
                    .FirstOrDefault(),
                t.User.TutorApplications
                    .Where(a => a.Status == TutorApplicationStatus.Approved)
                    .Select(a => a.Achievements)
                    .FirstOrDefault()
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<TutorSummaryDto>(items, totalCount, pageNumber, pageSize);
    }
}
