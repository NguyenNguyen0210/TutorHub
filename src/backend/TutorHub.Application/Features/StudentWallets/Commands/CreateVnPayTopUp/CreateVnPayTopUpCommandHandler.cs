using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Commands.CreateVnPayTopUp;

public class CreateVnPayTopUpCommandHandler : IRequestHandler<CreateVnPayTopUpCommand, VnPayTopUpRedirectDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IClock _clock;

    public CreateVnPayTopUpCommandHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IPaymentGateway paymentGateway,
        IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _paymentGateway = paymentGateway;
        _clock = clock;
    }

    public async Task<VnPayTopUpRedirectDto> Handle(CreateVnPayTopUpCommand request, CancellationToken cancellationToken)
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

        // Unique merchant reference with TOPUP prefix recognized by VNPay IPN / Return
        var merchantRef = $"TOPUP{now:yyMMddHHmmss}{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        var expireAt = now.AddMinutes(15);

        var topUpRequest = new TopUpRequest
        {
            Id = Guid.NewGuid(),
            StudentWalletId = studentProfile.Wallet.Id,
            Amount = request.Amount,
            TransferReference = merchantRef,
            Status = TopUpRequestStatus.Pending,
            RequestedAt = now,
            AdminNote = "Initiated via VNPay Gateway"
        };

        _context.TopUpRequests.Add(topUpRequest);
        await _context.SaveChangesAsync(cancellationToken);

        // Build VNPay redirect URL
        var clientIp = !string.IsNullOrWhiteSpace(request.IpAddress) ? request.IpAddress : "127.0.0.1";
        var paymentReq = new PaymentRedirectRequest(
            MerchantReference: merchantRef,
            Amount: request.Amount,
            OrderInfo: $"Nap tien vi TutorHub {request.Amount:N0} VND",
            IpAddress: clientIp,
            CreatedAt: now,
            ExpireAt: expireAt
        );

        var paymentUrl = _paymentGateway.CreateRedirect(paymentReq);

        return new VnPayTopUpRedirectDto(
            TopUpRequestId: topUpRequest.Id,
            PaymentUrl: paymentUrl,
            MerchantReference: merchantRef,
            Amount: request.Amount,
            ExpireAt: expireAt
        );
    }
}
