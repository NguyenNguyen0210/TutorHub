using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Admin.Conversations;

public record ConversationInvestigationScope(Guid FirstUser, Guid SecondUser, DateTime From, DateTime To)
{
    public Expression<Func<Conversation, bool>> Match => c =>
        (c.StudentProfile.UserId == FirstUser && c.TutorProfile.UserId == SecondUser)
        || (c.StudentProfile.UserId == SecondUser && c.TutorProfile.UserId == FirstUser);

    public static async Task<ConversationInvestigationScope> CreateAsync(IAppDbContext db, Guid? disputeId, Guid? reportId, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken)
    {
        if (disputeId.HasValue == reportId.HasValue || !fromDate.HasValue || !toDate.HasValue)
            throw new BadRequestException("Chọn một vụ việc và khoảng ngày cần điều tra.");
        var from = fromDate.Value.Date;
        var to = toDate.Value.Date;
        if (to < from || (to - from).TotalDays > 30)
            throw new BadRequestException("Khoảng điều tra cần từ 1 đến 31 ngày.");
        Guid first, second;
        if (disputeId.HasValue)
        {
            var value = await db.Disputes.AsNoTracking().Where(d => d.Id == disputeId.Value)
                .Select(d => new { d.InitiatorUserId, d.RespondentUserId }).SingleOrDefaultAsync(cancellationToken)
                ?? throw new NotFoundException("Dispute", disputeId.Value);
            first = value.InitiatorUserId; second = value.RespondentUserId;
        }
        else
        {
            var value = await db.Reports.AsNoTracking().Where(r => r.Id == reportId!.Value)
                .Select(r => new { First = r.Booking != null ? r.Booking.StudentProfile.UserId : r.ReporterUserId,
                    Second = r.Booking != null ? (Guid?)r.Booking.TutorProfile.UserId : r.ReportedUserId }).SingleOrDefaultAsync(cancellationToken)
                ?? throw new NotFoundException("Report", reportId!.Value);
            if (!value.Second.HasValue) throw new BadRequestException("Báo cáo chưa xác định được hai bên liên quan đến hội thoại.");
            first = value.First; second = value.Second.Value;
        }
        return new(first, second, DateTime.SpecifyKind(from.AddHours(-7), DateTimeKind.Utc), DateTime.SpecifyKind(to.AddDays(1).AddHours(-7), DateTimeKind.Utc));
    }
}
