using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings;
using TutorHub.Application.Features.Payments.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Payments.CreateVnPayUrl;

public class CreateVnPayUrlCommandHandler : IRequestHandler<CreateVnPayUrlCommand, VnPayPaymentUrlDto>
{
    private readonly IAppDbContext _context;
    private readonly IVnPayService _vnPayService;
    private readonly IClock _clock;

    public CreateVnPayUrlCommandHandler(IAppDbContext context, IVnPayService vnPayService, IClock clock)
    {
        _context = context;
        _vnPayService = vnPayService;
        _clock = clock;
    }

    public async Task<VnPayPaymentUrlDto> Handle(CreateVnPayUrlCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.Subject)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException("Booking", request.BookingId);
        }

        // 1. Ownership validation
        if (booking.StudentProfile.UserId != request.UserId)
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

        // 5. Initialize/Update the gateway attempt. The payment transaction
        // represents the GROSS escrow amount; the platform fee is only applied
        // when each session earns out (FR-EARN-003).
        var paymentTx = await _context.GetPaymentTransactionAsync(booking.Id, cancellationToken);

        if (paymentTx == null)
        {
            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                Amount = booking.TotalPrice,
                Status = TransactionStatus.Held, // Pre-allocated, state confirmed on IPN
                CommissionRate = 0,
                CommissionAmount = 0,
                PayoutAmount = booking.TotalPrice,
                PaymentGatewayRef = merchantRef,
                CreatedAt = now
            };
            _context.Transactions.Add(transaction);
        }
        else
        {
            paymentTx.PaymentGatewayRef = merchantRef;
            paymentTx.Amount = booking.TotalPrice;
            paymentTx.CommissionRate = 0;
            paymentTx.CommissionAmount = 0;
            paymentTx.PayoutAmount = booking.TotalPrice;
        }

        await _context.SaveChangesAsync(cancellationToken);

        // 6. Build VNPay payment URL
        var paymentReq = new VnPayPaymentRequest(
            MerchantReference: merchantRef,
            Amount: booking.TotalPrice,
            OrderInfo: $"Thanh toan buoi hoc {booking.Subject.Name} #{booking.Id.ToString()[..8]}",
            IpAddress: request.IpAddress,
            CreatedAt: now,
            ExpireAt: expireAt
        );

        var paymentUrl = _vnPayService.CreatePaymentUrl(paymentReq);

        return new VnPayPaymentUrlDto(
            PaymentUrl: paymentUrl,
            MerchantReference: merchantRef,
            BookingId: booking.Id,
            ExpireAt: expireAt
        );
    }
}
