using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
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
            var search = request.Search.Trim().ToLower();
            query = query.Where(a =>
                a.User.FullName.ToLower().Contains(search) ||
                a.User.Email.ToLower().Contains(search));
        }

        query = query.OrderByDescending(a => a.SubmittedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new AdminTutorApplicationListItemDto(
                a.Id,
                a.UserId,
                a.User.FullName,
                a.User.Email,
                a.User.AvatarUrl,
                a.Status.ToString(),
                a.SubmittedAt,
                a.ReviewedAt,
                a.RejectionReason
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminTutorApplicationListItemDto>(
            items, totalCount, request.PageNumber, request.PageSize);
    }
}
