using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Commands.RequestTopUp;

public class RequestTopUpCommandHandler : IRequestHandler<RequestTopUpCommand, TopUpRequestDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IClock _clock;

    public RequestTopUpCommandHandler(IAppDbContext context, ICurrentUserService currentUserService, IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _clock = clock;
    }

    public async Task<TopUpRequestDto> Handle(RequestTopUpCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        var studentProfile = await _context.StudentProfiles
            .Include(s => s.Wallet)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (studentProfile == null)
        {
            throw new ForbiddenException("Only registered students can request a wallet top-up.");
        }

        // Lazy create student wallet if not exists
        if (studentProfile.Wallet == null)
        {
            studentProfile.Wallet = new StudentWallet
            {
                Id = Guid.NewGuid(),
                StudentProfileId = studentProfile.Id,
                AvailableBalance = 0m,
                ReservedBalance = 0m,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.StudentWallets.Add(studentProfile.Wallet);
        }

        // Generate canonical, unique transfer reference: TUTORHUB NAP <UserId8> <ShortCode4>
        var userPart = userId.ToString("N")[..8].ToUpperInvariant();
        var shortCode = Guid.NewGuid().ToString("N")[..4].ToUpperInvariant();
        var transferRef = $"TUTORHUB NAP {userPart} {shortCode}";

        var topUpRequest = new TopUpRequest
        {
            Id = Guid.NewGuid(),
            StudentWalletId = studentProfile.Wallet.Id,
            Amount = request.Amount,
            TransferReference = transferRef,
            Status = TopUpRequestStatus.Pending,
            RequestedAt = now
        };

        _context.TopUpRequests.Add(topUpRequest);

        // Fetch platform bank details (or fallback)
        var bankNameSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankName", cancellationToken);
        var bankAccountNoSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankAccountNo", cancellationToken);
        var bankAccountNameSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankAccountName", cancellationToken);

        var bankName = bankNameSetting?.Value ?? "Vietcombank";
        var bankAccountNo = bankAccountNoSetting?.Value ?? "1029384756";
        var bankAccountName = bankAccountNameSetting?.Value ?? "TUTORHUB JSC";

        // Emit outbox business event
        _context.AddOutboxMessage(new StudentTopUpRequestedEvent(
            topUpRequest.Id,
            studentProfile.Id,
            userId,
            new MoneyDto(request.Amount, "VND"),
            transferRef,
            Guid.NewGuid(),
            1,
            now
        ));

        await _context.SaveChangesAsync(cancellationToken);

        return new TopUpRequestDto
        {
            Id = topUpRequest.Id,
            StudentWalletId = studentProfile.Wallet.Id,
            Amount = topUpRequest.Amount,
            TransferReference = topUpRequest.TransferReference,
            Status = topUpRequest.Status,
            RequestedAt = topUpRequest.RequestedAt,
            BankName = bankName,
            BankAccountNo = bankAccountNo,
            BankAccountName = bankAccountName
        };
    }
}
