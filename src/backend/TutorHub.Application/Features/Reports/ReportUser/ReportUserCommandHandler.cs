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
    private readonly ICurrentUserService _currentUserService;

    public ReportUserCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ReportSummaryDto> Handle(ReportUserCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        if (userId == request.TargetUserId)
        {
            throw new BadRequestException("Users cannot report themselves.");
        }

        var reporter = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (reporter == null)
        {
            throw new NotFoundException("User", userId);
        }

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken);

        if (targetUser == null)
        {
            throw new NotFoundException("User", request.TargetUserId);
        }

        Report report;
        try
        {
            // F-23: validated construction lives in the domain.
            report = Report.Create(
                reporterUserId: userId,
                reportType: TrustReportType.UserConduct,
                description: request.Reason,
                reportedUserId: targetUser.Id,
                targetId: targetUser.Id.ToString(),
                evidenceUrl: request.EvidenceUrl);
        }
        catch (ArgumentException ex)
        {
            throw new BadRequestException(ex.Message);
        }

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
