using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.Bookings;
using TutorHub.Application.Features.Payments.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Payments.InitiatePayment;

public class InitiatePaymentCommandHandler : IRequestHandler<InitiatePaymentCommand, PaymentRedirectDto>
{
    private readonly IAppDbContext _context;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public InitiatePaymentCommandHandler(IAppDbContext context, IPaymentGateway paymentGateway, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _paymentGateway = paymentGateway;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<PaymentRedirectDto> Handle(InitiatePaymentCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var booking = await _context.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.Subject)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException("Booking", request.BookingId);
        }

        // 1. Ownership validation
        if (booking.StudentProfile.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to pay for this booking.");
        }

        // 2. Status validation
        if (booking.Status != BookingStatus.Holding)
        {
            throw new ConflictException($"Booking cannot be paid in '{booking.Status}' status. Booking must be Holding.");
        }

        // 3. Expiration validation
        var now = _clock.UtcNow;
        if (!booking.HoldingExpiresAt.HasValue || booking.HoldingExpiresAt.Value <= now)
        {
            throw new BadRequestException("Booking holding time has expired. Please create a new booking.");
        }

        // 4. Generate unique Merchant Reference
        var merchantRef = $"THB{now:yyMMddHHmmss}{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        var expireAt = booking.HoldingExpiresAt.Value;

        // Keep every gateway attempt so a delayed callback can always be found.
        _context.Transactions.Add(new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Amount = booking.TotalPrice,
            Status = TransactionStatus.Pending,
            PlatformFeeRate = 0,
            PlatformFeeAmount = 0,
            PayoutAmount = booking.TotalPrice,
            PaymentGatewayRef = merchantRef,
            CreatedAt = now
        });

        await _context.SaveChangesAsync(cancellationToken);

        // 6. Build hosted payment redirect through the configured gateway
        var paymentReq = new PaymentRedirectRequest(
            MerchantReference: merchantRef,
            Amount: booking.TotalPrice,
            OrderInfo: $"Thanh toan buoi hoc {booking.Subject.Name} #{booking.Id.ToString()[..8]}",
            IpAddress: request.IpAddress,
            CreatedAt: now,
            ExpireAt: expireAt
        );

        var paymentUrl = _paymentGateway.CreateRedirect(paymentReq);

        return new PaymentRedirectDto(
            PaymentUrl: paymentUrl,
            MerchantReference: merchantRef,
            BookingId: booking.Id,
            ExpireAt: expireAt
        );
    }
}
