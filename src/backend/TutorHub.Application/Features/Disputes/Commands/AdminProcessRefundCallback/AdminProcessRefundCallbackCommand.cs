using MediatR;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.AdminProcessRefundCallback;

public record AdminProcessRefundCallbackCommand(
    Guid RefundTransactionId,
    TransactionStatus Outcome, // Succeeded or Failed
    string? ProviderReference,
    string? FailureReason,
    Guid AdminUserId
) : IRequest<RefundCallbackResultDto>;

public class RefundCallbackResultDto
{
    public Guid TransactionId { get; set; }
    public TransactionStatus Status { get; set; }
    public bool SettlementRequired { get; set; }
    public string? DisputeStatus { get; set; }
    public string Message { get; set; } = string.Empty;
}
