using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Reports.DTOs;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Admin.Reports.GetAdminReportById;

public class GetAdminReportByIdQueryHandler : IRequestHandler<GetAdminReportByIdQuery, AdminReportDetailDto>
{
    private readonly IAppDbContext _context;

    public GetAdminReportByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminReportDetailDto> Handle(GetAdminReportByIdQuery request, CancellationToken cancellationToken)
    {
        var report = await _context.Reports
            .AsNoTracking()
            .Include(r => r.ReporterUser)
            .Include(r => r.ResolvedByAdmin)
            .Include(r => r.Booking).ThenInclude(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(r => r.Booking).ThenInclude(b => b.TutorProfile).ThenInclude(t => t.User)
            .Include(r => r.Booking).ThenInclude(b => b.Subject)
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

        if (report == null)
        {
            throw new NotFoundException("Report", request.Id);
        }

        var booking = report.Booking;
        var studentUser = booking.StudentProfile.User;
        var tutorUser = booking.TutorProfile.User;

        var reporterRole = report.ReporterUserId == studentUser.Id ? "Student" : "Tutor";

        var bookingSummary = new BookingSummaryDto(
            Id: booking.Id,
            StudentProfileId: booking.StudentProfileId,
            StudentName: studentUser.FullName,
            TutorProfileId: booking.TutorProfileId,
            TutorName: tutorUser.FullName,
            SubjectId: booking.SubjectId,
            SubjectName: booking.Subject.Name,
            StartAt: booking.StartAt,
            EndAt: booking.EndAt,
            TotalAmount: booking.TotalAmount,
            Status: booking.Status,
            CreatedAt: booking.CreatedAt
        );

        return new AdminReportDetailDto(
            Id: report.Id,
            BookingId: report.BookingId,
            ReporterUserId: report.ReporterUserId,
            ReporterName: report.ReporterUser.FullName,
            ReporterRole: reporterRole,
            Description: report.Description,
            EvidenceUrl: report.EvidenceUrl,
            Status: report.Status,
            AdminDecision: report.AdminDecision,
            Resolution: report.Resolution,
            ResolvedByAdminId: report.ResolvedByAdminId,
            ResolvedByAdminName: report.ResolvedByAdmin?.FullName,
            CreatedAt: report.CreatedAt,
            ResolvedAt: report.ResolvedAt,
            Booking: bookingSummary,
            StudentName: studentUser.FullName,
            StudentEmail: studentUser.Email,
            StudentPhone: studentUser.Phone,
            TutorName: tutorUser.FullName,
            TutorEmail: tutorUser.Email,
            TutorPhone: tutorUser.Phone
        );
    }
}
