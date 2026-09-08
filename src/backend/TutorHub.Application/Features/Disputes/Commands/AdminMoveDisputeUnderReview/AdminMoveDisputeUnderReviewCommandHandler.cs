using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.AdminMoveDisputeUnderReview;

public class AdminMoveDisputeUnderReviewCommandHandler : IRequestHandler<AdminMoveDisputeUnderReviewCommand, DisputeDto>
{
    private readonly IAppDbContext _context;

    public AdminMoveDisputeUnderReviewCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<DisputeDto> Handle(AdminMoveDisputeUnderReviewCommand request, CancellationToken cancellationToken)
    {
        var dispute = await _context.Disputes
            .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(sp => sp.User)
            .Include(d => d.Session).ThenInclude(s => s.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(tp => tp.User)
            .Include(d => d.InitiatorUser)
            .Include(d => d.RespondentUser)
            .Include(d => d.Evidences)
            .FirstOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken);

        if (dispute == null)
        {
            throw new NotFoundException(nameof(Dispute), request.DisputeId);
        }

        var now = DateTime.UtcNow;
        dispute.MoveUnderReview(request.AdminUserId, now);

        await _context.SaveChangesAsync(cancellationToken);

        return new DisputeDto
        {
            Id = dispute.Id,
            SessionId = dispute.SessionId,
            SessionNumber = dispute.Session.SessionNumber,
            EnrollmentId = dispute.Session.EnrollmentId,
            InitiatorUserId = dispute.InitiatorUserId,
            InitiatorName = dispute.InitiatorUser?.FullName ?? "Unknown",
            RespondentUserId = dispute.RespondentUserId,
            RespondentName = dispute.RespondentUser?.FullName ?? "Unknown",
            Reason = dispute.Reason,
            Description = dispute.Description,
            Status = dispute.Status,
            ResolutionDecision = dispute.ResolutionDecision,
            AdminNotes = dispute.AdminNotes,
            ResolvedByAdminId = dispute.ResolvedByAdminId,
            ResolvedAt = dispute.ResolvedAt,
            HeldAmount = dispute.HeldAmount,
            HoldType = dispute.HoldType,
            HoldStatus = dispute.HoldStatus,
            HeldAt = dispute.HeldAt,
            CreatedAt = dispute.CreatedAt,
            Evidences = dispute.Evidences.Select(e => new DisputeEvidenceDto
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
        };
    }
}
