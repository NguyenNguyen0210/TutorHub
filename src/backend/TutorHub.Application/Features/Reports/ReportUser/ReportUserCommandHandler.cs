using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reports.ReportUser;

public class ReportUserCommandHandler : IRequestHandler<ReportUserCommand, ReportSummaryDto>
{
    private readonly IAppDbContext _context;

    public ReportUserCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ReportSummaryDto> Handle(ReportUserCommand request, CancellationToken cancellationToken)
    {
        var reporter = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.ReporterUserId, cancellationToken);

        if (reporter == null)
        {
            throw new NotFoundException("User", request.ReporterUserId);
        }

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken);

        if (targetUser == null)
        {
            throw new NotFoundException("User", request.TargetUserId);
        }

        var report = new Report
        {
            Id = Guid.NewGuid(),
            BookingId = null,
            ReportType = TrustReportType.UserConduct,
            TargetId = targetUser.Id.ToString(),
            ReportedUserId = targetUser.Id,
            ReporterUserId = reporter.Id,
            Description = request.Reason.Trim(),
            EvidenceUrl = string.IsNullOrWhiteSpace(request.EvidenceUrl) ? null : request.EvidenceUrl.Trim(),
            Status = ReportStatus.Open,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reports.Add(report);

        _context.AddOutboxMessage(new ReportCreatedEvent(
            report.Id,
            reporter.Id,
            targetUser.Id,
            report.Description));

        await _context.SaveChangesAsync(cancellationToken);

        return new ReportSummaryDto(
            Id: report.Id,
            BookingId: report.BookingId,
            ReportType: report.ReportType,
            ReportedUserId: report.ReportedUserId,
            TargetId: report.TargetId,
            ReporterUserId: report.ReporterUserId,
            ReporterName: reporter.FullName,
            ReporterRole: reporter.Role.ToString(),
            Description: report.Description,
            EvidenceUrl: report.EvidenceUrl,
            Status: report.Status,
            AdminDecision: report.AdminDecision,
            CreatedAt: report.CreatedAt,
            ResolvedAt: report.ResolvedAt
        );
    }
}
