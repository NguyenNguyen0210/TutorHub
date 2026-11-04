using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Enums;
using System.Text.Json;

namespace TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawalById;

public class GetAdminWithdrawalByIdQueryHandler : IRequestHandler<GetAdminWithdrawalByIdQuery, WithdrawalDto>
{
    private readonly IAppDbContext _context;

    public GetAdminWithdrawalByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<WithdrawalDto> Handle(GetAdminWithdrawalByIdQuery request, CancellationToken cancellationToken)
    {
        var withdrawal = await _context.Withdrawals
            .AsNoTracking()
            .Include(w => w.Wallet).ThenInclude(wall => wall.User)
            .Include(w => w.ProcessingStartedByAdmin)
            .Include(w => w.ProcessedByAdmin)
            .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId
                && ((w.Wallet.User != null && w.Wallet.User.Role == UserRole.Tutor)
                    || (w.Wallet.TutorProfile != null && w.Wallet.TutorProfile.User.Role == UserRole.Tutor)), cancellationToken);

        if (withdrawal == null)
        {
            throw new NotFoundException("Withdrawal", request.WithdrawalId);
        }
        var reservation = await _context.WalletTransactions.AsNoTracking()
            .Where(t => t.WithdrawalId == withdrawal.Id && t.Type == WalletTransactionType.WithdrawalDebit)
            .OrderBy(t => t.CreatedAt).Select(t => new { t.BalanceBefore, t.BalanceAfter }).FirstOrDefaultAsync(cancellationToken);
        var evidence = await _context.AuditLogs.AsNoTracking()
            .Where(a => a.EntityName == "Withdrawal" && a.EntityId == withdrawal.Id.ToString() && a.Action == "WithdrawalCompleted")
            .OrderByDescending(a => a.CreatedAt).Select(a => a.NewValuesJson).FirstOrDefaultAsync(cancellationToken);
        string? reference = null, note = null;
        if (evidence != null)
        {
            try
            {
                using var json = JsonDocument.Parse(evidence);
                if (json.RootElement.ValueKind == JsonValueKind.Object)
                {
                    if (json.RootElement.TryGetProperty("bankTransferReference", out var value) && value.ValueKind == JsonValueKind.String) reference = value.GetString();
                    if (json.RootElement.TryGetProperty("reconciliationNote", out value) && value.ValueKind == JsonValueKind.String) note = value.GetString();
                }
            }
            catch (JsonException) { /* Legacy audit text has no structured reconciliation metadata. */ }
        }

        return new WithdrawalDto(
            Id: withdrawal.Id,
            WalletId: withdrawal.WalletId,
            TutorProfileId: withdrawal.Wallet.TutorProfileId,
            TutorName: withdrawal.Wallet.User?.FullName ?? withdrawal.Wallet.TutorProfile?.User?.FullName ?? string.Empty,
            TutorEmail: withdrawal.Wallet.User?.Email ?? withdrawal.Wallet.TutorProfile?.User?.Email ?? string.Empty,
            Amount: withdrawal.Amount,
            Status: withdrawal.Status,
            BankName: withdrawal.BankName,
            BankCode: withdrawal.BankCode,
            AccountNumber: withdrawal.AccountNumber,
            AccountHolderName: withdrawal.AccountHolderName,
            Note: withdrawal.Note,
            RequestedAt: withdrawal.RequestedAt,
            ProcessingStartedAt: withdrawal.ProcessingStartedAt,
            ProcessingStartedByAdminId: withdrawal.ProcessingStartedByAdminId,
            ProcessingStartedByAdminName: withdrawal.ProcessingStartedByAdmin?.FullName,
            ProcessedAt: withdrawal.ProcessedAt,
            ProcessedByAdminId: withdrawal.ProcessedByAdminId,
            ProcessedByAdminName: withdrawal.ProcessedByAdmin?.FullName,
            FailureReason: withdrawal.FailureReason
        ) {
            TutorAvatarUrl = withdrawal.Wallet.User?.AvatarUrl,
            AvailableBalanceAtRequest = reservation?.BalanceBefore,
            AvailableBalanceAfterReservation = reservation?.BalanceAfter,
            BankTransferReference = reference,
            ReconciliationNote = note
        };
    }
}
