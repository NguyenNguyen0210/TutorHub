using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Application.Common.Search;

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
            .AsSplitQuery()
            .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.Service)
            .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(p => p.User)
            .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(p => p.User)
            .Include(d => d.InitiatorUser)
            .Include(d => d.RespondentUser)
            .Include(d => d.Evidences)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(d => d.Status == request.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(term)) + "%";
            var isId = Guid.TryParse(term, out var id);
            query = query.Where(d => (isId && d.Id == id)
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(d.InitiatorUser.FullName)!.ToLower(), pattern, @"\")
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(d.RespondentUser.FullName)!.ToLower(), pattern, @"\")
                || (d.Session.Enrollment.Service != null && EF.Functions.Like(VietnameseSearch.UnaccentImmutable(d.Session.Enrollment.Service.Title)!.ToLower(), pattern, @"\")));
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
                ServiceTitle = d.Session.Enrollment.Service?.Title ?? string.Empty,
                StudentName = d.Session.Enrollment.StudentProfile.User.FullName,
                StudentAvatarUrl = d.Session.Enrollment.StudentProfile.User.AvatarUrl,
                TutorName = d.Session.Enrollment.TutorProfile.User.FullName,
                TutorAvatarUrl = d.Session.Enrollment.TutorProfile.User.AvatarUrl,
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
                    FileUrl = $"/api/v1/disputes/{e.DisputeId}/evidence/{e.Id}/download",
                    ContentType = e.ContentType,
                    FileSizeBytes = e.FileSizeBytes,
                    CreatedAt = e.CreatedAt
                }).ToList()
            }).ToList()
        };
    }
}
