using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.DTOs;

namespace TutorHub.Application.Features.Disputes.Queries.AdminGetDisputes;

public class AdminGetDisputesQueryHandler : IRequestHandler<AdminGetDisputesQuery, AdminDisputeListResponseDto>
{
    private readonly IAppDbContext _context;

    public AdminGetDisputesQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminDisputeListResponseDto> Handle(AdminGetDisputesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Disputes
            .AsNoTracking()
            .Include(d => d.Session)
            .Include(d => d.InitiatorUser)
            .Include(d => d.RespondentUser)
            .Include(d => d.Evidences)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(d => d.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var size = request.PageSize <= 0 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .ThenByDescending(d => d.Id)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(cancellationToken);

        return new AdminDisputeListResponseDto
        {
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = size,
            Items = items.Select(d => new DisputeDto
            {
                Id = d.Id,
                SessionId = d.SessionId,
                SessionNumber = d.Session.SessionNumber,
                EnrollmentId = d.Session.EnrollmentId,
                InitiatorUserId = d.InitiatorUserId,
                InitiatorName = d.InitiatorUser?.FullName ?? "Unknown",
                RespondentUserId = d.RespondentUserId,
                RespondentName = d.RespondentUser?.FullName ?? "Unknown",
                Reason = d.Reason,
                Description = d.Description,
                Status = d.Status,
                ResolutionDecision = d.ResolutionDecision,
                AdminNotes = d.AdminNotes,
                ResolvedByAdminId = d.ResolvedByAdminId,
                ResolvedAt = d.ResolvedAt,
                HeldAmount = d.HeldAmount,
                HoldType = d.HoldType,
                HoldStatus = d.HoldStatus,
                HeldAt = d.HeldAt,
                CreatedAt = d.CreatedAt,
                Evidences = d.Evidences.Select(e => new DisputeEvidenceDto
                {
                    Id = e.Id,
                    DisputeId = e.DisputeId,
                    UploadedByUserId = e.UploadedByUserId,
                    FileName = e.FileName,
                    FileUrl = e.FileUrl,
                    ContentType = e.ContentType,
                    FileSizeBytes = e.FileSizeBytes,
                    CreatedAt = e.CreatedAt
                }).ToList()
            }).ToList()
        };
    }
}
