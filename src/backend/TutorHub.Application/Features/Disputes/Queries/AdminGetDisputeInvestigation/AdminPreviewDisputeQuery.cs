using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Services;

namespace TutorHub.Application.Features.Disputes.Queries.AdminGetDisputeInvestigation;

public record AdminPreviewDisputeQuery(Guid DisputeId, DisputeResolutionDecision Decision, decimal? CustomRefundAmount = null) : IRequest<DisputeAllocationPreviewDto>;
public record DisputeAllocationPreviewDto(decimal Gross, decimal StudentRefund, decimal TutorNet, decimal PlatformFee, decimal UnchangedAmount, decimal FeeRate, bool CanResolve, string? BlockReason);
public class AdminPreviewDisputeQueryHandler(IAppDbContext context) : IRequestHandler<AdminPreviewDisputeQuery, DisputeAllocationPreviewDto>
{
    public async Task<DisputeAllocationPreviewDto> Handle(AdminPreviewDisputeQuery request, CancellationToken cancellationToken)
    {
        var dispute = await context.Disputes.AsNoTracking().Include(d => d.Session).ThenInclude(s => s.Enrollment)
            .Include(d => d.Evidences).SingleOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken)
            ?? throw new NotFoundException("Dispute", request.DisputeId);
        var session = dispute.Session;
        var unchanged = request.Decision == DisputeResolutionDecision.DismissedNoFinancialChange;
        decimal refund, release;
        try { (refund, release) = DisputeFinancialCalculator.CalculateFinancialSplit(session.SessionPrice, request.Decision, request.CustomRefundAmount); }
        catch (ArgumentException exception) { throw new BadRequestException(exception.Message); }
        var (fee, net) = PlatformFeeCalculator.SplitGross(release, session.Enrollment.PlatformFeeRate);
        string? blocked = dispute.Status != DisputeStatus.UnderReview ? "Vui lòng bắt đầu điều tra trước khi xem xét phán quyết." : null;
        if (!unchanged && dispute.Evidences.Count == 0) blocked = "Chưa đủ căn cứ để phán quyết tài chính: cần bổ sung ít nhất một tệp bằng chứng vào vụ việc.";
        if (!unchanged && session.IsPayoutReleased) blocked = "Học phí buổi học đã được giải ngân. Không thể quyết toán lại khoản này.";
        return new(session.SessionPrice, refund, net, fee, unchanged ? session.SessionPrice : 0m, session.Enrollment.PlatformFeeRate, blocked == null, blocked);
    }
}
