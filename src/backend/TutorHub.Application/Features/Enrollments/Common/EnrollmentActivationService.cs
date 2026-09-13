using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Services;

namespace TutorHub.Application.Features.Enrollments.Common;

/// <summary>
/// Shared activation of a paid Booking into an active Enrollment: snapshots the
/// platform fee (DEC-S8-020), allocates N Sessions, credits the tutor wallet's
/// Pending escrow with the GROSS amount, and enqueues the outbox events. Used by
/// both the VNPay IPN and the transitional mock payment path so they cannot diverge.
/// </summary>
public interface IEnrollmentActivationService
{
    Task<Enrollment> ActivateAsync(Booking booking, DateTime now, CancellationToken cancellationToken);
}

public class EnrollmentActivationService : IEnrollmentActivationService
{
    private readonly IAppDbContext _context;

    public EnrollmentActivationService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Enrollment> ActivateAsync(Booking booking, DateTime now, CancellationToken cancellationToken)
    {
        if (!booking.ServiceId.HasValue)
        {
            throw new InvalidOperationException("Booking is missing ServiceId commercial reference.");
        }

        // Snapshot fee from PlatformSetting (DEC-S8-020, non-retroactive).
        var feeRate = 0.10m;
        var feeVersion = 1;
        var feeSetting = await _context.PlatformSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformFeeRate", cancellationToken);
        if (feeSetting != null && decimal.TryParse(feeSetting.Value, out var parsedRate) && parsedRate >= 0 && parsedRate < 1)
        {
            feeRate = parsedRate;
            feeVersion = feeSetting.CurrentVersion;
        }

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            StudentProfileId = booking.StudentProfileId,
            TutorProfileId = booking.TutorProfileId,
            ServiceId = booking.ServiceId.Value,
            SubjectId = booking.SubjectId,
            TotalPrice = booking.TotalPrice,
            TotalSessions = booking.TotalSessions,
            SessionDurationMinutes = booking.SessionDurationMinutes,
            TeachingMode = booking.TeachingMode,
            PlatformFeeRate = feeRate,
            FeePolicyVersion = feeVersion,
            CreatedAt = now
        };

        // N Unscheduled sessions with immutable pro-rata earning slices.
        var allocations = EnrollmentSessionAllocator.Allocate(booking.TotalPrice, booking.TotalSessions);
        for (var i = 0; i < booking.TotalSessions; i++)
        {
            enrollment.Sessions.Add(new Session
            {
                Id = Guid.NewGuid(),
                EnrollmentId = enrollment.Id,
                SessionNumber = i + 1,
                EarningAmount = allocations[i],
                CreatedAt = now
            });
        }

        _context.Enrollments.Add(enrollment);
        booking.Enrollment = enrollment;
        enrollment.Activate();

        // Escrow holds the GROSS enrollment amount; the platform fee is only
        // removed when each session is released (FR-EARN-003).
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.TutorProfileId == booking.TutorProfileId, cancellationToken);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                TutorProfileId = booking.TutorProfileId,
                PendingBalance = 0,
                AvailableBalance = 0,
                UpdatedAt = now
            };
            _context.Wallets.Add(wallet);
        }
        wallet.CreditPending(booking.TotalPrice, now);

        _context.AddOutboxMessage(new PaymentSucceededEvent(
            booking.Id,
            booking.StudentProfile.UserId,
            new MoneyDto(booking.TotalPrice),
            enrollment.Id));

        _context.AddOutboxMessage(new EnrollmentActivatedEvent(
            enrollment.Id,
            enrollment.StudentProfileId,
            enrollment.TutorProfileId,
            booking.StudentProfile.UserId,
            booking.TutorProfile.UserId));

        return enrollment;
    }
}
