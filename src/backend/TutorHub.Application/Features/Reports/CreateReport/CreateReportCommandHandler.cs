using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reports.CreateReport;

public class CreateReportCommandHandler : IRequestHandler<CreateReportCommand, ReportSummaryDto>
{
    private readonly IAppDbContext _context;

    public CreateReportCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ReportSummaryDto> Handle(CreateReportCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException("Booking", request.BookingId);
        }

        // 1. Check user participation in booking
        bool isStudent = booking.StudentProfile.UserId == request.UserId;
        bool isTutor = booking.TutorProfile.UserId == request.UserId;

        if (!isStudent && !isTutor)
        {
            throw new ForbiddenException("You do not have permission to report this booking.");
        }

        // 2. Check booking eligibility (Wave 3: anything except an unpaid Holding
        // can be reported; learning progress lives on Enrollment).
        if (booking.Status == BookingStatus.Holding)
        {
            throw new BadRequestException("Reports can only be created for paid or cancelled bookings.");
        }

        // 3. Application-level check for duplicate report
        var alreadyReported = await _context.Reports
            .AnyAsync(r => r.BookingId == request.BookingId && r.ReporterUserId == request.UserId, cancellationToken);

        if (alreadyReported)
        {
            throw new ConflictException("You have already submitted a report for this booking.");
        }

        var reporterUser = isStudent ? booking.StudentProfile.User : booking.TutorProfile.User;
        var reporterRole = isStudent ? "Student" : "Tutor";

        var targetUserId = isStudent ? booking.TutorProfile.UserId : booking.StudentProfile.UserId;

        Report report;
        try
        {
            // F-23: validated construction lives in the domain.
            report = Report.Create(
                reporterUserId: request.UserId,
                reportType: TrustReportType.UserConduct,
                description: request.Description,
                bookingId: booking.Id,
                reportedUserId: targetUserId,
                targetId: booking.Id.ToString(),
                evidenceUrl: request.EvidenceUrl);
        }
        catch (ArgumentException ex)
        {
            throw new BadRequestException(ex.Message);
        }

        _context.Reports.Add(report);

        // Enqueue ReportCreated Outbox Message (DEC-S7-001, DEC-S7-002)
        _context.AddOutboxMessage(new ReportCreatedEvent(
            report.Id,
            request.UserId,
            targetUserId,
            report.Description));

        // 4. Save changes with Unique Constraint protection
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            var innerMsg = ex.InnerException?.Message ?? string.Empty;
            if (innerMsg.Contains("IX_Reports_BookingId_ReporterUserId") || innerMsg.Contains("23505"))
            {
                throw new ConflictException("You have already submitted a report for this booking.");
            }
            throw;
        }

        return new ReportSummaryDto(
            Id: report.Id,
            BookingId: report.BookingId,
            ReportType: report.ReportType,
            ReportedUserId: report.ReportedUserId,
            TargetId: report.TargetId,
            ReporterUserId: report.ReporterUserId,
            ReporterName: reporterUser?.FullName ?? string.Empty,
            ReporterRole: reporterRole,
            Description: report.Description,
            EvidenceUrl: report.EvidenceUrl,
            Status: report.Status,
            AdminDecision: report.AdminDecision,
            CreatedAt: report.CreatedAt,
            ResolvedAt: report.ResolvedAt
        );
    }
}
