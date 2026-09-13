using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.DTOs;

namespace TutorHub.Application.Features.Disputes.Queries.GetMyDisputes;

public class GetMyDisputesQueryHandler : IRequestHandler<GetMyDisputesQuery, List<DisputeDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyDisputesQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<DisputeDto>> Handle(GetMyDisputesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var disputes = await _context.Disputes
            .AsNoTracking()
            .Include(d => d.Session)
            .Include(d => d.InitiatorUser)
            .Include(d => d.RespondentUser)
            .Include(d => d.Evidences)
            .Where(d => d.InitiatorUserId == userId || d.RespondentUserId == userId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        return disputes.Select(d => new DisputeDto
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
        }).ToList();
    }
}
