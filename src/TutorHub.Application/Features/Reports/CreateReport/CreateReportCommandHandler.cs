using MediatR;
using Microsoft.EntityFrameworkCore;
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

        // 2. Check booking eligibility (Only Confirmed, Completed, or Cancelled bookings can be reported)
        if (booking.Status == BookingStatus.Holding || booking.Status == BookingStatus.Pending)
        {
            throw new BadRequestException("Reports can only be created for Confirmed, Completed, or Cancelled bookings.");
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

        var report = new Report
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            ReporterUserId = request.UserId,
            Description = request.Description.Trim(),
            EvidenceUrl = string.IsNullOrWhiteSpace(request.EvidenceUrl) ? null : request.EvidenceUrl.Trim(),
            Status = ReportStatus.Open,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reports.Add(report);

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
            ReporterUserId: report.ReporterUserId,
            ReporterName: reporterUser.FullName,
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
