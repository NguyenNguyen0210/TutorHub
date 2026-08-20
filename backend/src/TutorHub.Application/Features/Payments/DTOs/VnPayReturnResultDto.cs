namespace TutorHub.Application.Features.Payments.DTOs;

public record VnPayReturnResultDto(
    bool Success,
    string Message,
    Guid BookingId,
    string MerchantReference,
    string? TransactionNo,
    decimal Amount,
    string? ResponseCode
);
