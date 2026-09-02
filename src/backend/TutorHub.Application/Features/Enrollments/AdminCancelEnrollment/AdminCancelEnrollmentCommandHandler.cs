using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.AdminCancelEnrollment;

public class AdminCancelEnrollmentCommandHandler : IRequestHandler<AdminCancelEnrollmentCommand, EnrollmentDto>
{
    private readonly IAppDbContext _context;

    public AdminCancelEnrollmentCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<EnrollmentDto> Handle(AdminCancelEnrollmentCommand request, CancellationToken cancellationToken)
    {
        // 1. Authorization: Only Admin can execute Administrative Emergency Cancellation
        if (request.Role != UserRole.Admin)
        {
            throw new ForbiddenException("Only administrators have permission to perform administrative enrollment cancellation.");
        }

        var enrollment = await _context.Enrollments
            .Include(e => e.StudentProfile).ThenInclude(s => s.User)
            .Include(e => e.TutorProfile).ThenInclude(t => t.User)
            .Include(e => e.Subject)
            .Include(e => e.Service)
            .Include(e => e.Sessions)
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, cancellationToken);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", request.EnrollmentId);
        }

        // 2. State machine guard
        if (enrollment.Status == EnrollmentStatus.Completed)
        {
            throw new ConflictException("Cannot cancel an enrollment that is already completed.");
        }

        if (enrollment.Status == EnrollmentStatus.Cancelled)
        {
            throw new ConflictException("Enrollment is already cancelled.");
        }

        // 3. Domain Cancel with CancelledBy.Admin
        var now = DateTime.UtcNow;
        var refundAmount = enrollment.Cancel(request.Reason, CancelledBy.Admin);

        // 4. Financial Escrow Adjustment & Refund Record
        if (refundAmount > 0)
        {
            var wallet = await _context.Wallets.FirstOrDefaultAsync(
                w => w.TutorProfileId == enrollment.TutorProfileId,
                cancellationToken);

            if (wallet != null)
            {
                if (wallet.PendingBalance < refundAmount)
                {
                    throw new InvalidOperationException("Financial invariant violated: Pending escrow balance is insufficient for refund deduction.");
                }
                wallet.PendingBalance -= refundAmount;
                wallet.UpdatedAt = now;
            }

            var refundTx = new Transaction
            {
                Id = Guid.NewGuid(),
                BookingId = enrollment.BookingId,
                SessionId = null,
                Amount = refundAmount,
                CommissionRate = 0,
                CommissionAmount = 0,
                PayoutAmount = 0,
                PaymentGatewayRef = "EscrowRefund",
                Status = TransactionStatus.Refunded,
                CreatedAt = now,
                RefundedAt = now
            };
            _context.Transactions.Add(refundTx);
        }

        // 5. Explicit DB Transaction
        if (_context.Database?.ProviderName != null)
        {
            await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        }
        else
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        var sessionDtos = enrollment.Sessions.OrderBy(s => s.SessionNumber).Select(s => new SessionDto(
            Id: s.Id,
            EnrollmentId: s.EnrollmentId,
            SessionNumber: s.SessionNumber,
            EarningAmount: s.EarningAmount,
            StartAt: s.StartAt,
            EndAt: s.EndAt,
            Status: s.Status,
            IsPayoutReleased: s.IsPayoutReleased,
            CreatedAt: s.CreatedAt,
            CompletedAt: s.CompletedAt,
            CancelledAt: s.CancelledAt,
            StudentAttendance: s.StudentAttendance,
            TutorAttendance: s.TutorAttendance,
            HasAttendanceConflict: s.HasAttendanceConflict
        )).ToList();

        return new EnrollmentDto(
            Id: enrollment.Id,
            BookingId: enrollment.BookingId,
            StudentProfileId: enrollment.StudentProfileId,
            TutorProfileId: enrollment.TutorProfileId,
            ServiceId: enrollment.ServiceId,
            SubjectId: enrollment.SubjectId,
            SubjectName: enrollment.Subject.Name,
            TotalPrice: enrollment.TotalPrice,
            TotalSessions: enrollment.TotalSessions,
            CompletedSessions: enrollment.CompletedSessions,
            SessionDurationMinutes: enrollment.SessionDurationMinutes,
            TeachingMode: enrollment.TeachingMode,
            Status: enrollment.Status,
            CreatedAt: enrollment.CreatedAt,
            CompletedAt: enrollment.CompletedAt,
            CancelledAt: enrollment.CancelledAt,
            CancelledBy: enrollment.CancelledBy,
            CancellationReason: enrollment.CancellationReason,
            Sessions: sessionDtos
        );
    }
}
