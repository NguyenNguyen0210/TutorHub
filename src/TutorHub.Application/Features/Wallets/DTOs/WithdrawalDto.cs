using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wallets.DTOs;

public record WithdrawalDto(
    Guid Id,
    Guid WalletId,
    Guid TutorProfileId,
    string TutorName,
    string TutorEmail,
    decimal Amount,
    WithdrawalStatus Status,
    string BankName,
    string AccountNumber,
    string AccountHolderName,
    string? Note,
    DateTime RequestedAt,
    DateTime? ProcessedAt,
    Guid? ProcessedByAdminId,
    string? ProcessedByAdminName,
    string? RejectionReason
);
