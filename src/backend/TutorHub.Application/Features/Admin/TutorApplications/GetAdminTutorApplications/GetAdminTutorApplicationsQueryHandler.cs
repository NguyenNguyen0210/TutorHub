using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Search;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.TutorApplications.GetAdminTutorApplications;

public class GetAdminTutorApplicationsQueryHandler
    : IRequestHandler<GetAdminTutorApplicationsQuery,
        PagedResult<AdminTutorApplicationListItemDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminTutorApplicationsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminTutorApplicationListItemDto>> Handle(
        GetAdminTutorApplicationsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.TutorApplications
            .AsNoTracking()
            .Include(a => a.User)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(a => a.Status == request.Status.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            // Term normalization is client-side by design; DB unaccent is authoritative column-side.
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.Search)) + "%";
            query = query.Where(a =>
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.User.FullName)!.ToLower(), pattern, @"\") ||
                EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.User.Email)!.ToLower(), pattern, @"\") ||
                (a.User.Phone != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.User.Phone)!.ToLower(), pattern, @"\")) ||
                (a.Subject != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.Subject)!.ToLower(), pattern, @"\")) ||
                (a.University != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(a.University)!.ToLower(), pattern, @"\")));
        }

        query = query.OrderByDescending(a => a.SubmittedAt).ThenByDescending(a => a.Id);

        var totalCount = await query.CountAsync(cancellationToken);

        var page = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var size = request.PageSize <= 0 ? 10 : (request.PageSize > 100 ? 100 : request.PageSize);

        var items = await query
            .Skip((page - 1) * size)
            .Take(size)
            .Select(a => new AdminTutorApplicationListItemDto(
                a.Id,
                a.UserId,
                a.User.FullName,
                a.User.Email,
                a.User.Phone,
                a.User.AvatarUrl,
                a.Status.ToString(),
                a.SubmittedAt,
                a.ReviewedAt,
                a.RejectionReason,
                a.Bio,
                a.Education,
                a.University,
                a.Major,
                a.DegreeLevel,
                a.Certifications,
                a.Subject,
                a.SubjectSub,
                a.ExperienceYears,
                a.TeachingMode.ToString(),
                a.Address,
                a.Methodology,
                a.Achievements,
                a.DocumentsJson
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminTutorApplicationListItemDto>(
            items, totalCount, request.PageNumber, request.PageSize);
    }
}
