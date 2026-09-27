using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Users.GetAdminUsers;

public class GetAdminUsersQueryHandler : IRequestHandler<GetAdminUsersQuery, PagedResult<AdminUserSummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminUsersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminUserSummaryDto>> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users.AsNoTracking();

        // 1. Search Filter (FullName, Email, Phone)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                (u.Phone != null && u.Phone.ToLower().Contains(search)));
        }

        // 2. Role Filter
        if (request.Role.HasValue)
        {
            query = query.Where(u => u.Role == request.Role.Value);
        }

        // 3. Status Filter
        if (request.Status.HasValue)
        {
            query = query.Where(u => u.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // 4. Deterministic Sort & Direct SQL Projection
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .ThenBy(u => u.Id)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new AdminUserSummaryDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Phone,
                u.AvatarUrl,
                u.Role,
                u.Status,
                u.CreatedAt,
                u.TutorApplications
                    .OrderBy(a => a.Status == TutorApplicationStatus.Approved ? 0 : a.Status == TutorApplicationStatus.Pending ? 1 : 2)
                    .ThenByDescending(a => a.SubmittedAt)
                    .Select(a => a.Status.ToString())
                    .FirstOrDefault()
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminUserSummaryDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
