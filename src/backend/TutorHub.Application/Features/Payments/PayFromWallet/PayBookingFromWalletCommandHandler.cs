using System.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Payments.PayFromWallet;

public class PayBookingFromWalletCommandHandler : IRequestHandler<PayBookingFromWalletCommand, PayBookingFromWalletResultDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEnrollmentActivationService _activationService;
    private readonly ILogger<PayBookingFromWalletCommandHandler> _logger;

    public PayBookingFromWalletCommandHandler(
        IAppDbContext context,
        IClock clock,
        ICurrentUserService currentUserService,
        IEnrollmentActivationService activationService,
        ILogger<PayBookingFromWalletCommandHandler> logger)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
        _activationService = activationService;
        _logger = logger;
    }

    public async Task<PayBookingFromWalletResultDto> Handle(PayBookingFromWalletCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        var executionStrategy = _context.Database.CreateExecutionStrategy();

        return await executionStrategy.ExecuteAsync(async () =>
        {
            await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

            var booking = await _context.Bookings
                .Include(b => b.StudentProfile).ThenInclude(s => s.User)
                .Include(b => b.TutorProfile).ThenInclude(t => t.User)
                .Include(b => b.Service)
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
                throw new ConflictException($"Booking cannot be paid in '{booking.Status}' status. Must be Holding.");
            }

            // 3. Expiration validation
            if (!booking.HoldingExpiresAt.HasValue || booking.HoldingExpiresAt.Value <= now)
            {
                throw new BadRequestException("Booking holding time has expired. Please create a new booking.");
            }

            // 4. Concurrency lock on StudentWallet (FOR UPDATE)
            var wallet = await _context.StudentWallets
                .FromSqlInterpolated($"SELECT * FROM \"StudentWallets\" WHERE \"StudentProfileId\" = {booking.StudentProfileId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (wallet == null || wallet.AvailableBalance < booking.TotalPrice)
            {
                var available = wallet?.AvailableBalance ?? 0m;
                var shortfall = booking.TotalPrice - available;
                throw new BadRequestException($"Số dư ví không đủ để thanh toán. Số dư hiện có: {available:N0} VND, Số tiền cần thanh toán: {booking.TotalPrice:N0} VND. Cần nạp thêm: {shortfall:N0} VND.");
            }

            // 5. Debit wallet (INV-STUDENT-WALLET-005)
            var balanceBefore = wallet.AvailableBalance;
            wallet.Debit(booking.TotalPrice, now);
            var balanceAfter = wallet.AvailableBalance;

            // 6. Create immutable student ledger record (INV-STUDENT-WALLET-003)
            var studentLedger = new StudentWalletTransaction
            {
                Id = Guid.NewGuid(),
                StudentWalletId = wallet.Id,
                Type = StudentWalletTransactionType.CoursePaymentDebit,
                Direction = FinancialDirection.Debit,
                Amount = booking.TotalPrice,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                ReferenceType = "Booking",
                ReferenceId = booking.Id,
                Description = $"Thanh toán khóa học #{booking.Id.ToString()[..8].ToUpper()}",
                CreatedByUserId = userId,
                CreatedAt = now
            };
            _context.StudentWalletTransactions.Add(studentLedger);

            // 7. Transfer to Platform Holding: Create or update Booking Transaction
            var paymentTx = await _context.GetPaymentTransactionAsync(booking.Id, cancellationToken);
            if (paymentTx == null)
            {
                paymentTx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    BookingId = booking.Id,
                    Amount = booking.TotalPrice,
                    Type = TransactionType.BookingPayment,
                    Status = TransactionStatus.Held, // Platform Holding!
                    PaymentGatewayRef = "STUDENT_WALLET",
                    CreatedAt = now
                };
                _context.Transactions.Add(paymentTx);
            }
            else
            {
                paymentTx.Status = TransactionStatus.Held;
                paymentTx.PaymentGatewayRef = "STUDENT_WALLET";
            }

            // 8. Update Booking Status to Paid
            booking.Status = BookingStatus.Paid;
            booking.ConfirmedAt = now;

            // 9. Activate Enrollment
            if (booking.ServiceId.HasValue)
            {
                await _activationService.ActivateAsync(booking, now, cancellationToken);
            }

            // 10. Add Outbox Business Event for Student Wallet
            _context.AddOutboxMessage(new StudentWalletPaymentSucceededEvent(
                booking.Id,
                booking.StudentProfileId,
                booking.StudentProfile.UserId,
                new MoneyDto(booking.TotalPrice, "VND"),
                Guid.NewGuid(),
                1,
                now
            ));

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            _logger.LogInformation("Student Wallet payment successful: Booking #{BookingId}, Transaction #{TxId}, Paid={Amount}, Remaining={Balance}",
                booking.Id, paymentTx.Id, booking.TotalPrice, wallet.AvailableBalance);

            return new PayBookingFromWalletResultDto
            {
                BookingId = booking.Id,
                TransactionId = paymentTx.Id,
                AmountPaid = booking.TotalPrice,
                RemainingBalance = wallet.AvailableBalance,
                PaidAt = now
            };
        });
    }
}
