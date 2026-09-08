using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Queries.AdminGetDisputeInvestigation;

public class AdminGetDisputeInvestigationQueryHandler : IRequestHandler<AdminGetDisputeInvestigationQuery, DisputeInvestigationDto>
{
    private readonly IAppDbContext _context;

    public AdminGetDisputeInvestigationQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<DisputeInvestigationDto> Handle(AdminGetDisputeInvestigationQuery request, CancellationToken cancellationToken)
    {
        var dispute = await _context.Disputes
            .AsNoTracking()
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

        var session = dispute.Session;
        var enrollment = session.Enrollment;

        // Fetch conversation snippet between the two participants if exists
        var messages = await _context.Messages
            .AsNoTracking()
            .Include(m => m.SenderUser)
            .Where(m => m.Conversation.StudentProfileId == enrollment.StudentProfileId &&
                         m.Conversation.TutorProfileId == enrollment.TutorProfileId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(15)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new InvestigationMessageDto
            {
                Id = m.Id,
                SenderUserId = m.SenderUserId,
                SenderName = m.SenderUser.FullName,
                Content = m.Content,
                SentAt = m.CreatedAt
            })
            .ToListAsync(cancellationToken);

        // Fetch tutor wallet
        var tutorWallet = await _context.Wallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.TutorProfileId == enrollment.TutorProfileId, cancellationToken);

        // Fetch original transaction if released
        var originalTx = await _context.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit, cancellationToken);

        var gross = session.EarningAmount;
        var originalFee = originalTx?.CommissionAmount ?? 0m;
        var originalNet = originalTx?.PayoutAmount ?? gross;

        return new DisputeInvestigationDto
        {
            Dispute = new DisputeDto
            {
                Id = dispute.Id,
                SessionId = dispute.SessionId,
                SessionNumber = session.SessionNumber,
                EnrollmentId = session.EnrollmentId,
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
            },
            Session = new SessionInvestigationDto
            {
                Id = session.Id,
                SessionNumber = session.SessionNumber,
                Status = session.Status,
                StartAt = session.StartAt,
                EndAt = session.EndAt,
                EarningAmount = session.EarningAmount,
                IsPayoutReleased = session.IsPayoutReleased,
                StudentAttendance = session.StudentAttendance,
                StudentAttendanceSubmittedAt = session.StudentAttendanceSubmittedAt,
                TutorAttendance = session.TutorAttendance,
                TutorAttendanceSubmittedAt = session.TutorAttendanceSubmittedAt,
                HasAttendanceConflict = session.HasAttendanceConflict
            },
            Enrollment = new EnrollmentInvestigationDto
            {
                Id = enrollment.Id,
                BookingId = enrollment.BookingId,
                Status = enrollment.Status,
                TotalAmount = enrollment.TotalPrice,
                TotalSessions = enrollment.TotalSessions,
                CompletedSessions = enrollment.CompletedSessions,
                PlatformFeeRate = enrollment.PlatformFeeRate,
                FeePolicyVersion = enrollment.FeePolicyVersion
            },
            ConversationSnippet = messages,
            FinancialSummary = new FinancialInvestigationDto
            {
                DisputedGrossAmount = gross,
                OriginalPlatformFee = originalFee,
                OriginalTutorNet = originalNet,
                TutorAvailableBalance = tutorWallet?.AvailableBalance ?? 0m,
                TutorHeldBalance = tutorWallet?.HeldBalance ?? 0m,
                TutorWithdrawableBalance = tutorWallet?.WithdrawableBalance ?? 0m,
                IsPayoutReleased = session.IsPayoutReleased
            }
        };
    }
}
