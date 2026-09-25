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
            var degree = request.DegreeLevel.Trim().ToLower();
            query = query.Where(t => t.User.TutorApplications.Any(a =>
                a.Status == TutorApplicationStatus.Approved &&
                ((a.DegreeLevel != null && a.DegreeLevel.ToLower().Contains(degree)) ||
                 t.Education.ToLower().Contains(degree))));
        }

        // Filter by University from Approved Application
        if (!string.IsNullOrWhiteSpace(request.University))
        {
            var uni = request.University.Trim().ToLower();
            query = query.Where(t => t.User.TutorApplications.Any(a =>
                a.Status == TutorApplicationStatus.Approved &&
                ((a.University != null && a.University.ToLower().Contains(uni)) ||
                 t.Education.ToLower().Contains(uni))));
        }

        // Filter by Certification from Approved Application
        if (!string.IsNullOrWhiteSpace(request.Certification))
        {
            var cert = request.Certification.Trim().ToLower();
            query = query.Where(t => t.User.TutorApplications.Any(a =>
                a.Status == TutorApplicationStatus.Approved &&
                ((a.Certifications != null && a.Certifications.ToLower().Contains(cert)) ||
                 t.Bio.ToLower().Contains(cert) ||
                 t.Education.ToLower().Contains(cert))));
        }

        // Filter by City / Address
        if (!string.IsNullOrWhiteSpace(request.City))
        {
            var city = request.City.Trim().ToLower();
            query = query.Where(t =>
                (t.Address != null && t.Address.ToLower().Contains(city)) ||
                t.User.TutorApplications.Any(a => a.Status == TutorApplicationStatus.Approved && a.Address != null && a.Address.ToLower().Contains(city)));
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
