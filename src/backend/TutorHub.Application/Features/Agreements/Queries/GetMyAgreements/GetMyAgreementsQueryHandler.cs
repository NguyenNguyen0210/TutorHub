using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Agreements.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Agreements.Queries.GetMyAgreements;

public class GetMyAgreementsQueryHandler : IRequestHandler<GetMyAgreementsQuery, PagedResult<CustomAgreementDto>>
{
    private readonly IAppDbContext _context;

    public GetMyAgreementsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<CustomAgreementDto>> Handle(GetMyAgreementsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var query = _context.CustomAgreements
            .AsNoTracking()
            .Include(a => a.TutorProfile).ThenInclude(t => t.User)
            .Include(a => a.StudentProfile).ThenInclude(s => s.User)
            .Include(a => a.Subject)
            .Include(a => a.Service)
            .Where(a => a.StudentProfile.UserId == request.UserId || a.TutorProfile.UserId == request.UserId);

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new CustomAgreementDto(
                a.Id,
                a.ServiceId,
                a.Service != null ? a.Service.Title : null,
                a.ConversationId,
                a.TutorProfileId,
                a.TutorProfile.UserId,
                a.TutorProfile.User.FullName,
                a.StudentProfileId,
                a.StudentProfile.UserId,
                a.StudentProfile.User.FullName,
                a.SubjectId,
                a.Subject.Name,
                a.Title,
                a.Description,
                a.TotalPrice,
                a.TotalSessions,
                a.SessionDurationMinutes,
                a.TeachingMode,
                a.Status,
                a.ExpiresAt,
                a.CreatedAt,
                a.AcceptedAt,
                a.RejectedAt,
                a.RejectionReason,
                a.CancelledAt,
                a.CancellationReason,
                null
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<CustomAgreementDto>(items, totalCount, pageNumber, pageSize);
    }
}
